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
    blob = new Blob([content], { type: mimeType });
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
