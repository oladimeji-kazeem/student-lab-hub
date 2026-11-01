import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Button, Card } from "@/components/ui-kit";
import {
  actions,
  useStore,
  useCurrentUser,
  evaluateAutoGrade,
  type LabAssignment,
} from "@/lib/store";

export function LabPracticePanel({
  kernel,
  currentCode,
  currentOutput,
  currentPlots,
  onLoadStarter,
}: {
  kernel: "python" | "r";
  currentCode: string;
  currentOutput: string;
  currentPlots: string[];
  onLoadStarter: (assignment: LabAssignment) => void;
}) {
  const user = useCurrentUser();
  const assignments = useStore((s) => s.assignments);
  const submissions = useStore((s) => s.submissions);

  const kernelAssignments = useMemo(
    () => assignments.filter((a) => a.kernel === kernel),
    [assignments, kernel],
  );

  const [selectedId, setSelectedId] = useState<string>("");
  const [expanded, setExpanded] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const activeAssignment = useMemo(
    () =>
      kernelAssignments.find((a) => a.id === selectedId) ??
      assignments.find((a) => a.id === selectedId) ??
      null,
    [kernelAssignments, assignments, selectedId],
  );

  const mySubmission = useMemo(() => {
    if (!user || !activeAssignment) return null;
    return (
      submissions.find(
        (sub) => sub.assignmentId === activeAssignment.id && sub.studentId === user.id,
      ) ?? null
    );
  }, [submissions, user, activeAssignment]);

  const liveEval = useMemo(() => {
    if (!activeAssignment) return null;
    return evaluateAutoGrade(activeAssignment, currentCode, currentOutput, currentPlots);
  }, [activeAssignment, currentCode, currentOutput, currentPlots]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (id) setExpanded(true);
  };

  const handleSubmit = () => {
    if (!activeAssignment) return;
    if (!currentCode.trim()) {
      toast.warning("Please write and run your code before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const sub = actions.submitLabPractice({
        assignmentId: activeAssignment.id,
        code: currentCode,
        output: currentOutput,
        plots: currentPlots,
      });
      toast.success(
        `Submitted "${activeAssignment.courseCode}"! Auto-Grader Score: ${sub.autoScore}/${sub.maxScore}`,
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-4 rounded-2xl border border-teal/35 bg-card/90 p-3.5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal/15 px-2.5 py-1 text-xs font-bold text-teal">
            🎓 Lab Practical Assessment
          </span>

          <select
            aria-label="Select Lab Practical Assignment"
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-teal"
          >
            <option value="">
              Select a Course Practical to Attempt ({kernelAssignments.length} available for{" "}
              {kernel === "python" ? "Python" : "R"})…
            </option>
            {kernelAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.courseCode}] {a.title} — ({a.maxScore} Marks · Due {a.dueDate})
              </option>
            ))}
          </select>

          {mySubmission && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                mySubmission.status === "graded"
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-lime/20 text-primary border border-lime/40"
              }`}
            >
              {mySubmission.status === "graded"
                ? `✓ Graded: ${mySubmission.finalScore}/${mySubmission.maxScore}`
                : `📤 Submitted (Auto-Score: ${mySubmission.autoScore}/${mySubmission.maxScore})`}
            </span>
          )}
        </div>

        {activeAssignment && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="py-1 px-2.5 text-xs"
              onClick={() => {
                onLoadStarter(activeAssignment);
                toast.info(`Loaded starter code for ${activeAssignment.courseCode}`);
              }}
            >
              📋 Load Starter Code
            </Button>
            <Button
              variant="ghost"
              className="py-1 px-2.5 text-xs"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Hide Details ▲" : "Show Instructions & Auto-Grader ▼"}
            </Button>
          </div>
        )}
      </div>

      {activeAssignment && expanded && (
        <div className="mt-3.5 grid gap-4 border-t border-border pt-3.5 lg:grid-cols-3">
          {/* Instructions & Metadata */}
          <div className="lg:col-span-2 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                {activeAssignment.courseCode}
              </span>
              <h4 className="font-bold text-sm text-primary">{activeAssignment.title}</h4>
              <span className="text-xs text-muted-foreground">
                · Dept. of {activeAssignment.department} · Max:{" "}
                <b className="text-foreground">{activeAssignment.maxScore} Marks</b> · Due:{" "}
                <b className="text-foreground">{activeAssignment.dueDate}</b>
              </span>
            </div>

            <p className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed text-foreground">
              <b className="text-primary">Instructions: </b>
              {activeAssignment.instructions}
            </p>

            {/* Lecturer Feedback if already graded */}
            {mySubmission && mySubmission.feedback && (
              <div className="rounded-xl border border-success/40 bg-success/10 p-3 text-xs">
                <div className="font-bold text-success">
                  👨‍🏫 Lecturer Assessment Feedback ({mySubmission.gradedBy || "Instructor"} —{" "}
                  {mySubmission.finalScore}/{mySubmission.maxScore} Marks):
                </div>
                <p className="mt-1 text-foreground">{mySubmission.feedback}</p>
              </div>
            )}
          </div>

          {/* Live Auto-Grader Check Card & Submit Button */}
          <Card className="bg-muted/30 p-3 space-y-2.5 border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Live Auto-Grader Check
              </span>
              {liveEval && (
                <span className="rounded-md bg-teal/15 px-2 py-0.5 font-mono text-xs font-extrabold text-teal">
                  Est. {liveEval.autoScore} / {activeAssignment.maxScore}
                </span>
              )}
            </div>

            {liveEval && (
              <ul className="space-y-1 text-[11px]">
                {liveEval.passed.map((msg, i) => (
                  <li key={`p-${i}`} className="flex items-center gap-1.5 text-success font-medium">
                    <span>✓</span>
                    <span>{msg}</span>
                  </li>
                ))}
                {liveEval.failed.map((msg, i) => (
                  <li
                    key={`f-${i}`}
                    className="flex items-center gap-1.5 text-muted-foreground"
                  >
                    <span>○</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button
              variant="lime"
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full py-2 text-xs font-bold"
            >
              {submitting
                ? "Submitting Practice…"
                : mySubmission
                  ? "📤 Re-Submit Updated Lab Practice"
                  : "📤 Submit Lab Practice for Grading"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}

