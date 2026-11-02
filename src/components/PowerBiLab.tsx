import React, { useState } from "react";
import { toast } from "sonner";
import { AppShell, Button, Card, Badge } from "@/components/ui-kit";
import { Gate } from "@/components/CodeLab";
import {
  POWERBI_DATASETS,
  EXERCISE_BRIEFS,
  EMBEDDED_REPORTS,
  DAX_CHEAT_SHEET,
  type StarterDataset,
  type ExerciseBrief,
} from "@/lib/powerbi-data";
import { downloadFile } from "@/lib/code-export";
import { Link } from "@tanstack/react-router";

export function PowerBiLab() {
  const [activeTab, setActiveTab] = useState<
    "reports" | "datasets" | "briefs" | "dax" | "submit"
  >("reports");
  const [selectedReport, setSelectedReport] = useState(EMBEDDED_REPORTS[0].id);
  const [selectedBrief, setSelectedBrief] = useState<ExerciseBrief>(EXERCISE_BRIEFS[0]);
  const [submittedFile, setSubmittedFile] = useState<string | null>(null);
  const [submissionNotes, setSubmissionNotes] = useState("");

  const currentReport =
    EMBEDDED_REPORTS.find((r) => r.id === selectedReport) || EMBEDDED_REPORTS[0];

  const handleDownloadDataset = (dataset: StarterDataset) => {
    downloadFile(dataset.filename, dataset.csvContent);
    toast.success(`Downloaded ${dataset.filename} (${dataset.rowCount} rows)`);
  };

  const handleDownloadAllDatasets = () => {
    POWERBI_DATASETS.forEach((d) => downloadFile(d.filename, d.csvContent));
    toast.success(`Downloaded all ${POWERBI_DATASETS.length} starter datasets`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".pbix") && !file.name.endsWith(".pdf")) {
        toast.error("Please upload a .pbix (Power BI) or .pdf file.");
        return;
      }
      setSubmittedFile(file.name);
      toast.success(`Attached ${file.name} for submission!`);
    }
  };

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedFile) {
      toast.error("Please select a .pbix or .pdf file to submit.");
      return;
    }
    toast.success(
      `Project submitted successfully! Your submission for "${selectedBrief.title}" has been recorded.`
    );
    setSubmittedFile(null);
    setSubmissionNotes("");
  };

  return (
    <AppShell title="Power BI & Data Analytics Lab">
      <Gate env="powerbi">
        {/* Top Header & Fast Navigation Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h1 className="font-sans text-base font-bold text-foreground">
                Power BI & Business Intelligence Studio
              </h1>
              <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[11px] font-bold text-lime">
                Industry Curriculum
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Build executive dashboards, master DAX measures, explore real-world datasets, and
              test interactive reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://app.powerbi.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center"
            >
              <Button variant="lime" className="px-3 py-1.5 text-xs font-bold shadow-md">
                Open Power BI Web ↗
              </Button>
            </a>

            <a
              href="https://powerbi.microsoft.com/desktop/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center"
            >
              <Button variant="outline" className="px-3 py-1.5 text-xs">
                Get Desktop App ↗
              </Button>
            </a>

            <Link to="/lab/sql">
              <Button variant="outline" className="px-3 py-1.5 text-xs">
                Query in SQL Lab 🗄️
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mb-5 flex flex-wrap gap-1.5 border-b border-border pb-3">
          {[
            { id: "reports", label: "Sample Embedded Reports", icon: "🖥️" },
            { id: "datasets", label: "Starter Datasets", icon: "📁", badge: "3 Datasets" },
            { id: "briefs", label: "Exercise Briefs & Projects", icon: "📋", badge: "3 Projects" },
            { id: "dax", label: "DAX Cheat Sheet & Modeling", icon: "📐" },
            { id: "submit", label: "Submit Project (.pbix)", icon: "📤" },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: SAMPLE EMBEDDED REPORTS */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Report Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Select Demo Dashboard:
                </span>
                {EMBEDDED_REPORTS.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedReport(rep.id)}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                      selectedReport === rep.id
                        ? "bg-lime text-card-foreground shadow-sm font-bold"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {rep.title}
                  </button>
                ))}
              </div>

              <div className="text-xs text-muted-foreground">
                Category:{" "}
                <span className="font-semibold text-primary">{currentReport.category}</span>
              </div>
            </div>

            {/* Embedded Iframe Container */}
            <Card className="p-0 overflow-hidden shadow-card border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-lime animate-pulse" />
                  <span className="font-semibold text-foreground">{currentReport.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    · Live Interactive Cross-filtering Enabled
                  </span>
                </div>
                <a
                  href={currentReport.embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-lime hover:underline font-semibold"
                >
                  Open Fullscreen ↗
                </a>
              </div>

              <div className="relative w-full aspect-[16/9] min-h-[500px] bg-background">
                <iframe
                  title={currentReport.title}
                  src={currentReport.embedUrl}
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              </div>

              <div className="border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                <span>{currentReport.description}</span>
                <span className="text-[11px] text-primary/80">
                  Tip: Click on any chart segment, bar, or slicer above to cross-filter the visual cards.
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: STARTER DATASETS */}
        {activeTab === "datasets" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Curated Starter Datasets for Power BI
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ready-to-use CSV files structured for Star Schema modeling, Power Query transformations, and DAX calculations.
                </p>
              </div>
              <Button
                variant="lime"
                className="px-3 py-1.5 text-xs font-bold"
                onClick={handleDownloadAllDatasets}
              >
                📥 Download All Datasets (.zip/.csv)
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {POWERBI_DATASETS.map((ds) => (
                <Card key={ds.id} className="flex flex-col justify-between p-4 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {ds.badge}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {ds.fileSize}
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-sans text-sm font-bold text-foreground">
                      {ds.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {ds.description}
                    </p>

                    <div className="mt-3 border-t border-border pt-2 text-[11px]">
                      <span className="font-semibold text-foreground">Columns:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ds.columns.slice(0, 6).map((c) => (
                          <span
                            key={c}
                            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                          >
                            {c}
                          </span>
                        ))}
                        {ds.columns.length > 6 && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            +{ds.columns.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {ds.rowCount} Sample Rows
                    </span>
                    <Button
                      variant="outline"
                      className="px-2.5 py-1 text-xs font-semibold hover:border-lime"
                      onClick={() => handleDownloadDataset(ds)}
                    >
                      📥 Download CSV
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Power Query Workflow Instructions */}
            <Card className="p-4 bg-muted/20 border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                💡 How to Import Into Power BI:
              </h3>
              <ol className="mt-2 list-decimal list-inside space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li>
                  Click <strong>Download CSV</strong> on any dataset above.
                </li>
                <li>
                  Open <strong>Power BI Desktop</strong> or <strong>Power BI Web</strong>.
                </li>
                <li>
                  Click <strong>Get Data</strong> ➔ select <strong>Text/CSV</strong> ➔ choose your downloaded file.
                </li>
                <li>
                  In the preview window, select <strong>Transform Data</strong> to open Power Query Editor, verify data types, or select <strong>Load</strong> to start creating visuals!
                </li>
              </ol>
            </Card>
          </div>
        )}

        {/* TAB 3: EXERCISE BRIEFS & GUIDED PROJECTS */}
        {activeTab === "briefs" && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left Briefs Sidebar List */}
            <div className="space-y-3 lg:col-span-4">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Course Projects & Challenges
              </div>

              {EXERCISE_BRIEFS.map((brief) => {
                const isSelected = selectedBrief.id === brief.id;
                return (
                  <div
                    key={brief.id}
                    onClick={() => setSelectedBrief(brief)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-lime bg-lime/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          brief.difficulty === "Beginner"
                            ? "bg-success/15 text-success"
                            : brief.difficulty === "Intermediate"
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {brief.difficulty}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ⏱️ {brief.estimatedHours}
                      </span>
                    </div>

                    <h3 className="mt-2 font-sans text-xs font-bold text-foreground">
                      {brief.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <span>Dataset:</span>
                      <span className="font-mono text-primary font-medium">{brief.datasetName}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detailed Brief View */}
            <div className="space-y-4 lg:col-span-8">
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Project Specification
                    </span>
                    <h2 className="text-base font-bold text-foreground">{selectedBrief.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const ds = POWERBI_DATASETS.find((d) => d.id === selectedBrief.datasetId);
                      return ds ? (
                        <Button
                          variant="lime"
                          className="px-3 py-1 text-xs font-bold"
                          onClick={() => handleDownloadDataset(ds)}
                        >
                          📥 Download {ds.filename}
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </div>

                {/* Scenario */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    1. Business Scenario & Problem Statement
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {selectedBrief.scenario}
                  </p>
                </div>

                {/* Objectives */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    2. Learning Objectives
                  </h4>
                  <ul className="mt-1.5 list-disc list-inside space-y-1 text-xs text-muted-foreground">
                    {selectedBrief.learningObjectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                {/* Required Visualizations */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    3. Required Visuals & Page Structure
                  </h4>
                  <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {selectedBrief.requiredVisuals.map((vis, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-background/50 p-2.5 text-xs"
                      >
                        <div className="font-semibold text-foreground">{vis.title}</div>
                        <div className="text-[11px] font-mono text-lime font-medium">
                          Type: {vis.type}
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{vis.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core DAX Measures */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    4. Recommended DAX Measures to Write
                  </h4>
                  <div className="mt-2 space-y-2">
                    {selectedBrief.keyDaxMeasures.map((dax, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-background/80 p-2.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-foreground">
                          <span className="font-bold text-primary">{dax.name}</span>
                        </div>
                        <div className="mt-1 rounded bg-muted/60 p-1.5 text-[11px] text-lime">
                          {dax.formula}
                        </div>
                        <p className="mt-1 font-sans text-[11px] text-muted-foreground">
                          {dax.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables */}
                <div className="mt-4 border-t border-border pt-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    5. Project Deliverables
                  </h4>
                  <ul className="mt-1.5 list-disc list-inside space-y-1 text-xs text-muted-foreground">
                    {selectedBrief.deliverables.map((del, i) => (
                      <li key={i}>{del}</li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      className="px-3 py-1 text-xs font-bold"
                      onClick={() => setActiveTab("submit")}
                    >
                      Go to Project Submission ➔
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: DAX CHEAT SHEET & DATA MODELING */}
        {activeTab === "dax" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Power BI DAX & Data Modeling Master Guide
              </h2>
              <p className="text-xs text-muted-foreground">
                Essential Data Analysis Expressions (DAX) patterns, filter context concepts, and Star Schema design principles.
              </p>
            </div>

            {/* Star Schema Modeling Architecture Guide */}
            <Card className="p-4 bg-muted/20 border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                ⭐ Star Schema Best Practices for Power BI
              </h3>
              <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 text-xs text-muted-foreground leading-relaxed">
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="font-bold text-foreground mb-1">
                    1. Fact Tables vs. Dimension Tables
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>
                      <strong>Fact Tables:</strong> Contain numerical transactions and metrics (e.g. Sales, Quantity, Profit, TxAmount). Deep with many rows.
                    </li>
                    <li>
                      <strong>Dimension Tables:</strong> Contain descriptive attributes (e.g. Customers, Products, Date Calendar, Stores). Wide with unique keys.
                    </li>
                    <li>
                      <strong>Relationship:</strong> Always build <strong>1-to-Many (1:*)</strong> relationships from Dimensions to Facts with Single Direction filtering.
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="font-bold text-foreground mb-1">
                    2. Calculated Columns vs. DAX Measures
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>
                      <strong>Calculated Columns:</strong> Computed during data refresh row-by-row and stored in memory. Use only for slicers or categorizations.
                    </li>
                    <li>
                      <strong>Measures:</strong> Computed on the fly based on user filter context and slicer selections. Consumes almost zero RAM.
                    </li>
                    <li>
                      <strong>Golden Rule:</strong> Always prefer Measures for revenue, counts, averages, and rates.
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* DAX Cheat Sheet Cards */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {DAX_CHEAT_SHEET.map((item, idx) => (
                <Card key={idx} className="p-4 shadow-sm border border-border">
                  <div className="flex items-center justify-between border-b border-border pb-1.5">
                    <span className="font-sans text-xs font-bold text-foreground">
                      {item.name}
                    </span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {item.category}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Syntax:
                      </span>
                      <div className="mt-0.5 font-mono text-[11px] text-muted-foreground bg-muted/40 p-1 rounded">
                        {item.syntax}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Production Example:
                      </span>
                      <div className="mt-0.5 font-mono text-[11px] text-lime font-semibold bg-editor p-1.5 rounded">
                        {item.example}
                      </div>
                    </div>

                    <p className="font-sans text-[11px] text-muted-foreground pt-1">
                      {item.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SUBMIT PROJECT (.PBIX) */}
        {activeTab === "submit" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="p-6">
              <h2 className="text-base font-bold text-foreground">
                Submit Power BI Assignment / Capstone Project
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload your completed <strong>.pbix</strong> file or exported PDF report. Your work will be recorded for assessment and instructor review.
              </p>

              <form onSubmit={handleSubmitAssignment} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Select Project:
                  </label>
                  <select
                    value={selectedBrief.id}
                    onChange={(e) => {
                      const b = EXERCISE_BRIEFS.find((x) => x.id === e.target.value);
                      if (b) setSelectedBrief(b);
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                  >
                    {EXERCISE_BRIEFS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Upload Report File (.pbix or .pdf):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="pbix-upload"
                      accept=".pbix,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="pbix-upload"
                      className="cursor-pointer rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-center text-xs font-semibold text-primary hover:border-lime hover:bg-muted/50 transition-colors w-full"
                    >
                      {submittedFile ? (
                        <span className="text-success font-bold">✓ Attached: {submittedFile}</span>
                      ) : (
                        <span>📁 Click to choose .pbix or .pdf report</span>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Executive Summary / Findings (Optional):
                  </label>
                  <textarea
                    rows={4}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Provide a brief summary of the business insights, key DAX calculations used, or recommendations for leadership..."
                    className="w-full rounded-lg border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                  />
                </div>

                <Button
                  type="submit"
                  variant="lime"
                  className="w-full py-2.5 text-xs font-bold shadow-md"
                >
                  🚀 Submit Assignment for Review
                </Button>
              </form>
            </Card>
          </div>
        )}
      </Gate>
    </AppShell>
  );
}

