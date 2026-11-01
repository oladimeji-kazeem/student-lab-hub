import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, Button, Input, Field } from "@/components/ui-kit";
import {
  actions,
  useStore,
  useCurrentUser,
  type LabSubmission,
} from "@/lib/store";
import { downloadFile } from "@/lib/code-export";

export function LabAssessmentModule() {
  const user = useCurrentUser();
  const assignments = useStore((s) => s.assignments);
  const submissions = useStore((s) => s.submissions);
  const departments = useStore((s) => s.departments);
  const institutions = useStore((s) => s.institutions);

  const [subTab, setSubTab] = useState<"submissions" | "assignments">("submissions");
  const [filterAssignmentId, setFilterAssignmentId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "submitted" | "graded">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Active submission being inspected/graded
  const [activeSubId, setActiveSubId] = useState<string | null>(
    submissions[0]?.id ?? null,
  );
  const activeSub: LabSubmission | null = useMemo(
    () => submissions.find((s) => s.id === activeSubId) ?? submissions[0] ?? null,
    [submissions, activeSubId],
  );

  const [gradeScore, setGradeScore] = useState<string>("");
  const [gradeFeedback, setGradeFeedback] = useState<string>("");

  // Create Assignment Form State
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [institution, setInstitution] = useState("All Institutions");
  const [department, setDepartment] = useState("Computer Science");
  const [kernel, setKernel] = useState<"python" | "r">("python");
  const [maxScore, setMaxScore] = useState("100");
  const [dueDate, setDueDate] = useState(() =>
    new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
  );
  const [instructions, setInstructions] = useState("");
  const [starterCode, setStarterCode] = useState(
    `import numpy as np\n\n# Write your solution below\n`,
  );
  const [keywordsInput, setKeywordsInput] = useState("numpy, mean");
  const [expectPlot, setExpectPlot] = useState(false);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (filterAssignmentId !== "all" && s.assignmentId !== filterAssignmentId) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q) ||
          s.assignmentTitle.toLowerCase().includes(q) ||
          (s.institution ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [submissions, filterAssignmentId, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.status === "graded").length;
    const pending = total - graded;
    const avgScore =
      total > 0
        ? Math.round(
            submissions.reduce((acc, s) => acc + (s.finalScore / (s.maxScore || 100)) * 100, 0) /
              total,
          )
        : 0;
    return { total, graded, pending, avgScore };
  }, [submissions]);

  const selectSubmissionForGrading = (sub: LabSubmission) => {
    setActiveSubId(sub.id);
    setGradeScore(String(sub.finalScore));
    setGradeFeedback(sub.feedback ?? "");
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    const scoreNum = Number(gradeScore || activeSub.finalScore);
    if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > activeSub.maxScore) {
      toast.error(`Score must be between 0 and ${activeSub.maxScore}`);
      return;
    }
    actions.gradeLabSubmission(
      activeSub.id,
      scoreNum,
      gradeFeedback,
      user?.name || "Lecturer / Admin",
    );
    toast.success(`Saved grade (${scoreNum}/${activeSub.maxScore}) for ${activeSub.studentName}`);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseCode.trim() || !instructions.trim()) {
      toast.error("Please fill in the Course Code, Title, and Instructions.");
      return;
    }
    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    actions.addAssignment({
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      institution,
      department,
      kernel,
      instructions: instructions.trim(),
      starterCode,
      expectedKeywords: keywords,
      expectPlot,
      maxScore: Math.max(10, Number(maxScore) || 100),
      dueDate,
      createdBy: user?.name || "Instructor",
    });

    toast.success(`Created lab practical: ${courseCode.toUpperCase()} — ${title}`);
    setTitle("");
    setCourseCode("");
    setInstructions("");
    setSubTab("submissions");
  };

  const handleExportCsv = () => {
    const headers = [
      "Student Name",
      "Email",
      "Institution",
      "Department",
      "Assignment",
      "Kernel",
      "Auto-Grader Score",
      "Final Score",
      "Max Score",
      "Status",
      "Graded By",
      "Submitted At",
      "Feedback",
    ];
    const rows = filteredSubmissions.map((s) => [
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.studentEmail}"`,
      `"${(s.institution || "N/A").replace(/"/g, '""')}"`,
      `"${(s.department || "N/A").replace(/"/g, '""')}"`,
      `"${s.assignmentTitle.replace(/"/g, '""')}"`,
      s.kernel.toUpperCase(),
      s.autoScore,
      s.finalScore,
      s.maxScore,
      s.status.toUpperCase(),
      `"${(s.gradedBy || "Auto-Grader").replace(/"/g, '""')}"`,
      s.submittedAt.slice(0, 10),
      `"${(s.feedback || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile("elab_student_gradebook.csv", csv, "text/csv;charset=utf-8");
    toast.success("Downloaded class gradebook as elab_student_gradebook.csv");
  };

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Active Lab Practicals
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-primary">
            {assignments.length}
          </div>
          <div className="mt-1 text-xs text-teal">
            Python & R auto-graded exercises
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Student Submissions
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-primary">
            {stats.total}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {stats.pending} awaiting lecturer review
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Graded Submissions
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-success">
            {stats.graded}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Verified with lecturer remarks
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Class Average Score
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-teal">
            {stats.avgScore}%
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Combined auto-grader & manual marks
          </div>
        </Card>
      </div>

      {/* Sub-navigation & Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("submissions")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              subTab === "submissions"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            📊 Student Submissions & Gradebook ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("assignments")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              subTab === "assignments"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            ➕ Create & Manage Lab Practicals ({assignments.length})
          </button>
        </div>

        <Button
          variant="outline"
          className="py-1.5 px-3 text-xs font-semibold border-teal/40 hover:bg-teal/10"
          onClick={handleExportCsv}
        >
          📥 Export Gradebook (.csv)
        </Button>
      </div>

      {/* TAB 1: SUBMISSIONS & INTERACTIVE GRADING INSPECTOR */}
      {subTab === "submissions" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Submissions List */}
          <div className="lg:col-span-5 space-y-3">
            <Card className="p-3.5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, email, university…"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal"
                />
                <select
                  aria-label="Filter by status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="submitted">Pending Review</option>
                  <option value="graded">Graded</option>
                </select>
              </div>

              <select
                aria-label="Filter by Lab Practical"
                value={filterAssignmentId}
                onChange={(e) => setFilterAssignmentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none"
              >
                <option value="all">All Course Practicals ({assignments.length})</option>
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.courseCode}] {a.title}
                  </option>
                ))}
              </select>
            </Card>

            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
              {filteredSubmissions.length === 0 ? (
                <Card className="p-8 text-center text-sm text-muted-foreground">
                  No student submissions match the current filter.
                </Card>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isSelected = activeSub?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => selectSubmissionForGrading(sub)}
                      className={`w-full text-left rounded-2xl border p-4 transition ${
                        isSelected
                          ? "border-teal bg-teal/10 shadow-card"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-primary">{sub.studentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {sub.institution || "Campus Student"} · {sub.department || "Science"}
                          </div>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-extrabold ${
                            sub.status === "graded"
                              ? "bg-success/15 text-success"
                              : "bg-lime/25 text-primary"
                          }`}
                        >
                          {sub.finalScore} / {sub.maxScore}
                        </span>
                      </div>

                      <div className="mt-2.5 text-xs font-semibold text-foreground truncate">
                        {sub.assignmentTitle}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="uppercase font-mono rounded bg-muted px-1.5 py-0.5 text-primary font-semibold">
                          {sub.kernel}
                        </span>
                        <span>Auto-Score: {sub.autoScore}/{sub.maxScore}</span>
                        <span>
                          {sub.status === "graded" ? "✓ Graded" : "⏳ Needs Review"} ·{" "}
                          {sub.submittedAt.slice(0, 10)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Detailed Code, Output, Plots & Grading Form */}
          <div className="lg:col-span-7">
            {activeSub ? (
              <Card className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <span className="rounded bg-teal/15 px-2 py-0.5 font-mono text-xs font-bold text-teal uppercase">
                      {activeSub.kernel} Submission
                    </span>
                    <h3 className="mt-1.5 text-lg font-bold text-primary">
                      {activeSub.assignmentTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Submitted by <b className="text-foreground">{activeSub.studentName}</b> (
                      {activeSub.studentEmail}) · {activeSub.institution || "University"}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      Awarded Score
                    </div>
                    <div className="text-2xl font-extrabold text-primary">
                      {activeSub.finalScore}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        / {activeSub.maxScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto-Grader Diagnostic Checklist */}
                <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-primary">
                    <span>🤖 Automated Verification Checks</span>
                    <span className="font-mono text-teal">
                      Auto-Score: {activeSub.autoScore} / {activeSub.maxScore}
                    </span>
                  </div>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {activeSub.autoChecksPassed.map((c, i) => (
                      <div key={`p-${i}`} className="text-success font-medium">
                        ✓ {c}
                      </div>
                    ))}
                    {activeSub.autoChecksFailed.map((c, i) => (
                      <div key={`f-${i}`} className="text-destructive">
                        ✗ {c}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submitted Code & Console Output */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-editor overflow-hidden">
                    <div className="bg-editor-panel px-3 py-1.5 font-mono text-[11px] text-editor-foreground">
                      Submitted Code ({activeSub.kernel})
                    </div>
                    <pre className="p-3 font-mono text-xs text-editor-foreground overflow-x-auto max-h-60 whitespace-pre-wrap">
                      {activeSub.code}
                    </pre>
                  </div>

                  <div className="rounded-xl bg-editor overflow-hidden">
                    <div className="bg-editor-panel px-3 py-1.5 font-mono text-[11px] text-editor-foreground">
                      Captured Console Output
                    </div>
                    <pre className="p-3 font-mono text-xs text-lime overflow-x-auto max-h-60 whitespace-pre-wrap">
                      {activeSub.output || "(No stdout output)"}
                    </pre>
                  </div>
                </div>

                {/* Submitted Plots */}
                {activeSub.plots && activeSub.plots.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-primary">
                      📊 Submitted Visual Figures ({activeSub.plots.length})
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {activeSub.plots.map((plotUrl, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-border bg-white p-2 shadow-sm"
                        >
                          <img
                            src={plotUrl}
                            alt={`Submitted Plot ${idx + 1}`}
                            className="mx-auto max-h-48 w-auto object-contain"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lecturer / Admin Grading Form */}
                <form
                  onSubmit={handleSaveGrade}
                  className="border-t border-border pt-4 space-y-3"
                >
                  <div className="font-bold text-sm text-primary">
                    👨‍🏫 Lecturer Assessment & Score Override
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label={`Final Score (Max ${activeSub.maxScore})`}>
                      <Input
                        type="number"
                        min={0}
                        max={activeSub.maxScore}
                        value={gradeScore !== "" ? gradeScore : String(activeSub.finalScore)}
                        onChange={(e) => setGradeScore(e.target.value)}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Lecturer Feedback / Remarks for Student">
                        <Input
                          type="text"
                          placeholder="e.g. Well structured Random Forest pipeline and clean plot!"
                          value={
                            gradeFeedback !== "" ? gradeFeedback : (activeSub.feedback ?? "")
                          }
                          onChange={(e) => setGradeFeedback(e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {activeSub.gradedBy
                        ? `Last graded by ${activeSub.gradedBy}`
                        : "Currently using automated score"}
                    </span>
                    <Button variant="lime" className="py-2 px-4 text-xs font-bold">
                      ✓ Save Grade & Publish Feedback
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="p-10 text-center text-sm text-muted-foreground">
                Select a student submission on the left to inspect code, output, and award marks.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CREATE & MANAGE LAB PRACTICALS */}
      {subTab === "assignments" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-6 p-5 space-y-4">
            <h3 className="text-lg font-bold text-primary">
              ➕ Create New Lab Practical Assignment
            </h3>
            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Course Code">
                  <Input
                    required
                    placeholder="e.g. CSC 301"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Practical Title">
                    <Input
                      required
                      placeholder="e.g. K-Means Clustering & PCA Analysis"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Target Institution">
                  <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
                  >
                    <option value="All Institutions">All Nigerian Institutions</option>
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.name}>
                        {inst.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Department">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Lab Kernel">
                  <select
                    value={kernel}
                    onChange={(e) => setKernel(e.target.value as "python" | "r")}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none"
                  >
                    <option value="python">Python 3 (Pyodide)</option>
                    <option value="r">R 4.3 (WebR)</option>
                  </select>
                </Field>
                <Field label="Max Marks">
                  <Input
                    type="number"
                    min={10}
                    max={500}
                    value={maxScore}
                    onChange={(e) => setMaxScore(e.target.value)}
                  />
                </Field>
                <Field label="Due Date">
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Student Instructions & Problem Statement">
                <textarea
                  required
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Describe what students need to compute, print, or plot..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-teal"
                />
              </Field>

              <Field label="Starter Code (Loaded when student selects practical)">
                <textarea
                  rows={4}
                  value={starterCode}
                  onChange={(e) => setStarterCode(e.target.value)}
                  className="w-full rounded-xl border border-input bg-editor p-3 font-mono text-xs text-editor-foreground outline-none"
                />
              </Field>

              <Field label="Auto-Grader Expected Keywords / Outputs (Comma-separated)">
                <Input
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="e.g. RandomForestClassifier, accuracy, classification_report"
                />
              </Field>

              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={expectPlot}
                  onChange={(e) => setExpectPlot(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Require student code to generate at least one visual Plot / Figure (20% weight)
              </label>

              <Button variant="lime" className="w-full py-2.5 font-bold">
                Publish Lab Practical Assignment →
              </Button>
            </form>
          </Card>

          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-lg font-bold text-primary">
              📚 Published Course Practicals ({assignments.length})
            </h3>
            {assignments.map((a) => {
              const subCount = submissions.filter((s) => s.assignmentId === a.id).length;
              return (
                <Card key={a.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                        {a.courseCode}
                      </span>
                      <span className="ml-2 rounded bg-teal/15 px-2 py-0.5 font-mono text-xs font-bold text-teal uppercase">
                        {a.kernel}
                      </span>
                      <h4 className="mt-1.5 font-bold text-primary">{a.title}</h4>
                    </div>
                    <Button
                      variant="ghost"
                      className="py-1 px-2 text-xs text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        actions.deleteAssignment(a.id);
                        toast.info(`Deleted ${a.courseCode}`);
                      }}
                    >
                      Delete
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">{a.instructions}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    <span>
                      🏛 {a.department} · Max: <b>{a.maxScore} Marks</b> · Due: <b>{a.dueDate}</b>
                    </span>
                    <span className="font-semibold text-teal">
                      📤 {subCount} {subCount === 1 ? "submission" : "submissions"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

