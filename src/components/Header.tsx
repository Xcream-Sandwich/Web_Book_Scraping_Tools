import React from "react";
import { BookOpen, Code2, Globe, Sparkles, Layers, Terminal } from "lucide-react";

interface HeaderProps {
  activeTab: "scraper" | "pythonCode";
  onTabChange: (tab: "scraper" | "pythonCode") => void;
  isLoading?: boolean;
  queueCount?: number;
  onOpenQueue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  isLoading = false,
  queueCount = 0,
  onOpenQueue,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">DocScraper Pro</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono text-indigo-400">
                  DOCSCOUT
                </span>
              </div>
              <p className="text-xs text-zinc-500">Advanced Directory Scraping Engine v2.4</p>
            </div>
          </div>

          {/* Mobile status pill */}
          <div className="flex md:hidden items-center gap-1.5">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${
              isLoading
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}>
              {isLoading ? "SCANNING..." : "STATUS: READY"}
            </div>
          </div>
        </div>

        {/* Status Pills & Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Bento Status Pills */}
          <div className="hidden lg:flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-mono border ${
              isLoading
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                : "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}>
              {isLoading ? "STATUS: SCANNING..." : "STATUS: READY"}
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-400">
              ENGINE: BEAUTIFULSOUP 4
            </div>
          </div>

          {/* Queue Button if items exist */}
          {queueCount > 0 && onOpenQueue && (
            <button
              onClick={onOpenQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold shadow transition animate-in fade-in"
              title="Open Download Queue Drawer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Queue</span>
              <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                {queueCount}
              </span>
            </button>
          )}

          {/* Bento Tabs */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl shadow-inner">
            <button
              id="tab-interactive-scraper"
              onClick={() => onTabChange("scraper")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "scraper"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Interactive Scraper</span>
            </button>
            <button
              id="tab-python-code"
              onClick={() => onTabChange("pythonCode")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === "pythonCode"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="flex items-center gap-1.5">
                Python Source
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

