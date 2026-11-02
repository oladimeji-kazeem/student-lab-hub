import React, { useState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { AppShell, Button, Card } from "@/components/ui-kit";
import { Gate } from "@/components/CodeLab";
import { CodeEditor } from "@/components/CodeEditor";
import {
  loadSqlJs,
  SqlDatabaseSession,
  SQL_DATASETS,
  SQL_TEMPLATES,
  type TableSchema,
  type QueryResult,
} from "@/lib/sql-engine";
import { downloadFile } from "@/lib/code-export";
import { CloudDriveImportModal } from "@/components/CloudDriveImportModal";

export function SqlLab() {
  const [engineReady, setEngineReady] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string>("Initializing SQL WebAssembly...");
  const [session, setSession] = useState<SqlDatabaseSession | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<string>("northwind");
  const [query, setQuery] = useState<string>(SQL_DATASETS[0].starterQuery);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [expandedTable, setExpandedTable] = useState<string | null>("Products");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [isPending, startTransition] = useTransition();
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize sql.js WebAssembly
  useEffect(() => {
    let mounted = true;
    loadSqlJs((stage) => {
      if (mounted) setLoadingStage(stage);
    })
      .then((SQL) => {
        if (!mounted) return;
        const s = new SqlDatabaseSession(SQL);
        setSession(s);
        setSchema(s.getSchema());
        setEngineReady(true);
        // Execute initial starter query
        try {
          const res = s.execute(SQL_DATASETS[0].starterQuery);
          setResult(res);
        } catch (e: any) {
          console.error(e);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setLoadingStage(`Error loading SQL engine: ${err.message}`);
        toast.error("Failed to load SQL engine from CDN. Check internet connection.");
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Switch Dataset
  const handleDatasetChange = (datasetId: string) => {
    if (!session) return;
    const ds = SQL_DATASETS.find((d) => d.id === datasetId);
    if (!ds) return;

    setSelectedDataset(datasetId);
    session.initDatabase(datasetId);
    setSchema(session.getSchema());
    setQuery(ds.starterQuery);
    setQueryError(null);
    setCurrentPage(1);

    try {
      const res = session.execute(ds.starterQuery);
      setResult(res);
      toast.success(`Loaded database: ${ds.name}`);
    } catch (e: any) {
      setQueryError(e.message);
    }
  };

  // Run Query
  const handleRunQuery = () => {
    if (!session) return;
    if (!query.trim()) {
      toast.error("Please enter a SQL query to execute.");
      return;
    }

    setQueryError(null);
    startTransition(() => {
      try {
        const res = session.execute(query);
        setResult(res);
        // Re-read schema in case query was a DDL/DML like CREATE TABLE, DROP TABLE, or INSERT
        setSchema(session.getSchema());
        setCurrentPage(1);
        toast.success(`Executed in ${res.executionTimeMs} ms (${res.values.length} rows)`);
      } catch (err: any) {
        setQueryError(err.message);
        toast.error("SQL Execution Error");
      }
    });
  };

  // Preview 10 rows of a table
  const handlePreviewTable = (tableName: string) => {
    const previewQuery = `SELECT * FROM "${tableName}" LIMIT 10;`;
    setQuery(previewQuery);
    if (!session) return;

    try {
      setQueryError(null);
      const res = session.execute(previewQuery);
      setResult(res);
      setCurrentPage(1);
    } catch (e: any) {
      setQueryError(e.message);
    }
  };

  // Reset current database
  const handleResetDatabase = () => {
    if (!session) return;
    session.initDatabase(selectedDataset);
    setSchema(session.getSchema());
    const ds = SQL_DATASETS.find((d) => d.id === selectedDataset);
    if (ds) {
      setQuery(ds.starterQuery);
      const res = session.execute(ds.starterQuery);
      setResult(res);
    }
    setQueryError(null);
    toast.success("Database restored to original state.");
  };

  // Export Results as CSV
  const handleExportCsv = () => {
    if (!result || result.values.length === 0) {
      toast.error("No results to export.");
      return;
    }

    const headers = result.columns.map((c) => `"${c.replace(/"/g, '""')}"`).join(",");
    const rows = result.values.map((row) =>
      row.map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csv = [headers, ...rows].join("\n");
    downloadFile(`query_result_${Date.now()}.csv`, csv);
    toast.success("Exported query results as CSV");
  };

  // Export Query Script (.sql)
  const handleExportSql = () => {
    downloadFile(`query_${selectedDataset}_${Date.now()}.sql`, query);
    toast.success("Saved query script (.sql)");
  };

  // Download entire SQLite Database (.sqlite)
  const handleDownloadDatabaseFile = () => {
    if (!session) return;
    try {
      const binary = session.exportDatabaseFile();
      const blob = new Blob([binary], { type: "application/x-sqlite3" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedDataset}_database.sqlite`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded SQLite database file");
    } catch (e: any) {
      toast.error(`Failed to export database: ${e.message}`);
    }
  };

  // Import custom CSV
  const handleUploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    try {
      const text = await file.text();
      const rawName = file.name.replace(/\.[^/.]+$/, "");
      const { rowsImported } = session.importCsv(rawName, text);
      setSchema(session.getSchema());
      const previewSql = `SELECT * FROM "${rawName.replace(/[^a-zA-Z0-9_]/g, "_")}" LIMIT 15;`;
      setQuery(previewSql);
      const res = session.execute(previewSql);
      setResult(res);
      toast.success(`Imported table "${rawName}" (${rowsImported} rows)`);
    } catch (err: any) {
      toast.error(`CSV Import error: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Pagination for Results
  const filteredRows = result
    ? result.values.filter((row) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return row.some((col) => String(col ?? "").toLowerCase().includes(q));
      })
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <AppShell title="SQL Server & Database Lab">
      <Gate env="sql">
        {/* Top Control Bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Database:
              </span>
              <select
                value={selectedDataset}
                onChange={(e) => handleDatasetChange(e.target.value)}
                className="mt-0.5 rounded-lg border border-border bg-background px-3 py-1.5 font-sans text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
              >
                {SQL_DATASETS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.badge})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Practice Template:
              </span>
              <select
                onChange={(e) => {
                  const t = SQL_TEMPLATES.find((x) => x.name === e.target.value);
                  if (t) {
                    setQuery(t.query);
                    toast.info(`Loaded query: ${t.name}`);
                  }
                }}
                defaultValue=""
                className="mt-0.5 rounded-lg border border-border bg-background px-3 py-1.5 font-sans text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
              >
                <option value="" disabled>
                  💡 Select Practice Topic...
                </option>
                {SQL_TEMPLATES.map((t) => (
                  <option key={t.name} value={t.name}>
                    [{t.category}] {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleUploadCsv}
            />
            <Button
              variant="outline"
              className="px-2.5 py-1 text-xs"
              onClick={() => fileInputRef.current?.click()}
              title="Upload your own CSV file as a SQL table"
            >
              📥 Import CSV Table
            </Button>

            <Button
              variant="outline"
              className="px-2.5 py-1 text-xs border-teal/60 bg-teal/10 text-teal font-semibold hover:bg-teal/20"
              onClick={() => setCloudModalOpen(true)}
              title="Import dataset directly from Google Drive or OneDrive link"
            >
              ☁️ Cloud Drive Import
            </Button>

            <Button
              variant="outline"
              className="px-2.5 py-1 text-xs"
              onClick={handleExportCsv}
              title="Export query results as CSV"
            >
              📄 Export CSV
            </Button>

            <Button
              variant="outline"
              className="px-2.5 py-1 text-xs"
              onClick={handleExportSql}
              title="Save SQL script"
            >
              💾 .sql
            </Button>

            <Button
              variant="outline"
              className="px-2.5 py-1 text-xs"
              onClick={handleDownloadDatabaseFile}
              title="Download entire database file (.sqlite)"
            >
              🗄️ .db
            </Button>

            <Button
              variant="outline"
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleResetDatabase}
              title="Restore sample database tables"
            >
              ↺ Reset DB
            </Button>

            <Button
              variant="lime"
              className="px-4 py-1.5 text-xs font-bold shadow-md"
              onClick={handleRunQuery}
              disabled={!engineReady || isPending}
            >
              {isPending ? "Executing..." : "⚡ Run Query (Ctrl+Enter)"}
            </Button>
          </div>
        </div>

        {/* Loading Banner if WebAssembly initializing */}
        {!engineReady && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-teal/30 bg-teal/10 p-3 text-xs text-teal">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            <span>{loadingStage}</span>
          </div>
        )}

        {/* Main Grid: Left Schema & Reference Sidebar (3 cols), Right Query & Grid (9 cols) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left Panel: Schema Explorer & T-SQL Cheat Sheet */}
          <div className="space-y-4 lg:col-span-4">
            {/* Schema Explorer Card */}
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  <span>🗂️ Database Schema</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                    {schema.length} Tables
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">Click to inspect</span>
              </div>

              <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                {schema.map((tbl) => {
                  const isOpen = expandedTable === tbl.name;
                  return (
                    <div
                      key={tbl.name}
                      className="rounded-lg border border-border/80 bg-background/50 p-2 text-xs transition-colors hover:border-lime/50"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedTable(isOpen ? null : tbl.name)}
                          className="flex items-center gap-1.5 font-mono font-semibold text-foreground hover:text-lime text-left"
                        >
                          <span className="text-[10px] text-muted-foreground">
                            {isOpen ? "▼" : "▶"}
                          </span>
                          <span>{tbl.name}</span>
                          <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground">
                            {tbl.rowCount} rows
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePreviewTable(tbl.name)}
                          className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-lime hover:text-card-foreground"
                          title="Preview first 10 rows"
                        >
                          Preview
                        </button>
                      </div>

                      {isOpen && (
                        <div className="mt-2 pl-3 border-l-2 border-lime/30 space-y-1 pt-1 font-mono text-[11px]">
                          {tbl.columns.map((c) => (
                            <div key={c.cid} className="flex items-center justify-between py-0.5">
                              <span className="flex items-center gap-1 text-foreground">
                                {c.pk ? "🔑" : "▫"} {c.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase">
                                {c.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* SQL Server & T-SQL Guide */}
            <Card className="p-4 text-xs">
              <div className="mb-2 flex items-center justify-between border-b border-border pb-1.5 font-bold uppercase tracking-wider text-muted-foreground">
                <span>📘 T-SQL & SQL Server Reference</span>
              </div>
              <div className="space-y-2 text-muted-foreground leading-relaxed">
                <div>
                  <span className="font-semibold text-foreground">Row Limiting:</span>
                  <div className="font-mono text-[11px] text-primary">
                    T-SQL: SELECT TOP 10 * FROM Table
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    ANSI: SELECT * FROM Table LIMIT 10
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Null Handling:</span>
                  <div className="font-mono text-[11px] text-primary">
                    ISNULL(col, default) or COALESCE(col, default)
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-foreground">String Concatenation:</span>
                  <div className="font-mono text-[11px] text-primary">
                    FirstName || ' ' || LastName
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Window Ranking:</span>
                  <div className="font-mono text-[11px] text-primary">
                    RANK() OVER (PARTITION BY Dept ORDER BY Salary DESC)
                  </div>
                </div>

                <div className="rounded-lg bg-lime/10 p-2 text-[11px] text-lime-dark dark:text-lime">
                  💡 <strong>Tip for Students:</strong> e-Lab automatically recognizes both
                  standard ANSI SQL and SQL Server T-SQL syntax.
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel: SQL Code Editor & Query Output Table */}
          <div className="space-y-4 lg:col-span-8">
            {/* Query Editor Box */}
            <Card className="p-0 overflow-hidden border border-border shadow-md">
              <div className="flex items-center justify-between bg-editor-panel px-4 py-2 border-b border-border/40">
                <div className="flex items-center gap-2 font-mono text-xs text-editor-foreground">
                  <span className="h-2 w-2 rounded-full bg-lime" />
                  <span>query.sql · Microsoft T-SQL / ANSI</span>
                </div>
                <div className="text-[11px] text-editor-foreground/70">
                  Press <kbd className="rounded bg-muted/30 px-1 py-0.5 text-[10px]">Ctrl+Enter</kbd> to run
                </div>
              </div>

              <div className="min-h-[180px]">
                <CodeEditor
                  value={query}
                  onChange={setQuery}
                  language="sql"
                  onRun={handleRunQuery}
                  minHeight="180px"
                  height="220px"
                />
              </div>
            </Card>

            {/* Error Message if Query Failed */}
            {queryError && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <span>⚠️ SQL Error:</span>
                </div>
                <div className="font-mono">{queryError}</div>
              </div>
            )}

            {/* Results Grid Card */}
            {result && !queryError && (
              <Card className="p-4 shadow-sm">
                {/* Result Metadata Header */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                      ✓ {result.values.length} rows
                    </span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      ⚡ {result.executionTimeMs} ms
                    </span>
                  </div>

                  {/* Search inside results */}
                  {result.values.length > 5 && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search results..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
                      />
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                      >
                        <option value={10}>10 / page</option>
                        <option value={15}>15 / page</option>
                        <option value={30}>30 / page</option>
                        <option value={50}>50 / page</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Table Data Render */}
                <div className="overflow-x-auto rounded-lg border border-border bg-background/40">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="border-b border-border bg-muted/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 w-10 text-center text-muted-foreground/60">#</th>
                        {result.columns.map((col, idx) => (
                          <th key={idx} className="px-3 py-2 font-semibold text-foreground">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={result.columns.length + 1}
                            className="px-3 py-6 text-center text-muted-foreground"
                          >
                            No matching records found.
                          </td>
                        </tr>
                      ) : (
                        paginatedRows.map((row, rIdx) => {
                          const rowNum = (currentPage - 1) * rowsPerPage + rIdx + 1;
                          return (
                            <tr
                              key={rIdx}
                              className="transition-colors hover:bg-muted/40 font-mono text-[12px]"
                            >
                              <td className="px-3 py-1.5 text-center text-[10px] text-muted-foreground/60 select-none">
                                {rowNum}
                              </td>
                              {row.map((cell: any, cIdx: number) => (
                                <td
                                  key={cIdx}
                                  className={`px-3 py-1.5 truncate max-w-[240px] ${
                                    cell === null
                                      ? "text-muted-foreground/50 italic"
                                      : typeof cell === "number"
                                      ? "text-blue-500 font-semibold"
                                      : "text-foreground"
                                  }`}
                                  title={cell !== null ? String(cell) : "NULL"}
                                >
                                  {cell === null ? "NULL" : String(cell)}
                                </td>
                              ))}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Page {currentPage} of {totalPages} ({filteredRows.length} total rows)
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        className="px-2.5 py-0.5 text-xs"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2.5 py-0.5 text-xs"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Cloud Drive Import Modal */}
        <CloudDriveImportModal
          isOpen={cloudModalOpen}
          onClose={() => setCloudModalOpen(false)}
          env="sql"
          onInsertCode={(newCode) => {
            setQuery((prev) => (prev.trim() ? `${prev}\n${newCode}` : newCode));
          }}
          onImportSqlTable={(tableName, csvContent) => {
            if (!session) return;
            try {
              const { rowsImported } = session.importCsv(tableName, csvContent);
              setSchema(session.getSchema());
              const previewSql = `SELECT * FROM "${tableName.replace(/[^a-zA-Z0-9_]/g, "_")}" LIMIT 15;`;
              setQuery(previewSql);
              const res = session.execute(previewSql);
              setResult(res);
              toast.success(`Imported cloud table "${tableName}" (${rowsImported} rows)`);
            } catch (err: any) {
              toast.error(`SQL import failed: ${err.message}`);
            }
          }}
        />
      </Gate>
    </AppShell>
  );
}

