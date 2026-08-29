export interface ScrapedSubdirectory {
  name: string;
  url: string;
}

export interface ScrapedFile {
  name: string;
  url: string;
  ext: string;
  size: string;
  rawSize: number;
  modified: string;
  folder?: string;
}

export interface ScrapeResponse {
  success: boolean;
  error?: string;
  targetUrl?: string;
  pageTitle?: string;
  serverType?: string;
  totalFound?: number;
  files?: ScrapedFile[];
  subdirectories?: ScrapedSubdirectory[];
  scanDurationMs?: number;
  extensionsScanned?: string[];
  isRecursive?: boolean;
}

export interface ExtensionConfig {
  ext: string;
  label: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  desc: string;
}

export type DownloadStatus = "queued" | "downloading" | "completed" | "failed" | "cancelled" | "paused";

export interface DownloadQueueItem {
  id: string;
  name: string;
  url: string;
  ext: string;
  folder?: string;
  sizeFormatted: string;
  totalBytes?: number;
  downloadedBytes: number;
  progress: number;
  status: DownloadStatus;
  speed?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}
