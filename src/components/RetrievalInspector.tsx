import React, { useState } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Layers,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';
import { isChunkUsed, RetrievalResult, ScoredChunk } from '../utils/ragPipeline';

interface RetrievalInspectorProps {
  retrievalResult: RetrievalResult | null;
  currentThreshold: number;
}

export const RetrievalInspector: React.FC<RetrievalInspectorProps> = ({
  retrievalResult,
  currentThreshold,
}) => {
  const [expandedChunkId, setExpandedChunkId] = useState<string | null>(null);
  const [showTextSentToModel, setShowTextSentToModel] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedChunkId((prev) => (prev === id ? null : id));
  };

  if (!retrievalResult) {
    return (
      <div className="flex flex-col h-full bg-[#FAFBFB] p-6 text-center text-gray-400 justify-center items-center">
        <Search className="w-10 h-10 text-gray-300 mb-3" />
        <h3 className="text-sm font-bold text-gray-700">Retrieval Inspector</h3>
        <p className="text-xs text-gray-500 max-w-xs mt-1">
          Ask a question in Chat or run a test to inspect real-time vector embeddings, cosine similarities, keyword boosts, and threshold decisions.
        </p>
      </div>
    );
  }

  // Recalculate isUsed dynamically with isChunkUsed helper:
  // "Moving the threshold slider changes which chunks are USED, live."
  const dynamicCandidates = retrievalResult.candidates.map((c) => ({
    ...c,
    isUsed: isChunkUsed(c, currentThreshold),
  }));

  const aboveCount = dynamicCandidates.filter((c) => c.isUsed).length;
  const sentToModelCount = aboveCount;

  return (
    <div className="flex flex-col h-full bg-[#FAFBFB] overflow-hidden">
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">Retrieval Inspector</h2>
          </div>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            {aboveCount} USED
          </span>
        </div>

        {/* Embedded Question Preview */}
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1">
            <span>Embedded Query Vector:</span>
            <span className="font-mono text-[10px] text-teal-700">
              {retrievalResult.queryEmbedding ? `${retrievalResult.queryEmbedding.length}-dim vector` : 'Embedded'}
            </span>
          </div>
          <p className="text-xs font-medium text-gray-900 italic font-serif">
            "{retrievalResult.query}"
          </p>

          {/* Emergency indicator if triggered */}
          {retrievalResult.emergencyDetected && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Emergency keyword detected in query</span>
            </div>
          )}
        </div>

        {/* Active Filters Bar */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
              Top-K: <strong className="text-gray-900">{retrievalResult.topK}</strong>
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
              Threshold: <strong className="text-teal-800">{currentThreshold.toFixed(2)}</strong>
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
              Hybrid:{' '}
              <strong className={retrievalResult.hybridEnabled ? 'text-emerald-700' : 'text-gray-500'}>
                {retrievalResult.hybridEnabled ? 'ON' : 'OFF'}
              </strong>
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded font-medium">
              Care Sheet:{' '}
              <strong className="text-purple-700">
                {retrievalResult.selectedCareSheet === 'none'
                  ? 'None'
                  : retrievalResult.selectedCareSheet === 'sheetA'
                  ? 'Sheet A'
                  : 'Sheet B'}
              </strong>
            </span>
          </div>

          {/* Toggle for Text Sent to Model */}
          <button
            onClick={() => setShowTextSentToModel(!showTextSentToModel)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors border flex items-center gap-1 shrink-0 ${
              showTextSentToModel
                ? 'bg-teal-700 text-white border-teal-800'
                : 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100'
            }`}
            title="Toggle showing text chunks exactly as sent to Gemini model"
          >
            <FileText className="w-3 h-3" />
            <span>{showTextSentToModel ? 'Hide text sent to model' : 'Show text sent to model'}</span>
          </button>
        </div>

        {/* Text Sent to Model Panel (Change 6) */}
        {showTextSentToModel && (
          <div className="mt-2.5 bg-slate-900 text-slate-100 rounded-lg p-2.5 border border-slate-700 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
              <span className="font-bold text-teal-400 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Text Sent to Model ({aboveCount} chunks)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Order: Care sheet first, then leaflets</span>
            </div>
            {aboveCount === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No chunks were sent to the model (0 chunks passed threshold &amp; gate).</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(() => {
                  const csUsed = dynamicCandidates.filter((c) => c.isUsed && c.chunk.documentType === 'care sheet');
                  const lfUsed = dynamicCandidates.filter((c) => c.isUsed && c.chunk.documentType !== 'care sheet');
                  csUsed.sort((a, b) => (b.rawScore + b.boost) - (a.rawScore + a.boost));
                  lfUsed.sort((a, b) => (b.rawScore + b.boost) - (a.rawScore + a.boost));
                  const orderedUsed = [...csUsed, ...lfUsed];

                  return orderedUsed.map((sc, idx) => (
                    <div key={sc.chunk.id} className="bg-slate-950 p-2 rounded border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-teal-300 font-semibold mb-1">
                        <span>[CHUNK {idx + 1}] {sc.chunk.medicineName} › {sc.chunk.sectionHeading}</span>
                        <span className="text-slate-400 font-mono">rev: {sc.chunk.lastReviewedDate}</span>
                      </div>
                      <div className="text-[11px] text-slate-200 whitespace-pre-wrap font-sans leading-relaxed bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                        {sc.chunk.text}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Candidate Chunks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {dynamicCandidates.length === 0 ? (
          <div className="p-6 text-center text-gray-400 bg-white rounded-xl border border-gray-200">
            <Info className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-semibold text-gray-600">No candidate chunks available</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Make sure documents are uploaded and care sheet filters match.
            </p>
          </div>
        ) : (
          dynamicCandidates.map((item) => {
            const isExpanded = expandedChunkId === item.chunk.id;
            const isCareSheet = item.chunk.documentType === 'care sheet';

            return (
              <div
                key={item.chunk.id}
                className={`bg-white rounded-xl border transition-all ${
                  item.isUsed
                    ? 'border-emerald-300 shadow-2xs'
                    : item.gateOk === false
                    ? 'border-rose-200 bg-rose-50/20 opacity-80'
                    : 'border-gray-200 opacity-80 bg-gray-50/50'
                }`}
              >
                {/* Chunk Top Row */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold flex items-center justify-center font-mono">
                        #{item.rank}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">
                          {item.chunk.medicineName}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {item.chunk.sectionHeading}
                        </p>
                      </div>
                    </div>

                    {/* Tag: USED (green), BLOCKED (rose), or IGNORED below threshold (grey) */}
                    <div>
                      {item.isUsed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          USED
                        </span>
                      ) : item.gateOk === false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-300 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5 text-gray-400" />
                          IGNORED below threshold
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Similarity Score Bar with Raw Score as Main Number */}
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-gray-500 font-medium">Raw Cosine Score:</span>
                      <div className="font-mono text-xs flex items-center gap-2">
                        <strong className={item.isUsed ? 'text-emerald-800 font-bold' : 'text-gray-700'}>
                          {item.rawScore.toFixed(3)}
                        </strong>
                        {item.boost !== 0 && (
                          <span className="text-[10px] text-gray-500">
                            ({item.boost > 0 ? `+${item.boost.toFixed(2)} boost` : `${item.boost.toFixed(2)} penalty`} → rank: {item.finalScore.toFixed(3)})
                          </span>
                        )}
                        {item.lexicalFloor !== undefined && (
                          <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1 rounded">
                            floor: {item.lexicalFloor.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Score Bar with Threshold Pin (Threshold applies to raw score) */}
                    <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-visible my-1">
                      {/* Score Fill (based on raw score) */}
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${
                          item.isUsed ? 'bg-emerald-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, item.rawScore * 100))}%` }}
                      />

                      {/* Vertical line indicator at the current threshold */}
                      <div
                        className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-red-600 z-10"
                        style={{ left: `${Math.min(100, Math.max(0, currentThreshold * 100))}%` }}
                        title={`Threshold: ${currentThreshold.toFixed(2)}`}
                      >
                        {/* Tiny pin header on top */}
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 -translate-x-[2px] -translate-y-1"></div>
                      </div>
                    </div>

                    {/* Scale markers */}
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5">
                      <span>0.00</span>
                      <span className="text-red-600 font-bold">▲ Thresh: {currentThreshold.toFixed(2)}</span>
                      <span>1.00</span>
                    </div>
                  </div>

                  {/* Match & Gate Reasons (Show reason when chunk is blocked) */}
                  {item.matchReasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                      {item.matchReasons.map((reason, rIdx) => {
                        const isBlocked = reason.startsWith('Blocked:');
                        return (
                          <span
                            key={rIdx}
                            className={`inline-flex items-center gap-1 border px-1.5 py-0.5 rounded font-medium ${
                              isBlocked
                                ? 'bg-rose-50 text-rose-800 border-rose-200 font-semibold'
                                : 'bg-teal-50 text-teal-800 border border-teal-200'
                            }`}
                          >
                            {isBlocked ? (
                              <XCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                            ) : (
                              <Sparkles className="w-2.5 h-2.5 text-teal-600 shrink-0" />
                            )}
                            {reason}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Expand / Collapse Passage Toggle */}
                  <button
                    onClick={() => toggleExpand(item.chunk.id)}
                    className="mt-2.5 w-full flex items-center justify-between text-[11px] font-semibold text-gray-600 hover:text-teal-800 transition-colors pt-1.5 border-t border-gray-100"
                  >
                    <span className="flex items-center gap-1.5">
                      {isExpanded ? (
                        'Hide passage'
                      ) : item.isUsed ? (
                        <>
                          <FileText className="w-3 h-3 text-emerald-600" />
                          <span>Show text sent to model</span>
                        </>
                      ) : (
                        'Show exact passage text'
                      )}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {/* Exact Passage View */}
                  {isExpanded && (
                    <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 leading-relaxed font-sans">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mb-1.5">
                        <span>File: {item.chunk.fileName} | Reviewed: {item.chunk.lastReviewedDate}</span>
                        {item.isUsed && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded font-sans">
                            Sent to model
                          </span>
                        )}
                      </div>
                      <div className="bg-white p-2 rounded border border-gray-200 text-gray-800 whitespace-pre-wrap font-sans">
                        {item.chunk.text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary Line (Matching Prompt Spec exactly) */}
      <div className="p-3 bg-white border-t border-gray-200 text-xs text-gray-700 font-medium">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-gray-900">
              {dynamicCandidates.length} chunks retrieved,{' '}
              <span className="text-emerald-700 font-bold">{aboveCount} above {currentThreshold.toFixed(2)}</span>,{' '}
              <span className="text-teal-800 font-bold">{sentToModelCount} sent to the model</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

