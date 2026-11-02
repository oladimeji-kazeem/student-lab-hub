import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell, Button, Card, Badge } from "@/components/ui-kit";
import { useCurrentUser } from "@/lib/store";
import {
  INITIAL_RESOURCES,
  parseCloudStorageUrl,
  type LibraryResource,
  type ResourceCategory,
  type CloudProvider,
} from "@/lib/resources-data";
import { Link } from "@tanstack/react-router";

const STORAGE_KEY = "elab_custom_resources_v1";

export function ResourceLibrary() {
  const user = useCurrentUser();
  const [resources, setResources] = useState<LibraryResource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...INITIAL_RESOURCES, ...parsed];
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_RESOURCES;
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState<string>("All");
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Helper Tool State
  const [customLinkInput, setCustomLinkInput] = useState("");
  const [parsedCustomLink, setParsedCustomLink] = useState<ReturnType<typeof parseCloudStorageUrl> | null>(null);

  // New Resource Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ResourceCategory>("Lab Manuals");
  const [newProvider, setNewProvider] = useState<CloudProvider>("Google Drive");
  const [newUrl, setNewUrl] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const isLecturerOrAdmin = user?.accountType === "lecturer" || user?.role === "admin";

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Please provide both a title and a Google Drive/OneDrive share link.");
      return;
    }

    const parsed = parseCloudStorageUrl(newUrl);
    const newRes: LibraryResource = {
      id: `res-user-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      provider: parsed.provider,
      fileType: newCategory === "Datasets" ? "CSV" : "PDF",
      fileSize: "Cloud Hosted",
      description: newDesc.trim() || "Uploaded instructional material from cloud storage.",
      course: newCourse.trim() || "General Practice",
      authorOrDept: user?.name || "e-Lab Instructor",
      shareUrl: newUrl.trim(),
      previewUrl: parsed.previewUrl,
      downloadUrl: parsed.downloadUrl,
      featured: true,
    };

    const updated = [newRes, ...resources];
    setResources(updated);

    // Save custom resources to localStorage
    try {
      const userCustomOnly = updated.filter((r) => r.id.startsWith("res-user-"));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userCustomOnly));
    } catch (e) {
      // ignore
    }

    toast.success(`Added resource: "${newTitle}"`);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewUrl("");
    setNewCourse("");
    setNewDesc("");
  };

  const handleParseCustomLink = () => {
    if (!customLinkInput.trim()) {
      toast.error("Please paste a Google Drive or OneDrive link first.");
      return;
    }
    const result = parseCloudStorageUrl(customLinkInput.trim());
    setParsedCustomLink(result);
    toast.success(`Successfully analyzed ${result.provider} link!`);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  // Filtered resources
  const filteredResources = resources.filter((res) => {
    const matchesCategory =
      activeCategory === "All" || res.category === activeCategory;
    const matchesProvider =
      providerFilter === "All" || res.provider === providerFilter;
    const matchesSearch =
      !searchTerm ||
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.course.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesProvider && matchesSearch;
  });

  return (
    <AppShell title="Resource Library & Lab Manuals">
      {/* Header Banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h1 className="font-sans text-base font-bold text-foreground">
              Academic Library & Cloud Materials
            </h1>
            <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[11px] font-bold text-teal">
              Google Drive & OneDrive Connected
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Access course textbooks, practical lab manuals, and class datasets directly from cloud
            storage, or connect your own files into Python, R, and SQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isLecturerOrAdmin && (
            <Button
              variant="lime"
              className="px-3 py-1.5 text-xs font-bold shadow-md"
              onClick={() => setIsAddModalOpen(true)}
            >
              + Add Drive / OneDrive Material
            </Button>
          )}

          <button
            onClick={() => setActiveCategory("CloudHelper")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-lime"
          >
            <span>🔗</span>
            <span>Link Converter Tool</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "All", label: "All Materials", icon: "📑" },
            { id: "Lab Manuals", label: "Lab Manuals", icon: "🔬" },
            { id: "Textbooks", label: "Course Textbooks", icon: "📖" },
            { id: "Datasets", label: "Class Datasets", icon: "🗄️" },
            { id: "CloudHelper", label: "Cloud Link Helper & Code", icon: "⚡" },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {activeCategory !== "CloudHelper" && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search manuals, books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
            />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="All">All Providers</option>
              <option value="Google Drive">Google Drive</option>
              <option value="OneDrive">OneDrive</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: REGULAR CATALOG VIEW */}
      {activeCategory !== "CloudHelper" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((res) => (
            <Card key={res.id} className="flex flex-col justify-between p-4 shadow-sm border border-border">
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      res.category === "Lab Manuals"
                        ? "bg-teal/15 text-teal"
                        : res.category === "Textbooks"
                        ? "bg-primary/15 text-primary"
                        : "bg-warning/20 text-warning"
                    }`}
                  >
                    {res.category}
                  </span>

                  <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    {res.provider === "Google Drive" ? "🟢 Google Drive" : "🔵 OneDrive"}
                  </span>
                </div>

                <h3 className="mt-2.5 font-sans text-sm font-bold text-foreground">
                  {res.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="font-medium text-primary">{res.course}</span>
                  <span>·</span>
                  <span>{res.fileSize}</span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {res.description}
                </p>

                <div className="mt-3 text-[11px] text-muted-foreground/80">
                  By: <span className="font-semibold text-foreground">{res.authorOrDept}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 border-t border-border pt-3 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="outline"
                  className="px-2.5 py-1 text-xs font-semibold hover:border-lime"
                  onClick={() => setPreviewResource(res)}
                >
                  👁️ Read / Preview
                </Button>

                <div className="flex items-center gap-1.5">
                  {res.category === "Datasets" ? (
                    <Link to="/lab/sql">
                      <Button variant="outline" className="px-2 py-1 text-xs">
                        Open in SQL 🗄️
                      </Button>
                    </Link>
                  ) : null}

                  <a
                    href={res.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center"
                  >
                    <Button variant="lime" className="px-2.5 py-1 text-xs font-bold">
                      📥 Download
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW 2: CLOUD LINK HELPER & STUDENT CODE GENERATOR */}
      {activeCategory === "CloudHelper" && (
        <div className="max-w-3xl mx-auto space-y-5">
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-base font-bold text-foreground">
                Google Drive & OneDrive Code Link Generator
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Have your own dataset, manual, or textbook hosted on your Google Drive or Microsoft OneDrive? Paste the share link below to generate direct download links, preview frames, and ready-to-run <strong>Python</strong> and <strong>R</strong> code.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Paste Share Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customLinkInput}
                    onChange={(e) => setCustomLinkInput(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... or https://1drv.ms/..."
                    className="flex-1 rounded-lg border border-border bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime font-mono"
                  />
                  <Button
                    variant="lime"
                    className="px-4 text-xs font-bold"
                    onClick={handleParseCustomLink}
                  >
                    Generate Links ➔
                  </Button>
                </div>
              </div>

              {/* Quick instructions */}
              <div className="rounded-xl bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
                <div className="font-bold text-foreground">💡 How to get a shareable link:</div>
                <div>
                  • <strong>Google Drive:</strong> Right-click file ➔ Click <em>Share</em> ➔ Change general access to <em>"Anyone with the link can view"</em> ➔ Click <em>Copy link</em>.
                </div>
                <div>
                  • <strong>OneDrive:</strong> Right-click file ➔ Click <em>Share</em> ➔ Ensure <em>"Anyone with link can view"</em> is selected ➔ Click <em>Copy link</em>.
                </div>
              </div>
            </div>

            {/* Generated Outputs */}
            {parsedCustomLink && (
              <div className="mt-6 space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                      ✓ {parsedCustomLink.provider} Detected
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={parsedCustomLink.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="outline" className="px-2.5 py-1 text-xs">
                        📥 Test Download Link
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Direct Download URL */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <span>Direct Download URL:</span>
                    <button
                      onClick={() => handleCopyText(parsedCustomLink.downloadUrl, "Direct URL")}
                      className="text-lime hover:underline"
                    >
                      Copy URL
                    </button>
                  </div>
                  <div className="rounded-lg bg-background p-2 font-mono text-xs text-foreground border border-border break-all">
                    {parsedCustomLink.downloadUrl}
                  </div>
                </div>

                {/* Python Snippet */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <span>🐍 Python Pandas Code (Paste into Python Lab or Notebook):</span>
                    <button
                      onClick={() => handleCopyText(parsedCustomLink.pythonSnippet, "Python code")}
                      className="text-lime hover:underline"
                    >
                      Copy Code
                    </button>
                  </div>
                  <pre className="rounded-lg bg-editor p-3 font-mono text-xs text-editor-foreground overflow-x-auto">
                    {parsedCustomLink.pythonSnippet}
                  </pre>
                </div>

                {/* R Snippet */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <span>📊 R Statistical Code (Paste into R Lab):</span>
                    <button
                      onClick={() => handleCopyText(parsedCustomLink.rSnippet, "R code")}
                      className="text-lime hover:underline"
                    >
                      Copy Code
                    </button>
                  </div>
                  <pre className="rounded-lg bg-editor p-3 font-mono text-xs text-editor-foreground overflow-x-auto">
                    {parsedCustomLink.rSnippet}
                  </pre>
                </div>

                {/* Embedded Document Preview */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Live Document / Dataset Embed Preview:
                  </div>
                  <div className="h-[300px] w-full rounded-lg border border-border overflow-hidden bg-background">
                    <iframe
                      src={parsedCustomLink.previewUrl}
                      title="Cloud file preview"
                      className="h-full w-full border-0"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL 1: IN-APP PDF / DOCUMENT READER */}
      {previewResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
              <div>
                <h3 className="font-sans text-sm font-bold text-foreground">
                  {previewResource.title}
                </h3>
                <div className="text-[11px] text-muted-foreground">
                  {previewResource.category} · {previewResource.provider} · {previewResource.course}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewResource.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" className="px-2.5 py-1 text-xs">
                    Open Fullscreen ↗
                  </Button>
                </a>

                <a
                  href={previewResource.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button variant="lime" className="px-2.5 py-1 text-xs font-bold">
                    📥 Download
                  </Button>
                </a>

                <button
                  onClick={() => setPreviewResource(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-background">
              <iframe
                src={previewResource.previewUrl}
                title={previewResource.title}
                className="h-full w-full border-0"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW MATERIAL (FOR INSTRUCTORS / ADMINS) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                Add Drive or OneDrive Learning Material
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddResource} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Title / Book Name:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Econometrics & Time Series Analysis Lab Guide"
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Category:
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                  >
                    <option value="Lab Manuals">Lab Manuals</option>
                    <option value="Textbooks">Course Textbooks</option>
                    <option value="Datasets">Class Datasets</option>
                    <option value="Lecture Notes">Lecture Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Course / Subject Code:
                  </label>
                  <input
                    type="text"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    placeholder="e.g. STA312 / Analytics"
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Google Drive or OneDrive Share URL:
                </label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... or OneDrive link"
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Description / Topics Covered:
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summary of chapters, dataset schema, or practical lab instructions..."
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="lime"
                  className="px-4 py-1.5 text-xs font-bold shadow-md"
                >
                  Publish Material to Library ➔
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

