import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Button } from "@/components/ui-kit";
import { Gate } from "@/components/CodeLab";
import { downloadFile, downloadAsIpynb, downloadRWorkspace } from "@/lib/code-export";

export const Route = createFileRoute("/lab/vscode")({
  head: () => ({
    meta: [
      { title: "VS Code Online — e-Lab" },
      { name: "description", content: "Open a VS Code workspace in your browser." },
      { property: "og:title", content: "VS Code Online — e-Lab" },
      { property: "og:description", content: "A full code editor without installing anything." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VSCode,
});

const initial: Record<string, string> = {
  "README.md":
    "# My Lab Workspace\n\nEdit files on the left, or open the full VS Code in a new tab.\n",
  "analysis.py": "import pandas as pd\n\ndf = pd.read_csv('data.csv')\nprint(df.describe())\n",
  "stats.R": "df <- read.csv('data.csv')\nsummary(df)\n",
  "data.csv": "x,y\n1,2\n2,4\n3,6\n",
};

function VSCode() {
  const [files, setFiles] = useState(initial);
  const [open, setOpen] = useState("analysis.py");
  const [newName, setNewName] = useState("");

  const currentContent = files[open] ?? "";
  const isPython = open.endsWith(".py");
  const isR = open.endsWith(".R") || open.endsWith(".r");

  const handleDownloadActive = () => {
    downloadFile(open, currentContent);
    toast.success(`Downloaded ${open}`);
  };

  const handleExportIpynb = () => {
    const kernel = isR ? "r" : "python";
    downloadAsIpynb(currentContent, kernel, open.replace(/\.[^/.]+$/, ".ipynb"));
    toast.success(`Exported notebook for ${open}`);
  };

  const handleExportRData = async (format: "rdata" | "rda") => {
    await downloadRWorkspace(format, currentContent, undefined, open.replace(/\.[^/.]+$/, ""));
    toast.success(`Exported ${open} as .${format === "rdata" ? "RData" : "rda"}`);
  };

  return (
    <AppShell title="VS Code Online">
      <Gate env="vscode">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl glass p-3 shadow-card">
          <p className="text-sm text-muted-foreground">
            Lightweight workspace with file downloads — or launch the full VS Code for the Web.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">Download:</span>
            <Button variant="outline" className="py-1 px-3 text-xs" onClick={handleDownloadActive}>
              📥 {open}
            </Button>
            {(isPython || isR) && (
              <Button variant="outline" className="py-1 px-3 text-xs" onClick={handleExportIpynb}>
                📓 .ipynb
              </Button>
            )}
            {isR && (
              <>
                <Button
                  variant="outline"
                  className="py-1 px-3 text-xs"
                  onClick={() => handleExportRData("rdata")}
                >
                  💾 .RData
                </Button>
                <Button
                  variant="outline"
                  className="py-1 px-3 text-xs"
                  onClick={() => handleExportRData("rda")}
                >
                  💾 .rda
                </Button>
              </>
            )}
            <a href="https://vscode.dev" target="_blank" rel="noreferrer">
              <Button variant="lime" className="py-1 px-3 text-xs">
                Open full VS Code ↗
              </Button>
            </a>
          </div>
        </div>

        <div className="flex h-[70vh] overflow-hidden rounded-2xl bg-editor shadow-glow">
          <aside className="w-56 shrink-0 bg-editor-panel p-3 font-mono text-xs text-editor-foreground">
            <div className="mb-2 uppercase opacity-60">Explorer</div>
            {Object.keys(files).map((f) => (
              <button
                key={f}
                onClick={() => setOpen(f)}
                className={`block w-full truncate rounded px-2 py-1 text-left hover:bg-editor ${open === f ? "bg-editor text-lime" : ""}`}
              >
                {f}
              </button>
            ))}
            <form
              className="mt-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (newName && !files[newName]) {
                  setFiles({ ...files, [newName]: "" });
                  setOpen(newName);
                  setNewName("");
                }
              }}
            >
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="+ new file"
                className="w-full rounded bg-editor px-2 py-1 outline-none"
              />
            </form>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex bg-editor-panel">
              <span className="border-t-2 border-lime bg-editor px-4 py-2 font-mono text-xs text-editor-foreground">
                {open}
              </span>
            </div>
            <textarea
              spellCheck={false}
              value={files[open] ?? ""}
              onChange={(e) => setFiles({ ...files, [open]: e.target.value })}
              className="flex-1 resize-none bg-editor p-4 font-mono text-sm text-editor-foreground outline-none"
            />
            <div className="bg-teal px-4 py-1 font-mono text-xs text-primary-foreground">
              e-Lab · {open.split(".").pop()?.toUpperCase()} · UTF-8
            </div>
          </div>
        </div>
      </Gate>
    </AppShell>
  );
}
