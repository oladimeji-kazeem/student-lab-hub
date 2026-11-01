/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { AppShell, Button, Card } from "@/components/ui-kit";
import { Gate, run, loadR, isWasmReady } from "@/components/CodeLab";
import { CodeEditor } from "@/components/CodeEditor";
import { actions } from "@/lib/store";
import {
  downloadAsIpynb,
  downloadAsPython,
  downloadAsR,
  downloadRWorkspace,
  type NotebookCellExport,
} from "@/lib/code-export";

export const Route = createFileRoute("/lab/notebook")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      kernel: (search.kernel === "r" ? "r" : "python") as "python" | "r",
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
  isEditingMd?: boolean;
  status?: "idle" | "running" | "success" | "error";
  elapsed?: number;
}

const defaultPythonCells: Cell[] = [
  {
    id: "nb-1",
    type: "markdown",
    content:
      "# Lab Notebook: Python Data Science\nWelcome to your browser notebook! Add code cells, execute calculations with NumPy & Pandas, and export as **.ipynb** or **.py**.",
    isEditingMd: false,
  },
  {
    id: "nb-2",
    type: "code",
    content: `import numpy as np

# Generate random sample
sample = np.random.normal(loc=50, scale=12, size=1000)
print(f"Sample size: {len(sample)}")
print(f"Mean       : {np.mean(sample):.3f}")
print(f"Std Dev    : {np.std(sample):.3f}")
print(f"Median     : {np.median(sample):.3f}")`,
    executionCount: 1,
    outputs: ["Sample size: 1000\nMean       : 49.982\nStd Dev    : 12.045\nMedian     : 50.114\n"],
    status: "success",
  },
  {
    id: "nb-3",
    type: "markdown",
    content: "### Iteration & Trials\nRun the next cell to perform multi-trial calculations:",
    isEditingMd: false,
  },
  {
    id: "nb-4",
    type: "code",
    content: `trials = [np.random.randint(1, 100) for _ in range(5)]
print("Simulated trials:", trials)
print("Max trial:", max(trials))`,
    executionCount: 2,
    outputs: ["Simulated trials: [42, 87, 19, 93, 61]\nMax trial: 93\n"],
    status: "success",
  },
];

const defaultRCells: Cell[] = [
  {
    id: "nb-r1",
    type: "markdown",
    content:
      "# Lab Notebook: R Statistical Analysis\nInteractive R notebook powered by WebR. Run statistics, regressions, and download your workspace as **.RData**, **.rda**, **.R**, or **.ipynb**.",
    isEditingMd: false,
  },
  {
    id: "nb-r2",
    type: "code",
    content: `# Summary statistics on mtcars dataset
data(mtcars)
head(mtcars[, c("mpg", "wt", "hp", "qsec")])
summary(mtcars$mpg)`,
    executionCount: 1,
    outputs: [],
    status: "idle",
  },
  {
    id: "nb-r3",
    type: "markdown",
    content:
      "### Linear Regression Modeling\nFit an ordinary least squares regression model of miles per gallon on weight:",
    isEditingMd: false,
  },
  {
    id: "nb-r4",
    type: "code",
    content: `model <- lm(mpg ~ wt, data = mtcars)
coef(model)
summary(model)$r.squared`,
    executionCount: 2,
    outputs: [],
    status: "idle",
  },
];

function NotebookLab() {
  const search = Route.useSearch();
  const [kernel, setKernel] = useState<"python" | "r">(search.kernel ?? "python");
  const [cells, setCells] = useState<Cell[]>(
    kernel === "python" ? defaultPythonCells : defaultRCells,
  );
  const [runningAll, setRunningAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [wasmStage, setWasmStage] = useState("");
  const [wasmPercent, setWasmPercent] = useState(0);
  const [isDownloadingWasm, setIsDownloadingWasm] = useState(false);
  const nextExecCount = useRef(Math.max(1, ...cells.map((c) => c.executionCount ?? 0)) + 1);

  // Switch templates when user changes kernel explicitly via selector
  const switchKernel = (newKernel: "python" | "r") => {
    if (newKernel === kernel) return;
    setKernel(newKernel);
    setCells(newKernel === "python" ? defaultPythonCells : defaultRCells);
    nextExecCount.current = 3;
    toast.info(`Switched kernel to ${newKernel === "python" ? "Python 3" : "R 4.3"}`);
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
            ? "# Write Python code here\n"
            : "# Write R code here\n"
          : "### Markdown notes\nClick to edit this text.",
      isEditingMd: type === "markdown",
      status: "idle",
      outputs: [],
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
      const output = await run(kernel, cell.content, (stage, percent) => {
        setWasmStage(stage);
        if (percent !== undefined) setWasmPercent(percent);
      });
      const elapsed = (performance.now() - startTime) / 1000;
      updateCell(cell.id, {
        status: "success",
        outputs: output ? [output] : ["(No output)"],
        executionCount: execNum,
        elapsed,
      });
      actions.countRun();
    } catch (err) {
      const elapsed = (performance.now() - startTime) / 1000;
      updateCell(cell.id, {
        status: "error",
        outputs: [`Error: ${(err as Error).message}`],
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
        status: "idle",
        executionCount: null,
        elapsed: undefined,
      })),
    );
    toast.info("Cleared all cell outputs");
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
        <div className="mb-6 space-y-4 rounded-2xl glass p-4 shadow-card">
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

          {/* Download & Export Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-primary">Export Options:</span>
              <span>Download your code and notebook in any of the supported formats below.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
              Initial load fetches pre-compiled WebAssembly binaries. Subsequent executions run instantly from local cache.
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
                            {isDownloadingWasm && wasmPercent > 0
                              ? `${wasmPercent}%`
                              : "Running…"}
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

                  {/* Cell Output Area */}
                  {cell.outputs && cell.outputs.length > 0 && (
                    <div className="border-t border-editor-panel bg-editor-panel/70 p-3">
                      <div className="mb-1 text-[11px] font-mono text-teal">
                        Out [{cell.executionCount}]:
                      </div>
                      <pre
                        className={`overflow-x-auto whitespace-pre-wrap font-mono text-xs ${
                          cell.status === "error" ? "text-destructive" : "text-lime"
                        }`}
                      >
                        {cell.outputs.join("\n")}
                      </pre>
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
      </Gate>
    </AppShell>
  );
}
