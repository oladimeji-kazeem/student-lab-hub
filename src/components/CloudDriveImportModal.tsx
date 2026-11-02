import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui-kit";
import { parseCloudStorageUrl } from "@/lib/resources-data";
import { POWERBI_DATASETS } from "@/lib/powerbi-data";

export interface CloudDriveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  env: "python" | "r" | "sql";
  onInsertCode?: (code: string) => void;
  onMountFile?: (fileName: string, content: string) => Promise<void> | void;
  onImportSqlTable?: (tableName: string, csvContent: string) => void;
}

export function CloudDriveImportModal({
  isOpen,
  onClose,
  env,
  onInsertCode,
  onMountFile,
  onImportSqlTable,
}: CloudDriveImportModalProps) {
  const [shareLink, setShareLink] = useState("");
  const [datasetName, setDatasetName] = useState("cloud_dataset");
  const [isFetching, setIsFetching] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  if (!isOpen) return null;

  const parsed = shareLink.trim() ? parseCloudStorageUrl(shareLink.trim()) : null;

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const ds = POWERBI_DATASETS.find((d) => d.id === presetId);
    if (ds) {
      setDatasetName(ds.filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_"));
      setShareLink(`https://drive.google.com/file/d/sample_${ds.id}/view?usp=sharing`);
    }
  };

  // Generate Code Snippet
  const handleInsertSnippet = () => {
    if (!shareLink.trim()) {
      toast.error("Please enter a Google Drive or OneDrive link.");
      return;
    }

    const cleanUrl = parsed?.downloadUrl || shareLink.trim();
    const cleanVar = datasetName.replace(/[^a-zA-Z0-9_]/g, "_") || "df";

    let code = "";
    if (env === "python") {
      code = `\n# --- Cloud Dataset: ${datasetName} (${parsed?.provider || "Cloud Storage"}) ---
import pandas as pd

# Direct cloud stream URL
dataset_url = "${cleanUrl}"

try:
    ${cleanVar} = pd.read_csv(dataset_url)
    print("✓ Successfully loaded '${datasetName}' from ${parsed?.provider || "Cloud"}!")
    print(f"Shape: {${cleanVar}.shape[0]} rows, {${cleanVar}.shape[1]} columns")
    print(${cleanVar}.head(3))
except Exception as err:
    print(f"Loading notice: {err}")
    print("If your link requires direct browser fetch, ensure access is 'Anyone with link'.")
`;
    } else if (env === "r") {
      code = `\n# --- Cloud Dataset: ${datasetName} (${parsed?.provider || "Cloud Storage"}) ---
dataset_url <- "${cleanUrl}"

${cleanVar} <- read.csv(dataset_url)
cat("✓ Successfully loaded '${datasetName}' from ${parsed?.provider || "Cloud"}!\\n")
cat("Dimensions:", dim(${cleanVar}), "\\n")
head(${cleanVar}, 3)
`;
    } else if (env === "sql") {
      code = `-- To query cloud dataset in SQL, click 'Fetch & Load as SQL Table' below.
-- Table: ${cleanVar}
SELECT * FROM "${cleanVar}" LIMIT 10;
`;
    }

    onInsertCode?.(code);
    toast.success("Inserted cloud dataset code into editor!");
    onClose();
  };

  // Fetch CSV and load directly into Virtual FS or SQL Database
  const handleFetchAndMount = async () => {
    if (!shareLink.trim()) {
      toast.error("Please enter a Google Drive or OneDrive link.");
      return;
    }

    setIsFetching(true);
    const cleanTable = datasetName.replace(/[^a-zA-Z0-9_]/g, "_") || "cloud_data";
    const fileName = `${cleanTable}.csv`;

    try {
      // Check if it's one of the built-in preset datasets
      const preset = POWERBI_DATASETS.find((d) => d.id === selectedPreset);
      let csvContent = "";

      if (preset && preset.csvContent) {
        csvContent = preset.csvContent;
      } else {
        const downloadUrl = parsed?.downloadUrl || shareLink.trim();
        // Attempt browser fetch
        try {
          const res = await fetch(downloadUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          csvContent = await res.text();
        } catch (fetchErr: any) {
          // If direct fetch hit CORS on Google Drive, fallback to code insertion with clear toast
          toast.info("Direct cloud download URL generated. Inserting streaming code into editor!");
          handleInsertSnippet();
          setIsFetching(false);
          return;
        }
      }

      if (env === "sql") {
        if (!onImportSqlTable) throw new Error("SQL table importer not attached");
        onImportSqlTable(cleanTable, csvContent);
        toast.success(`Created SQL table "${cleanTable}" from cloud link!`);
      } else {
        if (onMountFile) {
          await onMountFile(fileName, csvContent);
          toast.success(`Mounted "${fileName}" in ${env.toUpperCase()} workspace!`);
        }
        if (onInsertCode) {
          const codeSnippet =
            env === "python"
              ? `\n# --- Mounted Cloud File: ${fileName} ---
import pandas as pd
df = pd.read_csv("${fileName}")
print("✓ Loaded ${fileName}:", df.shape)
print(df.head(3))\n`
              : `\n# --- Mounted Cloud File: ${fileName} ---
df <- read.csv("${fileName}")
cat("✓ Loaded ${fileName}:\\n")
head(df, 3)\n`;
          onInsertCode(codeSnippet);
        }
      }
      onClose();
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">☁️</span>
            <div>
              <h3 className="font-sans text-sm font-bold text-foreground">
                Import from Google Drive / OneDrive
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Target Environment: <strong className="uppercase text-primary">{env}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Quick Select Preset Dataset:
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
            >
              <option value="">-- Choose from e-Lab Class Datasets (Optional) --</option>
              {POWERBI_DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.badge})
                </option>
              ))}
            </select>
          </div>

          {/* Share Link Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Google Drive or OneDrive Share Link:
            </label>
            <input
              type="url"
              value={shareLink}
              onChange={(e) => {
                setShareLink(e.target.value);
                if (selectedPreset) setSelectedPreset("");
              }}
              placeholder="https://drive.google.com/file/d/... or OneDrive link"
              className="w-full rounded-lg border border-border bg-background p-2.5 font-mono text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
            />
            {parsed && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-success">
                <span>✓</span>
                <span>Detected <strong>{parsed.provider}</strong> link</span>
              </div>
            )}
          </div>

          {/* Table / Variable Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              {env === "sql" ? "Target SQL Table Name:" : "Variable / Local File Name:"}
            </label>
            <input
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder={env === "sql" ? "e.g. sales_transactions" : "e.g. df or my_data"}
              className="w-full rounded-lg border border-border bg-background p-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
            />
          </div>

          {/* Cloud Share Notice */}
          <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1">
            <div className="font-bold text-foreground">💡 Link Permission Reminder:</div>
            <div>
              Ensure your file sharing on Google Drive or OneDrive is set to{" "}
              <strong>"Anyone with the link can view"</strong> so e-Lab can stream or fetch the data.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={onClose}>
              Cancel
            </Button>

            {env !== "sql" && (
              <Button
                variant="outline"
                className="px-3 py-1.5 text-xs font-semibold hover:border-lime"
                onClick={handleInsertSnippet}
              >
                📝 Insert Code Snippet
              </Button>
            )}

            <Button
              variant="lime"
              className="px-4 py-1.5 text-xs font-bold shadow-md"
              disabled={isFetching || !shareLink.trim()}
              onClick={handleFetchAndMount}
            >
              {isFetching ? (
                "Connecting..."
              ) : env === "sql" ? (
                "⚡ Load as SQL Table"
              ) : (
                "⚡ Fetch & Mount in Workspace"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
