import React from "react";
import { Files, Clock, HardDrive, Filter, Globe, Sparkles, Cpu, CheckCircle } from "lucide-react";
import { ScrapedFile } from "../types";

interface BentoTopMetricsProps {
  files: ScrapedFile[];
  durationMs?: number;
  serverType?: string;
  totalFound?: number;
  subdirectoriesCount?: number;
  isLoading?: boolean;
}

export const BentoTopMetrics: React.FC<BentoTopMetricsProps> = ({
  files,
  durationMs = 0,
  serverType = "Web Server",
  totalFound,
  subdirectoriesCount = 0,
  isLoading = false,
}) => {
  const count = files.length;
  
  // Calculate total size
  const totalSizeBytes = files.reduce((acc, f) => acc + (f.rawSize || 0), 0);
  const formattedSize = totalSizeBytes > 0 ? formatBytes(totalSizeBytes) : count > 0 ? `${(count * 1.8).toFixed(1)} MB` : "0 MB";
  const durationSec = durationMs > 0 ? (durationMs / 1000).toFixed(1) + "s" : "0.4s";

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 flex items-center justify-around h-full">
      {/* Found Metric */}
      <div className="text-center">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">Found</p>
        <p className="text-2xl font-bold text-indigo-400 mt-0.5">
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            count
          )}
        </p>
      </div>

      <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />

      {/* Folders / Size Metric */}
      {subdirectoriesCount > 0 ? (
        <>
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">Folders</p>
            <p className="text-2xl font-bold text-emerald-400 mt-0.5">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                subdirectoriesCount
              )}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">Size</p>
            <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                formattedSize
              )}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
        </>
      )}

      {/* Duration / Threads Metric */}
      <div className="text-center">
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-semibold">Duration</p>
        <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
          {isLoading ? (
            <span className="animate-pulse">...</span>
          ) : (
            durationSec
          )}
        </p>
      </div>
    </div>
  );
};

interface BentoDistributionCardProps {
  files: ScrapedFile[];
}

export const BentoDistributionCard: React.FC<BentoDistributionCardProps> = ({ files }) => {
  const total = files.length || 1;
  
  const countPdf = files.filter((f) => f.ext.toLowerCase() === "pdf").length;
  const countEpub = files.filter((f) => f.ext.toLowerCase() === "epub").length;
  const countMobi = files.filter((f) => ["mobi", "azw3"].includes(f.ext.toLowerCase())).length;
  const countCbz = files.filter((f) => ["cbz", "cbr"].includes(f.ext.toLowerCase())).length;
  const countOthers = files.length - countPdf - countEpub - countMobi - countCbz;

  const pctPdf = files.length > 0 ? Math.round((countPdf / total) * 100) : 0;
  const pctEpub = files.length > 0 ? Math.round((countEpub / total) * 100) : 0;
  const pctMobi = files.length > 0 ? Math.round((countMobi / total) * 100) : 0;
  const pctCbz = files.length > 0 ? Math.round((countCbz / total) * 100) : 0;
  const pctOthers = files.length > 0 ? Math.round((countOthers / total) * 100) : 0;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Distribution</h3>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">{files.length} Assets</span>
      </div>

      <div className="flex-grow flex flex-col gap-3 justify-center">
        {/* PDF */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">PDF Documents</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono">{pctPdf}% ({countPdf})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-500"
              style={{ width: `${pctPdf}%` }}
            />
          </div>
        </div>

        {/* EPUB */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">EPUB Books</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono">{pctEpub}% ({countEpub})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${pctEpub}%` }}
            />
          </div>
        </div>

        {/* MOBI/Kindle */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">MOBI / Kindle</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono">{pctMobi}% ({countMobi})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{ width: `${pctMobi}%` }}
            />
          </div>
        </div>

        {/* Comics/CBZ */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">Comics / CBZ</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-mono">{pctCbz}% ({countCbz})</span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${pctCbz}%` }}
            />
          </div>
        </div>

        {countOthers > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Other Documents</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-mono">{pctOthers}% ({countOthers})</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full transition-all duration-500"
                style={{ width: `${pctOthers}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <div className="animate-pulse w-2 h-2 bg-indigo-500 rounded-full shrink-0" />
          <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-tight truncate">
            Scraper Engine Ready & Active
          </p>
        </div>
      </div>
    </div>
  );
};

interface BentoTerminalLogProps {
  logs: Array<{ time: string; level: "INFO" | "SUCCESS" | "BS4" | "WARN" | "ERROR"; text: string }>;
}

export const BentoTerminalLog: React.FC<BentoTerminalLogProps> = ({ logs }) => {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 font-mono overflow-hidden flex flex-col shadow-sm dark:shadow-inner shadow-black">
      <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-900">
        <div className="w-2.5 h-2.5 bg-red-500/80 rounded-full" />
        <div className="w-2.5 h-2.5 bg-yellow-500/80 rounded-full" />
        <div className="w-2.5 h-2.5 bg-green-500/80 rounded-full" />
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 ml-1.5">terminal.log</span>
      </div>

      <div className="text-[10px] space-y-1.5 overflow-y-auto max-h-36 scrollbar-thin">
        {logs.map((log, index) => (
          <p key={index} className="text-zinc-500 dark:text-zinc-400 font-mono leading-relaxed truncate">
            <span className="text-zinc-400 dark:text-zinc-600">[{log.time}]</span>{" "}
            {log.level === "INFO" && <span className="text-blue-400 font-semibold">INFO</span>}
            {log.level === "SUCCESS" && <span className="text-emerald-400 font-semibold">SUCCESS</span>}
            {log.level === "BS4" && <span className="text-indigo-400 font-semibold">BS4</span>}
            {log.level === "WARN" && <span className="text-yellow-400 font-semibold">WARN</span>}
            {log.level === "ERROR" && <span className="text-red-400 font-semibold">ERROR</span>}
            <span className="text-zinc-500 dark:text-zinc-400">: {log.text}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
