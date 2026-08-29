import React, { useState } from "react";
import { Search, Loader2, SlidersHorizontal, Check, X, Globe, Sparkles, Zap } from "lucide-react";
import { SUPPORTED_EXTENSIONS } from "../constants";

interface ScraperControlsProps {
  url: string;
  setUrl: (url: string) => void;
  selectedExts: string[];
  setSelectedExts: (exts: string[]) => void;
  timeoutSec: number;
  setTimeoutSec: (sec: number) => void;
  isLoading: boolean;
  onScrape: () => void;
}

export const ScraperControls: React.FC<ScraperControlsProps> = ({
  url,
  setUrl,
  selectedExts,
  setSelectedExts,
  timeoutSec,
  setTimeoutSec,
  isLoading,
  onScrape,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customExtInput, setCustomExtInput] = useState("");

  const isAllSelected = selectedExts.includes("*") || selectedExts.includes("all");

  const toggleExt = (ext: string) => {
    if (isAllSelected) {
      // If was in ALL mode, switch to specific selection
      setSelectedExts([ext]);
      return;
    }
    if (selectedExts.includes(ext)) {
      if (selectedExts.length > 1) {
        setSelectedExts(selectedExts.filter((e) => e !== ext));
      }
    } else {
      setSelectedExts([...selectedExts, ext]);
    }
  };

  const selectAllMode = () => {
    setSelectedExts(["*"]);
  };

  const selectAllStandardExts = () => {
    setSelectedExts(SUPPORTED_EXTENSIONS.map((e) => e.ext));
  };

  const selectDefaultExts = () => {
    setSelectedExts(["pdf", "epub", "zip", "mobi", "cbz"]);
  };

  const selectEbooksOnly = () => {
    setSelectedExts(["pdf", "epub", "mobi", "azw3", "djvu", "txt", "docx"]);
  };

  const selectArchivesOnly = () => {
    setSelectedExts(["zip", "rar", "7z"]);
  };

  const handleAddCustomExt = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customExtInput.trim().toLowerCase().replace(/^\./, "");
    if (clean && !selectedExts.includes(clean)) {
      if (isAllSelected) {
        setSelectedExts([clean]);
      } else {
        setSelectedExts([...selectedExts, clean]);
      }
      setCustomExtInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading && url.trim()) {
      onScrape();
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {/* Target URL Input Area + Execute Scrape */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-grow relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="target-url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Masukkan URL direktori web target (e.g. https://archive.org/download/...)"
            disabled={isLoading}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition duration-150 disabled:opacity-50 font-mono text-xs sm:text-sm"
          />
          {url && !isLoading && (
            <button
              id="btn-clear-url"
              onClick={() => setUrl("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
              title="Clear URL"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Primary Execute Scrape Action */}
        <button
          id="btn-start-scrape"
          onClick={onScrape}
          disabled={isLoading || !url.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <span>Execute Scrape</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Extension Filters & Format Quick Selectors */}
      <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
              Target Formats:
            </span>
            {isAllSelected && (
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-bold">
                ALL FILES MODE (*.*)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={selectAllMode}
              className={`px-2 py-0.5 rounded transition font-medium ${
                isAllSelected ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-indigo-300 bg-zinc-950 border border-zinc-800"
              }`}
            >
              🌟 Scan Semua Format (*.*)
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={selectDefaultExts}
              className="text-zinc-500 hover:text-indigo-400 transition"
            >
              Default (PDF, EPUB, ZIP, MOBI, CBZ)
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={selectEbooksOnly}
              className="text-zinc-500 hover:text-indigo-400 transition"
            >
              E-Books Only
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={selectArchivesOnly}
              className="text-zinc-500 hover:text-indigo-400 transition"
            >
              Archives (ZIP/RAR)
            </button>
          </div>
        </div>

        {/* Extension Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SUPPORTED_EXTENSIONS.map((item) => {
            const isSelected = !isAllSelected && selectedExts.includes(item.ext);
            return (
              <button
                key={item.ext}
                type="button"
                onClick={() => toggleExt(item.ext)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  isSelected
                    ? `${item.badgeBg} ${item.badgeBorder} ${item.badgeText} shadow-sm ring-1 ring-inset ring-current/20`
                    : isAllSelected
                    ? "bg-zinc-900/60 text-zinc-400 border-zinc-800 opacity-60"
                    : "bg-zinc-950 text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-current" : "bg-zinc-700"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Custom Extension Input */}
          <form onSubmit={handleAddCustomExt} className="flex items-center gap-1 ml-1">
            <input
              type="text"
              value={customExtInput}
              onChange={(e) => setCustomExtInput(e.target.value)}
              placeholder="+ custom (e.g. azw)"
              className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
            {customExtInput && (
              <button
                type="submit"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
              >
                Add
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="pt-2 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 font-medium transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAdvanced ? "Hide Advanced Config" : "Timeout & Connection Settings"}</span>
          </button>
          <span className="text-zinc-500 font-mono text-[11px]">
            Timeout: <strong className="text-zinc-300">{timeoutSec}s</strong>
          </span>
        </div>

        {showAdvanced && (
          <div className="mt-3 p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2 animate-fadeIn">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Request Timeout (Seconds):</span>
              <span className="font-mono text-indigo-400 font-semibold">{timeoutSec}s</span>
            </div>
            <input
              type="range"
              min={5}
              max={45}
              step={5}
              value={timeoutSec}
              onChange={(e) => setTimeoutSec(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 font-mono">
              <span>5s (Fast)</span>
              <span>15s (Recommended)</span>
              <span>45s (Deep Scan)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

