import React from "react";
import {
  AlertTriangle,
  FileQuestion,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Bookmark,
} from "lucide-react";

interface EmptyOrErrorStateProps {
  type: "error" | "empty" | "initial";
  errorMessage?: string;
  onRetry?: () => void;
  onSelectPreset?: (url: string) => void;
}

export const EmptyOrErrorState: React.FC<EmptyOrErrorStateProps> = ({
  type,
  errorMessage,
  onRetry,
  onSelectPreset,
}) => {
  if (type === "error") {
    const isForbidden = errorMessage?.includes("403");
    const isTimeout = errorMessage?.includes("timeout");

    return (
      <div className="bg-red-950/20 border border-red-500/30 rounded-xl p-6 text-center space-y-4">
        <div className="mx-auto w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          {isForbidden ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
        </div>

        <div>
          <h3 className="text-sm font-bold text-red-300">Scrape Execution Failed</h3>
          <p className="text-xs text-red-200/80 mt-1 max-w-lg mx-auto font-mono">
            {errorMessage || "Failed to establish handshake or parse directory markup."}
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 max-w-md mx-auto text-left text-xs space-y-2">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Troubleshooting Steps:
          </span>
          <ul className="list-disc list-inside text-zinc-400 space-y-1 text-[11px]">
            {isTimeout && <li>Increase request timeout slider to 30–45 seconds.</li>}
            {isForbidden && <li>Target web directory strictly forbids automated user-agents.</li>}
            <li>Check that the URL has protocol prefix (<code>http://</code> or <code>https://</code>).</li>
            <li>Try one of the verified demo presets below.</li>
          </ul>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    );
  }

  if (type === "empty") {
    return (
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 text-center space-y-4">
        <div className="mx-auto w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <FileQuestion className="w-5 h-5" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-200">No Matching Files Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
            Directory scanned successfully, but no document links with the active format extensions were found.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {/* Presets removed */}
        </div>
      </div>
    );
  }

  // Initial State
  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 text-center space-y-4">
      <div className="max-w-xl mx-auto space-y-1.5">
        <h3 className="text-base font-bold text-zinc-100 tracking-tight">
          Ready to Scan Directory
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Input an open web directory URL to scan and extract documents (<span className="text-indigo-400 font-mono">.pdf, .epub, .mobi, .cbz, dll</span>).
        </p>
      </div>
    </div>
  );
};
