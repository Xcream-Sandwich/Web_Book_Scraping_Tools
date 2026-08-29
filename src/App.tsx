import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ScraperControls } from "./components/ScraperControls";
import { BentoTopMetrics, BentoDistributionCard, BentoTerminalLog } from "./components/StatsCards";
import { ResultsTable } from "./components/ResultsTable";
import { EmptyOrErrorState } from "./components/EmptyOrErrorState";
import { PythonCodeViewer } from "./components/PythonCodeViewer";
import { DownloadQueueDrawer } from "./components/DownloadQueueDrawer";
import { useDownloadQueue } from "./hooks/useDownloadQueue";
import { ScrapeResponse, ScrapedFile } from "./types";

interface TerminalLogEntry {
  time: string;
  level: "INFO" | "SUCCESS" | "BS4" | "WARN" | "ERROR";
  text: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"scraper" | "pythonCode">("scraper");
  const [url, setUrl] = useState<string>("");
  const [selectedExts, setSelectedExts] = useState<string[]>(["pdf", "epub", "mobi", "cbz"]);
  const [timeoutSec, setTimeoutSec] = useState<number>(15);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResponse | null>(null);
  const [logs, setLogs] = useState<TerminalLogEntry[]>([
    { time: "11:05:01", level: "INFO", text: "Directory scraper engine initialized." },
    { time: "11:05:02", level: "SUCCESS", text: "BeautifulSoup 4 parser loaded." },
    { time: "11:05:02", level: "INFO", text: "Ready. Target URL can be inserted." },
  ]);

  // Download Queue Manager Hook
  const {
    queue,
    isQueueRunning,
    isQueueOpen,
    concurrency,
    setIsQueueOpen,
    setConcurrency,
    addToQueue,
    cancelItem,
    removeItem,
    retryItem,
    retryAllFailed,
    clearCompleted,
    clearAll,
    toggleQueue,
  } = useDownloadQueue();

  useEffect(() => {
    // Check if user has explicit preference, otherwise default to dark mode
    const isDark = localStorage.getItem('theme') === 'light' ? false : true;
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const addLog = (level: "INFO" | "SUCCESS" | "BS4" | "WARN" | "ERROR", text: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    setLogs((prev) => [...prev.slice(-15), { time: timeStr, level, text }]);
  };

  const handleScrape = async (targetUrlOverride?: string) => {
    const targetUrl = targetUrlOverride || url;
    if (!targetUrl || !targetUrl.trim()) return;

    setIsLoading(true);
    setScrapeResult(null);

    addLog("INFO", `Initiating request to: ${targetUrl.slice(0, 45)}...`);
    addLog("BS4", `Filtering formats: .${selectedExts.join(", .")}`);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: targetUrl.trim(),
          extensions: selectedExts,
          timeoutSeconds: timeoutSec,
        }),
      });

      const data: ScrapeResponse = await response.json();
      setScrapeResult(data);

      if (data.success && data.files) {
        if (data.isRecursive && data.subdirectories && data.subdirectories.length > 0) {
          addLog("INFO", `Detected ${data.subdirectories.length} subdirectories. Completed multi-folder scan.`);
        }
        addLog("SUCCESS", `HTTP 200 OK. Scanned ${data.totalFound || data.files.length} document links.`);
        addLog("BS4", `Extracted ${data.files.length} document assets in ${((data.scanDurationMs || 350) / 1000).toFixed(2)}s.`);
      } else {
        addLog("WARN", data.error || "No documents matched filter criteria.");
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || "Connection timeout or network failure.";
      setScrapeResult({
        success: false,
        error: `Scraping request failed: ${msg}`,
      });
      addLog("ERROR", `Request exception: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    addLog("INFO", `Loaded preset directory URL: ${presetUrl}`);
    handleScrape(presetUrl);
  };

  // Perform initial scan on first mount
  useEffect(() => {
    handleScrape("mock://gutenberg-classics");
  }, []);

  const activeFiles = scrapeResult?.files || [];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 dark:selection:bg-indigo-500 selection:text-indigo-900 dark:selection:text-white">
      {/* Bento Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLoading={isLoading}
        queueCount={queue.length}
        onOpenQueue={() => setIsQueueOpen(true)}
      />

      {/* Main Bento Grid Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {activeTab === "scraper" ? (
          <div className="space-y-4">
            {/* Top Bento Row: Controls + Quick Metrics */}
            <div className="grid grid-cols-12 gap-4 items-stretch">
              {/* Controls Bento Card (Span 8) */}
              <div className="col-span-12 lg:col-span-8 flex flex-col">
                <ScraperControls
                  url={url}
                  setUrl={setUrl}
                  selectedExts={selectedExts}
                  setSelectedExts={setSelectedExts}
                  timeoutSec={timeoutSec}
                  setTimeoutSec={setTimeoutSec}
                  isLoading={isLoading}
                  onScrape={() => handleScrape()}
                />
              </div>

              {/* Quick Metrics Bento Card (Span 4) */}
              <div className="col-span-12 lg:col-span-4 flex flex-col">
                <BentoTopMetrics
                  files={activeFiles}
                  durationMs={scrapeResult?.scanDurationMs}
                  serverType={scrapeResult?.serverType}
                  totalFound={scrapeResult?.totalFound}
                  subdirectoriesCount={scrapeResult?.subdirectories?.length}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Main Bento Grid Row: Asset List + Sidebar Diagnostics */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left/Main Column: Scanned Assets Table / Loading / Errors (Span 8 or 9) */}
              <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">
                {isLoading ? (
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-10 text-center space-y-4">
                    <div className="relative mx-auto w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                      <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Executing Directory Scraping...
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto font-mono">
                        Sending GET request, extracting anchor DOM nodes via BeautifulSoup, parsing .{selectedExts.join(", .")} assets across root and subfolders.
                      </p>
                    </div>
                  </div>
                ) : scrapeResult ? (
                  scrapeResult.success && scrapeResult.files && scrapeResult.files.length > 0 ? (
                    <ResultsTable
                      files={scrapeResult.files}
                      subdirectories={scrapeResult.subdirectories}
                      isRecursive={scrapeResult.isRecursive}
                      onAddToQueue={(filesToAdd) => addToQueue(filesToAdd, true)}
                      queueCount={queue.length}
                      onOpenQueue={() => setIsQueueOpen(true)}
                    />
                  ) : (
                    <EmptyOrErrorState
                      type={scrapeResult.error ? "error" : "empty"}
                      errorMessage={scrapeResult.error}
                      onRetry={() => handleScrape()}
                      onSelectPreset={handleSelectPreset}
                    />
                  )
                ) : (
                  <EmptyOrErrorState
                    type="initial"
                    onSelectPreset={handleSelectPreset}
                  />
                )}
              </div>

              {/* Right Column: Distribution Meter + Live Terminal Log (Span 4 or 3) */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
                {/* Distribution Progress Card */}
                <BentoDistributionCard files={activeFiles} />

                {/* Terminal Log Bento Card */}
                <BentoTerminalLog logs={logs} />
              </div>
            </div>
          </div>
        ) : (
          /* Python Code & Streamlit Source Tab */
          <PythonCodeViewer />
        )}
      </main>

      {/* Download Queue Drawer / Modal */}
      <DownloadQueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        isQueueRunning={isQueueRunning}
        onToggleQueue={toggleQueue}
        onRetryItem={retryItem}
        onRetryAllFailed={retryAllFailed}
        onCancelItem={cancelItem}
        onRemoveItem={removeItem}
        onClearCompleted={clearCompleted}
        onClearAll={clearAll}
        concurrency={concurrency}
        onChangeConcurrency={setConcurrency}
      />

      {/* Bento Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 py-3.5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
          <p>© 2026 DOCSCOUT • Built with Requests & BeautifulSoup4</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Connection Stable
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
              Engine: BS4 v4.12
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
