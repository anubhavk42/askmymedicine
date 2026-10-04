import React, { useState } from 'react';
import {
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  FileQuestion,
  Copy,
  Check,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  FileText,
  SearchX,
  Trash2
} from 'lucide-react';

export interface QuestionLogItem {
  id: string;
  assistantMessageId?: string;
  question: string;
  medicinesDetected: string[];
  careSheetSelected: string;
  answerType: 'care sheet' | 'leaflet' | 'care sheet & leaflet' | 'not found' | 'clarification';
  feedback?: 'yes' | 'no';
  timestamp: Date | string;
  timeFormatted: string;
}

interface InsightsTabProps {
  questionsLog: QuestionLogItem[];
  onClearLog?: () => void;
}

export const InsightsTab: React.FC<InsightsTabProps> = ({ questionsLog, onClearLog }) => {
  const [copiedCSV, setCopiedCSV] = useState(false);

  const totalQuestions = questionsLog.length;

  // Filter feedback
  const feedbackItems = questionsLog.filter((q) => q.feedback === 'yes' || q.feedback === 'no');
  const yesSolvedCount = questionsLog.filter((q) => q.feedback === 'yes').length;
  const pctSolved =
    feedbackItems.length > 0
      ? Math.round((yesSolvedCount / feedbackItems.length) * 100)
      : totalQuestions > 0 && yesSolvedCount > 0
      ? Math.round((yesSolvedCount / totalQuestions) * 100)
      : 0;

  // Care sheet answered
  const careSheetCount = questionsLog.filter(
    (q) => q.answerType === 'care sheet' || q.answerType === 'care sheet & leaflet'
  ).length;
  const pctCareSheet = totalQuestions > 0 ? Math.round((careSheetCount / totalQuestions) * 100) : 0;

  // Not found
  const notFoundCount = questionsLog.filter((q) => q.answerType === 'not found').length;
  const pctNotFound = totalQuestions > 0 ? Math.round((notFoundCount / totalQuestions) * 100) : 0;

  // Table of unanswered questions: got a not-found reply OR a "No, still unsure" tap
  const unansweredList = questionsLog.filter(
    (q) => q.answerType === 'not found' || q.feedback === 'no'
  );

  const handleCopyCSV = () => {
    if (unansweredList.length === 0) return;
    const header = ['Question', 'Medicine Detected', 'Care Sheet', 'Outcome Reason', 'Time'];
    const rows = unansweredList.map((item) => {
      const med = item.medicinesDetected.length > 0 ? item.medicinesDetected.join('; ') : 'None';
      const reason =
        item.answerType === 'not found'
          ? 'Not found in documents'
          : item.feedback === 'no'
          ? 'User rated: Still unsure'
          : 'Unresolved';
      const cleanQ = `"${item.question.replace(/"/g, '""')}"`;
      return [cleanQ, `"${med}"`, `"${item.careSheetSelected}"`, `"${reason}"`, `"${item.timeFormatted}"`].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopiedCSV(true);
    setTimeout(() => setCopiedCSV(false), 2000);
  };

  return (
    <div className="flex-1 bg-[#FAFBFB] overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-teal-700" />
            <h2 className="text-base font-bold text-gray-900">RAG Analytics &amp; Insights</h2>
            <span className="text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
              Audit Dashboard
            </span>
          </div>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Monitor real-world RAG resolution rates, user feedback, and gaps in your clinical document set. Questions with no matching document or where the user remained unsure are logged below.
          </p>
        </div>

        {questionsLog.length > 0 && onClearLog && (
          <button
            onClick={onClearLog}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            title="Clear all question logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        )}
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total questions asked */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-gray-600">Total Questions</span>
            <FileQuestion className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono">
            {totalQuestions}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {feedbackItems.length} rated by patient
          </div>
        </div>

        {/* Metric 2: % Yes, solved */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-emerald-800">Yes, Solved</span>
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-700 font-mono">
            {pctSolved}%
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {yesSolvedCount} of {feedbackItems.length || totalQuestions || 0} responses
          </div>
        </div>

        {/* Metric 3: % answered from a care sheet */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-purple-900">Care Sheet Used</span>
            <ShieldCheck className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-800 font-mono">
            {pctCareSheet}%
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {careSheetCount} doctor care plan answers
          </div>
        </div>

        {/* Metric 4: % not found */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold text-amber-900">Not Found</span>
            <SearchX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono">
            {pctNotFound}%
          </div>
          <div className="text-[11px] text-gray-400 mt-1">
            {notFoundCount} safe refusal answers
          </div>
        </div>
      </div>

      {/* Unanswered Questions Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>Unanswered &amp; Unresolved Questions</span>
              <span className="text-xs font-mono font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                {unansweredList.length}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Identifies missing medication leaflets, unaddressed symptoms, or user confusion.
            </p>
          </div>

          <button
            onClick={handleCopyCSV}
            disabled={unansweredList.length === 0}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-semibold border border-gray-300 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Copy unresolved questions to clipboard as CSV for documentation or clinical audit"
          >
            {copiedCSV ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied as CSV!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy as CSV</span>
              </>
            )}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {unansweredList.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Check className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-bold text-gray-700">All questions answered successfully!</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                No unanswered questions or unsatisfied patient feedback recorded yet. Try asking an unrepresented medication to test missing document logging.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">Question</th>
                  <th className="py-3 px-4 w-44">Medicine Detected</th>
                  <th className="py-3 px-4 w-32">Care Sheet</th>
                  <th className="py-3 px-4 w-44">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unansweredList.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-400 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-md break-words">
                      "{item.question}"
                    </td>
                    <td className="py-3 px-4">
                      {item.medicinesDetected.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.medicinesDetected.map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 capitalize"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-[11px]">None detected</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {item.careSheetSelected === 'none'
                          ? 'None'
                          : item.careSheetSelected === 'sheetA'
                          ? 'Sheet A'
                          : 'Sheet B'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.answerType === 'not found' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Not found in documents
                        </span>
                      ) : item.feedback === 'no' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300">
                          <ThumbsDown className="w-3 h-3 text-rose-600" />
                          Marked: Still unsure
                        </span>
                      ) : (
                        <span className="text-gray-500 text-[11px]">Unresolved</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-400 text-[11px] whitespace-nowrap">
                      {item.timeFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
