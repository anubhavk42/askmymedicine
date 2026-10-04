/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { TopBar } from './components/TopBar';
import { DocumentsColumn } from './components/DocumentsColumn';
import { ChatColumn, ChatMessage } from './components/ChatColumn';
import { RetrievalInspector } from './components/RetrievalInspector';
import { TestsTab } from './components/TestsTab';
import { InsightsTab, QuestionLogItem } from './components/InsightsTab';
import { DocumentModal } from './components/DocumentModal';
import {
  IngestedDocument,
  DocChunk,
  RetrievalResult,
  parseMarkdownFile,
  performRetrieval,
  checkEmergencySymptoms,
  buildSystemInstruction,
  extractMedicinesFromQuery,
  stripEmergencyBannerText,
} from './utils/ragPipeline';
import { fetchEmbeddings, generateRAGAnswer } from './services/aiService';

const STORAGE_KEY_DOCS = 'askmymedicine_docs_v1';
const STORAGE_KEY_CHUNKS = 'askmymedicine_chunks_v1';
const STORAGE_KEY_INSIGHTS = 'askmymedicine_insights_log_v1';

export default function App() {
  // Top bar configuration state
  const [selectedCareSheet, setSelectedCareSheet] = useState<'none' | 'sheetA' | 'sheetB'>('none');
  const [topK, setTopK] = useState<number>(5);
  const [threshold, setThreshold] = useState<number>(0.50);
  const [hybridEnabled, setHybridEnabled] = useState<boolean>(true);

  // Ingested data state
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [chunks, setChunks] = useState<DocChunk[]>([]);
  const [isEmbedding, setIsEmbedding] = useState<boolean>(false);
  const [embeddingProgress, setEmbeddingProgress] = useState<{
    current: number;
    total: number;
    currentDoc?: string;
  } | undefined>(undefined);

  // Available medicines for Quick Topic Chips
  const availableMedicines = useMemo(() => {
    const medSet = new Set<string>();
    chunks.forEach((c) => {
      if (c.medicineName && c.documentType === 'leaflet') {
        const cleanName = c.medicineName.replace(/\s+for\s+adults/i, '').trim();
        if (cleanName && !cleanName.toLowerCase().includes('care sheet')) {
          medSet.add(cleanName);
        }
      }
    });
    return Array.from(medSet);
  }, [chunks]);

  // Chat & Retrieval state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState<boolean>(false);
  const [lastRetrievalResult, setLastRetrievalResult] = useState<RetrievalResult | null>(null);

  // Active view state
  const [activeDesktopView, setActiveDesktopView] = useState<'main' | 'tests' | 'insights'>('main');
  const [mobileTab, setMobileTab] = useState<'chat' | 'inspector' | 'docs' | 'tests' | 'insights'>('chat');
  const [inspectingDoc, setInspectingDoc] = useState<IngestedDocument | null>(null);

  // Feature 4: Large Text Mode state (persisted in sessionStorage)
  const [largeText, setLargeText] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('askmymedicine_large_text') === 'true';
    } catch {
      return false;
    }
  });

  const handleSetLargeText = (val: boolean) => {
    setLargeText(val);
    try {
      sessionStorage.setItem('askmymedicine_large_text', val ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not save large text to sessionStorage:', e);
    }
  };

  // Feature 2 & 3: Questions log state for Insights (persisted in localStorage)
  const [questionsLog, setQuestionsLog] = useState<QuestionLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INSIGHTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not load insights log from localStorage:', e);
    }
    return [];
  });

  const saveQuestionsLog = (items: QuestionLogItem[]) => {
    setQuestionsLog(items);
    try {
      localStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save insights log to localStorage:', e);
    }
  };

  const handleFeedback = (messageId: string, feedback: 'yes' | 'no') => {
    // 1. Update message in chat
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback } : m))
    );

    // 2. Find target question and update feedback in questionsLog
    const targetMsg = messages.find((m) => m.id === messageId);

    setQuestionsLog((prev) => {
      let matched = false;
      const updated = prev.map((q) => {
        if (
          q.assistantMessageId === messageId ||
          (targetMsg?.queryText && q.question === targetMsg.queryText)
        ) {
          matched = true;
          return { ...q, feedback };
        }
        return q;
      });

      if (!matched && targetMsg) {
        updated.push({
          id: `q_${Date.now()}`,
          assistantMessageId: messageId,
          question: targetMsg.queryText || 'Question',
          medicinesDetected: targetMsg.medicinesDetected || [],
          careSheetSelected: selectedCareSheet,
          answerType: targetMsg.answerType || (targetMsg.noneFound ? 'not found' : 'leaflet'),
          feedback,
          timestamp: new Date(),
          timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }

      try {
        localStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save feedback to localStorage:', e);
      }
      return updated;
    });
  };

  // Active models info
  const [activeModelInfo, setActiveModelInfo] = useState<{
    embeddingModel: string;
    textModel: string;
  }>({
    embeddingModel: 'gemini-embedding-2-preview',
    textModel: 'gemini-3.8-flash',
  });

  // Health check on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.activeEmbeddingModel && data.activeTextModel) {
          setActiveModelInfo({
            embeddingModel: data.activeEmbeddingModel,
            textModel: data.activeTextModel,
          });
        }
      })
      .catch((err) => console.log('Server health check notice:', err));
  }, []);

  // Load from localStorage or pre-load sample documents on first visit
  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem(STORAGE_KEY_DOCS);
      const savedChunks = localStorage.getItem(STORAGE_KEY_CHUNKS);

      if (savedDocs && savedChunks) {
        const parsedDocs = JSON.parse(savedDocs);
        const parsedChunks = JSON.parse(savedChunks);
        if (Array.isArray(parsedDocs) && parsedDocs.length > 0) {
          setDocuments(parsedDocs);
          setChunks(parsedChunks);
          return;
        }
      }
    } catch (e) {
      console.error('Error loading stored documents from localStorage:', e);
    }

    // App starts empty; only uses files uploaded by user
  }, []);

  // Ingest documents helper
  const ingestRawDocuments = async (
    filesData: Array<{ fileName: string; content: string }>
  ) => {
    setIsEmbedding(true);
    const newDocs: IngestedDocument[] = [];
    const newChunks: DocChunk[] = [];

    setEmbeddingProgress({ current: 0, total: filesData.length });

    try {
      for (let i = 0; i < filesData.length; i++) {
        const item = filesData[i];
        setEmbeddingProgress({
          current: i + 1,
          total: filesData.length,
          currentDoc: item.fileName,
        });

        const { metadata, rawChunks } = parseMarkdownFile(item.fileName, item.content);
        const docId = `doc_${Date.now()}_${i}`;

        // Prepare chunk texts with prefix:
        // "Before embedding, put the medicine name and section heading at the start of each chunk's text, for example 'Metformin, If you miss a dose: ...'."
        const textsToEmbed = rawChunks.map(
          (rc) => `${metadata.medicineName}, ${rc.sectionHeading}: ${rc.text}`
        );

        let embeddings: number[][] = [];
        let status: 'embedded' | 'failed' = 'embedded';
        let errorMsg: string | undefined;

        try {
          const embedRes = await fetchEmbeddings(textsToEmbed);
          embeddings = embedRes.embeddings;
          if (embedRes.modelUsed && embedRes.modelUsed !== activeModelInfo.embeddingModel) {
            setActiveModelInfo((prev) => ({ ...prev, embeddingModel: embedRes.modelUsed }));
          }
        } catch (err: any) {
          console.error(`Failed to embed file ${item.fileName}:`, err);
          status = 'failed';
          errorMsg = err.message;
        }

        // Create DocChunk objects
        rawChunks.forEach((rc, cIdx) => {
          newChunks.push({
            id: `chunk_${docId}_${cIdx}`,
            fileName: item.fileName,
            medicineName: metadata.medicineName,
            documentType: metadata.documentType,
            sectionHeading: rc.sectionHeading,
            lastReviewedDate: metadata.pageLastReviewed,
            country: metadata.country,
            text: rc.text,
            embeddingText: textsToEmbed[cIdx],
            embedding: embeddings[cIdx] || [],
          });
        });

        newDocs.push({
          id: docId,
          fileName: item.fileName,
          medicineName: metadata.medicineName,
          documentType: metadata.documentType,
          pageLastReviewed: metadata.pageLastReviewed,
          country: metadata.country,
          source: metadata.source,
          rawContent: item.content,
          chunksCount: rawChunks.length,
          status,
          error: errorMsg,
        });
      }

      setDocuments(newDocs);
      setChunks(newChunks);

      // Persist in localStorage: "Keep the vector store in memory and in localStorage."
      try {
        localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(newDocs));
        localStorage.setItem(STORAGE_KEY_CHUNKS, JSON.stringify(newChunks));
      } catch (err) {
        console.warn('Could not save to localStorage (quota or disabled):', err);
      }
    } finally {
      setIsEmbedding(false);
      setEmbeddingProgress(undefined);
    }
  };

  // User file upload handler
  const handleFileUpload = async (files: File[]) => {
    const filesData: Array<{ fileName: string; content: string }> = [];
    for (const file of files) {
      const text = await file.text();
      filesData.push({ fileName: file.name, content: text });
    }
    ingestRawDocuments(filesData);
  };

  // Re-ingest button handler
  const handleReingest = () => {
    if (documents.length === 0) {
      return;
    }
    const filesData = documents.map((d) => ({
      fileName: d.fileName,
      content: d.rawContent,
    }));
    ingestRawDocuments(filesData);
  };

  // Clear all documents handler
  const handleClearDocs = () => {
    setDocuments([]);
    setChunks([]);
    setMessages([]);
    setLastRetrievalResult(null);
    try {
      localStorage.removeItem(STORAGE_KEY_DOCS);
      localStorage.removeItem(STORAGE_KEY_CHUNKS);
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
  };

  // Handle user question from Chat
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoadingAnswer) return;

    // Check emergency symptoms on the original query text
    const { isEmergency, reason: emergencyReason } = checkEmergencySymptoms(queryText);

    // Follow-up question handling (Change 9):
    // If the new question names no known medicine and contains a follow-up word,
    // append the previous user question to the text used for embedding and retrieval.
    const allMedNames = Array.from(new Set(chunks.map((c) => c.medicineName)));
    const queryMedicines = extractMedicinesFromQuery(queryText, allMedNames);
    const loadedLeaflets = new Set(
      chunks
        .filter((c) => c.documentType === 'leaflet')
        .map((c) => c.medicineName.toLowerCase().trim())
    );
    const knownQueryMeds = queryMedicines.filter((qm) =>
      Array.from(loadedLeaflets).some((lm) => lm.includes(qm) || qm.includes(lm))
    );

    let queryForRetrieval = queryText;
    if (knownQueryMeds.length === 0) {
      const followUpRegex = /\b(it|that|this|next one|again|too|also)\b/i;
      if (followUpRegex.test(queryText)) {
        const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user');
        if (lastUserMsg) {
          queryForRetrieval = `${queryText} ${lastUserMsg.text}`;
        }
      }
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date(),
      thresholdUsed: threshold,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingAnswer(true);

    try {
      // Change 4: Ask which medicine if generic medicine question with no medicine and no care sheet
      const isGenericMedicineQuestion =
        knownQueryMeds.length === 0 &&
        selectedCareSheet === 'none' &&
        /\b(tablets?|pills?|capsules?|medicines?)\b/i.test(queryText);

      if (isGenericMedicineQuestion) {
        // Embed query and perform retrieval so inspector updates
        const embedRes = await fetchEmbeddings([queryText]);
        const queryVector = embedRes.embeddings[0];
        const retrieval = performRetrieval({
          query: queryText,
          queryEmbedding: queryVector,
          chunks,
          topK,
          threshold,
          hybridEnabled,
          selectedCareSheet,
        });

        setLastRetrievalResult({
          ...retrieval,
          emergencyDetected: isEmergency,
          emergencyReason: isEmergency ? emergencyReason : undefined,
        });

        const emergencyBannerText = isEmergency
          ? 'This may be urgent. Call 112 or go to the nearest hospital now.'
          : undefined;

        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: 'Which medicine do you mean? Please type its name, for example metformin or omeprazole.',
          isEmergency,
          emergencyBannerText,
          sources: [],
          noneFound: false,
          askWhichMedicine: true,
          thresholdUsed: threshold,
          timestamp: new Date(),
          modelUsed: embedRes.modelUsed,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoadingAnswer(false);
        return;
      }

      // 1. Embed query
      const embedRes = await fetchEmbeddings([queryForRetrieval]);
      const queryVector = embedRes.embeddings[0];

      // 2. Perform Retrieval
      const retrieval = performRetrieval({
        query: queryForRetrieval,
        queryEmbedding: queryVector,
        chunks,
        topK,
        threshold,
        hybridEnabled,
        selectedCareSheet,
      });

      // Update inspector panel immediately (set emergencyDetected from new question only)
      setLastRetrievalResult({
        ...retrieval,
        emergencyDetected: isEmergency,
        emergencyReason: isEmergency ? emergencyReason : undefined,
      });

      let answerText = '';
      let noneFound = false;
      let refusedByModel = false;
      let usedSectionsChecked = 0;
      let usedModel = embedRes.modelUsed;
      let sources: Array<{ document: string; section: string; reviewedDate: string }> = [];

      // 3. Rule 5 & silence check:
      if (retrieval.sentToModelCount === 0) {
        noneFound = true;
        refusedByModel = false;
        answerText = 'I could not find that in the documents. Please ask your doctor or pharmacist.';
        sources = [];
      } else {
        // Call Gemini Model with system instruction (pass isEmergency from new question only)
        const systemInstruction = buildSystemInstruction(
          selectedCareSheet,
          threshold,
          isEmergency
        );
        const chunksForModel = retrieval.usedChunks.map((sc) => ({
          medicine: sc.chunk.medicineName,
          section: sc.chunk.sectionHeading,
          text: sc.chunk.text,
          reviewedDate: sc.chunk.lastReviewedDate,
        }));

        const genRes = await generateRAGAnswer({
          prompt: queryText, // Pass original question to model
          systemInstruction,
          chunks: chunksForModel,
        });

        answerText = genRes.answer;
        usedModel = genRes.modelUsed;

        // Change 5: strip every "This may be urgent. Call 112 or go to the nearest hospital now." from model text
        answerText = stripEmergencyBannerText(answerText);

        // Change 1 & 6: If model answer contains "I could not find that in the documents", treat as model refusal
        if (/I could not find that in the documents/i.test(answerText)) {
          noneFound = true;
          refusedByModel = true;
          usedSectionsChecked = retrieval.usedChunks.length;
          answerText = 'I could not find that in the documents. Please ask your doctor or pharmacist.';
          sources = [];
        } else {
          noneFound = false;
          refusedByModel = false;
          // Build sources list only from the chunks actually USED, removing duplicates with same document and section
          const seenSources = new Set<string>();
          retrieval.usedChunks.forEach((sc) => {
            const key = `${sc.chunk.medicineName}:::${sc.chunk.sectionHeading}`;
            if (!seenSources.has(key)) {
              seenSources.add(key);
              sources.push({
                document: sc.chunk.medicineName,
                section: sc.chunk.sectionHeading,
                reviewedDate: sc.chunk.lastReviewedDate,
              });
            }
          });
        }
      }

      // App owns the emergency banner: show it once as the red banner at top, do not prefix into answerText
      const emergencyBannerText = isEmergency
        ? 'This may be urgent. Call 112 or go to the nearest hospital now.'
        : undefined;

      const hasCareSheet = retrieval.usedChunks.some((c) => c.chunk.documentType === 'care sheet');
      const hasLeaflet = retrieval.usedChunks.some((c) => c.chunk.documentType === 'leaflet' || c.chunk.documentType !== 'care sheet');
      let answerType: QuestionLogItem['answerType'] = 'not found';
      if (!noneFound) {
        if (hasCareSheet && hasLeaflet) answerType = 'care sheet & leaflet';
        else if (hasCareSheet) answerType = 'care sheet';
        else answerType = 'leaflet';
      }

      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: answerText,
        isEmergency,
        emergencyBannerText,
        sources: noneFound ? [] : sources,
        noneFound,
        refusedByModel,
        usedSectionsChecked,
        usedChunks: retrieval.usedChunks,
        thresholdUsed: threshold,
        timestamp: new Date(),
        modelUsed: usedModel,
        queryText,
        answerType,
        medicinesDetected: queryMedicines,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Feature 2 & 3: Log answered question to insights log
      const logItem: QuestionLogItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        assistantMessageId: assistantMsg.id,
        question: queryText,
        medicinesDetected: queryMedicines,
        careSheetSelected: selectedCareSheet,
        answerType,
        timestamp: new Date(),
        timeFormatted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setQuestionsLog((prev) => {
        const next = [...prev, logItem];
        try {
          localStorage.setItem(STORAGE_KEY_INSIGHTS, JSON.stringify(next));
        } catch (e) {
          console.warn('Could not save insights log to localStorage:', e);
        }
        return next;
      });
    } catch (err: any) {
      console.error('Error handling question:', err);
      const errorMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: 'Something went wrong. Please try again.',
        isError: true,
        failedQuery: queryText,
        noneFound: true,
        thresholdUsed: threshold,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setLastRetrievalResult(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F6F8F9] text-gray-900 font-sans">
      {/* Top Bar with Sliders, Care Sheet Dropdown, and Controls */}
      <TopBar
        selectedCareSheet={selectedCareSheet}
        setSelectedCareSheet={setSelectedCareSheet}
        topK={topK}
        setTopK={setTopK}
        threshold={threshold}
        setThreshold={setThreshold}
        hybridEnabled={hybridEnabled}
        setHybridEnabled={setHybridEnabled}
        onReingest={handleReingest}
        isEmbedding={isEmbedding}
        activeModelInfo={activeModelInfo}
        mobileTab={mobileTab}
        setMobileTab={setMobileTab}
        activeDesktopView={activeDesktopView}
        setActiveDesktopView={setActiveDesktopView}
        largeText={largeText}
        setLargeText={handleSetLargeText}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Verification Tests View (Desktop Switcher or Mobile Tab) */}
        {activeDesktopView === 'tests' || mobileTab === 'tests' ? (
          <TestsTab
            chunks={chunks}
            threshold={threshold}
            topK={topK}
            hybridEnabled={hybridEnabled}
            onSetSelectedCareSheet={setSelectedCareSheet}
            onSelectResultForInspector={setLastRetrievalResult}
          />
        ) : activeDesktopView === 'insights' || mobileTab === 'insights' ? (
          <InsightsTab
            questionsLog={questionsLog}
            onClearLog={() => saveQuestionsLog([])}
          />
        ) : (
          /* 3-Column Test Bench Dashboard */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Column: Documents Ingestion (Desktop or Mobile Tab) */}
            <aside
              className={`w-full lg:w-72 xl:w-80 h-full shrink-0 border-r border-gray-200 transition-all ${
                mobileTab === 'docs' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
              }`}
            >
              <DocumentsColumn
                documents={documents}
                totalChunks={chunks.length}
                onFileUpload={handleFileUpload}
                onSelectDoc={setInspectingDoc}
                onClearDocs={handleClearDocs}
                isEmbedding={isEmbedding}
                embeddingProgress={embeddingProgress}
              />
            </aside>

            {/* Centre Column: Chat */}
            <main
              className={`flex-1 h-full min-w-0 transition-all ${
                mobileTab === 'chat' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
              }`}
            >
              <ChatColumn
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoadingAnswer}
                onClearChat={handleClearChat}
                currentThreshold={threshold}
                largeText={largeText}
                onFeedback={handleFeedback}
                availableMedicines={availableMedicines}
                totalDocuments={documents.length}
                onGoToDocuments={() => {
                  setMobileTab('docs');
                  setActiveDesktopView('main');
                }}
                onRetry={(query) => handleSendMessage(query)}
              />
            </main>

            {/* Right Column: Retrieval Inspector (Desktop or Mobile Tab) */}
            <aside
              className={`w-full lg:w-80 xl:w-96 h-full shrink-0 border-l border-gray-200 transition-all ${
                mobileTab === 'inspector' ? 'flex flex-col' : 'hidden lg:flex lg:flex-col'
              }`}
            >
              <RetrievalInspector
                retrievalResult={lastRetrievalResult}
                currentThreshold={threshold}
              />
            </aside>
          </div>
        )}
      </div>

      {/* Document Content Modal */}
      {inspectingDoc && (
        <DocumentModal
          document={inspectingDoc}
          onClose={() => setInspectingDoc(null)}
        />
      )}
    </div>
  );
}
