export interface DocMetadata {
  medicineName: string;
  documentType: 'leaflet' | 'care sheet';
  pageLastReviewed: string;
  country: string;
  source: string;
}

export interface IngestedDocument {
  id: string;
  fileName: string;
  medicineName: string;
  documentType: 'leaflet' | 'care sheet';
  pageLastReviewed: string;
  country: string;
  source: string;
  rawContent: string;
  chunksCount: number;
  status: 'embedded' | 'failed' | 'pending';
  error?: string;
}

export interface DocChunk {
  id: string;
  fileName: string;
  medicineName: string;
  documentType: 'leaflet' | 'care sheet';
  sectionHeading: string;
  lastReviewedDate: string;
  country: string;
  text: string;
  embeddingText: string;
  embedding: number[];
}

export interface ScoredChunk {
  chunk: DocChunk;
  rawScore: number;
  boost: number;
  finalScore: number;
  isUsed: boolean;
  rank: number;
  matchReasons: string[];
  gateOk?: boolean;
  lexicalFloor?: number;
}

export function isChunkUsed(scoredChunk: ScoredChunk, threshold: number): boolean {
  if (scoredChunk.gateOk === false) return false;
  const effectiveThreshold =
    scoredChunk.lexicalFloor !== undefined
      ? Math.min(scoredChunk.lexicalFloor, threshold)
      : threshold;
  return scoredChunk.rawScore >= effectiveThreshold;
}

export function stripEmergencyBannerText(text: string): string {
  return text
    .replace(/^This may be urgent\.?\s*Call 112 or go to the nearest hospital now\.?\s*/gim, '')
    .replace(/This may be urgent\.?\s*Call 112 or go to the nearest hospital now\.?/gi, '')
    .trim();
}

export interface RetrievalResult {
  query: string;
  candidates: ScoredChunk[]; // All top candidate chunks up to topK
  usedChunks: ScoredChunk[]; // Chunks above threshold
  allScoredCount: number;
  aboveThresholdCount: number;
  sentToModelCount: number;
  threshold: number;
  topK: number;
  hybridEnabled: boolean;
  selectedCareSheet: 'none' | 'sheetA' | 'sheetB';
  queryEmbedding?: number[];
  emergencyDetected: boolean;
  emergencyReason?: string;
}

// Emergency symptom trigger phrases (case-insensitive) - precise match, no false positives
const EMERGENCY_PATTERNS = [
  /(trouble|difficulty)\s+breathing/i,
  /can'?t\s+breathe/i,
  /\bbreathless\b/i,
  /shortness\s+of\s+breath/i,
  /(swollen|swelling)\s+(in\s+the\s+)?(face|throat|tongue|lips)/i,
  /face\s+is\s+swollen/i,
  /(throat|tongue|lips)\s+is\s+swollen/i,
  /yellow\s+(skin|eyes)/i,
  /skin\s+and\s+eyes\s+turned\s+yellow/i,
  /eyes\s+and\s+skin\s+turned\s+yellow/i,
  /\bchest\s+pain\b/i,
  /\boverdose\b/i,
  /took\s+too\s+many/i,
  /swallowed\s+too\s+many/i,
  /(took|swallowed)\s+the\s+whole\s+(bottle|strip|pack|packet)/i,
  // Count of 10 or more: took/swallowed + number (10+) + tablets/pills/capsules
  /(took|swallowed)\s+([1-9][0-9]+)\s+(?:[a-z0-9_-]+\s+)?(tablets|pills|capsules)/i,
];

export function checkEmergencySymptoms(text: string): { isEmergency: boolean; reason?: string } {
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(text)) {
      return { isEmergency: true, reason: `Emergency keyword matched: "${text.match(pattern)?.[0]}"` };
    }
  }
  return { isEmergency: false };
}

// Word count helper
export function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

// Split long text (> 250 words) into chunks of ~150-200 words at sentence boundaries
function splitLongText(text: string, maxWords = 250): string[] {
  if (countWords(text) <= maxWords) return [text.trim()];

  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text];
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentCount = 0;

  for (const sentence of sentences) {
    const sWords = countWords(sentence);
    if (currentCount + sWords > maxWords && currentChunk.length > 0) {
      chunks.push(currentChunk.join('').trim());
      currentChunk = [sentence];
      currentCount = sWords;
    } else {
      currentChunk.push(sentence);
      currentCount += sWords;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('').trim());
  }

  return chunks;
}

// Parse markdown file and extract metadata and chunks
export function parseMarkdownFile(fileName: string, content: string): {
  metadata: DocMetadata;
  rawChunks: Array<{ sectionHeading: string; text: string }>;
} {
  const lines = content.split('\n');

  // Extract Title/Medicine
  let medicineName = fileName.replace(/^\d+_/, '').replace(/_NHS\.md$|_SAMPLE\.md$|\.md$/, '').replace(/_/g, ' ');
  let documentType: 'leaflet' | 'care sheet' = fileName.toLowerCase().includes('care_sheet') || fileName.toLowerCase().includes('care sheet') ? 'care sheet' : 'leaflet';
  let pageLastReviewed = 'Unknown';
  let country = 'India';
  let source = 'Medical Leaflet';

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].trim().startsWith('# ')) { medicineName = lines[i].replace(/^#\s*/, '').trim(); break; }
  }
  const header = lines.slice(0, 10).join(' ');
  const pick = (re: RegExp) => header.match(re)?.[1]?.trim();
  const srcVal = pick(/Source:\s*(.+?)(?=\s*(?:\.\s+|\|\s*)Document type:|\s*\|\s*|$)/i);
  if (srcVal) source = srcVal;
  const dtVal = pick(/Document type:\s*([^.|]+)/i);
  if (dtVal) documentType = /care sheet/i.test(dtVal) ? 'care sheet' : 'leaflet';
  const revVal = pick(/(?:Page last reviewed|Review date):\s*([^.|]+)/i);
  if (revVal) pageLastReviewed = revVal;
  const ctyVal = pick(/Country:\s*([^.|]+)/i);
  if (ctyVal) country = ctyVal;
  if (documentType === 'care sheet') {
    const m = fileName.match(/Care_Sheet_([AB])/i);
    if (m) medicineName = `Doctor's Care Sheet ${m[1].toUpperCase()}`;
  }

  // Split by "##" section headings
  const sections: Array<{ heading: string; text: string }> = [];
  const rawSections = content.split(/\n(?=##\s+)/);

  for (const rawSec of rawSections) {
    const trimmed = rawSec.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('## ')) {
      const firstLineEnd = trimmed.indexOf('\n');
      const heading = (firstLineEnd === -1 ? trimmed : trimmed.substring(0, firstLineEnd))
        .replace(/^##\s*/, '')
        .trim();
      const body = firstLineEnd === -1 ? '' : trimmed.substring(firstLineEnd).trim();
      if (body) {
        sections.push({ heading, text: body });
      }
    } else if (!trimmed.startsWith('# ')) {
      // Intro or preamble text before first ##
      if (countWords(trimmed) > 10) {
        sections.push({ heading: 'Overview', text: trimmed });
      }
    }
  }

  // Merge sections shorter than 40 words with the next section
  const mergedSections: Array<{ heading: string; text: string }> = [];
  let buffer: { heading: string; text: string } | null = null;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    if (buffer) {
      buffer.heading = `${buffer.heading} & ${sec.heading}`;
      buffer.text = `${buffer.text}\n\n${sec.text}`;
      if (countWords(buffer.text) >= 40 || i === sections.length - 1) {
        mergedSections.push(buffer);
        buffer = null;
      }
    } else {
      if (countWords(sec.text) < 40 && i < sections.length - 1) {
        buffer = { heading: sec.heading, text: sec.text };
      } else {
        mergedSections.push(sec);
      }
    }
  }

  if (buffer) {
    if (mergedSections.length > 0) {
      const last = mergedSections[mergedSections.length - 1];
      last.heading += ` & ${buffer.heading}`;
      last.text += `\n\n${buffer.text}`;
    } else {
      mergedSections.push(buffer);
    }
  }

  // Split sections longer than 250 words
  const finalChunks: Array<{ sectionHeading: string; text: string }> = [];
  for (const mSec of mergedSections) {
    const splits = splitLongText(mSec.text, 250);
    splits.forEach((txt, idx) => {
      finalChunks.push({
        sectionHeading: splits.length > 1 ? `${mSec.heading} (Part ${idx + 1})` : mSec.heading,
        text: txt,
      });
    });
  }

  return {
    metadata: {
      medicineName,
      documentType,
      pageLastReviewed,
      country,
      source,
    },
    rawChunks: finalChunks,
  };
}

// Cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Levenshtein distance for typo matching
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

// Extract medicine keywords from query with typo and brand tolerance
export function extractMedicinesFromQuery(query: string, allMedicineNames: string[]): string[] {
  const lowerQuery = query.toLowerCase();
  const matched = new Set<string>();

  // Known medicine catalog mapping (including Indian brand/Hinglish aliases)
  const medicineAliases: Record<string, string[]> = {
    paracetamol: ['paracetamol', 'crocin', 'dolo', 'calpol', 'acetaminophen'],
    metformin: ['metformin', 'glycomet', 'glucophage'],
    atorvastatin: ['atorvastatin', 'lipitor', 'atorva'],
    ibuprofen: ['ibuprofen', 'brufen', 'advil', 'motrin'],
    aspirin: ['aspirin', 'disprin', 'ecosprin'],
    cetirizine: ['cetirizine', 'zyrtec', 'cetzine'],
    omeprazole: ['omeprazole', 'prilosec', 'omez'],
    pantoprazole: ['pantoprazole', 'pantocid', 'pantosec', 'protonix'],
    amlodipine: ['amlodipine', 'norvasc', 'amlong'],
    losartan: ['losartan', 'cozaar', 'losacar'],
    simvastatin: ['simvastatin', 'zocor'],
    levothyroxine: ['levothyroxine', 'thyronorm', 'eltroxin', 'synthroid'],
    amoxicillin: ['amoxicillin', 'amoxil'],
    lactulose: ['lactulose', 'duphalac'],
    'folic acid': ['folic acid', 'folate', 'b9'],
    'ferrous fumarate': ['ferrous fumarate', 'iron', 'ferrous'],
    azithromycin: ['azithromycin', 'azithral', 'zithromax'],
  };

  // 1. Exact alias match
  for (const [med, aliases] of Object.entries(medicineAliases)) {
    for (const alias of aliases) {
      const regex = new RegExp(`\\b${alias}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        matched.add(med);
        break;
      }
    }
  }

  // Also check dynamically provided medicine names exact match
  for (const name of allMedicineNames) {
    const cleanName = name.toLowerCase().replace(/doctor's care sheet [ab]/i, '').trim();
    if (cleanName.length > 3) {
      const regex = new RegExp(`\\b${cleanName}\\b`, 'i');
      if (regex.test(lowerQuery)) {
        matched.add(cleanName);
      }
    }
  }

  // 2. Typo tolerance: compare each query word of 6+ letters with every alias
  // Accept distance of 1 for words under 9 letters (6, 7, 8) and 2 for longer words (>= 9)
  // Never fuzzy-match words under 6 letters
  const words = lowerQuery.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  for (const word of words) {
    if (word.length >= 6) {
      const maxDist = word.length < 9 ? 1 : 2;
      for (const [med, aliases] of Object.entries(medicineAliases)) {
        for (const alias of aliases) {
          if (Math.abs(word.length - alias.length) <= maxDist) {
            if (levenshteinDistance(word, alias) <= maxDist) {
              matched.add(med);
              break;
            }
          }
        }
      }
    }
  }

  return Array.from(matched);
}

// Perform retrieval
export function performRetrieval({
  query,
  queryEmbedding,
  chunks,
  topK,
  threshold,
  hybridEnabled,
  selectedCareSheet,
}: {
  query: string;
  queryEmbedding: number[];
  chunks: DocChunk[];
  topK: number;
  threshold: number;
  hybridEnabled: boolean;
  selectedCareSheet: 'none' | 'sheetA' | 'sheetB';
}): RetrievalResult {
  const { isEmergency, reason: emergencyReason } = checkEmergencySymptoms(query);

  // Filter care sheets:
  // "Care sheets: include only the one selected in the dropdown; ignore the other."
  const eligibleChunks = chunks.filter((chunk) => {
    if (chunk.documentType === 'care sheet') {
      const isSheetA = chunk.fileName.includes('Care_Sheet_A') || chunk.medicineName.includes('Sheet A');
      const isSheetB = chunk.fileName.includes('Care_Sheet_B') || chunk.medicineName.includes('Sheet B');

      if (selectedCareSheet === 'none') {
        return false;
      }
      if (selectedCareSheet === 'sheetA') {
        return isSheetA;
      }
      if (selectedCareSheet === 'sheetB') {
        return isSheetB;
      }
      return false;
    }
    // All leaflets are eligible
    return true;
  });

  // Extract medicines from query
  const allMedNames = Array.from(new Set(chunks.map((c) => c.medicineName)));
  const queryMedicines = extractMedicinesFromQuery(query, allMedNames);

  // Loaded leaflet medicines
  const loadedLeafletMedicines = new Set(
    chunks
      .filter((c) => c.documentType === 'leaflet')
      .map((c) => c.medicineName.toLowerCase().trim())
  );

  // Known query medicines: keep only ones that have a leaflet in loaded documents
  // (Azithromycin is in alias list but has no document, so it does not count)
  const knownQueryMedicines = queryMedicines.filter((qm) => {
    return Array.from(loadedLeafletMedicines).some(
      (lm) => lm.includes(qm) || qm.includes(lm)
    );
  });

  // If 2 or more known medicines, raise Top-K to max(topK, min(8, 2 x number of medicines))
  let effectiveTopK = topK;
  if (hybridEnabled && knownQueryMedicines.length >= 2) {
    effectiveTopK = Math.max(topK, Math.min(8, 2 * knownQueryMedicines.length));
  }

  // Selected care sheet text (to check which medicines the care sheet mentions)
  const careSheetChunks = eligibleChunks.filter((c) => c.documentType === 'care sheet');
  const careSheetFullText = careSheetChunks
    .map((c) => `${c.medicineName} ${c.sectionHeading} ${c.text}`)
    .join(' ')
    .toLowerCase();

  // Stop words for care sheet lexical floor (b)
  const stopWords = new Set([
    'what', 'when', 'which', 'should', 'would', 'about', 'tablet', 'tablets',
    'medicine', 'medicines', 'take', 'taking', 'tell', 'please', 'have',
    'with', 'from', 'this', 'that', 'there', 'your', 'does'
  ]);
  const queryContentWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !stopWords.has(w));

  // Score each chunk and evaluate known-medicine gate
  const scoredChunks: ScoredChunk[] = eligibleChunks.map((chunk) => {
    const rawScore = cosineSimilarity(queryEmbedding, chunk.embedding);
    let boost = 0;
    let gateOk = true;
    const matchReasons: string[] = [];
    const chunkMed = chunk.medicineName.toLowerCase();

    if (hybridEnabled) {
      if (knownQueryMedicines.length >= 1) {
        // At least one known leaflet medicine named:
        // Only that medicine's leaflet chunks may be USED, plus selected care sheet chunks
        if (chunk.documentType === 'leaflet') {
          const isTargetMed = knownQueryMedicines.some(
            (km) => chunkMed.includes(km) || km.includes(chunkMed)
          );
          if (isTargetMed) {
            gateOk = true;
            boost += 0.25;
            matchReasons.push('Medicine keyword in query (+0.25)');
          } else {
            gateOk = false;
            matchReasons.push('Blocked: other medicine');
          }
        } else {
          // Care sheet chunks allowed: give same +0.25 boost if its text contains a named medicine
          gateOk = true;
          const chunkFull = `${chunk.medicineName} ${chunk.sectionHeading} ${chunk.text}`.toLowerCase();
          const mentionsNamedMed = queryMedicines.some((qm) => chunkFull.includes(qm));
          if (mentionsNamedMed) {
            boost += 0.25;
            matchReasons.push('Care sheet mentions query medicine (+0.25)');
          }
        }
      } else if (selectedCareSheet !== 'none') {
        // Names none and a care sheet is selected:
        // Only that care sheet's chunks, plus leaflet chunks of medicines the care sheet mentions
        if (chunk.documentType === 'leaflet') {
          const mentionedInCareSheet = Array.from(loadedLeafletMedicines).some((lm) => {
            return (chunkMed.includes(lm) || lm.includes(chunkMed)) && careSheetFullText.includes(lm);
          });
          if (mentionedInCareSheet) {
            gateOk = true;
          } else {
            gateOk = false;
            matchReasons.push('Blocked: not in care sheet');
          }
        } else {
          gateOk = true;
          const chunkFull = `${chunk.medicineName} ${chunk.sectionHeading} ${chunk.text}`.toLowerCase();
          const mentionsNamedMed = queryMedicines.some((qm) => chunkFull.includes(qm));
          if (mentionsNamedMed) {
            boost += 0.25;
            matchReasons.push('Care sheet mentions query medicine (+0.25)');
          }
        }
      } else {
        // Names none and no care sheet is selected:
        // Nothing may be USED
        gateOk = false;
        matchReasons.push('Blocked: no known medicine named');
      }

      // Check section heading keywords if gate passed
      if (gateOk) {
        const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const headingWords = chunk.sectionHeading.toLowerCase().split(/\s+/);
        const headingMatches = queryWords.filter((qw) => headingWords.some((hw) => hw.includes(qw)));
        if (headingMatches.length > 0) {
          const hBoost = Math.min(0.10, headingMatches.length * 0.05);
          boost += hBoost;
          matchReasons.push(`Section heading match: ${headingMatches.join(', ')} (+${hBoost.toFixed(2)})`);
        }
      }
    } else {
      // Hybrid OFF: no gate, no boost. Plain vector search with raw threshold
      gateOk = true;
      boost = 0;
    }

    // Rank with unclamped rawScore + boost. Show clamped value in inspector.
    const finalScore = Math.max(0, Math.min(1.0, rawScore + boost));

    return {
      chunk,
      rawScore,
      boost,
      finalScore,
      isUsed: false,
      rank: 0,
      matchReasons,
      gateOk,
    };
  });

  // Care Sheet lexical floor (0.35 raw):
  // When a care sheet is selected, up to TWO of its chunks count as USED at a lower floor of 0.35 raw
  // if either (a) its text contains a medicine the question names, or (b) shares a content word of 4+ letters
  let qualifyingCareSheetChunks: ScoredChunk[] = [];
  if (selectedCareSheet !== 'none') {
    qualifyingCareSheetChunks = scoredChunks.filter((sc) => {
      if (sc.chunk.documentType !== 'care sheet') return false;
      const textAndHead = `${sc.chunk.medicineName} ${sc.chunk.sectionHeading} ${sc.chunk.text}`.toLowerCase();
      const conditionA = queryMedicines.some((km) => textAndHead.includes(km)) || knownQueryMedicines.some((km) => textAndHead.includes(km));
      const conditionB = queryContentWords.some((cw) => textAndHead.includes(cw));
      return conditionA || conditionB;
    });

    if (qualifyingCareSheetChunks.length > 0) {
      qualifyingCareSheetChunks.sort((a, b) => b.rawScore - a.rawScore);
      const bestTwo = qualifyingCareSheetChunks.slice(0, 2);
      bestTwo.forEach((cs) => {
        cs.lexicalFloor = 0.35;
        cs.matchReasons.push('Care sheet floor applied (0.35)');
      });
    }
  }

  // Rank: all gateOk = true chunks come first (ordered by raw + boost), then gateOk = false chunks
  scoredChunks.sort((a, b) => {
    const aGate = a.gateOk !== false ? 1 : 0;
    const bGate = b.gateOk !== false ? 1 : 0;
    if (aGate !== bGate) {
      return bGate - aGate;
    }
    return (b.rawScore + b.boost) - (a.rawScore + a.boost);
  });

  // Take Top-K
  let topCandidates = scoredChunks.slice(0, effectiveTopK);

  // Seat up to TWO care sheet chunks with the 0.35 floor
  // Make sure both are in the candidate list even if the Top-K is full.
  const careSheetsToSeat = qualifyingCareSheetChunks.slice(0, 2);
  for (const cs of careSheetsToSeat) {
    if (!topCandidates.some((c) => c.chunk.id === cs.chunk.id)) {
      if (topCandidates.length >= effectiveTopK) {
        // Find last non-care-sheet chunk to replace
        let replaceIdx = -1;
        for (let i = topCandidates.length - 1; i >= 0; i--) {
          if (topCandidates[i].chunk.documentType !== 'care sheet') {
            replaceIdx = i;
            break;
          }
        }
        if (replaceIdx !== -1) {
          topCandidates[replaceIdx] = cs;
        } else {
          topCandidates[topCandidates.length - 1] = cs;
        }
      } else {
        topCandidates.push(cs);
      }
    }
  }

  // Determine USED strictly by isChunkUsed(item, threshold)
  topCandidates.forEach((item, index) => {
    item.rank = index + 1;
    item.isUsed = isChunkUsed(item, threshold);
  });

  // Care sheet chunks first in usedChunks, then the leaflet chunks by score
  const careSheetUsed = topCandidates.filter(
    (item) => item.isUsed && item.chunk.documentType === 'care sheet'
  );
  const leafletUsed = topCandidates.filter(
    (item) => item.isUsed && item.chunk.documentType !== 'care sheet'
  );
  careSheetUsed.sort((a, b) => (b.rawScore + b.boost) - (a.rawScore + a.boost));
  leafletUsed.sort((a, b) => (b.rawScore + b.boost) - (a.rawScore + a.boost));
  const usedChunks = [...careSheetUsed, ...leafletUsed];

  return {
    query,
    candidates: topCandidates,
    usedChunks,
    allScoredCount: eligibleChunks.length,
    aboveThresholdCount: usedChunks.length,
    sentToModelCount: usedChunks.length,
    threshold,
    topK: effectiveTopK,
    hybridEnabled,
    selectedCareSheet,
    queryEmbedding,
    emergencyDetected: isEmergency,
    emergencyReason,
  };
}

// System Instruction builder implementing all rules
export function buildSystemInstruction(
  selectedCareSheet: string,
  threshold: number,
  isEmergency: boolean
): string {
  return `You are "AskMyMedicine", a strict clinical RAG safety agent for everyday medicines in India.

CRITICAL RULES YOU MUST OBEY:
1) Answer ONLY from the retrieved chunks provided below. Never use outside knowledge or extrapolate. Silence in the chunks is not permission to use general knowledge. If the retrieved chunks do not contain the exact answer, say the exact not-found reply. Do not give a partial or related answer.
2) If the retrieved chunks do not answer the question, reply exactly:
   "I could not find that in the documents. Please ask your doctor or pharmacist."
   Do not guess.
3) STRUCTURE AND LABELS:
   - When a care sheet chunk is present, the answer MUST start with the words "Your doctor's care sheet says:" followed by what that chunk says. Then, if a leaflet chunk adds or differs, a second part starting "The general leaflet says:". The care sheet part always comes first.
   - If a care sheet chunk says to avoid, limit or stop-and-call a medicine, state that first and clearly, and never recommend that medicine. If the leaflet says something different, show the care sheet line first, label the leaflet line as general advice, and say: follow your doctor's care sheet.
   - Label every statement with where it came from (care sheet or the named leaflet). Never join two facts from different chunks into one claim. Never attach a condition to a rule that the chunk does not attach (for example do not write "if you are taking metformin" unless the chunk says so).
   - Only say "care sheet" if one of the retrieved chunks is labelled Doctor's Care Sheet A or B. If none is, never mention a care sheet.
4) EMERGENCY RULES:
   - Never write the "This may be urgent" line yourself. The app shows it.
   - In an emergency (isEmergency is true), do not tell the person to stop, skip or continue any medicine. Write one short sentence on getting urgent help, then repeat only what the chunks say about that symptom. If the chunks say nothing about the symptom, say only that and nothing else.
5) Do not mention 112 unless the question is an emergency or a chunk contains a UK number that you are converting. The leaflets mention UK numbers (NHS 111, 999). Tell the user that in India they should call 112.
6) If the question mentions a brand name, answer only from the generic leaflet and never state a strength (such as 650 mg) that is not in a chunk.
7) Never state a dose, timing or limit that is not written in the retrieved chunks. When stating doses, include all spacing intervals (e.g., leaving at least 4 hours between doses) and maximum limits mentioned in the chunk. If asked for something not in them, say so and send the user to their doctor or pharmacist.
8) Do not diagnose, never tell the user to stop or change a medicine (unless instructed by their doctor's care sheet chunk), and never suggest a medicine that is not in the documents.
9) End every answer with a source line in this exact format:
   "Source: <document>, <section>, reviewed <date>" for each document used.
10) Use simple English and short sentences, under 120 words.`;
}
