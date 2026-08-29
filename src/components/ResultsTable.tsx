import React, { useState, useMemo } from "react";
import {
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  FileArchive,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  Loader2,
  Folder,
  ChevronLeft,
  ChevronRight,
  ListPlus,
  Layers,
} from "lucide-react";
import JSZip from "jszip";
import { ScrapedFile, ScrapedSubdirectory } from "../types";

interface ResultsTableProps {
  files: ScrapedFile[];
  subdirectories?: ScrapedSubdirectory[];
  isRecursive?: boolean;
  onAddToQueue?: (files: ScrapedFile[]) => void;
  queueCount?: number;
  onOpenQueue?: () => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  files,
  subdirectories = [],
  isRecursive = false,
  onAddToQueue,
  queueCount = 0,
  onOpenQueue,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<string>("ALL");
  const [selectedFolder, setSelectedFolder] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"name" | "ext" | "size" | "folder">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [copiedAllLinks, setCopiedAllLinks] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Available formats among found files
  const availableFormats = useMemo(() => {
    const formats = Array.from(new Set(files.map((f) => f.ext.toUpperCase())));
    return ["ALL", ...formats];
  }, [files]);

  // Available folders among found files
  const availableFolders = useMemo(() => {
    const folders = Array.from(
      new Set(files.map((f) => f.folder).filter(Boolean) as string[])
    );
    return ["ALL", ...folders];
  }, [files]);

  // Filtered and sorted files
  const processedFiles = useMemo(() => {
    let result = files.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.folder && f.folder.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFormat =
        selectedFormat === "ALL" || f.ext.toUpperCase() === selectedFormat;
      const matchesFolder =
        selectedFolder === "ALL" || f.folder === selectedFolder;
      return matchesSearch && matchesFormat && matchesFolder;
    });

    result.sort((a, b) => {
      let valA: string | number = a.name.toLowerCase();
      let valB: string | number = b.name.toLowerCase();

      if (sortField === "ext") {
        valA = a.ext.toLowerCase();
        valB = b.ext.toLowerCase();
      } else if (sortField === "size") {
        valA = a.rawSize || 0;
        valB = b.rawSize || 0;
      } else if (sortField === "folder") {
        valA = (a.folder || "").toLowerCase();
        valB = (b.folder || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [files, searchQuery, selectedFormat, selectedFolder, sortField, sortDirection]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(processedFiles.length / pageSize));
  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedFiles.slice(start, start + pageSize);
  }, [processedFiles, currentPage, pageSize]);

  // Reset to page 1 on filter changes
  const handleFilterChange = (setter: () => void) => {
    setter();
    setCurrentPage(1);
  };

  // Toggle single selection
  const toggleSelectFile = (url: string) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) {
      next.delete(url);
    } else {
      next.add(url);
    }
    setSelectedUrls(next);
  };

  // Toggle select all visible
  const toggleSelectAll = () => {
    if (selectedUrls.size === processedFiles.length && processedFiles.length > 0) {
      setSelectedUrls(new Set());
    } else {
      const allUrls = new Set(processedFiles.map((f) => f.url));
      setSelectedUrls(allUrls);
    }
  };

  // Copy single link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Copy all links
  const handleCopyAllLinks = () => {
    const linksToCopy = processedFiles.map((f) => f.url).join("\n");
    navigator.clipboard.writeText(linksToCopy);
    setCopiedAllLinks(true);
    setTimeout(() => setCopiedAllLinks(false), 2000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["No", "File Name", "Folder / Bundle", "Format", "Size", "Download URL"];
    const rows = processedFiles.map((f, i) => [
      i + 1,
      `"${f.name.replace(/"/g, '""')}"`,
      `"${(f.folder || "Root").replace(/"/g, '""')}"`,
      f.ext.toUpperCase(),
      `"${f.size}"`,
      `"${f.url}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `scraped_documents_${Date.now()}.csv`;
    link.click();
  };

  // Export to TXT Links
  const handleExportTXT = () => {
    const linksText = processedFiles.map((f) => f.url).join("\n");
    const blob = new Blob([linksText], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `document_download_links_${Date.now()}.txt`;
    link.click();
  };

  // Batch ZIP Download
  const handleDownloadZip = async () => {
    let targetFiles =
      selectedUrls.size > 0
        ? files.filter((f) => selectedUrls.has(f.url))
        : processedFiles;

    if (targetFiles.length === 0) return;

    if (targetFiles.length > 50 && selectedUrls.size === 0) {
      const confirmZip = window.confirm(
        `Peringatan: Anda akan mengunduh ${targetFiles.length} berkas sekaligus untuk dijadikan ZIP di memori browser.\n\nJika ukuran total terlalu besar (Gigabytes), tab browser ini mungkin akan crash (Kehabisan Memori). Disarankan untuk menggunakan fitur "Download Queue" untuk unduhan stabil.\n\nApakah Anda tetap ingin melanjutkan pembuatan ZIP?`
      );
      if (!confirmZip) return;
    }

    setIsZipping(true);
    setZipProgress(0);

    try {
      const zip = new JSZip();
      let completed = 0;

      for (const file of targetFiles) {
        try {
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.name)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            // Organize zip in folders if available
            const zipPath = file.folder && file.folder !== "Root" ? `${file.folder}/${file.name}` : file.name;
            zip.file(zipPath, blob);
          } else {
            zip.file(
              `${file.name}.download_link.txt`,
              `Direct Download Link:\n${file.url}`
            );
          }
        } catch {
          zip.file(
            `${file.name}.download_link.txt`,
            `Direct Download Link:\n${file.url}`
          );
        }

        completed++;
        setZipProgress(Math.round((completed / targetFiles.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `scraped_books_${Date.now()}.zip`;
      link.click();
    } catch (err) {
      console.error("ZIP error:", err);
      alert("Gagal membuat berkas ZIP. Anda tetap dapat mengunduh berkas satu per satu atau ekspor tautan TXT.");
    } finally {
      setIsZipping(false);
      setZipProgress(0);
    }
  };

  // Direct download single file
  const handleDirectDownload = (file: ScrapedFile) => {
    const downloadUrl = `/api/proxy-download?url=${encodeURIComponent(file.url)}&filename=${encodeURIComponent(file.name)}`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStyle = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === "pdf") return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (e === "epub") return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (e === "mobi" || e === "azw3") return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
    if (e === "cbz" || e === "cbr") return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    if (e === "djvu") return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
    return "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700";
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden">
      {/* Bento Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Scanned Assets List</h3>
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            {processedFiles.length} / {files.length} items
          </span>
          {isRecursive && (
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-semibold flex items-center gap-1">
              <Folder className="w-3 h-3" />
              {subdirectories.length > 0 ? `${subdirectories.length} Folders Scanned` : "Recursive Active"}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {availableFolders.length > 2 && (
            <select
              value={selectedFolder}
              onChange={(e) => handleFilterChange(() => setSelectedFolder(e.target.value))}
              className="bg-white dark:bg-zinc-950 text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 focus:outline-none focus:border-indigo-500 max-w-[200px] truncate"
            >
              <option value="ALL">All Folders ({availableFolders.length - 1})</option>
              {availableFolders.filter((f) => f !== "ALL").map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          )}
          <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-500 dark:text-zinc-400">
            Sort: {sortField.toUpperCase()} {sortDirection.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Filter & Toolbar Row */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
          <input
            id="table-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
            placeholder="Search document name, folder, or URL..."
            className="w-full bg-white dark:bg-zinc-950 text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 dark:text-zinc-400"
          />
        </div>

        {/* Format Selector Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {availableFormats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => handleFilterChange(() => setSelectedFormat(fmt))}
              className={`text-[11px] px-2 py-1 rounded-md font-semibold transition border ${
                selectedFormat === fmt
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-zinc-50 dark:bg-zinc-900/80 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800/60"
              }`}
            >
              {fmt === "ALL" ? "All Formats" : fmt}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Add Selected or Add All to Queue */}
          {onAddToQueue && (
            <button
              onClick={() => {
                const target = selectedUrls.size > 0
                  ? files.filter((f) => selectedUrls.has(f.url))
                  : processedFiles;
                onAddToQueue(target);
              }}
              disabled={processedFiles.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition disabled:opacity-50"
              title="Add to Download Queue"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>
                {selectedUrls.size > 0
                  ? `Queue Selected (${selectedUrls.size})`
                  : selectedFolder !== "ALL"
                  ? `Queue Folder (${processedFiles.length})`
                  : `Queue All (${processedFiles.length})`}
              </span>
            </button>
          )}

          {queueCount > 0 && onOpenQueue && (
            <button
              onClick={onOpenQueue}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition"
              title="Open Download Queue Drawer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Queue ({queueCount})</span>
            </button>
          )}

          <button
            onClick={handleDownloadZip}
            disabled={isZipping || processedFiles.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-xs font-medium transition disabled:opacity-50"
            title="Download ZIP"
          >
            {isZipping ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>ZIP ({zipProgress}%)</span>
              </>
            ) : (
              <>
                <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {selectedUrls.size > 0
                    ? `ZIP Selected (${selectedUrls.size})`
                    : selectedFolder !== "ALL"
                    ? `ZIP Folder (${processedFiles.length})`
                    : `ZIP All (${processedFiles.length})`}
                </span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-xs transition"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportTXT}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-xs transition"
            title="Export TXT Links"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Links</span>
          </button>

          <button
            onClick={handleCopyAllLinks}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-xs transition"
            title="Copy all links"
          >
            {copiedAllLinks ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Selected Items Floating Notification Bar */}
      {selectedUrls.size > 0 && (
        <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span className="font-semibold">{selectedUrls.size} items selected</span>
          </div>
          <div className="flex items-center gap-2">
            {onAddToQueue && (
              <button
                onClick={() => {
                  const target = files.filter((f) => selectedUrls.has(f.url));
                  onAddToQueue(target);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium shadow transition"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Add Selected to Queue</span>
              </button>
            )}
            <button
              onClick={() => setSelectedUrls(new Set())}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 text-[11px] underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Bento Table */}
      <div className="flex-grow overflow-auto max-h-[520px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-10">
            <tr className="text-zinc-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider font-mono">
              <th className="px-3 py-3 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition"
                  title="Select all"
                >
                  {selectedUrls.size === processedFiles.length && processedFiles.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th
                onClick={() => {
                  if (sortField === "name") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("name");
                    setSortDirection("asc");
                  }
                }}
                className="px-4 py-3 font-medium cursor-pointer hover:text-zinc-600 dark:text-zinc-400 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>File Name</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortField === "folder") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("folder");
                    setSortDirection("asc");
                  }
                }}
                className="px-4 py-3 font-medium w-40 cursor-pointer hover:text-zinc-600 dark:text-zinc-400 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Subdirectory</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortField === "ext") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("ext");
                    setSortDirection("asc");
                  }
                }}
                className="px-4 py-3 font-medium w-20 cursor-pointer hover:text-zinc-600 dark:text-zinc-400 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Type</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => {
                  if (sortField === "size") {
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("size");
                    setSortDirection("asc");
                  }
                }}
                className="px-4 py-3 font-medium text-right w-24 cursor-pointer hover:text-zinc-600 dark:text-zinc-400 transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Size</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="px-4 py-3 font-medium text-center w-24">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-sm">
            {paginatedFiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs">
                  No files matched the search query or extension filters.
                </td>
              </tr>
            ) : (
              paginatedFiles.map((file, idx) => {
                const isSelected = selectedUrls.has(file.url);
                return (
                  <tr
                    key={file.url + idx}
                    className={`hover:bg-zinc-100 dark:bg-zinc-800/30 transition-colors ${
                      isSelected ? "bg-indigo-950/20" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => toggleSelectFile(file.url)}
                        className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* File Name & Path */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 hover:text-indigo-300 transition text-xs">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs sm:max-w-md font-mono">
                          {file.url}
                        </span>
                      </div>
                    </td>

                    {/* Folder / Bundle */}
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800/80 font-mono truncate max-w-[140px] inline-block" title={file.folder || "Root"}>
                        {file.folder || "Root"}
                      </span>
                    </td>

                    {/* Type Badge */}
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getBadgeStyle(file.ext)}`}>
                        {file.ext.toUpperCase()}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {file.size}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Copy URL */}
                        <button
                          onClick={() => handleCopyLink(file.url)}
                          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition p-1"
                          title="Copy Link"
                        >
                          {copiedUrl === file.url ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Open in new tab */}
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 transition p-1"
                          title="Open Link in New Tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Add to Queue */}
                        {onAddToQueue && (
                          <button
                            onClick={() => onAddToQueue([file])}
                            className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-300 transition p-1"
                            title="Add to Download Queue"
                          >
                            <ListPlus className="w-3.5 h-3.5 inline" />
                          </button>
                        )}

                        {/* Direct Download */}
                        <button
                          onClick={() => handleDirectDownload(file)}
                          className="text-indigo-400 hover:text-indigo-300 transition p-1"
                          title="Download File Directly"
                        >
                          <Download className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {processedFiles.length > pageSize && (
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, processedFiles.length)} of {processedFiles.length} items
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>
            <span className="font-mono text-zinc-600 dark:text-zinc-400 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 transition flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
