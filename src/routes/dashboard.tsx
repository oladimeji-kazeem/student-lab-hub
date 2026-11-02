import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, Badge, Button } from "@/components/ui-kit";
import { useCurrentUser, useStore, hasAccess } from "@/lib/store";
import { LabAssessmentModule } from "@/components/admin/LabAssessmentModule";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — e-Lab" },
      {
        name: "description",
        content: "Your e-Lab overview: access status, payments and labs.",
      },
      { property: "og:title", content: "Dashboard — e-Lab" },
      { property: "og:description", content: "Manage your coding lab access." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const user = useCurrentUser();
  const payments = useStore((s) => s.payments);
  const assignments = useStore((s) => s.assignments);
  const submissions = useStore((s) => s.submissions);

  if (!user)
    return (
      <AppShell title="Overview">
        <div />
      </AppShell>
    );

  const mine = payments.filter((p) => p.userId === user.id);
  const ok = hasAccess(user);
  const daysLeft = user.accessUntil
    ? Math.max(0, Math.ceil((new Date(user.accessUntil).getTime() - Date.now()) / 864e5))
    : 0;

  const labs = [
    {
      to: "/lab/notebook" as const,
      env: "notebook" as const,
      name: "Interactive Notebook",
      desc: "Jupyter-style notebook for Python & R with .ipynb exports",
    },
    {
      to: "/lab/python" as const,
      env: "python" as const,
      name: "Python Lab",
      desc: "Python 3 in the browser",
    },
    { to: "/lab/r" as const, env: "r" as const, name: "R Lab", desc: "R runtime for statistics" },
    {
      to: "/lab/sql" as const,
      env: "sql" as const,
      name: "SQL Server Lab",
      desc: "Relational database queries & T-SQL practice",
    },
    {
      to: "/lab/powerbi" as const,
      env: "powerbi" as const,
      name: "Power BI & Analytics Lab",
      desc: "Interactive dashboards, downloadable datasets & DAX briefs",
    },
    {
      to: "/lab/vscode" as const,
      env: "vscode" as const,
      name: "VS Code",
      desc: "Full online editor",
    },
  ];

  return (
    <AppShell title={`Hello, ${user.name.split(" ")[0]}`}>
      {/* Top Status Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">User Status</div>
          <div className="mt-2">
            <Badge v={user.status} />
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">Account Type</div>
          <div className="mt-2">
            <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-bold text-teal capitalize">
              {user.accountType === "lecturer"
                ? "👨‍🏫 Lecturer"
                : user.accountType === "non-academic"
                  ? "💼 Non-Academic"
                  : "🎓 Student"}
            </span>
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">Lab Access</div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-primary">
            {ok ? `${daysLeft} days` : "None"}
          </div>
        </Card>
        <Card>
          <div className="text-xs font-semibold uppercase text-muted-foreground">
            Payments Logged
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold text-primary">{mine.length}</div>
        </Card>
      </div>

      {/* User Profile Card (Dynamic by Category) */}
      <Card className="mt-5 border-border bg-card/60">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal">
              {user.accountType === "student"
                ? "Student Academic Profile"
                : user.accountType === "lecturer"
                  ? "Lecturer Academic Affiliation"
                  : "Professional Profile"}
            </div>
            <h3 className="mt-1 text-lg font-bold text-primary">
              {user.accountType === "non-academic"
                ? user.currentRole || "Professional Practitioner"
                : user.institution || "Nigerian Higher Institution"}
            </h3>
            {user.employer && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Organization / Employer: <b className="text-foreground">{user.employer}</b>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {user.department && (
              <span className="rounded-lg bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
                🏛 Dept. of {user.department}
              </span>
            )}
            {user.course && (
              <span className="rounded-lg bg-lime/20 px-3 py-1 text-xs font-semibold text-primary">
                📚 {user.course}
              </span>
            )}
            {user.degree && (
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                🎓 {user.degree}
              </span>
            )}
            {user.currentRole && user.accountType === "lecturer" && (
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                🏷 {user.currentRole}
              </span>
            )}
            {user.stateOfResidence && (
              <span className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                📍 {user.stateOfResidence} State
              </span>
            )}
          </div>
        </div>
      </Card>

      {!ok && (
        <Card className="mt-5 border-lime bg-accent">
          <h3 className="font-bold text-primary">Activate your environment</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.some((p) => p.status === "pending")
              ? "Your bank payment is awaiting admin review."
              : "Pay your subscription fee by bank transfer, then log the reference for instant review."}
          </p>
          <Link to="/payment">
            <Button className="mt-3">Go to payments</Button>
          </Link>
        </Card>
      )}

      <h2 className="mt-8 mb-3 text-lg font-bold text-primary">Your labs</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {labs.map((l) => {
          const can = hasAccess(user, l.env);
          return (
            <Card key={l.to}>
              <div className="h-1.5 w-10 rounded-full bg-brand" />
              <h3 className="mt-3 font-bold text-primary">{l.name}</h3>
              <p className="text-sm text-muted-foreground">{l.desc}</p>
              {can ? (
                <Link to={l.to}>
                  <Button variant="lime" className="mt-4">
                    Launch
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="outline" className="mt-4">
                  Locked
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Lecturer / Admin Assessment & Gradebook Console */}
      {(user.accountType === "lecturer" || user.role === "admin") && (
        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-primary">
                👨‍🏫 Lecturer Lab Assessment & Student Gradebook
              </h2>
              <p className="text-xs text-muted-foreground">
                Create course practicals, inspect student code & auto-grader checks, award marks, and export `.csv` mark sheets.
              </p>
            </div>
          </div>
          <LabAssessmentModule />
        </div>
      )}

      {/* Student Course Practicals & Gradebook */}
      {user.accountType !== "lecturer" && (
        <div className="mt-10 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-primary">
              🎓 Assigned Course Lab Practicals & My Grades
            </h2>
            <p className="text-xs text-muted-foreground">
              Attempt your department's coding practicals in the Interactive Notebook or Python/R Lab to receive automated & lecturer grading.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {assignments.map((asg) => {
              const mySub = submissions.find(
                (s) => s.assignmentId === asg.id && s.studentId === user.id,
              );
              return (
                <Card key={asg.id} className="flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                        {asg.courseCode}
                      </span>
                      <span className="rounded bg-teal/15 px-2 py-0.5 font-mono text-xs font-bold text-teal uppercase">
                        {asg.kernel}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-primary text-sm">{asg.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                      {asg.instructions}
                    </p>
                  </div>

                  <div className="space-y-2 border-t border-border pt-2.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Max: {asg.maxScore} Marks</span>
                      <span>Due: {asg.dueDate}</span>
                    </div>

                    {mySub ? (
                      <div className="rounded-xl bg-success/10 border border-success/30 p-2.5 space-y-1">
                        <div className="flex items-center justify-between font-bold text-success">
                          <span>
                            {mySub.status === "graded" ? "✓ Lecturer Graded" : "📤 Submitted"}
                          </span>
                          <span className="font-mono">
                            {mySub.finalScore} / {mySub.maxScore}
                          </span>
                        </div>
                        {mySub.feedback && (
                          <p className="text-[11px] text-foreground leading-snug">
                            "{mySub.feedback}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-muted-foreground italic">
                        Not yet submitted
                      </div>
                    )}

                    <Link
                      to="/lab/notebook"
                      search={{ kernel: asg.kernel }}
                      className="block"
                    >
                      <Button variant="outline" className="w-full py-1.5 text-xs font-semibold">
                        {mySub ? "Re-open in Lab →" : "Attempt Practical in Lab →"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
