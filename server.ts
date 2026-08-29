import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to format bytes
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Built-in sample mock directories for instant testing without external network dependencies
const SAMPLE_DIRECTORIES: Record<string, { title: string; files: Array<{ name: string; url: string; ext: string; size: string; rawSize: number; modified: string }> }> = {
  "gutenberg-classics": {
    title: "Project Gutenberg - Classic Literature Open Directory",
    files: [
      { name: "Pride_and_Prejudice_Jane_Austen.epub", url: "https://www.gutenberg.org/ebooks/1342.epub.images", ext: "epub", size: "2.4 MB", rawSize: 2516582, modified: "2024-01-15 10:30" },
      { name: "Pride_and_Prejudice_Jane_Austen.pdf", url: "https://www.gutenberg.org/files/1342/1342-pdf.pdf", ext: "pdf", size: "3.8 MB", rawSize: 3984588, modified: "2024-01-15 10:30" },
      { name: "Pride_and_Prejudice_Jane_Austen.mobi", url: "https://www.gutenberg.org/ebooks/1342.kindle.images", ext: "mobi", size: "4.1 MB", rawSize: 4300000, modified: "2024-01-15 10:30" },
      { name: "Frankenstein_Mary_Shelley.epub", url: "https://www.gutenberg.org/ebooks/84.epub.images", ext: "epub", size: "1.8 MB", rawSize: 1887436, modified: "2024-02-10 14:12" },
      { name: "Frankenstein_Mary_Shelley.pdf", url: "https://www.gutenberg.org/files/84/84-pdf.pdf", ext: "pdf", size: "2.9 MB", rawSize: 3040870, modified: "2024-02-10 14:12" },
      { name: "The_Adventures_of_Sherlock_Holmes.epub", url: "https://www.gutenberg.org/ebooks/1661.epub.images", ext: "epub", size: "3.2 MB", rawSize: 3355443, modified: "2024-03-01 08:45" },
      { name: "The_Adventures_of_Sherlock_Holmes.pdf", url: "https://www.gutenberg.org/files/1661/1661-pdf.pdf", ext: "pdf", size: "5.1 MB", rawSize: 5347737, modified: "2024-03-01 08:45" },
      { name: "The_Great_Gatsby_F_Scott_Fitzgerald.mobi", url: "https://www.gutenberg.org/ebooks/64317.kindle.images", ext: "mobi", size: "2.1 MB", rawSize: 2202009, modified: "2024-03-20 18:22" },
      { name: "The_Great_Gatsby_F_Scott_Fitzgerald.epub", url: "https://www.gutenberg.org/ebooks/64317.epub.images", ext: "epub", size: "1.5 MB", rawSize: 1572864, modified: "2024-03-20 18:22" },
      { name: "Moby_Dick_Herman_Melville.pdf", url: "https://www.gutenberg.org/files/2701/2701-pdf.pdf", ext: "pdf", size: "7.4 MB", rawSize: 7759462, modified: "2024-04-05 11:15" },
      { name: "Comic_Sample_Manga_Chapter_01.cbz", url: "https://example.com/comics/sample_ch01.cbz", ext: "cbz", size: "18.6 MB", rawSize: 19503513, modified: "2024-04-18 19:40" },
      { name: "Vintage_Comics_Adventure_No1.cbz", url: "https://example.com/comics/vintage_01.cbz", ext: "cbz", size: "24.2 MB", rawSize: 25375539, modified: "2024-04-20 09:10" }
    ]
  },
  "open-textbooks": {
    title: "Open Textbook & Scientific Documents Repository",
    files: [
      { name: "Calculus_Volume_1_OpenStax.pdf", url: "https://openstax.org/details/books/calculus-volume-1", ext: "pdf", size: "42.5 MB", rawSize: 44564480, modified: "2024-01-10 12:00" },
      { name: "College_Physics_2e.pdf", url: "https://openstax.org/details/books/college-physics-2e", ext: "pdf", size: "65.1 MB", rawSize: 68262297, modified: "2024-02-14 16:30" },
      { name: "Python_for_Data_Science_Handbook.pdf", url: "https://github.com/jakevdp/PythonDataScienceHandbook", ext: "pdf", size: "12.8 MB", rawSize: 13421772, modified: "2024-03-11 11:20" },
      { name: "Deep_Learning_Goodfellow.pdf", url: "https://www.deeplearningbook.org/", ext: "pdf", size: "21.4 MB", rawSize: 22439526, modified: "2024-03-15 15:45" },
      { name: "Introduction_to_Algorithms.epub", url: "https://mitpress.mit.edu/books/introduction-algorithms", ext: "epub", size: "8.9 MB", rawSize: 9332326, modified: "2024-04-02 09:00" },
      { name: "Automate_the_Boring_Stuff_with_Python.mobi", url: "https://automatetheboringstuff.com/", ext: "mobi", size: "6.7 MB", rawSize: 7025459, modified: "2024-04-12 14:15" },
      { name: "Graphic_Novel_Archived_Collection.cbz", url: "https://archive.org/details/graphic-novel-01", ext: "cbz", size: "35.0 MB", rawSize: 36700160, modified: "2024-04-25 17:00" }
    ]
  }
};

// API: Scrape URL
app.post("/api/scrape", async (req, res) => {
  const startTime = Date.now();
  try {
    const { url, extensions = ["pdf", "epub", "mobi", "cbz"], timeoutSeconds = 15, userAgent } = req.body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: "URL target tidak boleh kosong. Silakan masukkan URL yang valid (misal: https://example.com/files/)."
      });
    }

    const trimmedUrl = url.trim();

    // Check for preset / mock directory trigger
    if (trimmedUrl.startsWith("mock://") || trimmedUrl.startsWith("sample://")) {
      const presetKey = trimmedUrl.replace(/^(mock|sample):\/\//, "").toLowerCase();
      const sample = SAMPLE_DIRECTORIES[presetKey] || SAMPLE_DIRECTORIES["gutenberg-classics"];
      
      const normalizedAllowedExts = extensions.map((e: string) => e.toLowerCase().replace(/^\./, ""));
      const filteredFiles = sample.files.filter(f => normalizedAllowedExts.includes(f.ext.toLowerCase()));

      return res.json({
        success: true,
        targetUrl: trimmedUrl,
        pageTitle: sample.title,
        serverType: "Mock Directory / Demo Server",
        totalFound: filteredFiles.length,
        files: filteredFiles,
        scanDurationMs: Date.now() - startTime,
        extensionsScanned: normalizedAllowedExts
      });
    }

    // Validate standard HTTP/HTTPS URL
    let parsedTargetUrl: URL;
    try {
      parsedTargetUrl = new URL(trimmedUrl);
      if (!["http:", "https:"].includes(parsedTargetUrl.protocol)) {
        throw new Error("Protokol harus HTTP atau HTTPS");
      }
    } catch {
      return res.status(400).json({
        success: false,
        error: `Format URL "${trimmedUrl}" tidak valid. Pastikan menyertakan protokol http:// atau https://.`
      });
    }

    // Set up fetch abort timeout
    const controller = new AbortController();
    const timeoutMs = Math.min(Math.max((Number(timeoutSeconds) || 15) * 1000, 3000), 45000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const headers: Record<string, string> = {
      "User-Agent": userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,id;q=0.8"
    };

    let response: Response;
    try {
      response = await fetch(parsedTargetUrl.toString(), {
        headers,
        signal: controller.signal,
        redirect: "follow"
      });
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        return res.status(504).json({
          success: false,
          error: `Koneksi timeout setelah ${timeoutSeconds} detik saat menghubungi "${trimmedUrl}". Server target mungkin lambat atau memblokir koneksi.`
        });
      }
      return res.status(502).json({
        success: false,
        error: `Gagal terhubung ke host (${(err as Error).message || "Host unreachable"}). Periksa koneksi internet atau ketersediaan server target.`
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let statusDesc = `HTTP Error ${response.status}: ${response.statusText}`;
      if (response.status === 403) {
        statusDesc = "Akses ditolak (403 Forbidden). Server direktori target melarang pemindaian otomatis.";
      } else if (response.status === 404) {
        statusDesc = "Direktori tidak ditemukan (404 Not Found). Periksa kembali alamat path URL.";
      }
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 500).json({
        success: false,
        error: statusDesc
      });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const pageTitle = $("title").text().trim() || $("h1").first().text().trim() || parsedTargetUrl.pathname;
    const serverHeader = response.headers.get("server") || "Web Server";

    // Prepare extension filter
    const normalizedExts = (Array.isArray(extensions) && extensions.length > 0 ? extensions : ["pdf", "epub", "mobi", "cbz", "zip"])
      .map((ext: string) => ext.toLowerCase().trim().replace(/^\./, ""))
      .filter(Boolean);

    const isAllExts = normalizedExts.includes("*") || normalizedExts.includes("all");

    // Helper to parse file size string to raw bytes
    const parseBytes = (sizeStr: string): number => {
      if (!sizeStr || sizeStr === "-" || sizeStr === "Unknown") return 0;
      const match = sizeStr.trim().match(/^([\d.]+)\s*([KMGTkmgt]?B?|[Bb]ytes)?$/);
      if (!match) return 0;
      const val = parseFloat(match[1]);
      const unit = (match[2] || "").toUpperCase();
      if (unit.startsWith("K")) return Math.round(val * 1024);
      if (unit.startsWith("M")) return Math.round(val * 1024 * 1024);
      if (unit.startsWith("G")) return Math.round(val * 1024 * 1024 * 1024);
      if (unit.startsWith("T")) return Math.round(val * 1024 * 1024 * 1024 * 1024);
      return Math.round(val);
    };

    const foundFilesMap = new Map<string, { name: string; url: string; ext: string; size: string; rawSize: number; modified: string; folder?: string }>();
    const foundSubdirs: Array<{ name: string; url: string }> = [];
    const visitedUrls = new Set<string>();

    const targetBasePath = parsedTargetUrl.pathname.endsWith("/") ? parsedTargetUrl.pathname : parsedTargetUrl.pathname + "/";

    // BFS Queue for directory scanning
    interface QueueItem {
      url: string;
      name: string;
      depth: number;
    }

    const queue: QueueItem[] = [{ url: parsedTargetUrl.toString(), name: "Root", depth: 0 }];
    const MAX_DEPTH = 3;
    const MAX_DIRECTORIES_TOTAL = 300;

    let isRecursive = false;

    while (queue.length > 0 && visitedUrls.size < MAX_DIRECTORIES_TOTAL) {
      const batch = queue.splice(0, 15);
      
      await Promise.all(batch.map(async (item) => {
        if (visitedUrls.has(item.url)) return;
        visitedUrls.add(item.url);

        try {
          const resp = item.depth === 0 ? response : await fetch(item.url, {
            headers,
            signal: AbortSignal.timeout(Math.min(timeoutMs, 10000))
          });

          if (!resp.ok && item.depth > 0) return;
          const currentHtml = item.depth === 0 ? html : await resp.text();
          const $curr = cheerio.load(currentHtml);

          let foundTableRows = 0;

          // 1. Try structured table parsing (Apache FancyIndexing / Nginx Autoindex)
          $curr("tr").each((_, tr) => {
            const tds = $curr(tr).find("td");
            if (tds.length >= 3) {
              const a = $curr(tds[1]).find("a");
              const href = a.attr("href");
              const linkText = a.text().trim();
              if (!href) return;

              const rawHref = href.trim();
              if (rawHref.startsWith("?") || rawHref.startsWith("#") || linkText.toLowerCase().includes("parent directory") || rawHref === "/" || rawHref === "../" || rawHref === "..") {
                return;
              }

              try {
                const absUrl = new URL(rawHref, item.url).toString();
                const parsed = new URL(absUrl);
                if (parsed.origin !== parsedTargetUrl.origin) return;

                const lastSeg = parsed.pathname.split("/").filter(Boolean).pop() || "";
                const cleanName = decodeURIComponent(lastSeg).replace(/\?.*$/, "");
                const dateText = tds.length >= 4 ? $curr(tds[2]).text().trim() : "";
                const sizeText = tds.length >= 4 ? $curr(tds[3]).text().trim() : (tds.length === 3 ? $curr(tds[2]).text().trim() : "");

                const isFolder = rawHref.endsWith("/") || absUrl.endsWith("/") || sizeText === "-" || sizeText === "";

                if (isFolder) {
                  if (item.depth < MAX_DEPTH && !visitedUrls.has(absUrl)) {
                    isRecursive = true;
                    const folderName = cleanName || linkText.replace(/\/$/, "") || "folder";
                    if (!foundSubdirs.some(s => s.url === absUrl)) {
                      foundSubdirs.push({ name: folderName, url: absUrl.endsWith("/") ? absUrl : absUrl + "/" });
                    }
                    queue.push({
                      url: absUrl.endsWith("/") ? absUrl : absUrl + "/",
                      name: folderName,
                      depth: item.depth + 1
                    });
                  }
                } else {
                  const dotIdx = cleanName.lastIndexOf(".");
                  if (dotIdx !== -1) {
                    const ext = cleanName.substring(dotIdx + 1).toLowerCase();
                    // Exclude web script tools unless explicitly asked
                    const isSystemScript = ["php", "cgi", "pl", "asp", "aspx", "jsp"].includes(ext) && !normalizedExts.includes(ext);

                    if (!isSystemScript && (isAllExts || normalizedExts.includes(ext))) {
                      if (!foundFilesMap.has(absUrl)) {
                        foundFilesMap.set(absUrl, {
                          name: cleanName || linkText || `file_${foundFilesMap.size + 1}.${ext}`,
                          url: absUrl,
                          ext,
                          size: sizeText && sizeText !== "-" ? sizeText : "Unknown",
                          rawSize: parseBytes(sizeText),
                          modified: dateText || new Date().toISOString().split("T")[0],
                          folder: item.name
                        });
                      }
                    }
                  }
                }
                foundTableRows++;
              } catch {}
            }
          });

          // 2. Fallback for non-table anchor listings or pre-formatted text
          if (foundTableRows === 0) {
            $curr("a").each((_, el) => {
              const href = $curr(el).attr("href");
              if (!href) return;

              const rawHref = href.trim();
              if (rawHref.startsWith("#") || rawHref.startsWith("javascript:") || rawHref.startsWith("?") || rawHref.startsWith("mailto:")) return;

              const linkText = $curr(el).text().trim();
              if (linkText.toLowerCase().includes("parent directory") || rawHref === "/" || rawHref === "../" || rawHref === "..") return;

              try {
                const absUrl = new URL(rawHref, item.url).toString();
                const parsed = new URL(absUrl);
                if (parsed.origin !== parsedTargetUrl.origin) return;

                const lastSeg = parsed.pathname.split("/").filter(Boolean).pop() || "";
                const cleanName = decodeURIComponent(lastSeg).replace(/\?.*$/, "");
                const isFolder = rawHref.endsWith("/") || absUrl.endsWith("/") || !cleanName.includes(".");

                if (isFolder) {
                  if (item.depth < MAX_DEPTH && !visitedUrls.has(absUrl)) {
                    isRecursive = true;
                    const folderName = cleanName || linkText.replace(/\/$/, "") || "folder";
                    if (!foundSubdirs.some(s => s.url === absUrl)) {
                      foundSubdirs.push({ name: folderName, url: absUrl.endsWith("/") ? absUrl : absUrl + "/" });
                    }
                    queue.push({
                      url: absUrl.endsWith("/") ? absUrl : absUrl + "/",
                      name: folderName,
                      depth: item.depth + 1
                    });
                  }
                } else {
                  const dotIdx = cleanName.lastIndexOf(".");
                  if (dotIdx !== -1) {
                    const ext = cleanName.substring(dotIdx + 1).toLowerCase();
                    const isSystemScript = ["php", "cgi", "pl", "asp", "aspx", "jsp"].includes(ext) && !normalizedExts.includes(ext);

                    if (!isSystemScript && (isAllExts || normalizedExts.includes(ext))) {
                      if (!foundFilesMap.has(absUrl)) {
                        foundFilesMap.set(absUrl, {
                          name: cleanName || linkText || `file_${foundFilesMap.size + 1}.${ext}`,
                          url: absUrl,
                          ext,
                          size: "Unknown",
                          rawSize: 0,
                          modified: new Date().toISOString().split("T")[0],
                          folder: item.name
                        });
                      }
                    }
                  }
                }
              } catch {}
            });
          }
        } catch {
          // Ignore individual directory fetch failures
        }
      }));
    }

    const fileList = Array.from(foundFilesMap.values());

    return res.json({
      success: true,
      targetUrl: trimmedUrl,
      pageTitle,
      serverType: serverHeader,
      totalFound: fileList.length,
      files: fileList,
      subdirectories: foundSubdirs,
      isRecursive: isRecursive || foundSubdirs.length > 0,
      scanDurationMs: Date.now() - startTime,
      extensionsScanned: normalizedExts
    });

  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      error: `Terjadi kesalahan saat memproses direktori: ${(error as Error).message || "Unknown error"}`
    });
  }
});

// API: Proxy File Download (solves CORS / mixed content issues when downloading direct files)
app.get("/api/proxy-download", async (req, res) => {
  try {
    const fileUrl = req.query.url as string;
    const customName = req.query.filename as string;

    if (!fileUrl) {
      return res.status(400).send("Parameter 'url' diperlukan.");
    }

    // Mock download generator for sample urls
    if (fileUrl.includes("example.com") || fileUrl.includes("mock://") || fileUrl.includes("sample://")) {
      const dummyContent = `DocScout Sample File Download\nSource: ${fileUrl}\nGenerated for preview demonstration.\nTime: ${new Date().toISOString()}`;
      res.setHeader("Content-Disposition", `attachment; filename="${customName || "sample_book.epub"}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      return res.send(Buffer.from(dummyContent, "utf-8"));
    }

    const response = await fetch(fileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send(`Gagal mengunduh file: ${response.statusText}`);
    }

    const filename = customName || path.basename(new URL(fileUrl).pathname) || "downloaded_file";
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (response.body) {
      // Pipe stream
      const { Readable } = await import("stream");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeStream = (Readable as any).fromWeb(response.body);
      nodeStream.pipe(res);
    } else {
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (err: unknown) {
    return res.status(500).send(`Gagal mengunduh: ${(err as Error).message}`);
  }
});

// Vite Middleware for Dev and Static for Prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocScout Server running on http://localhost:${PORT}`);
  });
}

startServer();
