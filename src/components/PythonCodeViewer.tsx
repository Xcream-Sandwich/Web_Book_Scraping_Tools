import React, { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  CheckCircle,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import { PYTHON_STREAMLIT_CODE, INSTALL_INSTRUCTIONS } from "../pythonCode";

export const PythonCodeViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"code" | "install">("code");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [activeSubTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_STREAMLIT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(INSTALL_INSTRUCTIONS);
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  const handleDownloadAppPy = () => {
    const blob = new Blob([PYTHON_STREAMLIT_CODE], { type: "text/x-python;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "app.py";
    link.click();
  };

  const handleDownloadRequirements = () => {
    const requirementsTxt = `streamlit>=1.32.0\nrequests>=2.31.0\nbeautifulsoup4>=4.12.0\npandas>=2.2.0\nurllib3>=2.0.0\n`;
    const blob = new Blob([requirementsTxt], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "requirements.txt";
    link.click();
  };

  return (
    <div className="space-y-4">
      {/* Top Bento Overview */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100">
              Python & Streamlit Source Script
            </h2>
            <p className="text-xs text-zinc-500">
              Single-file standalone scraper with BeautifulSoup4, Requests, and Streamlit Web UI.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadAppPy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download app.py</span>
          </button>
          <button
            onClick={handleDownloadRequirements}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>requirements.txt</span>
          </button>
        </div>
      </div>

      {/* Code Bento Window */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Window Top Bar with macOS dots */}
        <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-red-500/80 rounded-full" />
              <div className="w-2.5 h-2.5 bg-yellow-500/80 rounded-full" />
              <div className="w-2.5 h-2.5 bg-green-500/80 rounded-full" />
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5 ml-2">
              <button
                onClick={() => setActiveSubTab("code")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  activeSubTab === "code"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <FileCode2 className="w-3 h-3 text-indigo-400" />
                <span>app.py</span>
              </button>
              <button
                onClick={() => setActiveSubTab("install")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  activeSubTab === "install"
                    ? "bg-zinc-800 text-zinc-100 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Run Guide</span>
              </button>
            </div>
          </div>

          <div>
            {activeSubTab === "code" ? (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleCopyInstall}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition"
              >
                {copiedInstall ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Copy Shell Script</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-x-auto max-h-[550px] scrollbar-thin text-xs font-mono leading-relaxed bg-[#09090b]">
          {activeSubTab === "code" ? (
            <pre className="text-zinc-200 whitespace-pre">
              <code>{PYTHON_STREAMLIT_CODE}</code>
            </pre>
          ) : (
            <pre className="text-emerald-300 whitespace-pre">
              <code>{INSTALL_INSTRUCTIONS}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Run Guide Bento Box */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-400 space-y-2 font-mono">
        <div className="flex items-center gap-2 text-zinc-200 font-semibold text-xs">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Quick Execution Commands:</span>
        </div>
        <div className="space-y-1.5 text-[11px] text-zinc-400">
          <p>
            1. Install: <code className="text-indigo-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">pip install streamlit requests beautifulsoup4 pandas urllib3</code>
          </p>
          <p>
            2. Run: <code className="text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">streamlit run app.py</code>
          </p>
        </div>
      </div>
    </div>
  );
};
