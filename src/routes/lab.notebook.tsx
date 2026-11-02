/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { AppShell, Button } from "@/components/ui-kit";
import {
  Gate,
  runRich,
  loadR,
  loadPy,
  isWasmReady,
  installPythonPackages,
  getInstalledPyPackages,
} from "@/components/CodeLab";
import { CodeEditor } from "@/components/CodeEditor";
import { CloudDriveImportModal } from "@/components/CloudDriveImportModal";
import { actions } from "@/lib/store";
import {
  downloadAsIpynb,
  downloadAsPython,
  downloadAsR,
  downloadRWorkspace,
  parseUploadedNotebookOrScript,
  type NotebookCellExport,
} from "@/lib/code-export";
import { LAB_TEMPLATES } from "@/lib/ml-templates";
import { LabPracticePanel } from "@/components/LabPracticePanel";

export const Route = createFileRoute("/lab/notebook")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      kernel: (search["kernel"] === "r" ? "r" : "python") as "python" | "r",
    };
  },
  head: () => ({
    meta: [
      { title: "Interactive Notebook — e-Lab" },
      {
        name: "description",
        content: "Run interactive Jupyter-style Python and R notebooks directly in the browser.",
      },
      { property: "og:title", content: "Interactive Notebook — e-Lab" },
      {
        property: "og:description",
        content: "Code notebooks for Python & R with .ipynb, .py, .R, and .RData downloads.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotebookLab,
});

interface Cell extends NotebookCellExport {
  isEditingMd?: boolean | undefined;
  status?: "idle" | "running" | "success" | "error" | undefined;
  elapsed?: number | undefined;
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

function cloneTemplateCells(templateId: string): Cell[] {
  const tmpl = LAB_TEMPLATES.find((t) => t.id === templateId) ?? LAB_TEMPLATES[0];
  if (!tmpl) return [];
  return tmpl.cells.map((c) => ({
    ...c,
    id: `${c.id}-${Math.random().toString(36).slice(2, 6)}`,
    outputs: c.outputs ? [...c.outputs] : [],
    plots: c.plots ? [...c.plots] : [],
    isEditingMd: false,
    status: c.outputs && c.outputs.length > 0 ? "success" : "idle",
  }));
}

const NOTEBOOK_STORAGE_KEY = "elab-notebook-draft-v1";

function NotebookLab() {
  const search = Route.useSearch();
  const initialKernel = search.kernel ?? "python";
  const initialTemplateId =
    initialKernel === "python" ? "py-data-science" : "r-stats-regression";

  const [kernel, setKernel] = useState<"python" | "r">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.kernel === "python" || parsed?.kernel === "r") {
            return parsed.kernel;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return initialKernel;
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [cells, setCells] = useState<Cell[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.cells) && parsed.cells.length > 0) {
            return parsed.cells;
          }
        }
      } catch {
        // ignore storage errors
      }
    }
    return cloneTemplateCells(initialTemplateId);
  });
  const [runningAll, setRunningAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [wasmStage, setWasmStage] = useState("");
  const [wasmPercent, setWasmPercent] = useState(0);
  const [isDownloadingWasm, setIsDownloadingWasm] = useState(false);
  const nextExecCount = useRef(Math.max(1, ...cells.map((c) => c.executionCount ?? 0)) + 1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Persist notebook draft locally for offline/online continuity
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        NOTEBOOK_STORAGE_KEY,
        JSON.stringify({ kernel, cells, uploadedFileName }),
      );
    } catch {
      // ignore quota errors
    }
  }, [kernel, cells, uploadedFileName]);

  // micropip package installer state
  const [pkgInput, setPkgInput] = useState("");
  const [installingPkg, setInstallingPkg] = useState(false);
  const [installedList, setInstalledList] = useState<string[]>(getInstalledPyPackages());

  // Switch templates when user changes kernel explicitly via selector
  const switchKernel = (newKernel: "python" | "r") => {
    if (newKernel === kernel) return;
    const defaultTmpl = newKernel === "python" ? "py-data-science" : "r-stats-regression";
    setKernel(newKernel);
    setSelectedTemplateId(defaultTmpl);
    setUploadedFileName("");
    setCells(cloneTemplateCells(defaultTmpl));
    nextExecCount.current = 3;
    toast.info(`Switched kernel to ${newKernel === "python" ? "Python 3" : "R 4.3"}`);
  };

  const handleSelectTemplate = (templateId: string) => {
    const tmpl = LAB_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    if (tmpl.kernel !== kernel) {
      setKernel(tmpl.kernel);
    }
    setSelectedTemplateId(templateId);
    setUploadedFileName("");
    setCells(cloneTemplateCells(templateId));
    nextExecCount.current = 1;
    toast.success(`Loaded notebook template: ${tmpl.name}`);
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseUploadedNotebookOrScript(file.name, text, kernel);
      setKernel(parsed.kernel);
      setUploadedFileName(parsed.fileName);
      setCells(
        parsed.cells.map((c) => ({
          ...c,
          outputs: c.outputs ?? [],
          plots: c.plots ?? [],
          isEditingMd: false,
          status:
            (c.outputs && c.outputs.length > 0) || (c.plots && c.plots.length > 0)
              ? "success"
              : "idle",
        })),
      );
      nextExecCount.current =
        Math.max(0, ...parsed.cells.map((c) => c.executionCount ?? 0)) + 1;
      toast.success(
        `Imported "${file.name}" (${parsed.cells.length} ${parsed.cells.length === 1 ? "cell" : "cells"}, ${parsed.kernel === "python" ? "Python" : "R"} kernel)`,
      );
    } catch (err) {
      toast.error(`Upload failed: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    } catch (err) {
      toast.error(`Failed to install ${target}: ${(err as Error).message}`);
    } finally {
      setInstallingPkg(false);
      setIsDownloadingWasm(false);
      setWasmStage("");
      setWasmPercent(0);
    }
  };

  const updateCell = (id: string, patch: Partial<Cell>) => {
    setCells((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCell = (type: "code" | "markdown", afterId?: string) => {
    const newCell: Cell = {
      id: "cell-" + Math.random().toString(36).slice(2, 9),
      type,
      content:
        type === "code"
          ? kernel === "python"
            ? "# Write Python or AI/ML code here (or !pip install <pkg>)\n"
            : "# Write R code here\n"
          : "### Markdown notes\nClick to edit this text.",
      isEditingMd: type === "markdown",
      status: "idle",
      outputs: [],
      plots: [],
    };

    setCells((prev) => {
      if (!afterId) return [...prev, newCell];
      const index = prev.findIndex((c) => c.id === afterId);
      if (index === -1) return [...prev, newCell];
      const copy = [...prev];
      copy.splice(index + 1, 0, newCell);
      return copy;
    });
  };

  const removeCell = (id: string) => {
    if (cells.length <= 1) {
      toast.warning("Notebook must contain at least one cell");
      return;
    }
    setCells((prev) => prev.filter((c) => c.id !== id));
  };

  const moveCell = (id: string, dir: -1 | 1) => {
    setCells((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      if (!item) return prev;
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const runCell = async (cell: Cell) => {
    if (cell.type === "markdown") {
      updateCell(cell.id, { isEditingMd: false });
      return;
    }

    const execNum = nextExecCount.current++;
    updateCell(cell.id, { status: "running" });
    const isFirstTime = !isWasmReady(kernel);
    if (isFirstTime) {
      setIsDownloadingWasm(true);
      setWasmStage(`Downloading ${kernel === "python" ? "Pyodide" : "WebR"} WebAssembly runtime…`);
      setWasmPercent(20);
    }
    const startTime = performance.now();

    try {
      const res = await runRich(kernel, cell.content, (stage, percent) => {
        setWasmStage(stage);
        if (percent !== undefined) setWasmPercent(percent);
      });
      const elapsed = (performance.now() - startTime) / 1000;
      const hasText = Boolean(res.text && res.text.trim());
      const hasPlots = res.plots && res.plots.length > 0;
      updateCell(cell.id, {
        status: "success",
        outputs: hasText ? [res.text] : hasPlots ? [] : ["(Executed with no stdout)"],
        plots: res.plots,
        executionCount: execNum,
        elapsed,
      });
      setInstalledList(getInstalledPyPackages());
      actions.countRun();
    } catch (err) {
      const elapsed = (performance.now() - startTime) / 1000;
      updateCell(cell.id, {
        status: "error",
        outputs: [`Error: ${(err as Error).message}`],
        plots: [],
        executionCount: execNum,
        elapsed,
      });
    } finally {
      setIsDownloadingWasm(false);
      setWasmPercent(0);
      setWasmStage("");
    }
  };

  const runAllCells = async () => {
    setRunningAll(true);
    toast.info(`Running all cells with ${kernel === "python" ? "Python" : "R"} runtime…`);
    for (const c of cells) {
      if (c.type === "code") {
        await runCell(c);
      }
    }
    setRunningAll(false);
    toast.success("All cells executed");
  };

  const clearAllOutputs = () => {
    setCells((prev) =>
      prev.map((c) => ({
        ...c,
        outputs: [],
        plots: [],
        status: "idle",
        executionCount: null,
        elapsed: undefined,
      })),
    );
    toast.info("Cleared all cell outputs & plots");
  };

  const handleDownloadPlot = (dataUrl: string, cellExec: number | null | undefined, idx: number) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `notebook_cell_${cellExec ?? 1}_plot_${idx + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Downloaded plot as .png");
  };

  // Export handlers
  const handleDownloadIpynb = () => {
    downloadAsIpynb(cells, kernel, `notebook_${kernel}.ipynb`);
    toast.success(`Downloaded notebook as notebook_${kernel}.ipynb`);
  };

  const handleDownloadScript = () => {
    if (kernel === "python") {
      downloadAsPython(cells, `notebook_${kernel}.py`);
      toast.success("Downloaded code as notebook_python.py");
    } else {
      downloadAsR(cells, `notebook_${kernel}.R`);
      toast.success("Downloaded code as notebook_r.R");
    }
  };

  const handleDownloadRData = async (format: "rdata" | "rda") => {
    setExporting(true);
    const combinedRCode = cells
      .filter((c) => c.type === "code")
      .map((c) => c.content)
      .join("\n\n");
    try {
      let rInst: any = null;
      try {
        rInst = await loadR();
      } catch {
        // fallback
      }
      await downloadRWorkspace(format, combinedRCode, rInst, `notebook_workspace`);
      toast.success(
        `Downloaded workspace as notebook_workspace.${format === "rdata" ? "RData" : "rda"}`,
      );
    } catch (err) {
      toast.error(`Workspace export failed: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell title="Interactive Notebook">
      <Gate env="notebook">
        {/* Main Notebook Header Bar */}
        <div className="mb-6 space-y-3.5 rounded-2xl glass p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display font-bold text-primary">Kernel:</span>
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                <button
                  onClick={() => switchKernel("python")}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    kernel === "python"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="font-mono text-lime font-bold">Py</span>
                  Python 3 (Pyodide)
                </button>
                <button
                  onClick={() => switchKernel("r")}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    kernel === "r"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="font-mono text-teal font-bold">R</span>R 4.3 (WebR)
                </button>
              </div>

              {/* AI/ML & Statistical Notebook Template Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-primary">🤖 AI/ML Template:</span>
                <select
                  aria-label="Select AI/ML Notebook Template"
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal"
                >
                  <optgroup label="Python AI, Machine Learning & Data Science">
                    {LAB_TEMPLATES.filter((t) => t.kernel === "python").map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.badge})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="R Statistical & ML Modeling">
                    {LAB_TEMPLATES.filter((t) => t.kernel === "r").map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.badge})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Kernel Ready
              </span>
            </div>

            {/* Notebook Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="lime"
                className="py-1 px-3 text-xs inline-flex items-center gap-1.5"
                disabled={runningAll}
                onClick={runAllCells}
              >
                {runningAll ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-lime-foreground border-t-transparent" />
                    Running All…
                  </>
                ) : (
                  "▶ Run All Cells"
                )}
              </Button>
              <Button variant="outline" className="py-1 px-3 text-xs" onClick={clearAllOutputs}>
                Clear Outputs
              </Button>
              <Button variant="ghost" className="py-1 px-3 text-xs" onClick={() => addCell("code")}>
                + Code
              </Button>
              <Button
                variant="ghost"
                className="py-1 px-3 text-xs"
                onClick={() => addCell("markdown")}
              >
                + Markdown
              </Button>
            </div>
          </div>

          {/* micropip Package Manager Bar (Python Kernel) */}
          {kernel === "python" && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-primary">📦 micropip Packages:</span>
                {POPULAR_PY_PACKAGES.map((pkg) => {
                  const isInstalled = installedList.includes(pkg);
                  return (
                    <button
                      key={pkg}
                      type="button"
                      disabled={installingPkg || runningAll}
                      onClick={() => handleInstallPkg(pkg)}
                      className={`rounded-md border px-2 py-0.5 font-mono text-[11px] transition ${
                        isInstalled
                          ? "border-success/40 bg-success/15 text-success font-semibold"
                          : "border-border bg-card/80 text-muted-foreground hover:border-teal hover:text-foreground"
                      }`}
                      title={
                        isInstalled
                          ? `${pkg} is ready`
                          : `Click to install ${pkg} via micropip`
                      }
                    >
                      {isInstalled ? `✓ ${pkg}` : `+ ${pkg}`}
                    </button>
                  );
                })}
                <span className="text-[11px] text-muted-foreground ml-1 hidden md:inline">
                  (Tip: You can also run <code className="font-mono text-primary">!pip install pkg</code> inside any cell)
                </span>
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
                  className="w-48 rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-xs outline-none focus:ring-1 focus:ring-teal"
                />
                <Button
                  type="submit"
                  variant="outline"
                  disabled={installingPkg || runningAll || !pkgInput.trim()}
                  className="py-1 px-2.5 text-xs"
                >
                  {installingPkg ? "Installing…" : "Install"}
                </Button>
              </form>
            </div>
          )}

          {/* Offline / Online Continuity: Upload & Export Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary">Offline ↔ Online Continuity:</span>
              <span>
                Upload a local <code className="font-mono text-primary">.ipynb</code>,{" "}
                <code className="font-mono text-primary">.py</code>, or{" "}
                <code className="font-mono text-primary">.R</code> file to continue your work, or download to work offline.
              </span>
              {uploadedFileName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-teal">
                  📄 {uploadedFileName}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Hidden File Input for Notebook / Script Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".ipynb,.py,.R,.r,.RData,.rda"
                onChange={handleUploadFile}
                className="hidden"
              />
              <Button
                variant="outline"
                className="py-1 px-3 text-xs border-lime/60 bg-lime/10 text-primary font-semibold hover:bg-lime/20"
                onClick={() => fileInputRef.current?.click()}
              >
                📂 Upload .ipynb / .py / .R
              </Button>

              <Button
                variant="outline"
                className="py-1 px-3 text-xs border-teal/60 bg-teal/10 text-teal font-semibold hover:bg-teal/20"
                onClick={() => setCloudModalOpen(true)}
                title="Import dataset from Google Drive or Microsoft OneDrive"
              >
                ☁️ Cloud Drive Import
              </Button>

              <Button
                variant="outline"
                className="py-1 px-3 text-xs border-teal/40 hover:bg-teal/10"
                onClick={handleDownloadIpynb}
              >
                📓 Download .ipynb
              </Button>

              {kernel === "python" ? (
                <Button
                  variant="outline"
                  className="py-1 px-3 text-xs"
                  onClick={handleDownloadScript}
                >
                  📥 Download .py
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    onClick={handleDownloadScript}
                  >
                    📥 Download .R
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    disabled={exporting}
                    onClick={() => handleDownloadRData("rdata")}
                  >
                    💾 Download .RData
                  </Button>
                  <Button
                    variant="outline"
                    className="py-1 px-3 text-xs"
                    disabled={exporting}
                    onClick={() => handleDownloadRData("rda")}
                  >
                    💾 Download .rda
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Course Lab Practical Assessment & Auto-Grading Panel */}
        <LabPracticePanel
          kernel={kernel}
          currentCode={cells
            .filter((c) => c.type === "code")
            .map((c) => c.content)
            .join("\n\n")}
          currentOutput={cells
            .filter((c) => c.type === "code")
            .flatMap((c) => c.outputs ?? [])
            .join("\n")}
          currentPlots={cells
            .filter((c) => c.type === "code")
            .flatMap((c) => c.plots ?? [])}
          onLoadStarter={(asg) => {
            if (asg.kernel !== kernel) {
              setKernel(asg.kernel);
            }
            setCells([
              {
                id: `asg-md-${asg.id}`,
                type: "markdown",
                content: `# [${asg.courseCode}] ${asg.title}\n**Instructions:** ${asg.instructions}`,
                isEditingMd: false,
                status: "idle",
                outputs: [],
                plots: [],
              },
              {
                id: `asg-code-${asg.id}`,
                type: "code",
                content: asg.starterCode,
                isEditingMd: false,
                status: "idle",
                outputs: [],
                plots: [],
                executionCount: null,
              },
            ]);
          }}
        />

        {/* Live WASM Asset Download Progress Bar in Notebook */}
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
              Initial load fetches pre-compiled WebAssembly binaries & ML packages. Subsequent executions run instantly from cache.
            </div>
          </div>
        )}

        {/* Notebook Cells List */}
        <div className="space-y-4">
          {cells.map((cell, idx) => (
            <div
              key={cell.id}
              className="group overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all hover:border-teal/50"
            >
              {/* Cell Header Toolbar */}
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-muted-foreground">
                    {cell.type === "code"
                      ? `[${cell.executionCount ?? (cell.status === "running" ? "*" : " ")}]`
                      : "Markdown"}
                  </span>
                  <span className="rounded bg-background px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                    {cell.type}
                  </span>
                  {cell.elapsed !== undefined && (
                    <span className="text-[11px] text-muted-foreground">
                      {cell.elapsed.toFixed(2)}s
                    </span>
                  )}
                  {cell.plots && cell.plots.length > 0 && (
                    <span className="rounded-full bg-teal/15 px-2 py-0.5 font-mono text-[10px] font-bold text-teal">
                      📊 {cell.plots.length} {cell.plots.length === 1 ? "figure" : "figures"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {cell.type === "code" ? (
                    <Button
                      variant="lime"
                      className="relative overflow-hidden py-0.5 px-2.5 text-xs h-7 min-w-[70px] inline-flex items-center gap-1 font-bold"
                      disabled={cell.status === "running"}
                      onClick={() => runCell(cell)}
                    >
                      {cell.status === "running" ? (
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-[11px]">
                            {isDownloadingWasm && wasmPercent > 0 ? `${wasmPercent}%` : "Running…"}
                          </span>
                        </span>
                      ) : (
                        "▶ Run"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="py-0.5 px-2 text-xs h-7"
                      onClick={() => updateCell(cell.id, { isEditingMd: !cell.isEditingMd })}
                    >
                      {cell.isEditingMd ? "Preview" : "Edit"}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="py-0.5 px-2 text-xs h-7"
                    title="Move up"
                    disabled={idx === 0}
                    onClick={() => moveCell(cell.id, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    className="py-0.5 px-2 text-xs h-7"
                    title="Move down"
                    disabled={idx === cells.length - 1}
                    onClick={() => moveCell(cell.id, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    className="py-0.5 px-2 text-xs h-7 text-muted-foreground hover:text-destructive"
                    title="Delete cell"
                    onClick={() => removeCell(cell.id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Cell Body */}
              {cell.type === "code" ? (
                <div className="bg-editor p-1.5">
                  <CodeEditor
                    value={cell.content}
                    onChange={(val) => updateCell(cell.id, { content: val })}
                    language={kernel}
                    onRun={() => runCell(cell)}
                    minHeight="70px"
                  />

                  {/* Cell Output & Inline Plots Area */}
                  {((cell.outputs && cell.outputs.length > 0) ||
                    (cell.plots && cell.plots.length > 0)) && (
                    <div className="border-t border-editor-panel bg-editor-panel/70 p-3 space-y-3">
                      <div className="text-[11px] font-mono text-teal">
                        Out [{cell.executionCount}]:
                      </div>

                      {cell.outputs && cell.outputs.length > 0 && (
                        <pre
                          className={`overflow-x-auto whitespace-pre-wrap font-mono text-xs ${
                            cell.status === "error" ? "text-destructive" : "text-lime"
                          }`}
                        >
                          {cell.outputs.join("\n")}
                        </pre>
                      )}

                      {cell.plots && cell.plots.length > 0 && (
                        <div className="grid gap-3 pt-1">
                          {cell.plots.map((plotUrl, pIdx) => (
                            <div
                              key={pIdx}
                              className="overflow-hidden rounded-xl border border-editor-panel bg-white p-2.5 shadow-sm"
                            >
                              <div className="mb-1.5 flex items-center justify-between px-1">
                                <span className="font-mono text-[11px] font-semibold text-slate-600">
                                  📊 Figure {pIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDownloadPlot(plotUrl, cell.executionCount, pIdx)
                                  }
                                  className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                                >
                                  📥 Save .png
                                </button>
                              </div>
                              <img
                                src={plotUrl}
                                alt={`Cell ${cell.executionCount} Figure ${pIdx + 1}`}
                                className="mx-auto max-h-[420px] w-auto object-contain rounded"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : cell.isEditingMd ? (
                <div className="p-3">
                  <textarea
                    value={cell.content}
                    onChange={(e) => updateCell(cell.id, { content: e.target.value })}
                    rows={Math.max(2, cell.content.split("\n").length)}
                    className="w-full resize-y rounded-lg border border-input bg-card p-3 font-sans text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter Markdown content..."
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="outline"
                      className="py-1 px-3 text-xs"
                      onClick={() => updateCell(cell.id, { isEditingMd: false })}
                    >
                      Done Editing
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="cursor-pointer p-4 prose prose-sm max-w-none text-foreground hover:bg-muted/20"
                  onClick={() => updateCell(cell.id, { isEditingMd: true })}
                >
                  <div className="whitespace-pre-line leading-relaxed font-sans">
                    {cell.content}
                  </div>
                  <span className="mt-2 block text-[10px] text-muted-foreground opacity-60">
                    (Click to edit Markdown)
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Append Bar */}
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => addCell("code")}>
            ➕ Add Code Cell
          </Button>
          <Button variant="outline" onClick={() => addCell("markdown")}>
            ➕ Add Markdown Cell
          </Button>
        </div>

        {/* Cloud Drive Import Modal */}
        <CloudDriveImportModal
          isOpen={cloudModalOpen}
          onClose={() => setCloudModalOpen(false)}
          env={kernel}
          onInsertCode={(newCode) => {
            const newCell = {
              id: `cell-${Date.now()}`,
              type: "code" as const,
              source: newCode.trim(),
              outputs: [],
              plots: [],
              status: "idle" as const,
              executionCount: null,
            };
            setCells((prev) => [newCell, ...prev]);
            toast.success("Added cloud dataset cell to top of notebook!");
          }}
          onMountFile={async (fileName, content) => {
            try {
              if (kernel === "python") {
                const py = await loadPy();
                py.FS.writeFile(fileName, content);
              } else {
                const w = await loadR();
                await w.FS.writeFile(fileName, content);
              }
              setUploadedFileName(fileName);
              toast.success(`Mounted ${fileName} in virtual file system!`);
            } catch (err: any) {
              toast.error(`Could not mount file: ${err.message}`);
            }
          }}
        />
      </Gate>
    </AppShell>
  );
}
