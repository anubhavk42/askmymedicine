import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  AlertTriangle,
  FileCheck,
  Bot,
  HelpCircle,
  ShieldAlert,
  Loader2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  ShieldCheck,
  FileText,
  AlertCircle,
  Share2,
  ChevronDown,
  RotateCcw,
  Upload,
  Sparkles
} from 'lucide-react';
import { ScoredChunk } from '../utils/ragPipeline';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isEmergency?: boolean;
  emergencyBannerText?: string;
  sources?: Array<{
    document: string;
    section: string;
    reviewedDate: string;
  }>;
  noneFound?: boolean;
  refusedByModel?: boolean;
  usedSectionsChecked?: number;
  askWhichMedicine?: boolean;
  usedChunks?: ScoredChunk[];
  thresholdUsed: number;
  timestamp: Date;
  modelUsed?: string;
  feedback?: 'yes' | 'no';
  queryText?: string;
  answerType?: 'care sheet' | 'leaflet' | 'care sheet & leaflet' | 'not found';
  medicinesDetected?: string[];
  isError?: boolean;
  failedQuery?: string;
}

interface ChatColumnProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
  currentThreshold: number;
  largeText: boolean;
  onFeedback?: (messageId: string, feedback: 'yes' | 'no') => void;
  availableMedicines?: string[];
  totalDocuments?: number;
  onGoToDocuments?: () => void;
  onRetry?: (query: string) => void;
}

const TOPIC_PRESETS = [
  {
    label: 'How to take it',
    buildQuery: (med: string) => `How should I take ${med.toLowerCase()}?`,
  },
  {
    label: 'If I miss a dose',
    buildQuery: (med: string) => `If I miss a dose of ${med.toLowerCase()}, what should I do?`,
  },
  {
    label: 'Side effects',
    buildQuery: (med: string) => `What are the side effects of ${med.toLowerCase()}?`,
  },
  {
    label: 'With food, drink or other medicines',
    buildQuery: (med: string) => `Can I take ${med.toLowerCase()} with food, drink or other medicines?`,
  },
  {
    label: 'In pregnancy',
    buildQuery: (med: string) => `Can I take ${med.toLowerCase()} in pregnancy?`,
  },
];

export const ChatColumn: React.FC<ChatColumnProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  currentThreshold,
  largeText,
  onFeedback,
  availableMedicines = [],
  totalDocuments = 0,
  onGoToDocuments,
  onRetry,
}) => {
  const [input, setInput] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const exampleQuestions = [
    {
      title: 'Missed Metformin',
      query: 'I forgot my evening metformin. Should I take two tablets tomorrow morning?',
    },
    {
      title: 'Ibuprofen for Headache',
      query: 'Can I take ibuprofen for my headache?',
    },
    {
      title: 'Azithromycin Dose',
      query: 'What dose of azithromycin should I take for a sore throat?',
    },
    {
      title: 'Emergency Symptom Test',
      query: 'I took medicine and now have trouble breathing and swollen throat',
      isEmergency: true,
    },
  ];

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Change 3: Build WhatsApp Share URL
  const buildWhatsAppShareUrl = (msg: ChatMessage) => {
    const qText = msg.queryText || 'Medicine question';
    let sourceText = 'Uploaded medicine documents';
    if (msg.noneFound) {
      sourceText = 'Not found in uploaded documents';
    } else if (msg.sources && msg.sources.length > 0) {
      sourceText = msg.sources.map((s) => `${s.document} › ${s.section}`).join(' | ');
    }

    const shareText = `Question: ${qText}\n\nAnswer: ${msg.text}\n\nSources: ${sourceText}\n\nFrom AskMyMedicine. I am not a doctor.`;
    return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-[#F6F8F9] overflow-hidden relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
        {/* Change 4: Clear State: If documents are not loaded yet */}
        {totalDocuments === 0 ? (
          <div className="py-12 px-4 text-center max-w-md mx-auto my-auto">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-4 border border-teal-200 shadow-2xs">
              <FileText className="w-7 h-7 text-teal-700" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Please add your medicine documents first
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 mb-6 leading-relaxed">
              Upload your doctor's care sheet or patient information leaflets to ask verified questions.
            </p>
            {onGoToDocuments && (
              <button
                type="button"
                onClick={onGoToDocuments}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl transition-all shadow-xs min-h-[48px]"
              >
                <Upload className="w-4 h-4" />
                <span>Go to documents page</span>
              </button>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-6 sm:py-8 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Ask clinical medicine questions</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 mb-6">
              Ask about timing, missed doses, interactions, or care sheets. Answers are strictly extracted from your verified documents.
            </p>

            {/* Example Question Chips */}
            <div className="text-left">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-2 text-center">
                Try Example Questions:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {exampleQuestions.map((eq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSendMessage(eq.query)}
                    className={`p-3 text-left rounded-xl border transition-all text-xs font-medium hover:scale-[1.01] ${
                      eq.isEmergency
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100'
                        : 'bg-white border-gray-200 text-gray-800 hover:border-teal-500 hover:bg-teal-50/30 shadow-2xs'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5">
                      {eq.isEmergency ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-700" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      )}
                      <span>{eq.title}</span>
                    </div>
                    <p className="text-gray-500 line-clamp-2">{eq.query}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* User Message Bubble */}
              {msg.sender === 'user' ? (
                <div className="max-w-[88%] sm:max-w-[75%] bg-teal-800 text-white rounded-2xl rounded-tr-xs px-4 py-3 shadow-2xs">
                  <p
                    className={
                      largeText
                        ? 'text-[20px] font-semibold leading-relaxed text-white'
                        : 'text-base font-medium leading-relaxed'
                    }
                  >
                    {msg.text}
                  </p>
                  <div className="text-[10px] text-teal-200 mt-1 text-right font-mono">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                /* Assistant Answer Card */
                <div className="max-w-[98%] sm:max-w-[90%] w-full bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
                  {/* Emergency Alert Banner (Red on Top) */}
                  {msg.isEmergency && (
                    <div className="bg-red-700 text-white px-4 py-2.5 flex items-center gap-2.5 text-sm font-bold shadow-xs">
                      <AlertTriangle className="w-5 h-5 text-white shrink-0 animate-bounce" />
                      <div>
                        <p className={`leading-snug ${largeText ? 'text-[20px]' : 'text-sm'}`}>
                          {msg.emergencyBannerText ||
                            'This may be urgent. Call 112 or go to the nearest hospital now.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Change 4: Clear State: If the model call fails, show message with Retry button */}
                  {msg.isError ? (
                    <div className="p-4 sm:p-5 bg-rose-50/70 border-l-4 border-rose-600 space-y-3">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-base">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Something went wrong. Please try again.</span>
                      </div>
                      <p className="text-xs text-rose-800">
                        {msg.text !== 'Something went wrong. Please try again.' ? msg.text : 'A temporary network or model error occurred.'}
                      </p>
                      {msg.failedQuery && (
                        <button
                          type="button"
                          onClick={() => (onRetry ? onRetry(msg.failedQuery!) : onSendMessage(msg.failedQuery!))}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs min-h-[40px] active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Source Badges at top of each answer card */}
                      {!msg.askWhichMedicine && (
                        <div className="px-4 pt-3 pb-2 flex flex-wrap items-center gap-1.5 border-b border-gray-100 bg-gray-50/60">
                          {msg.noneFound ? (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-amber-50 text-amber-900 border border-amber-300 ${
                                largeText ? 'text-base py-1.5 px-3' : 'text-xs py-0.5 px-2'
                              }`}
                            >
                              <AlertCircle
                                className={`${largeText ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-amber-700`}
                              />
                              <span>Not found in the documents</span>
                            </span>
                          ) : (
                            <>
                              {/* Care sheet badge (teal) - shown first if care sheet used */}
                              {msg.usedChunks?.some((c) => c.chunk.documentType === 'care sheet') && (
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-teal-50 text-teal-900 border border-teal-300 ${
                                    largeText ? 'text-base py-1.5 px-3' : 'text-xs py-0.5 px-2'
                                  }`}
                                >
                                  <ShieldCheck
                                    className={`${largeText ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-teal-700`}
                                  />
                                  <span>From your doctor's care sheet</span>
                                </span>
                              )}

                              {/* Leaflet badge (grey) */}
                              {(msg.usedChunks?.some((c) => c.chunk.documentType !== 'care sheet') ||
                                (!msg.usedChunks?.some((c) => c.chunk.documentType === 'care sheet') &&
                                  (msg.sources?.length ?? 0) > 0)) && (
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-md font-bold bg-gray-100 text-gray-800 border border-gray-300 ${
                                    largeText ? 'text-base py-1.5 px-3' : 'text-xs py-0.5 px-2'
                                  }`}
                                >
                                  <FileText
                                    className={`${largeText ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-gray-600`}
                                  />
                                  <span>From the general leaflet</span>
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Body Text: answers use at least 16px text (text-base), or 20px in large text mode */}
                      <div
                        className={`p-4 sm:p-5 text-gray-950 leading-relaxed font-sans whitespace-pre-wrap ${
                          largeText ? 'text-[20px] font-medium' : 'text-base font-normal'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Change 1: On phones, the source panel is collapsed under a button "See where this came from" */}
                      {!msg.askWhichMedicine && (
                        <>
                          <div className="lg:hidden px-4 py-2 border-t border-gray-100 bg-[#FAFBFB]">
                            <button
                              type="button"
                              onClick={() => toggleSource(msg.id)}
                              className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-colors border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-2xs ${
                                largeText ? 'min-h-[48px] px-4 py-2 text-base' : 'px-3 py-1.5 text-xs'
                              }`}
                            >
                              <FileCheck className="w-3.5 h-3.5 text-teal-700" />
                              <span>See where this came from</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  expandedSources[msg.id] ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Source Panel: collapsed under button on phones, open beside the answer on wide screens */}
                          <div
                            className={`${
                              expandedSources[msg.id] ? 'block' : 'hidden lg:block'
                            } bg-[#FAFBFB] border-t border-gray-100 px-4 py-2.5 space-y-2`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              {msg.noneFound ? (
                                <div
                                  className={`inline-flex items-center gap-1.5 font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md ${
                                    largeText ? 'text-[20px] py-2 px-3.5 font-bold' : 'text-xs py-1 px-2.5'
                                  }`}
                                >
                                  <FileCheck
                                    className={`${largeText ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-gray-500`}
                                  />
                                  <span>
                                    {msg.refusedByModel
                                      ? `Source: none found. ${
                                          msg.usedSectionsChecked || msg.usedChunks?.length || 0
                                        } sections were checked and none answered this.`
                                      : `Source: none found. 0 chunks above ${msg.thresholdUsed.toFixed(2)}`}
                                  </span>
                                </div>
                              ) : msg.sources && msg.sources.length > 0 ? (
                                <>
                                  <span
                                    className={`font-bold uppercase tracking-wider text-gray-500 mr-1 ${
                                      largeText ? 'text-sm' : 'text-[11px]'
                                    }`}
                                  >
                                    Sources:
                                  </span>
                                  {msg.sources.map((src, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className={`inline-flex items-center gap-1.5 text-teal-950 bg-teal-50 border border-teal-300 rounded-md font-medium ${
                                        largeText ? 'text-[20px] py-2 px-3.5 font-semibold' : 'text-xs py-1 px-2.5'
                                      }`}
                                    >
                                      <FileCheck
                                        className={`${largeText ? 'w-5 h-5' : 'w-3.5 h-3.5'} text-teal-700 shrink-0`}
                                      />
                                      <span>
                                        {src.document} <span className="text-gray-400">›</span> {src.section}{' '}
                                        <span className="text-gray-400">|</span> rev: {src.reviewedDate}
                                      </span>
                                    </div>
                                  ))}
                                </>
                              ) : (
                                <span className={`text-gray-500 ${largeText ? 'text-[20px]' : 'text-xs'}`}>
                                  Source: Verified documents
                                </span>
                              )}

                              {msg.modelUsed && (
                                <span className="ml-auto text-[10px] text-gray-400 font-mono">
                                  Model: {msg.modelUsed}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Action Bar under answer: WhatsApp Share & Did this solve your doubt? */}
                      {!msg.askWhichMedicine && (
                        <div className="bg-[#F8FAFB] border-t border-gray-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
                          {/* Change 3: Share on WhatsApp Button */}
                          <a
                            href={buildWhatsAppShareUrl(msg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 font-bold rounded-lg transition-all border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 active:scale-95 shadow-2xs ${
                              largeText ? 'min-h-[48px] px-4 py-2.5 text-base' : 'px-3 py-1.5 text-xs'
                            }`}
                            title="Share on WhatsApp"
                          >
                            <Share2 className={`${largeText ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-700`} />
                            <span>Share on WhatsApp</span>
                          </a>

                          {/* Did this solve your doubt? Feedback */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-gray-700 font-semibold ${
                                largeText ? 'text-base font-bold' : 'text-xs'
                              }`}
                            >
                              Did this solve your doubt?
                            </span>

                            {msg.feedback ? (
                              <span
                                className={`inline-flex items-center gap-1.5 font-bold text-teal-900 bg-teal-50 px-3 py-1 rounded-md border border-teal-200 ${
                                  largeText ? 'text-base' : 'text-xs'
                                }`}
                              >
                                <CheckCircle2 className={`${largeText ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-teal-700`} />
                                <span>Thanks</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onFeedback && onFeedback(msg.id, 'yes')}
                                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 active:scale-95 shadow-2xs ${
                                    largeText ? 'min-h-[48px] px-4 py-2 text-base' : 'px-2.5 py-1 text-xs'
                                  }`}
                                  title="Yes, this solved my doubt"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Yes, solved</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onFeedback && onFeedback(msg.id, 'no')}
                                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-bold transition-all border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 active:scale-95 shadow-2xs ${
                                    largeText ? 'min-h-[48px] px-4 py-2 text-base' : 'px-2.5 py-1 text-xs'
                                  }`}
                                  title="No, I am still unsure"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5 text-amber-700" />
                                  <span>No, still unsure</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Change 4: Clear State: While waiting, show "Checking your documents..." */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 max-w-sm w-full shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-sm font-bold text-teal-900">
                <Loader2 className="w-4 h-4 animate-spin text-teal-700 shrink-0" />
                <span>Checking your documents...</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Change 1 & 2 & 5: Fixed Bottom Section on Phones (Message box sits fixed at bottom) */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20 shadow-md lg:shadow-none shrink-0">
        {/* Change 2: Pick a medicine, then a topic (no typing needed) */}
        {availableMedicines.length > 0 && !isLoading && (
          <div className="px-3 py-2 bg-[#FAFBFB] border-b border-gray-200 space-y-1.5">
            {/* Medicine chips row: scrollable sideways on phones */}
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
              <span
                className={`font-bold text-gray-500 shrink-0 uppercase tracking-wider ${
                  largeText ? 'text-xs' : 'text-[10px]'
                }`}
              >
                Medicines:
              </span>
              {availableMedicines.map((med) => {
                const isSelected = selectedMedicine === med;
                return (
                  <button
                    key={med}
                    type="button"
                    onClick={() => setSelectedMedicine(isSelected ? null : med)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border shadow-2xs ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-800 ring-2 ring-teal-500/30'
                        : 'bg-white hover:bg-teal-50 text-gray-800 border-gray-300 hover:border-teal-400'
                    } ${largeText ? 'min-h-[48px] px-4 text-base' : ''}`}
                  >
                    {med}
                  </button>
                );
              })}
              {selectedMedicine && (
                <button
                  type="button"
                  onClick={() => setSelectedMedicine(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline shrink-0 px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* When user taps a medicine, show 5 topic chips */}
            {selectedMedicine && (
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pt-1 pb-0.5 animate-fadeIn">
                <span
                  className={`font-bold text-teal-800 shrink-0 uppercase tracking-wider ${
                    largeText ? 'text-xs' : 'text-[10px]'
                  }`}
                >
                  {selectedMedicine} topics:
                </span>
                {TOPIC_PRESETS.map((topic, tIdx) => (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => {
                      const query = topic.buildQuery(selectedMedicine);
                      onSendMessage(query);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 border bg-teal-50 hover:bg-teal-100 text-teal-950 border-teal-300 shadow-2xs active:scale-95 ${
                      largeText ? 'min-h-[48px] px-4 text-base' : ''
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Change 5: Always-visible disclaimer note above the message box */}
        <div className="px-3.5 py-1.5 bg-amber-50/95 border-b border-amber-200/90 text-xs text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="font-medium">
              I answer only from the uploaded documents. I am not a doctor.
            </span>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              className="text-amber-800 hover:text-amber-950 font-medium text-[11px] flex items-center gap-1 hover:underline ml-2 shrink-0"
              title="Clear Chat History"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Change 1: Message Input Box with Send Button of at least 48px */}
        <div className="p-2.5 sm:p-3 bg-white">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                totalDocuments === 0
                  ? 'Please add your medicine documents first...'
                  : 'Ask a question about your medicines or care sheet...'
              }
              disabled={isLoading || totalDocuments === 0}
              className={`flex-1 bg-gray-50 border border-gray-300 rounded-xl px-4 text-gray-950 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 focus:bg-white transition-all disabled:opacity-50 ${
                largeText ? 'min-h-[52px] text-[20px] py-3.5 font-medium' : 'py-3 text-base'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || totalDocuments === 0}
              className={`bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:hover:bg-teal-700 shadow-xs flex items-center justify-center shrink-0 min-h-[48px] min-w-[48px] ${
                largeText ? 'p-3.5' : 'p-3'
              }`}
              title="Send Question"
            >
              <Send className={`${largeText ? 'w-6 h-6' : 'w-5 h-5'}`} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
