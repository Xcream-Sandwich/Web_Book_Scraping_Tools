import { useState, useEffect, useRef, useCallback } from "react";
import { DownloadQueueItem, ScrapedFile } from "../types";

export function useDownloadQueue() {
  const [queue, setQueue] = useState<DownloadQueueItem[]>([]);
  const [isQueueRunning, setIsQueueRunning] = useState<boolean>(true);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [concurrency, setConcurrency] = useState<number>(1);

  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const isRunningRef = useRef(isQueueRunning);
  isRunningRef.current = isQueueRunning;

  // Add files to queue
  const addToQueue = useCallback((files: ScrapedFile[], autoStart = true) => {
    if (!files || files.length === 0) return;

    setQueue((prev) => {
      const existingUrls = new Set(prev.map((item) => item.url));
      const newItems: DownloadQueueItem[] = [];

      files.forEach((file) => {
        // If already in queue, ignore duplicate unless failed
        if (!existingUrls.has(file.url)) {
          newItems.push({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            url: file.url,
            ext: file.ext,
            folder: file.folder || "Root",
            sizeFormatted: file.size,
            totalBytes: file.rawSize || undefined,
            downloadedBytes: 0,
            progress: 0,
            status: "queued",
          });
        }
      });

      return [...prev, ...newItems];
    });

    if (autoStart) {
      setIsQueueRunning(true);
    }
    setIsQueueOpen(true);
  }, []);

  // Cancel active download item
  const cancelItem = useCallback((id: string) => {
    const controller = abortControllersRef.current.get(id);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(id);
    }
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "cancelled", error: "Cancelled by user" } : item
      )
    );
  }, []);

  // Remove item from queue
  const removeItem = useCallback(
    (id: string) => {
      cancelItem(id);
      setQueue((prev) => prev.filter((item) => item.id !== id));
    },
    [cancelItem]
  );

  // Retry single failed item
  const retryItem = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "queued",
              progress: 0,
              downloadedBytes: 0,
              error: undefined,
            }
          : item
      )
    );
    setIsQueueRunning(true);
  }, []);

  // Retry all failed items
  const retryAllFailed = useCallback(() => {
    setQueue((prev) =>
      prev.map((item) =>
        item.status === "failed" || item.status === "cancelled"
          ? {
              ...item,
              status: "queued",
              progress: 0,
              downloadedBytes: 0,
              error: undefined,
            }
          : item
      )
    );
    setIsQueueRunning(true);
  }, []);

  // Clear completed items
  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((item) => item.status !== "completed"));
  }, []);

  // Clear all items
  const clearAll = useCallback(() => {
    abortControllersRef.current.forEach((controller) => controller.abort());
    abortControllersRef.current.clear();
    setQueue([]);
  }, []);

  // Toggle Pause/Resume
  const toggleQueue = useCallback(() => {
    setIsQueueRunning((prev) => {
      const next = !prev;
      if (!next) {
        // Pause all queued items that haven't started
        setQueue((q) =>
          q.map((item) => (item.status === "queued" ? { ...item, status: "paused" } : item))
        );
      } else {
        // Resume paused items
        setQueue((q) =>
          q.map((item) => (item.status === "paused" ? { ...item, status: "queued" } : item))
        );
      }
      return next;
    });
  }, []);

  // Format bytes to string
  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec <= 0) return "0 KB/s";
    if (bytesPerSec > 1024 * 1024) {
      return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  };

  // Helper function to trigger browser download
  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  };

  // Worker for downloading single item
  const downloadItem = async (item: DownloadQueueItem) => {
    const controller = new AbortController();
    abortControllersRef.current.set(item.id, controller);

    const startTime = Date.now();

    // Mark as downloading
    setQueue((prev) =>
      prev.map((q) =>
        q.id === item.id
          ? {
              ...q,
              status: "downloading",
              startedAt: startTime,
              progress: 0,
              downloadedBytes: 0,
            }
          : q
      )
    );

    try {
      const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(item.name)}`;
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status} (${response.statusText || "Download failed"})`);
      }

      const contentLengthHeader = response.headers.get("content-length");
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : item.totalBytes || 0;

      if (!response.body) {
        // Fallback for non-streamable response
        const blob = await response.blob();
        triggerBrowserDownload(blob, item.name);
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "completed",
                  progress: 100,
                  downloadedBytes: blob.size,
                  totalBytes: blob.size,
                  completedAt: Date.now(),
                }
              : q
          )
        );
        abortControllersRef.current.delete(item.id);
        return;
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;
      let lastProgressUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;

          const now = Date.now();
          // Throttle state updates for performance
          if (now - lastProgressUpdate > 120 || receivedBytes === totalBytes) {
            lastProgressUpdate = now;
            const elapsedSec = Math.max((now - startTime) / 1000, 0.1);
            const speed = formatSpeed(receivedBytes / elapsedSec);
            const progress = totalBytes > 0
              ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
              : Math.min(95, Math.round(receivedBytes / (1024 * 1024 * 5) * 100)); // synthetic progress if unknown

            setQueue((prev) =>
              prev.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      progress,
                      downloadedBytes: receivedBytes,
                      totalBytes: totalBytes || undefined,
                      speed,
                    }
                  : q
              )
            );
          }
        }
      }

      // Assemble chunks and save file
      const blob = new Blob(chunks);
      triggerBrowserDownload(blob, item.name);

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: "completed",
                progress: 100,
                downloadedBytes: receivedBytes,
                totalBytes: receivedBytes,
                completedAt: Date.now(),
                speed: undefined,
              }
            : q
        )
      );
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        // User cancelled, state already set
        return;
      }

      console.error(`Download failed for ${item.name}:`, err);
      const errorMessage = (err as Error)?.message || "Gagal mengunduh berkas.";

      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: "failed",
                error: errorMessage,
                speed: undefined,
              }
            : q
        )
      );
    } finally {
      abortControllersRef.current.delete(item.id);
    }
  };

  // Queue orchestrator loop
  useEffect(() => {
    if (!isQueueRunning) return;

    const activeDownloading = queue.filter((i) => i.status === "downloading");
    const availableSlots = concurrency - activeDownloading.length;

    if (availableSlots > 0) {
      const nextItems = queue.filter((i) => i.status === "queued").slice(0, availableSlots);
      if (nextItems.length > 0) {
        nextItems.forEach((item) => {
          downloadItem(item);
        });
      }
    }
  }, [queue, isQueueRunning, concurrency]);

  return {
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
  };
}
