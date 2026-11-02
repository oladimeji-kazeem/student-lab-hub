import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell, Button, Card, Badge } from "@/components/ui-kit";
import { useCurrentUser } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  INITIAL_RESOURCES,
  parseCloudStorageUrl,
  hasManualAccess,
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
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const isStudent = user?.accountType === "student";
  const [studentViewMode, setStudentViewMode] = useState<"assigned" | "all">(
    isStudent ? "assigned" : "all"
  );

  // Helper Tool State
  const [customLinkInput, setCustomLinkInput] = useState("");
  const [parsedCustomLink, setParsedCustomLink] = useState<ReturnType<typeof parseCloudStorageUrl> | null>(null);

  // New Resource Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<ResourceCategory>("Lab Manuals");
  const [newProvider, setNewProvider] = useState<CloudProvider>("Google Drive");
  const [newUrl, setNewUrl] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newApplicableCourses, setNewApplicableCourses] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const isLecturerOrAdmin = user?.accountType === "lecturer" || user?.role === "admin";

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error("Please provide both a title and a Google Drive/OneDrive share link.");
      return;
    }

    const parsed = parseCloudStorageUrl(newUrl);
    const parsedCourses = newApplicableCourses
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const newRes: LibraryResource = {
      id: `res-user-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      provider: parsed.provider,
      fileType: newCategory === "Datasets" ? "CSV" : "PDF",
      fileSize: "Cloud Hosted",
      description: newDesc.trim() || "Uploaded instructional material from cloud storage.",
      course: newCourse.trim() || (parsedCourses[0] ?? "General Practice"),
      applicableCourses:
        parsedCourses.length > 0
          ? parsedCourses
          : [newCourse.trim() || "General Practice"],
      authorOrDept: user?.name || "GardiaLab Instructor",
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
    setNewApplicableCourses("");
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

  const studentAssignedCount = resources.filter((res) => hasManualAccess(user, res)).length;

  // Filtered resources
  const filteredResources = resources.filter((res) => {
    // For students in assigned mode, only show resources explicitly approved / determined by admin
    if (isStudent && studentViewMode === "assigned") {
      if (!hasManualAccess(user, res)) {
        return false;
      }
    }

    const matchesCategory =
      activeCategory === "All" || res.category === activeCategory;
    const matchesProvider =
      providerFilter === "All" || res.provider === providerFilter;
    const matchesCourse =
      courseFilter === "All" ||
      res.course.toLowerCase().includes(courseFilter.toLowerCase()) ||
      res.applicableCourses?.some((c) =>
        c.toLowerCase().includes(courseFilter.toLowerCase()),
      );
    const matchesSearch =
      !searchTerm ||
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.applicableCourses?.some((c) =>
        c.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    return matchesCategory && matchesProvider && matchesCourse && matchesSearch;
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

      {/* Student View Banner: Explicitly indicates content is determined by Admin */}
      {isStudent && (
        <div className="mb-5 rounded-2xl border border-teal/30 bg-teal/5 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🎓</span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-sans text-xs font-bold text-foreground">
                    Student Instructional Materials (Admin Determined)
                  </span>
                  {user?.matricNumber && (
                    <span className="rounded-full bg-teal/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-teal">
                      Matric: {user.matricNumber}
                    </span>
                  )}
                  {user?.approvedCourses && user.approvedCourses.length > 0 && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      Approved: {user.approvedCourses.join(", ")}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Your library content is determined and assigned by your course administrator. You can view your approved practical manuals, or browse the institution-wide catalog to request access.
                </p>
              </div>
            </div>

            <div className="flex rounded-xl border border-border bg-card p-1 text-xs font-semibold shadow-sm">
              <button
                type="button"
                onClick={() => setStudentViewMode("assigned")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition",
                  studentViewMode === "assigned"
                    ? "bg-teal text-white shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>✓</span>
                <span>My Assigned Materials ({studentAssignedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentViewMode("all")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition",
                  studentViewMode === "all"
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>🌐</span>
                <span>Browse Full Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search manuals, books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-lime"
            />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="All">All Courses</option>
              <option value="GSY303">GSY303 - Gas Technology</option>
              <option value="DSA301">DSA301 - Computing & Data Science</option>
              <option value="CSC301">CSC301 - Database & SQL</option>
              <option value="STA211">STA211 - Statistics & R</option>
              <option value="DSA402">DSA402 - Power BI & Analytics</option>
              <option value="PET301">PET301 - Petroleum Refining</option>
            </select>
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
        <>
          {filteredResources.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-border/80 my-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-2xl mb-3">
                📚
              </div>
              <h3 className="text-base font-bold text-foreground">
                {isStudent && studentViewMode === "assigned"
                  ? "No Materials Assigned by Course Administrator Yet"
                  : "No Learning Materials Found"}
              </h3>
              <p className="mx-auto mt-1.5 max-w-lg text-xs text-muted-foreground leading-relaxed">
                {isStudent && studentViewMode === "assigned"
                  ? `Your library page content is determined and assigned by your institution's course administrator based on your matriculation number (${user?.matricNumber || "Not registered"}) and enrolled courses. Once your administrator approves your access or payment, your practical manuals, textbooks, and datasets will automatically appear here.`
                  : "No materials match your active search terms or filter criteria. Try clearing the search box or switching categories."}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {isStudent && studentViewMode === "assigned" ? (
                  <>
                    <Link to="/payment">
                      <Button variant="lime" className="px-3.5 py-1.5 text-xs font-bold shadow-sm">
                        💳 Request Course Access & Manual
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="px-3.5 py-1.5 text-xs"
                      onClick={() => setStudentViewMode("all")}
                    >
                      Browse Institution Catalog ➔
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="px-3.5 py-1.5 text-xs"
                    onClick={() => {
                      setActiveCategory("All");
                      setSearchTerm("");
                      setCourseFilter("All");
                      setProviderFilter("All");
                    }}
                  >
                    Reset All Filters
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((res) => {
                const isApproved = hasManualAccess(user, res);
                const coursesList = res.applicableCourses && res.applicableCourses.length > 0
                  ? res.applicableCourses
                  : [res.course];

                return (
                  <Card
                    key={res.id}
                    className={cn(
                      "flex flex-col justify-between p-4 shadow-sm border transition-all",
                      isApproved
                        ? "border-border hover:border-teal/40"
                        : "border-warning/30 bg-card/60",
                    )}
                  >
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

                        <div className="flex items-center gap-1.5">
                          {isApproved ? (
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success flex items-center gap-1">
                              <span>✓</span> Approved
                            </span>
                          ) : (
                            <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold text-warning flex items-center gap-1">
                              <span>🔒</span> Approval Required
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {res.provider === "Google Drive" ? "🟢" : "🔵"}
                          </span>
                        </div>
                      </div>

                      <h3 className="mt-2.5 font-sans text-sm font-bold text-foreground">
                        {res.title}
                      </h3>

                      {/* Multi-Course Applicability Tags */}
                      <div className="mt-2">
                        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                          Caters for Courses:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {coursesList.map((c, i) => (
                            <span
                              key={i}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                c.includes("GSY303")
                                  ? "bg-teal/20 text-teal border border-teal/30"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-medium text-primary">{res.fileSize}</span>
                        {res.requiredTool && (
                          <>
                            <span>·</span>
                            <span className="capitalize text-teal font-medium">
                              Tool: {res.requiredTool}
                            </span>
                          </>
                        )}
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
                        {res.category === "Datasets" && (
                          <Link to="/lab/sql">
                            <Button variant="outline" className="px-2 py-1 text-xs">
                              Open in SQL 🗄️
                            </Button>
                          </Link>
                        )}

                        {isApproved ? (
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
                        ) : (
                          <Link to="/payment">
                            <Button variant="outline" className="px-2 py-1 text-xs font-bold text-teal border-teal/40 hover:bg-teal/10">
                              Subscribe / Request Access
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
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
                    Primary Course Code:
                  </label>
                  <input
                    type="text"
                    value={newCourse}
                    onChange={(e) => setNewCourse(e.target.value)}
                    placeholder="e.g. GSY303 - Gas Technology"
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Applicable Courses (Comma-separated — caters for multiple courses):
                </label>
                <input
                  type="text"
                  value={newApplicableCourses}
                  onChange={(e) => setNewApplicableCourses(e.target.value)}
                  placeholder="e.g. GSY303 - Gas Technology, PET301 - Petroleum Refining, CHE302 - Process Thermodynamics"
                  className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-lime"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  A manual can cater for more than one course. Subscribers with any of these approved courses will automatically unlock this manual.
                </p>
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

