import React from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  Download,
  Folder,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Ban,
} from "lucide-react";
import { DownloadQueueItem } from "../types";

interface DownloadQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: DownloadQueueItem[];
  isQueueRunning: boolean;
  onToggleQueue: () => void;
  onRetryItem: (id: string) => void;
  onRetryAllFailed: () => void;
  onCancelItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  concurrency: number;
  onChangeConcurrency: (c: number) => void;
}

export const DownloadQueueDrawer: React.FC<DownloadQueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  isQueueRunning,
  onToggleQueue,
  onRetryItem,
  onRetryAllFailed,
  onCancelItem,
  onRemoveItem,
  onClearCompleted,
  onClearAll,
  concurrency,
  onChangeConcurrency,
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);

  const stats = React.useMemo(() => {
    const total = queue.length;
    const completed = queue.filter((i) => i.status === "completed").length;
    const downloading = queue.filter((i) => i.status === "downloading").length;
    const queued = queue.filter((i) => i.status === "queued").length;
    const failed = queue.filter((i) => i.status === "failed").length;
    const paused = queue.filter((i) => i.status === "paused").length;

    const totalProgress =
      total > 0
        ? Math.round(
            queue.reduce((acc, item) => {
              if (item.status === "completed") return acc + 100;
              if (item.status === "downloading") return acc + (item.progress || 0);
              return acc;
            }, 0) / total
          )
        : 0;

    return { total, completed, downloading, queued, failed, paused, totalProgress };
  }, [queue]);

  if (queue.length === 0 && !isOpen) {
    return null;
  }

  // Floating Mini-Widget when drawer is closed but queue exists
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:bg-zinc-800 border border-indigo-500/40 text-white rounded-full shadow-2xl backdrop-blur-md transition-all hover:scale-105 group"
        >
          <div className="relative flex items-center justify-center">
            {stats.downloading > 0 ? (
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            ) : (
              <Layers className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            )}
            <span className="absolute -top-2 -right-2 px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-bold rounded-full border border-zinc-100 dark:border-zinc-900">
              {stats.total}
            </span>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span>Download Queue</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                ({stats.completed}/{stats.total})
              </span>
            </div>
            <div className="w-28 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.totalProgress}%` }}
              />
            </div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in">
      <div
        className={`bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col transition-all overflow-hidden ${
          isMinimized ? "max-h-20" : "max-h-[85vh] sm:max-h-[80vh]"
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-white dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600/10 border border-indigo-500/30 text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Download Queue Manager
                </h3>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full">
                  {stats.completed} / {stats.total} Done ({stats.totalProgress}%)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Batch download pipeline with individual progress tracking & error retry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg transition"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg transition"
              title="Close Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Queue Control Toolbar */}
            <div className="p-3 bg-white dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              {/* Primary Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleQueue}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isQueueRunning
                      ? "bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30"
                      : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-900/30"
                  }`}
                >
                  {isQueueRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Queue</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start / Resume</span>
                    </>
                  )}
                </button>

                {stats.failed > 0 && (
                  <button
                    onClick={onRetryAllFailed}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-xs font-semibold transition"
                    title="Retry all failed files"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Failed ({stats.failed})</span>
                  </button>
                )}

                {stats.completed > 0 && (
                  <button
                    onClick={onClearCompleted}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs border border-zinc-300 dark:border-zinc-700/50 transition"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clear Completed</span>
                  </button>
                )}
              </div>

              {/* Concurrency & Clear All */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Concurrency:</span>
                  <select
                    value={concurrency}
                    onChange={(e) => onChangeConcurrency(Number(e.target.value))}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
                  >
                    <option value={1}>1 at a time (Sequential)</option>
                    <option value={2}>2 Parallel</option>
                    <option value={3}>3 Parallel</option>
                  </select>
                </div>

                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-400 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs transition"
                  title="Clear entire queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/60">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">Total Progress:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {stats.totalProgress}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  {stats.downloading > 0 && (
                    <span className="text-indigo-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {stats.downloading} active
                    </span>
                  )}
                  {stats.queued > 0 && (
                    <span className="text-zinc-500 dark:text-zinc-400">{stats.queued} queued</span>
                  )}
                  {stats.completed > 0 && (
                    <span className="text-emerald-400">{stats.completed} completed</span>
                  )}
                  {stats.failed > 0 && (
                    <span className="text-red-400">{stats.failed} failed</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-white dark:bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${stats.totalProgress}%` }}
                />
              </div>
            </div>

            {/* Queue Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh] divide-y divide-zinc-800/40">
              {queue.map((item, index) => {
                const isDownloading = item.status === "downloading";
                const isCompleted = item.status === "completed";
                const isFailed = item.status === "failed";
                const isQueued = item.status === "queued";
                const isPaused = item.status === "paused";

                return (
                  <div
                    key={item.id}
                    className={`pt-2.5 first:pt-0 rounded-xl p-3 border transition-all ${
                      isDownloading
                        ? "bg-indigo-950/20 border-indigo-500/40 shadow-sm"
                        : isCompleted
                        ? "bg-emerald-950/10 border-emerald-500/20"
                        : isFailed
                        ? "bg-red-950/20 border-red-500/30"
                        : "bg-white dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Format Icon & Details */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">
                          #{index + 1}
                        </span>

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                              {item.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                              .{item.ext}
                            </span>
                          </div>

                          {/* Subfolder & Size metadata */}
                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex-wrap font-mono">
                            {item.folder && item.folder !== "Root" && (
                              <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                <Folder className="w-3 h-3" />
                                {item.folder}
                              </span>
                            )}
                            <span>•</span>
                            <span>{item.sizeFormatted}</span>
                            {item.speed && isDownloading && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-400 font-semibold">
                                  {item.speed}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Pill & Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Badge */}
                        {isDownloading && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-full animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{item.progress}%</span>
                          </span>
                        )}

                        {isCompleted && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </span>
                        )}

                        {isFailed && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold rounded-full">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        )}

                        {isQueued && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs rounded-full border border-zinc-300 dark:border-zinc-700">
                            <Clock className="w-3 h-3" />
                            <span>Queued</span>
                          </span>
                        )}

                        {isPaused && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/30">
                            <Pause className="w-3 h-3" />
                            <span>Paused</span>
                          </span>
                        )}

                        {/* Action buttons */}
                        {isFailed && (
                          <button
                            onClick={() => onRetryItem(item.id)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition"
                            title="Retry download"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isDownloading && (
                          <button
                            onClick={() => onCancelItem(item.id)}
                            className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-amber-400 hover:bg-zinc-100 dark:bg-zinc-800 rounded transition"
                            title="Cancel download"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isDownloading && (
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800 rounded transition"
                            title="Remove from queue"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar (Visible if Downloading or Completed or Failed) */}
                    {(isDownloading || isCompleted || (item.progress > 0 && isFailed)) && (
                      <div className="mt-2.5">
                        <div className="w-full bg-zinc-50 dark:bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-150 ${
                              isCompleted
                                ? "bg-emerald-500"
                                : isFailed
                                ? "bg-red-500"
                                : "bg-indigo-500"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message Box */}
                    {isFailed && item.error && (
                      <div className="mt-2 p-2 bg-red-950/40 border border-red-800/40 rounded-lg text-xs text-red-300 flex items-center justify-between gap-2">
                        <span className="truncate">{item.error}</span>
                        <button
                          onClick={() => onRetryItem(item.id)}
                          className="px-2 py-0.5 bg-red-900/60 hover:bg-red-800 text-white rounded text-[10px] font-semibold shrink-0"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div className="p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span>
                Tip: Files are downloaded directly into your browser's download directory.
              </span>
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-medium transition"
              >
                Hide Panel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
