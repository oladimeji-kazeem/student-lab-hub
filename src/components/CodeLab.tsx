import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Button, Card } from "@/components/ui-kit";
import { CodeEditor } from "@/components/CodeEditor";
import { actions, hasAccess, useCurrentUser, type Env } from "@/lib/store";
import {
  downloadAsPython,
  downloadAsR,
  downloadAsIpynb,
  downloadRWorkspace,
  downloadFile,
} from "@/lib/code-export";
import { LAB_TEMPLATES } from "@/lib/ml-templates";

/* eslint-disable @typescript-eslint/no-explicit-any */
let pyodide: Promise<any> | null = null;
let pyodideReady = false;
const installedPyPackages = new Set<string>(["numpy"]);

let webR: Promise<any> | null = null;
let webRReady = false;

export interface RunResult {
  text: string;
  plots: string[];
}

export function isWasmReady(env: "python" | "r"): boolean {
  return env === "python" ? pyodideReady : webRReady;
}

export function getInstalledPyPackages(): string[] {
  return Array.from(installedPyPackages);
}

export function loadPy(onProgress?: (stage: string, percent?: number) => void) {
  if (pyodide) {
    if (pyodideReady) onProgress?.("Pyodide Ready", 100);
    return pyodide;
  }
  onProgress?.("Downloading Pyodide WebAssembly (~10MB)...", 20);
  pyodide = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
    s.onload = async () => {
      try {
        onProgress?.("Compiling WebAssembly & starting runtime...", 55);
        const py = await (window as any).loadPyodide();
        onProgress?.("Loading scientific packages & environment...", 85);
        pyodideReady = true;
        onProgress?.("Python 3 environment ready", 100);
        res(py);
      } catch (err) {
        pyodide = null;
        rej(err);
      }
    };
    s.onerror = (e) => {
      pyodide = null;
      rej(e);
    };
    document.head.appendChild(s);
  });
  return pyodide;
}

export function loadR(onProgress?: (stage: string, percent?: number) => void) {
  if (webR) {
    if (webRReady) onProgress?.("WebR Ready", 100);
    return webR;
  }
  onProgress?.("Downloading WebR WebAssembly binary...", 25);
  webR = (async () => {
    try {
      const url = "https://webr.r-wasm.org/latest/webr.mjs";
      const mod = await import(/* @vite-ignore */ url);
      onProgress?.("Initializing WebR virtual machine...", 65);
      const w = new mod.WebR();
      await w.init();
      onProgress?.("WebR environment ready", 100);
      webRReady = true;
      return w;
    } catch (err) {
      webR = null;
      throw err;
    }
  })();
  return webR;
}

/**
 * Install one or more Python packages via Pyodide / micropip
 */
export async function installPythonPackages(
  rawInput: string,
  onProgress?: (stage: string, percent?: number) => void,
): Promise<string[]> {
  const pkgs = rawInput
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("-"));

  if (pkgs.length === 0) return [];

  const py = await loadPy(onProgress);
  onProgress?.(`Loading micropip package manager...`, 40);
  await py.loadPackage("micropip");
  const micropip = py.pyimport("micropip");

  for (let i = 0; i < pkgs.length; i++) {
    const pkg = pkgs[i];
    if (!pkg) continue;
    const pct = Math.round(45 + ((i + 1) / pkgs.length) * 50);
    onProgress?.(`Installing ${pkg} via micropip...`, pct);
    await micropip.install(pkg);
    installedPyPackages.add(pkg);
  }
  onProgress?.(`Installed: ${pkgs.join(", ")}`, 100);
  return pkgs;
}

/**
 * Extract `!pip install ...` or `%pip install ...` magic lines from Python code
 * and return cleaned Python code plus list of packages to install.
 */
function extractPipMagics(code: string): { cleanedCode: string; pipPackages: string[] } {
  const pipPackages: string[] = [];
  const cleanedLines = code.split("\n").map((line) => {
    const match = line.match(/^\s*(?:!|%|#\s*!)\s*(?:pip|micropip)\s+install\s+(.+)$/i);
    if (match && match[1]) {
      const tokens = match[1]
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t && !t.startsWith("-"));
      pipPackages.push(...tokens);
      return `# [e-Lab micropip] ${line.trim()}`;
    }
    return line;
  });
  return { cleanedCode: cleanedLines.join("\n"), pipPackages };
}

/**
 * Rich execution returning both stdout/stderr text and inline base64 PNG plots
 * (from Matplotlib/Seaborn in Python or base/grid graphics in R).
 */
export async function runRich(
  env: "python" | "r",
  code: string,
  onProgress?: (stage: string, percent?: number) => void,
): Promise<RunResult> {
  if (env === "python") {
    const isFirstTime = !pyodideReady;
    if (isFirstTime) {
      onProgress?.("Downloading Pyodide WebAssembly...", 15);
    } else {
      onProgress?.("Preparing Python environment...", 35);
    }
    const py = await loadPy(onProgress);
    let out = "";
    py.setStdout({ batched: (s: string) => (out += s + "\n") });
    py.setStderr({ batched: (s: string) => (out += s + "\n") });

    // 1. Check for !pip install or %pip install lines
    const { cleanedCode, pipPackages } = extractPipMagics(code);
    if (pipPackages.length > 0) {
      out += `📦 Installing packages via micropip: ${pipPackages.join(", ")}...\n`;
      await installPythonPackages(pipPackages.join(" "), onProgress);
      out += `✓ Installed ${pipPackages.join(", ")}\n`;
    }

    // 2. Auto-load packages from imports (numpy, pandas, scikit-learn, matplotlib, scipy, etc.)
    onProgress?.("Resolving & loading scientific/ML packages...", 75);
    await py.loadPackagesFromImports(cleanedCode);

    // Record detected common packages
    for (const candidate of [
      "numpy",
      "pandas",
      "scikit-learn",
      "scipy",
      "matplotlib",
      "seaborn",
      "statsmodels",
      "nltk",
    ]) {
      const importName = candidate === "scikit-learn" ? "sklearn" : candidate;
      if (new RegExp(`\\b${importName}\\b`).test(cleanedCode)) {
        installedPyPackages.add(candidate);
      }
    }

    // 3. Configure headless Matplotlib AGG backend & capture hook if matplotlib/seaborn is used
    const usesPlot = /\b(matplotlib|pyplot|plt|seaborn|sns)\b/.test(cleanedCode);
    if (usesPlot) {
      try {
        await py.loadPackage("matplotlib");
        await py.runPythonAsync(`
import sys, io, base64
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as plt

_elab_captured_plots = []

def _elab_capture_current_figs():
    for num in list(plt.get_fignums()):
        fig = plt.figure(num)
        if fig.axes:
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=130, bbox_inches="tight", facecolor="white")
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode("ascii")
            _elab_captured_plots.append(f"data:image/png;base64,{b64}")
    plt.close("all")

plt.show = lambda *args, **kwargs: _elab_capture_current_figs()
`);
      } catch {
        // Ignore if matplotlib hook setup fails
      }
    }

    // 4. Execute user Python code
    onProgress?.("Executing Python code...", 92);
    const r = await py.runPythonAsync(cleanedCode);
    if (r !== undefined && r !== null) out += String(r) + "\n";

    // 5. Collect any Matplotlib figures (both from plt.show() and any unclosed figures)
    const plots: string[] = [];
    try {
      const capturedJson = await py.runPythonAsync(`
import sys, json
if "matplotlib.pyplot" in sys.modules:
    import io, base64
    import matplotlib.pyplot as plt
    if "_elab_captured_plots" not in globals():
        _elab_captured_plots = []
    for num in list(plt.get_fignums()):
        fig = plt.figure(num)
        if fig.axes:
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=130, bbox_inches="tight", facecolor="white")
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode("ascii")
            _elab_captured_plots.append(f"data:image/png;base64,{b64}")
    plt.close("all")
    _elab_out_json = json.dumps(_elab_captured_plots)
    _elab_captured_plots = []
else:
    _elab_out_json = "[]"
_elab_out_json
`);
      if (typeof capturedJson === "string") {
        const parsed = JSON.parse(capturedJson);
        if (Array.isArray(parsed)) {
          plots.push(...parsed);
        }
      }
    } catch {
      // ignore plot collection errors
    }

    return { text: out, plots };
  }

  // R execution via WebR
  const isFirstTime = !webRReady;
  if (isFirstTime) {
    onProgress?.("Downloading WebR WebAssembly...", 20);
  } else {
    onProgress?.("Running R code...", 50);
  }
  const w = await loadR(onProgress);
  onProgress?.("Executing in WebR Shelter...", 85);
  const shelter = await new w.Shelter();
  try {
    const res = await shelter.captureR(code, {
      withAutoprint: true,
      captureStreams: true,
      captureConditions: false,
      captureGraphics: { width: 640, height: 420 },
    });
    const text = res.output.map((o: any) => o.data).join("\n");
    const plots: string[] = [];

    if (res.images && Array.isArray(res.images) && typeof document !== "undefined") {
      for (const img of res.images) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width || 640;
          canvas.height = img.height || 420;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            plots.push(canvas.toDataURL("image/png"));
          }
        } catch {
          // ignore individual image conversion issues
        }
      }
    }

    return { text, plots };
  } finally {
    shelter.purge();
  }
}

/**
 * Standard string-returning runner (backward compatible)
 */
export async function run(
  env: "python" | "r",
  code: string,
  onProgress?: (stage: string, percent?: number) => void,
): Promise<string> {
  const res = await runRich(env, code, onProgress);
  return res.text;
}

const POPULAR_PY_PACKAGES = [
  "scikit-learn",
  "matplotlib",
  "seaborn",
  "pandas",
  "scipy",
  "statsmodels",
  "nltk",
];

export function CodeLab({
  env,
  title,
  starter,
}: {
  env: "python" | "r";
  title: string;
  starter: string;
}) {
  const envTemplates = LAB_TEMPLATES.filter((t) => t.kernel === env);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [code, setCode] = useState(starter);
  const [out, setOut] = useState("");
  const [plots, setPlots] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [wasmStage, setWasmStage] = useState<string>("");
  const [wasmPercent, setWasmPercent] = useState<number>(0);
  const [isDownloadingWasm, setIsDownloadingWasm] = useState(false);

  // micropip package installer state
  const [pkgInput, setPkgInput] = useState("");
  const [installingPkg, setInstallingPkg] = useState(false);
  const [installedList, setInstalledList] = useState<string[]>(getInstalledPyPackages());

  const exec = async () => {
    setBusy(true);
    const firstTime = !isWasmReady(env);
    if (firstTime) {
      setIsDownloadingWasm(true);
      setWasmStage(`Downloading ${env === "python" ? "Pyodide" : "WebR"} WebAssembly runtime…`);
      setWasmPercent(20);
      setOut(
        (o) =>
          o +
          `[1/2] Connecting to CDN & downloading ${env === "python" ? "Pyodide Python" : "WebR R"} WebAssembly binaries…\n`,
      );
    } else {
      setWasmStage("Running code…");
      setWasmPercent(50);
    }

    const t = performance.now();
    try {
      const r = await runRich(env, code, (stage, percent) => {
        setWasmStage(stage);
        if (percent !== undefined) setWasmPercent(percent);
      });
      setOut(r.text + `\n✓ Completed in ${((performance.now() - t) / 1000).toFixed(2)}s\n`);
      setPlots(r.plots);
      setInstalledList(getInstalledPyPackages());
      actions.countRun();
    } catch (e) {
      setOut(`✗ ${(e as Error).message}\n`);
    } finally {
      setBusy(false);
      setIsDownloadingWasm(false);
      setWasmPercent(0);
      setWasmStage("");
    }
  };

  const handleInstallPkg = async (pkgName?: string) => {
    const target = (pkgName ?? pkgInput).trim();
    if (!target) return;
    setInstallingPkg(true);
    setIsDownloadingWasm(true);
    setWasmStage(`Installing ${target} via micropip…`);
    setWasmPercent(30);
    try {
      const installed = await installPythonPackages(target, (stage, pct) => {
        setWasmStage(stage);
        if (pct !== undefined) setWasmPercent(pct);
      });
      setInstalledList(getInstalledPyPackages());
      if (!pkgName) setPkgInput("");
      toast.success(`Installed Python package: ${installed.join(", ")}`);
      setOut((prev) => prev + `\n📦 Installed via micropip: ${installed.join(", ")}\n`);
    } catch (err) {
      toast.error(`Failed to install ${target}: ${(err as Error).message}`);
      setOut((prev) => prev + `\n✗ micropip error (${target}): ${(err as Error).message}\n`);
    } finally {
      setInstallingPkg(false);
      setIsDownloadingWasm(false);
      setWasmStage("");
      setWasmPercent(0);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = envTemplates.find((t) => t.id === templateId);
    if (found) {
      setCode(found.script);
      setOut("");
      setPlots([]);
      toast.info(`Loaded template: ${found.name}`);
    }
  };

  const handleDownloadCode = () => {
    if (env === "python") {
      downloadAsPython(code, "lab_script.py");
      toast.success("Downloaded script as lab_script.py");
    } else {
      downloadAsR(code, "lab_script.R");
      toast.success("Downloaded script as lab_script.R");
    }
  };

  const handleDownloadIpynb = () => {
    downloadAsIpynb(
      [
        {
          id: "cell-1",
          type: "code",
          content: code,
          outputs: out ? [out] : [],
          plots,
          executionCount: 1,
        },
      ],
      env,
      `lab_${env}.ipynb`,
    );
    toast.success(`Exported notebook as lab_${env}.ipynb`);
  };

  const handleDownloadRData = async (format: "rdata" | "rda") => {
    setExporting(true);
    try {
      let rInst: any = null;
      try {
        rInst = await loadR();
      } catch {
        // use fallback generator if runtime isn't ready
      }
      await downloadRWorkspace(format, code, rInst, `workspace_${env}`);
      toast.success(
        `Downloaded workspace as workspace_${env}.${format === "rdata" ? "RData" : "rda"}`,
      );
    } catch (err) {
      toast.error(`Export failed: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPlot = (dataUrl: string, index: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `elab_plot_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded elab_plot_${index + 1}.png`);
  };

  return (
    <AppShell title={title}>
      <Gate env={env}>
        {/* Top Control, AI/ML Template Picker & Export Bar */}
        <div className="mb-4 space-y-3 rounded-2xl glass p-3.5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                {env === "python" ? "Python 3 · Pyodide" : "R 4.3 · WebR"}
              </span>

              {/* WASM Engine Status Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1 font-mono text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${isWasmReady(env)
                      ? "bg-success"
                      : isDownloadingWasm
                        ? "bg-warning animate-pulse"
                        : "bg-muted-foreground/50"
                    }`}
                />
                <span className="text-muted-foreground">
                  {isWasmReady(env)
                    ? "WASM Ready"
                    : isDownloadingWasm
                      ? "Downloading WASM…"
                      : "WASM On-Demand"}
                </span>
              </span>

              {/* AI/ML & Data Science Starter Template Picker */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-primary hidden sm:inline">
                  🤖 Template:
                </span>
                <select
                  aria-label="Load AI/ML or Data Science template"
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal"
                >
                  <option value="">Choose AI / ML / Stats Template…</option>
                  {envTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.badge})
                    </option>
                  ))}
                </select>
              </div>

              <Link
                to="/lab/notebook"
                search={{ kernel: env }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
              >
                <span>📓</span> Switch to Notebook mode
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">Download:</span>
              {env === "python" ? (
                <>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    onClick={handleDownloadCode}
                  >
                    📥 .py
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    onClick={handleDownloadIpynb}
                  >
                    📓 .ipynb
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    onClick={handleDownloadCode}
                  >
                    📥 .R
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    disabled={exporting}
                    onClick={() => handleDownloadRData("rdata")}
                  >
                    💾 .RData
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    disabled={exporting}
                    onClick={() => handleDownloadRData("rda")}
                  >
                    💾 .rda
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    onClick={handleDownloadIpynb}
                  >
                    📓 .ipynb
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Python micropip Package Manager Bar */}
          {env === "python" && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-primary">📦 micropip Packages:</span>
                {POPULAR_PY_PACKAGES.map((pkg) => {
                  const isInstalled = installedList.includes(pkg);
                  return (
                    <button
                      key={pkg}
                      type="button"
                      disabled={installingPkg || busy}
                      onClick={() => handleInstallPkg(pkg)}
                      className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition ${isInstalled
                          ? "border-success/40 bg-success/15 text-success font-semibold"
                          : "border-border bg-card/80 text-muted-foreground hover:border-teal hover:text-foreground"
                        }`}
                      title={
                        isInstalled
                          ? `${pkg} is loaded`
                          : `Click to pre-install ${pkg} via micropip`
                      }
                    >
                      {isInstalled ? `✓ ${pkg}` : `+ ${pkg}`}
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInstallPkg();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={pkgInput}
                  onChange={(e) => setPkgInput(e.target.value)}
                  placeholder="Install PyPI pkg (e.g. joblib)..."
                  className="w-44 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-teal"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={installingPkg || busy || !pkgInput.trim()}
                  className="py-1 px-2.5 text-xs"
                >
                  {installingPkg ? "Installing…" : "Install"}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Live WASM Asset Download Progress Bar (When downloading over network) */}
        {isDownloadingWasm && (
          <div className="mb-4 rounded-xl border border-teal/40 bg-teal/10 p-3 fade-up">
            <div className="flex items-center justify-between text-xs font-semibold text-teal mb-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal border-t-transparent" />
                <span>{wasmStage || "Downloading WebAssembly Assets…"}</span>
              </div>
              <span className="font-mono">{wasmPercent}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-teal transition-all duration-300"
                style={{ width: `${Math.max(5, wasmPercent)}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              Initial load fetches pre-compiled WebAssembly runtime & ML wheels. Future executions run instantly from cache.
            </div>
          </div>
        )}

        {/* Editor and Console */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-editor shadow-glow">
            <div className="flex items-center justify-between bg-editor-panel px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-editor-foreground">
                  main.{env === "python" ? "py" : "R"}
                </span>
                <span className="rounded bg-[#161b22] px-1.5 py-0.5 font-mono text-[10px] text-teal border border-border/40">
                  CodeMirror 6
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="py-1 text-editor-foreground hover:bg-editor text-xs"
                  onClick={() => {
                    setCode(starter);
                    setSelectedTemplateId("");
                  }}
                >
                  Reset
                </Button>

                {/* Enhanced ▶ Run Button with Explicit Loading Spinner & Progress */}
                <Button
                  variant="lime"
                  className="relative overflow-hidden py-1 px-3.5 inline-flex items-center gap-2 text-xs font-bold transition-all"
                  disabled={busy}
                  onClick={exec}
                >
                  {busy && wasmPercent > 0 && (
                    <span
                      className="absolute inset-0 bg-lime-foreground/15 transition-all duration-300"
                      style={{ width: `${wasmPercent}%` }}
                    />
                  )}

                  {busy ? (
                    <span className="relative z-10 flex items-center gap-1.5">
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>
                        {isDownloadingWasm ? `Loading WASM (${wasmPercent}%)` : "Running…"}
                      </span>
                    </span>
                  ) : (
                    <span className="relative z-10 flex items-center gap-1">
                      <span>▶</span>
                      <span>Run</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>

            {/* CodeMirror Editor with Syntax Highlighting & Autocompletion */}
            <div className="flex-1 p-2">
              <CodeEditor
                value={code}
                onChange={setCode}
                language={env}
                onRun={exec}
                height="60vh"
              />
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-2xl bg-editor shadow-card">
            <div className="flex items-center justify-between bg-editor-panel px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-editor-foreground">
                  Console & Visual Output
                </span>
                {plots.length > 0 && (
                  <span className="rounded-full bg-teal/20 px-2 py-0.5 font-mono text-[10px] font-bold text-teal">
                    📊 {plots.length} {plots.length === 1 ? "Plot" : "Plots"}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                className="py-1 text-editor-foreground hover:bg-editor text-xs"
                onClick={() => {
                  setOut("");
                  setPlots([]);
                }}
              >
                Clear
              </Button>
            </div>

            <div className="flex-1 overflow-auto bg-editor p-4 h-[60vh] space-y-4">
              <pre className="font-mono text-xs text-lime leading-relaxed whitespace-pre-wrap">
                {out || (
                  <span className="text-editor-foreground/40 italic">
                    Console output & Matplotlib/R charts will appear here. Press ▶ Run or Ctrl+Enter to execute.
                  </span>
                )}
              </pre>

              {/* Inline Rendered Matplotlib / Seaborn / R Plots */}
              {plots.length > 0 && (
                <div className="space-y-3 border-t border-editor-panel pt-3">
                  <div className="font-mono text-[11px] font-semibold text-teal uppercase tracking-wider">
                    📊 Inline Rendered Figures ({plots.length})
                  </div>
                  {plots.map((plotUrl, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-xl border border-editor-panel bg-white p-2 shadow-sm"
                    >
                      <div className="mb-1.5 flex items-center justify-between px-1">
                        <span className="font-mono text-[11px] font-semibold text-slate-600">
                          Figure {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadPlot(plotUrl, idx)}
                          className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          📥 Save .png
                        </button>
                      </div>
                      <img
                        src={plotUrl}
                        alt={`Generated Plot ${idx + 1}`}
                        className="mx-auto max-h-[380px] w-auto object-contain rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Gate>
    </AppShell>
  );
}

export function Gate({ env, children }: { env: Env; children: React.ReactNode }) {
  const u = useCurrentUser();
  const ok = hasAccess(u, env);
  if (ok) return <>{children}</>;
  return (
    <Card className="max-w-md mx-auto text-center py-10 px-6">
      <div className="text-4xl mb-3">🔒</div>
      <h2 className="text-xl font-bold text-primary">Lab Access Required</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your account currently does not have active access to the {env.toUpperCase()} lab
        environment. Activate a subscription plan via Nigerian bank transfer to unlock full
        access.
      </p>
      <Link to="/payment" className="mt-6 inline-block">
        <Button variant="lime">View Subscription Plans & Pay →</Button>
      </Link>
    </Card>
  );
}
export { downloadFile };
