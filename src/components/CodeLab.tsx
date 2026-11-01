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
} from "@/lib/code-export";

/* eslint-disable @typescript-eslint/no-explicit-any */
let pyodide: Promise<any> | null = null;
let pyodideReady = false;

let webR: Promise<any> | null = null;
let webRReady = false;

export function isWasmReady(env: "python" | "r"): boolean {
  return env === "python" ? pyodideReady : webRReady;
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

export async function run(
  env: "python" | "r",
  code: string,
  onProgress?: (stage: string, percent?: number) => void,
): Promise<string> {
  if (env === "python") {
    const isFirstTime = !pyodideReady;
    if (isFirstTime) {
      onProgress?.("Downloading Pyodide WebAssembly...", 15);
    } else {
      onProgress?.("Running Python code...", 50);
    }
    const py = await loadPy(onProgress);
    let out = "";
    py.setStdout({ batched: (s: string) => (out += s + "\n") });
    py.setStderr({ batched: (s: string) => (out += s + "\n") });
    onProgress?.("Loading packages from imports...", 80);
    await py.loadPackagesFromImports(code);
    onProgress?.("Executing Python code...", 95);
    const r = await py.runPythonAsync(code);
    if (r !== undefined && r !== null) out += String(r) + "\n";
    return out;
  }

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
    });
    return res.output.map((o: any) => o.data).join("\n");
  } finally {
    shelter.purge();
  }
}

export function CodeLab({
  env,
  title,
  starter,
}: {
  env: "python" | "r";
  title: string;
  starter: string;
}) {
  const [code, setCode] = useState(starter);
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [wasmStage, setWasmStage] = useState<string>("");
  const [wasmPercent, setWasmPercent] = useState<number>(0);
  const [isDownloadingWasm, setIsDownloadingWasm] = useState(false);

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
      const r = await run(env, code, (stage, percent) => {
        setWasmStage(stage);
        if (percent !== undefined) setWasmPercent(percent);
      });
      setOut(r + `\n✓ Completed in ${((performance.now() - t) / 1000).toFixed(2)}s\n`);
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
    downloadAsIpynb(code, env, `lab_${env}.ipynb`, out);
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

  return (
    <AppShell title={title}>
      <Gate env={env}>
        {/* Top Control & Export Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl glass p-3 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
              {env === "python" ? "Python 3 · Pyodide" : "R 4.3 · WebR"}
            </span>

            {/* WASM Engine Status Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-2.5 py-1 font-mono text-xs">
              <span
                className={`h-2 w-2 rounded-full ${
                  isWasmReady(env)
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
              Initial load fetches pre-compiled WebAssembly runtime. Future executions run instantly from local cache.
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
                  onClick={() => setCode(starter)}
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
                  {/* Subtle fill bar when downloading WASM */}
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
                        {isDownloadingWasm
                          ? `Loading WASM (${wasmPercent}%)`
                          : "Running…"}
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
              <span className="font-mono text-xs text-editor-foreground">Console Output</span>
              <Button
                variant="ghost"
                className="py-1 text-editor-foreground hover:bg-editor text-xs"
                onClick={() => setOut("")}
              >
                Clear
              </Button>
            </div>
            <pre className="flex-1 overflow-auto bg-editor p-4 font-mono text-xs text-lime leading-relaxed h-[60vh] whitespace-pre-wrap">
              {out || (
                <span className="text-editor-foreground/40 italic">
                  Console output will appear here. Press ▶ Run or Ctrl+Enter to execute.
                </span>
              )}
            </pre>
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
