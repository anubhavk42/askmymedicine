/**
 * AI Service communicating with the server endpoints for embedding and generation.
 * Also provides vector caching in localStorage and fallback capability.
 */

export interface EmbedResponse {
  embeddings: number[][];
  modelUsed: string;
  isFallback?: boolean;
}

export interface GenerateResponse {
  answer: string;
  modelUsed: string;
}

// Deterministic hashing fallback embedding (128 dimensions) in case of network or quota failure
function generateDeterministicFallbackVector(text: string, dimensions = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

  if (words.length === 0) return vector;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    const sign = (hash & 1) === 0 ? 1 : -1;
    vector[idx] += sign * (1 + 1 / (i + 1));
  }

  // Normalize to unit vector
  let norm = 0;
  for (let i = 0; i < dimensions; i++) norm += vector[i] * vector[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) vector[i] /= norm;
  }
  return vector;
}

export async function fetchEmbeddings(texts: string[]): Promise<EmbedResponse> {
  try {
    const res = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    const data = await res.json();
    return {
      embeddings: data.embeddings,
      modelUsed: data.modelUsed || 'gemini-embedding-2-preview',
      isFallback: false,
    };
  } catch (err: any) {
    console.warn('Backend embedding call failed, using deterministic clinical semantic fallback:', err.message);
    const fallbackEmbeddings = texts.map((t) => generateDeterministicFallbackVector(t));
    return {
      embeddings: fallbackEmbeddings,
      modelUsed: 'local-clinical-vectorizer (fallback)',
      isFallback: true,
    };
  }
}

export async function generateRAGAnswer({
  prompt,
  systemInstruction,
  chunks,
}: {
  prompt: string;
  systemInstruction: string;
  chunks: Array<{ medicine: string; section: string; text: string; reviewedDate: string }>;
}): Promise<GenerateResponse> {
  const chunksContext = chunks
    .map(
      (c, i) =>
        `[CHUNK ${i + 1}] Medicine: ${c.medicine} | Section: ${c.section} | Reviewed: ${c.reviewedDate}\n${c.text}`
    )
    .join('\n\n---\n\n');

  const fullPrompt = `RETRIEVED CLINICAL CHUNKS (ONLY SOURCE OF TRUTH):\n${chunksContext}\n\nPATIENT QUESTION:\n${prompt}`;

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: fullPrompt,
      systemInstruction,
      chunks,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }

  const data = await res.json();
  return {
    answer: data.answer,
    modelUsed: data.modelUsed || 'gemini-3.8-flash',
  };
}
