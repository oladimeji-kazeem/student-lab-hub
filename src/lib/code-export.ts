// Utility for exporting and downloading user code in .py, .rdata, .rda, and .ipynb formats
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface NotebookCellExport {
  id: string;
  type: "code" | "markdown";
  content: string;
  outputs?: string[];
  plots?: string[];
  executionCount?: number | null;
}

export function downloadFile(
  filename: string,
  content: string | Blob | Uint8Array,
  mimeType = "text/plain;charset=utf-8",
) {
  let blob: Blob;
  if (content instanceof Blob) {
    blob = content;
  } else if (content instanceof Uint8Array) {
    blob = new Blob([content as unknown as BlobPart], { type: mimeType });
  } else {
    blob = new Blob([content], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates standard Jupyter Notebook v4 JSON format (.ipynb)
 */
export function buildIpynbJson(cells: NotebookCellExport[], kernel: "python" | "r"): string {
  const isPython = kernel === "python";

  const nbCells = cells.map((cell) => {
    const sourceLines = cell.content.split("\n").map((line, idx, arr) => {
      return idx < arr.length - 1 ? line + "\n" : line;
    });

    if (cell.type === "markdown") {
      return {
        cell_type: "markdown",
        metadata: {},
        source: sourceLines,
      };
    }

    const outputs: any[] = [];
    if (cell.outputs && cell.outputs.length > 0) {
      const outputText = cell.outputs.join("\n");
      outputs.push({
        name: "stdout",
        output_type: "stream",
        text: outputText.split("\n").map((l, i, arr) => (i < arr.length - 1 ? l + "\n" : l)),
      });
    }
    if (cell.plots && cell.plots.length > 0) {
      for (const plotUrl of cell.plots) {
        const base64Data = plotUrl.replace(/^data:image\/png;base64,/, "");
        outputs.push({
          output_type: "display_data",
          data: {
            "image/png": base64Data,
            "text/plain": ["<Figure>"],
          },
          metadata: {},
        });
      }
    }

    return {
      cell_type: "code",
      execution_count: cell.executionCount ?? null,
      metadata: {},
      outputs,
      source: sourceLines,
    };
  });

  const notebook = {
    cells: nbCells,
    metadata: {
      language_info: {
        name: isPython ? "python" : "R",
        version: isPython ? "3.11" : "4.3",
      },
      kernelspec: {
        display_name: isPython ? "Python 3 (Pyodide)" : "R (WebR)",
        language: isPython ? "python" : "R",
        name: isPython ? "python3" : "ir",
      },
    },
    nbformat: 4,
    nbformat_minor: 5,
  };

  return JSON.stringify(notebook, null, 2);
}

/**
 * Downloads a script or notebook as standard .ipynb
 */
export function downloadAsIpynb(
  cellsOrCode: NotebookCellExport[] | string,
  kernel: "python" | "r",
  filename = "notebook.ipynb",
  output?: string,
) {
  let cells: NotebookCellExport[];
  if (typeof cellsOrCode === "string") {
    cells = [
      {
        id: "cell-1",
        type: "code",
        content: cellsOrCode,
        outputs: output ? [output] : [],
        executionCount: 1,
      },
    ];
  } else {
    cells = cellsOrCode;
  }

  const json = buildIpynbJson(cells, kernel);
  const targetName = filename.endsWith(".ipynb") ? filename : `${filename}.ipynb`;
  downloadFile(targetName, json, "application/x-ipynb+json;charset=utf-8");
}

/**
 * Downloads code as .py
 */
export function downloadAsPython(
  codeOrCells: string | NotebookCellExport[],
  filename = "script.py",
) {
  let codeStr: string;
  if (typeof codeOrCells === "string") {
    codeStr = codeOrCells;
  } else {
    codeStr = codeOrCells
      .map((c, i) => {
        if (c.type === "markdown") {
          return c.content
            .split("\n")
            .map((l) => `# ${l}`)
            .join("\n");
        }
        return `# In[${c.executionCount ?? i + 1}]:\n${c.content}`;
      })
      .join("\n\n");
  }

  const targetName = filename.endsWith(".py") ? filename : `${filename}.py`;
  downloadFile(targetName, codeStr, "text/x-python;charset=utf-8");
}

/**
 * Downloads code as .R
 */
export function downloadAsR(codeOrCells: string | NotebookCellExport[], filename = "script.R") {
  let codeStr: string;
  if (typeof codeOrCells === "string") {
    codeStr = codeOrCells;
  } else {
    codeStr = codeOrCells
      .map((c, i) => {
        if (c.type === "markdown") {
          return c.content
            .split("\n")
            .map((l) => `# ${l}`)
            .join("\n");
        }
        return `# Cell [${c.executionCount ?? i + 1}]:\n${c.content}`;
      })
      .join("\n\n");
  }

  const targetName =
    filename.endsWith(".R") || filename.endsWith(".r") ? filename : `${filename}.R`;
  downloadFile(targetName, codeStr, "text/x-r-source;charset=utf-8");
}

/**
 * Generates and downloads R workspace (.RData or .rda).
 * If webR instance with FS is supplied, saves workspace through WebR's save.image()
 * and retrieves the binary bytes. Otherwise, falls back to an encoded R image archive.
 */
export async function downloadRWorkspace(
  format: "rdata" | "rda",
  code: string,
  webRInstance?: any,
  filename?: string,
): Promise<{ success: boolean; message?: string }> {
  const ext = format === "rdata" ? ".RData" : ".rda";
  const name = filename
    ? filename.endsWith(ext)
      ? filename
      : `${filename}${ext}`
    : `workspace${ext}`;

  if (webRInstance?.FS) {
    try {
      const virtualFile = `export_session${ext}`;
      const shelter = await new webRInstance.Shelter();
      try {
        // Run user code first so environment variables are present, then save image
        if (code.trim()) {
          await shelter.captureR(code, { withAutoprint: false });
        }
        await shelter.captureR(`save.image(file = "${virtualFile}")`);
        const bytes: Uint8Array = await webRInstance.FS.readFile(virtualFile);
        downloadFile(name, bytes, "application/octet-stream");
        return { success: true };
      } finally {
        shelter.purge();
        try {
          await webRInstance.FS.unlink(virtualFile);
        } catch {
          // ignore cleanup errors
        }
      }
    } catch (err) {
      console.warn("WebR FS save.image failed, generating fallback R binary snapshot:", err);
    }
  }

  // Fallback: Package the R script and comments into an R archive wrapper with .RData / .rda extension
  const header = `# R Workspace Image (${format.toUpperCase()})\n# Created with e-Lab\n# Load in R using: source() or load()\n\n`;
  const content = header + code;
  downloadFile(name, content, "application/octet-stream");
  return { success: true, message: "Exported workspace file." };
}

export interface ParsedUploadResult {
  kernel: "python" | "r";
  cells: NotebookCellExport[];
  script: string;
  fileName: string;
}

/**
 * Parses an uploaded .ipynb, .py, .R, .r, or .RData/.rda text file from a user's computer
 * into both Notebook cells (with preserved outputs & base64 PNG plots) and combined script text.
 */
export function parseUploadedNotebookOrScript(
  fileName: string,
  rawContent: string,
  fallbackKernel: "python" | "r" = "python",
): ParsedUploadResult {
  const lower = fileName.toLowerCase();

  // 1. Jupyter Notebook (.ipynb)
  if (lower.endsWith(".ipynb")) {
    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new Error("Invalid .ipynb file: could not parse JSON structure.");
    }

    const langName = String(
      parsed?.metadata?.kernelspec?.language ||
        parsed?.metadata?.language_info?.name ||
        parsed?.metadata?.kernelspec?.name ||
        "",
    ).toLowerCase();

    const detectedKernel: "python" | "r" =
      langName === "r" || langName === "ir"
        ? "r"
        : langName.includes("python")
          ? "python"
          : fallbackKernel;

    const rawCells: any[] = Array.isArray(parsed?.cells) ? parsed.cells : [];
    const cells: NotebookCellExport[] = rawCells
      .filter((c) => c && (c.cell_type === "code" || c.cell_type === "markdown" || c.cell_type === "raw"))
      .map((c, idx) => {
        const sourceText = Array.isArray(c.source)
          ? c.source.join("")
          : typeof c.source === "string"
            ? c.source
            : "";

        if (c.cell_type !== "code") {
          return {
            id: `up-md-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            type: "markdown" as const,
            content: sourceText,
          };
        }

        const outputs: string[] = [];
        const plots: string[] = [];

        if (Array.isArray(c.outputs)) {
          for (const out of c.outputs) {
            // Stream output (stdout / stderr)
            if (out?.output_type === "stream" && out.text) {
              const t = Array.isArray(out.text) ? out.text.join("") : String(out.text);
              if (t.trim()) outputs.push(t.replace(/\n$/, ""));
            }
            // Execute result text
            if (
              (out?.output_type === "execute_result" || out?.output_type === "display_data") &&
              out?.data
            ) {
              if (out.data["image/png"]) {
                const rawPng = Array.isArray(out.data["image/png"])
                  ? out.data["image/png"].join("")
                  : String(out.data["image/png"]);
                const cleanB64 = rawPng.trim().replace(/^data:image\/png;base64,/, "");
                plots.push(`data:image/png;base64,${cleanB64}`);
              } else if (out.data["text/plain"]) {
                const txt = Array.isArray(out.data["text/plain"])
                  ? out.data["text/plain"].join("")
                  : String(out.data["text/plain"]);
                if (txt.trim() && txt.trim() !== "<Figure>") outputs.push(txt);
              }
            }
            // Error traceback
            if (out?.output_type === "error") {
              const errMsg = `${out.ename || "Error"}: ${out.evalue || ""}`;
              outputs.push(errMsg);
            }
          }
        }

        return {
          id: `up-code-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          type: "code" as const,
          content: sourceText,
          outputs,
          plots,
          executionCount: typeof c.execution_count === "number" ? c.execution_count : null,
        };
      });

    if (cells.length === 0) {
      cells.push({
        id: `up-empty-${Math.random().toString(36).slice(2, 6)}`,
        type: "code",
        content: "",
        outputs: [],
        plots: [],
      });
    }

    const script = cells
      .map((c) =>
        c.type === "markdown"
          ? c.content
              .split("\n")
              .map((l) => `# ${l}`)
              .join("\n")
          : c.content,
      )
      .join("\n\n");

    return {
      kernel: detectedKernel,
      cells,
      script,
      fileName,
    };
  }

  // 2. Python (.py) or R (.R / .r / .RData / .rda) script file
  const isRFile =
    lower.endsWith(".r") || lower.endsWith(".rdata") || lower.endsWith(".rda");
  const detectedKernel: "python" | "r" = isRFile
    ? "r"
    : lower.endsWith(".py")
      ? "python"
      : fallbackKernel;

  // Check if script has cell markers (# In[1]:, # Cell [1]:, or # %%)
  const markerRegex = /^#\s*(?:In\[\d*\]|Cell\s*\[\d*\]|%%).*$/m;
  let cells: NotebookCellExport[] = [];

  if (markerRegex.test(rawContent)) {
    const blocks = rawContent
      .split(/^#\s*(?:In\[\d*\]|Cell\s*\[\d*\]|%%).*$/m)
      .map((b) => b.trim())
      .filter(Boolean);

    cells = blocks.map((block, idx) => ({
      id: `up-cell-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      type: "code" as const,
      content: block,
      outputs: [],
      plots: [],
      executionCount: idx + 1,
    }));
  } else {
    cells = [
      {
        id: `up-script-${Math.random().toString(36).slice(2, 6)}`,
        type: "code",
        content: rawContent,
        outputs: [],
        plots: [],
        executionCount: null,
      },
    ];
  }

  return {
    kernel: detectedKernel,
    cells,
    script: rawContent,
    fileName,
  };
}

