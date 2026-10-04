import React, { useState } from 'react';
import {
  Play,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import {
  DocChunk,
  performRetrieval,
  ScoredChunk,
  buildSystemInstruction,
  stripEmergencyBannerText,
} from '../utils/ragPipeline';
import { fetchEmbeddings, generateRAGAnswer } from '../services/aiService';

export interface TestCase {
  id: string;
  question: string;
  requiredCareSheet: 'none' | 'sheetA' | 'sheetB';
  expectedSummary: string;
  actualAnswer?: string;
  chunksUsed?: ScoredChunk[];
  status: 'PENDING' | 'PASS' | 'FAIL' | 'RUNNING';
  lastRunTimestamp?: string;
  automatedCheckResult?: string;
  modelUsed?: string;
}

const DEFAULT_TESTS: TestCase[] = [
  {
    id: 'test-1',
    question: 'I forgot my evening metformin. Should I take two tablets tomorrow morning?',
    requiredCareSheet: 'none',
    expectedSummary: 'Do not double the dose; if taken more than once a day, skip the missed dose.',
    status: 'PENDING',
  },
  {
    id: 'test-2',
    question: 'Can I take ibuprofen for my headache?',
    requiredCareSheet: 'sheetA',
    expectedSummary:
      'Show both the leaflet and care sheet A, label each, care sheet first; care sheet A says avoid ibuprofen.',
    status: 'PENDING',
  },
  {
    id: 'test-3',
    question: 'What dose of azithromycin should I take for a sore throat?',
    requiredCareSheet: 'none',
    expectedSummary: 'The exact not-found reply, no dose. Zero model calls.',
    status: 'PENDING',
  },
];

interface TestsTabProps {
  chunks: DocChunk[];
  threshold: number;
  topK: number;
  hybridEnabled: boolean;
  onSetSelectedCareSheet: (val: 'none' | 'sheetA' | 'sheetB') => void;
  onSelectResultForInspector: (result: any) => void;
}

export const TestsTab: React.FC<TestsTabProps> = ({
  chunks,
  threshold,
  topK,
  hybridEnabled,
  onSetSelectedCareSheet,
  onSelectResultForInspector,
}) => {
  const [testCases, setTestCases] = useState<TestCase[]>(DEFAULT_TESTS);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);

  // Manual status toggle: "a PASS / FAIL chip that I can set manually"
  const togglePassFail = (id: string) => {
    setTestCases((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const nextStatus = t.status === 'PASS' ? 'FAIL' : 'PASS';
        return { ...t, status: nextStatus };
      })
    );
  };

  const runSingleTest = async (testId: string) => {
    const test = testCases.find((t) => t.id === testId);
    if (!test) return;

    setTestCases((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'RUNNING', actualAnswer: undefined } : t))
    );

    try {
      // Set Care Sheet
      onSetSelectedCareSheet(test.requiredCareSheet);

      // Embed Query
      const embedRes = await fetchEmbeddings([test.question]);
      const queryVector = embedRes.embeddings[0];

      // Perform Retrieval
      const retrieval = performRetrieval({
        query: test.question,
        queryEmbedding: queryVector,
        chunks,
        topK,
        threshold,
        hybridEnabled,
        selectedCareSheet: test.requiredCareSheet,
      });

      onSelectResultForInspector(retrieval);

      let answerText = '';
      let usedModel = embedRes.modelUsed;

      if (retrieval.sentToModelCount === 0) {
        // Safe refusal rule:
        // "If zero chunks survive, do NOT call the model. Show the fixed not-found reply instead."
        answerText =
          `I could not find that in the documents. Please ask your doctor or pharmacist.\n\n` +
          `Source: none found. 0 chunks above ${threshold.toFixed(2)}`;
      } else {
        // Call model with system instruction (Change 7)
        const systemInstruction = buildSystemInstruction(
          test.requiredCareSheet,
          threshold,
          retrieval.emergencyDetected
        );

        const chunksForModel = retrieval.usedChunks.map((sc) => ({
          medicine: sc.chunk.medicineName,
          section: sc.chunk.sectionHeading,
          text: sc.chunk.text,
          reviewedDate: sc.chunk.lastReviewedDate,
        }));

        const genRes = await generateRAGAnswer({
          prompt: test.question,
          systemInstruction,
          chunks: chunksForModel,
        });

        answerText = genRes.answer;
        usedModel = genRes.modelUsed;

        // Strip emergency banner from model text (Change 5)
        answerText = stripEmergencyBannerText(answerText);

        // Not-found handling (Change 1 & 6)
        if (/I could not find that in the documents/i.test(answerText)) {
          answerText =
            `I could not find that in the documents. Please ask your doctor or pharmacist.\n\n` +
            `Source: none found. ${retrieval.usedChunks.length} sections were checked and none answered this.`;
        }
      }

      // Automated evaluation heuristics
      let autoPass = false;
      let reason = '';

      if (test.id === 'test-1') {
        // Metformin missed dose
        const lower = answerText.toLowerCase();
        const hasNoDouble = lower.includes('double') || lower.includes('two doses') || lower.includes('not take 2');
        const hasSkip = lower.includes('skip') || lower.includes('usual time');
        autoPass = hasNoDouble && hasSkip;
        reason = autoPass ? 'Metformin missed dose rules correctly retrieved & stated' : 'Missing skip or double dose warning';
      } else if (test.id === 'test-2') {
        // Ibuprofen with Care Sheet A
        const lower = answerText.toLowerCase();
        const mentionsAvoid = lower.includes('avoid') || lower.includes('do not take') || lower.includes('not recommended');
        const mentionsCareSheet = lower.includes('care sheet') || lower.includes('doctor');
        autoPass = mentionsAvoid && mentionsCareSheet;
        reason = autoPass ? 'Doctor Care Sheet priority & Ibuprofen avoidance correctly enforced' : 'Care sheet contrast missing';
      } else if (test.id === 'test-3') {
        // Azithromycin (not in documents)
        const lower = answerText.toLowerCase();
        const matchesNotFound =
          lower.includes('could not find that in the documents') &&
          lower.includes('doctor or pharmacist');
        autoPass = matchesNotFound && retrieval.sentToModelCount === 0;
        reason = autoPass ? 'Exact not-found reply returned without model call (0 chunks)' : 'Model was invoked or dose invented';
      }

      setTestCases((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                actualAnswer: answerText,
                chunksUsed: retrieval.usedChunks,
                status: autoPass ? 'PASS' : 'FAIL',
                automatedCheckResult: reason,
                lastRunTimestamp: new Date().toLocaleTimeString(),
                modelUsed: usedModel,
              }
            : t
        )
      );
    } catch (err: any) {
      setTestCases((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: 'FAIL',
                actualAnswer: `Execution error: ${err.message}`,
                automatedCheckResult: 'Execution failed',
                lastRunTimestamp: new Date().toLocaleTimeString(),
              }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const test of testCases) {
      await runSingleTest(test.id);
    }
    setIsRunningAll(false);
  };

  // Generate result log for screenshot
  const generateLogText = () => {
    const lines = [
      '====================================================',
      'ASKMYMEDICINE - CLINICAL RAG VERIFICATION LOG',
      `Date: ${new Date().toLocaleString()}`,
      `Config: Threshold=${threshold.toFixed(2)} | Top-K=${topK} | Hybrid=${hybridEnabled ? 'ON' : 'OFF'}`,
      '====================================================\n',
    ];

    testCases.forEach((t, i) => {
      lines.push(`TEST #${i + 1}: ${t.question}`);
      lines.push(`Config: Care Sheet = ${t.requiredCareSheet}`);
      lines.push(`Expected: ${t.expectedSummary}`);
      lines.push(`Status: [ ${t.status} ] (Evaluation: ${t.automatedCheckResult || 'None'})`);
      lines.push(`Chunks Used: ${t.chunksUsed?.length || 0}`);
      if (t.chunksUsed && t.chunksUsed.length > 0) {
        t.chunksUsed.forEach((c) => {
          lines.push(`  - ${c.chunk.medicineName} › ${c.chunk.sectionHeading} (Score: ${c.finalScore.toFixed(3)})`);
        });
      }
      lines.push(`Answer:\n${t.actualAnswer || 'Not run yet'}`);
      lines.push('----------------------------------------------------');
    });

    const passCount = testCases.filter((t) => t.status === 'PASS').length;
    lines.push(`\nSUMMARY: ${passCount} / ${testCases.length} TESTS PASSED`);
    lines.push('====================================================');
    return lines.join('\n');
  };

  const copyLogToClipboard = () => {
    navigator.clipboard.writeText(generateLogText());
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F6F8F9]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Strip */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <h2 className="text-base font-bold text-gray-900">RAG Verification Test Bench</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Verify accuracy against the 3 required acceptance scenarios: dosage safety, care sheet priority, and safe absence refusal.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={runAllTests}
              disabled={isRunningAll || chunks.length === 0}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              <PlayCircle className={`w-4 h-4 ${isRunningAll ? 'animate-spin' : ''}`} />
              {isRunningAll ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={copyLogToClipboard}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-gray-200"
            >
              {copiedLog ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedLog ? 'Copied Log!' : 'Copy Result Log'}
            </button>
          </div>
        </div>

        {/* Warning if no chunks */}
        {chunks.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Please upload or load the 18 clinical documents in the Documents panel before running tests.</span>
          </div>
        )}

        {/* Test Cases Table Cards */}
        <div className="space-y-4">
          {testCases.map((test, index) => {
            return (
              <div
                key={test.id}
                className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden"
              >
                {/* Header Row */}
                <div className="p-4 border-b border-gray-100 bg-[#FAFBFB] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        {test.question}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span>Required Care Sheet:</span>
                        <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.2 rounded border border-purple-200">
                          {test.requiredCareSheet === 'none'
                            ? 'None'
                            : test.requiredCareSheet === 'sheetA'
                            ? 'Sheet A (Diabetes & Cholesterol)'
                            : 'Sheet B (BP & Thyroid)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & PASS/FAIL Chip */}
                  <div className="flex items-center gap-2.5">
                    {/* Status Chip (Clickable to manually toggle) */}
                    <button
                      onClick={() => togglePassFail(test.id)}
                      className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                        test.status === 'PASS'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                          : test.status === 'FAIL'
                          ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                          : test.status === 'RUNNING'
                          ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                      title="Click to manually toggle PASS / FAIL"
                    >
                      {test.status === 'PASS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
                      {test.status === 'FAIL' && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
                      <span>{test.status}</span>
                      <span className="text-[10px] text-gray-400 font-normal">(click to set)</span>
                    </button>

                    {/* Single Run Button */}
                    <button
                      onClick={() => runSingleTest(test.id)}
                      disabled={test.status === 'RUNNING' || chunks.length === 0}
                      className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-teal-700" />
                      Run
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Left: Expected */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Expected Behavior:
                    </span>
                    <p className="text-gray-800 leading-relaxed font-medium">{test.expectedSummary}</p>
                    {test.automatedCheckResult && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-[11px] text-gray-600">
                        <strong>Evaluation Note:</strong> {test.automatedCheckResult}
                      </div>
                    )}
                  </div>

                  {/* Right: Actual Answer */}
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Actual Answer:
                      </span>
                      {test.lastRunTimestamp && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          Ran at: {test.lastRunTimestamp}
                        </span>
                      )}
                    </div>
                    {test.actualAnswer ? (
                      <p className="text-gray-900 leading-relaxed font-sans whitespace-pre-wrap">
                        {test.actualAnswer}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">Not run yet. Click "Run" to test.</p>
                    )}
                  </div>
                </div>

                {/* Chunks Used Footer */}
                {test.chunksUsed && test.chunksUsed.length > 0 && (
                  <div className="px-4 py-2.5 bg-teal-50/60 border-t border-teal-100 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-teal-900 text-[11px]">
                      Chunks Used ({test.chunksUsed.length}):
                    </span>
                    {test.chunksUsed.map((sc, scIdx) => (
                      <span
                        key={scIdx}
                        className="inline-flex items-center gap-1 bg-white border border-teal-200 text-teal-900 px-2 py-0.5 rounded text-[11px] font-medium"
                      >
                        <FileCheck className="w-3 h-3 text-teal-700" />
                        {sc.chunk.medicineName} › {sc.chunk.sectionHeading} ({sc.finalScore.toFixed(2)})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Small Result Log (ready to screenshot) */}
        <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs shadow-md border border-gray-800">
          <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-gray-400 font-semibold text-[11px] ml-1">
                Verification Result Log (Ready to Screenshot)
              </span>
            </div>
            <button
              onClick={copyLogToClipboard}
              className="text-gray-400 hover:text-white text-[11px] flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded transition-colors"
            >
              {copiedLog ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedLog ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px] text-emerald-400">
            {generateLogText()}
          </pre>
        </div>
      </div>
    </div>
  );
};
