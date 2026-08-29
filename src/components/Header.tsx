import React from "react";
import { Layers, Sun, Moon } from "lucide-react";

interface HeaderProps {
  isLoading?: boolean;
  queueCount?: number;
  onOpenQueue?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoading = false,
  queueCount = 0,
  onOpenQueue,
}) => {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else {
      root.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
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
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">DocScraper Pro</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-mono text-indigo-400">
                  DOCSCOUT
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Advanced Directory Scraping Engine v2.4</p>
            </div>
          </div>
          {/* Mobile status pill */}
          <div className="flex md:hidden items-center gap-1.5">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono border ${
              isLoading
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
            }`}>
              {isLoading ? "SCANNING..." : "STATUS: READY"}
            </div>
          </div>
        </div>

        {/* Status Pills & Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Bento Status Pills */}
          <div className="hidden lg:flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-mono border ${
              isLoading
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
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

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 ml-2"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

