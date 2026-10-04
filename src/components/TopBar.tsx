import React from 'react';
import { Sliders, ShieldCheck, Activity, Sparkles, RefreshCw, BarChart3, Type, PhoneCall } from 'lucide-react';

interface TopBarProps {
  selectedCareSheet: 'none' | 'sheetA' | 'sheetB';
  setSelectedCareSheet: (val: 'none' | 'sheetA' | 'sheetB') => void;
  topK: number;
  setTopK: (val: number) => void;
  threshold: number;
  setThreshold: (val: number) => void;
  hybridEnabled: boolean;
  setHybridEnabled: (val: boolean) => void;
  onReingest: () => void;
  isEmbedding: boolean;
  activeModelInfo: { embeddingModel: string; textModel: string };
  mobileTab: 'chat' | 'inspector' | 'docs' | 'tests' | 'insights';
  setMobileTab: (tab: 'chat' | 'inspector' | 'docs' | 'tests' | 'insights') => void;
  activeDesktopView: 'main' | 'tests' | 'insights';
  setActiveDesktopView: (view: 'main' | 'tests' | 'insights') => void;
  largeText: boolean;
  setLargeText: (val: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedCareSheet,
  setSelectedCareSheet,
  topK,
  setTopK,
  threshold,
  setThreshold,
  hybridEnabled,
  setHybridEnabled,
  onReingest,
  isEmbedding,
  activeModelInfo,
  mobileTab,
  setMobileTab,
  activeDesktopView,
  setActiveDesktopView,
  largeText,
  setLargeText,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Primary Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
                AskMyMedicine
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                RAG Test Bench
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Patient RAG Verification for Everyday Medicines & Care Sheets (India)
            </p>
          </div>
        </div>

        {/* View Switcher (Desktop: Dashboard vs Tests vs Insights) */}
        <div className="hidden lg:flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-medium">
          <button
            onClick={() => setActiveDesktopView('main')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeDesktopView === 'main'
                ? 'bg-white text-teal-900 font-semibold shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            3-Column Dashboard
          </button>
          <button
            onClick={() => setActiveDesktopView('tests')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeDesktopView === 'tests'
                ? 'bg-white text-teal-900 font-semibold shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            Verification Tests
          </button>
          <button
            onClick={() => setActiveDesktopView('insights')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeDesktopView === 'insights'
                ? 'bg-white text-teal-900 font-semibold shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
            Insights
          </button>
        </div>

        {/* Large Text Mode Toggle & Care Sheet Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Emergency? Call 112 Link */}
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-colors shadow-2xs whitespace-nowrap active:scale-95"
            title="Call National Emergency 112"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
            <span>Emergency? Call 112</span>
          </a>

          {/* Large Text Mode Toggle */}
          <button
            onClick={() => setLargeText(!largeText)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
              largeText
                ? 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-400'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title="Toggle Large Text Mode (font size >= 20px, high contrast, tap targets >= 48px)"
          >
            <Type className="w-3.5 h-3.5 text-teal-700" />
            <span>Large text</span>
            <span
              className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                largeText ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {largeText ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Care Sheet Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="care-sheet-select" className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Which care sheet is yours?
            </label>
            <select
              id="care-sheet-select"
              value={selectedCareSheet}
              onChange={(e) => setSelectedCareSheet(e.target.value as any)}
              className="text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 bg-white"
            >
              <option value="none">None</option>
              <option value="sheetA">Sheet A: diabetes and cholesterol</option>
              <option value="sheetB">Sheet B: blood pressure and thyroid</option>
            </select>
          </div>
        </div>
      </div>

      {/* RAG Controls & Sliders Strip */}
      <div className="bg-[#F8FAFB] border-t border-gray-200 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Sliders and Toggles */}
          <div className="flex flex-wrap items-center gap-6 flex-1">
            {/* Top-K Slider */}
            <div className="flex items-center gap-2.5 min-w-[170px]">
              <span className="font-semibold text-gray-700">Top-K:</span>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-24 accent-teal-700 cursor-pointer"
                title={`Top-K: ${topK}`}
              />
              <span className="font-mono font-bold text-teal-800 bg-white px-1.5 py-0.5 border border-gray-200 rounded">
                {topK}
              </span>
            </div>

            {/* Similarity Threshold Slider */}
            <div className="flex items-center gap-2.5 min-w-[260px]">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-700">Similarity threshold:</span>
                <span className="text-[10px] text-gray-500 italic">starting value, tune it</span>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-28 accent-teal-700 cursor-pointer"
                title={`Threshold: ${threshold.toFixed(2)}`}
              />
              <span className="font-mono font-bold text-teal-800 bg-white px-1.5 py-0.5 border border-gray-200 rounded">
                {threshold.toFixed(2)}
              </span>
            </div>

            {/* Hybrid Search Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={hybridEnabled}
                onChange={(e) => setHybridEnabled(e.target.checked)}
                className="rounded text-teal-700 focus:ring-teal-600 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                Hybrid search
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${hybridEnabled ? 'bg-teal-100 text-teal-800' : 'bg-gray-200 text-gray-600'}`}>
                  {hybridEnabled ? 'ON' : 'OFF'}
                </span>
              </span>
            </label>
          </div>

          {/* Model info & Re-ingest button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>Embed: <strong className="text-gray-700 font-mono">{activeModelInfo.embeddingModel}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Gen: <strong className="text-gray-700 font-mono">{activeModelInfo.textModel}</strong></span>
            </div>

            <button
              onClick={onReingest}
              disabled={isEmbedding}
              className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-gray-50 text-teal-800 font-semibold border border-teal-300 rounded-md transition-colors disabled:opacity-50 text-xs shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isEmbedding ? 'animate-spin text-teal-600' : ''}`} />
              {isEmbedding ? 'Ingesting...' : 'Re-ingest'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-t border-gray-200 bg-white text-xs font-semibold text-gray-600">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            mobileTab === 'chat' ? 'border-teal-700 text-teal-800 bg-teal-50/50' : 'border-transparent'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setMobileTab('inspector')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            mobileTab === 'inspector' ? 'border-teal-700 text-teal-800 bg-teal-50/50' : 'border-transparent'
          }`}
        >
          Sources / Inspector
        </button>
        <button
          onClick={() => setMobileTab('docs')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            mobileTab === 'docs' ? 'border-teal-700 text-teal-800 bg-teal-50/50' : 'border-transparent'
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setMobileTab('tests')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            mobileTab === 'tests' ? 'border-teal-700 text-teal-800 bg-teal-50/50' : 'border-transparent'
          }`}
        >
          Tests
        </button>
        <button
          onClick={() => setMobileTab('insights')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            mobileTab === 'insights' ? 'border-teal-700 text-teal-800 bg-teal-50/50' : 'border-transparent'
          }`}
        >
          Insights
        </button>
      </div>
    </header>
  );
};
