import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Card, Badge, Button, Input, Field } from "@/components/ui-kit";
import { actions, useCurrentUser, useStore, formatNaira, type Env } from "@/lib/store";
import { NIGERIAN_BANKS } from "@/lib/nigerian-academic-data";
import { INITIAL_RESOURCES } from "@/lib/resources-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Payments & Course Subscription — GardiaLab" },
      {
        name: "description",
        content: "Bank transfer details and payment logging for GardiaLab course, manual, and tool access.",
      },
      { property: "og:title", content: "Payments & Course Subscription — GardiaLab" },
      {
        property: "og:description",
        content: "Subscribe and unlock your practical manual, course, and coding environment on GardiaLab.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentPage,
});

const POPULAR_COURSES = [
  "GSY303 - Gas Technology",
  "DSA301 - Computing Lab & Data Science",
  "CSC301 - Database Systems & SQL Server",
  "STA211 - Statistics & Econometrics Lab",
  "DSA402 - Business Intelligence & Power BI",
  "PET301 - Petroleum Engineering & Gas Refining",
  "CHE302 - Chemical Process Engineering",
  "OTHER",
];

function PaymentPage() {
  const user = useCurrentUser();
  const plans = useStore((s) => s.plans);
  const settings = useStore((s) => s.settings);
  const payments = useStore((s) => s.payments);

  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [customBank, setCustomBank] = useState("");

  const [courseChoice, setCourseChoice] = useState<string>(
    user?.course || "GSY303 - Gas Technology",
  );
  const [customCourse, setCustomCourse] = useState("");

  const [selectedManualId, setSelectedManualId] = useState<string>("all");
  const [selectedTools, setSelectedTools] = useState<Env[]>([
    "python",
    "r",
    "vscode",
    "notebook",
    "sql",
    "powerbi",
  ]);

  const [matricNumber, setMatricNumber] = useState(user?.matricNumber || "");

  const [f, setF] = useState({
    plan: "",
    reference: "",
    paidOn: new Date().toISOString().slice(0, 10),
    payerName: user?.name || "",
    amount: "",
    note: "",
  });
  const [done, setDone] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!user)
    return (
      <AppShell title="Payments">
        <div />
      </AppShell>
    );

  const plan = plans.find((p) => p.id === (f.plan || plans[0]?.id));
  const mine = payments.filter((p) => p.userId === user.id);

  const up =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (user.accountType === "student" && !matricNumber.trim()) {
      toast.error("Matriculation / Student ID number is compulsory for student subscribers.");
      return;
    }

    const effectiveBank =
      selectedBank === "Other Nigerian Bank" && customBank.trim()
        ? customBank.trim()
        : selectedBank;

    const autoRef = `TX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const cleanRef = f.reference.trim() || autoRef;

    const effectiveCourse =
      courseChoice === "OTHER"
        ? customCourse.trim() || "General Engineering / Data Science"
        : courseChoice;

    const manualObj = INITIAL_RESOURCES.find((r) => r.id === selectedManualId);
    const effectiveManualTitle =
      selectedManualId === "all"
        ? "All Applicable Course Manuals & Datasets"
        : manualObj?.title || selectedManualId;

    actions.submitPayment({
      plan: plan!.id,
      bank: effectiveBank,
      reference: cleanRef,
      paidOn: f.paidOn,
      payerName: f.payerName.trim() || user?.name || "Student",
      amount: Number(f.amount || plan!.price),
      note: f.note,
      courseCode: effectiveCourse,
      manualId: selectedManualId === "all" ? undefined : selectedManualId,
      manualTitle: effectiveManualTitle,
      requestedTools: selectedTools,
      matricNumber: matricNumber.trim() || undefined,
    });

    setF({
      plan: "",
      reference: "",
      paidOn: new Date().toISOString().slice(0, 10),
      payerName: user?.name || "",
      amount: "",
      note: "",
    });
    setDone(true);
  };

  return (
    <AppShell title="Payments & Subscriptions">
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Step 1: Official Nigerian Bank Transfer Details */}
        <Card className="lg:col-span-2 bg-sidebar-grad text-primary-foreground">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-lime">
              Step 1 · Pay by bank transfer
            </span>
            <span className="rounded-full bg-lime/20 px-2 py-0.5 text-[10px] font-bold text-lime">
              NUBAN (Nigeria)
            </span>
          </div>

          <p className="mt-2 text-xs opacity-85 leading-relaxed">
            Transfer the plan fee via your mobile banking app (USSD, GTWorld, Kuda, OPay, Zenith, etc.)
            to our verified account:
          </p>

          <dl className="mt-4 space-y-3 font-mono text-sm">
            {[
              ["Bank", settings.bankName, "bank"],
              ["Account name", settings.accountName, "name"],
              ["Account no. (NUBAN)", settings.accountNumber, "acc"],
              ["Narration / Reference", user.email, "ref"],
            ].map(([k, v, key]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-2 border-b border-primary-foreground/15 pb-2"
              >
                <div className="min-w-0">
                  <dt className="text-xs font-sans opacity-70">{k}</dt>
                  <dd className="font-semibold truncate text-white">{v}</dd>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(v, key)}
                  className="shrink-0 rounded bg-white/10 px-2 py-1 text-[11px] font-sans font-medium text-lime hover:bg-white/20 transition"
                  title="Copy to clipboard"
                >
                  {copiedKey === key ? "Copied ✓" : "Copy"}
                </button>
              </div>
            ))}
          </dl>

          <div className="mt-4 rounded-xl bg-primary-foreground/10 p-3 text-xs opacity-90">
            <span className="font-semibold text-lime">📌 Narration Tip:</span>{" "}
            {settings.instructions ||
              "Please include your email or student name in the transfer narration so we can automatically match your transaction."}
          </div>
        </Card>

        {/* Step 2: Log Payment Form */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal">
              Step 2 · Log your payment
            </span>
            {plan && (
              <span className="text-xs font-bold text-teal">
                Fee: {formatNaira(plan.price)}
              </span>
            )}
          </div>

          {done && (
            <div className="mt-3 rounded-lg border border-success/30 bg-success/15 p-3.5 text-sm text-success space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <span>✓</span> Payment Logged & Email Dispatched!
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An automatic notification has been routed to <strong>info@ai-gardia.com</strong> (copied to <strong>olakazeem@gmail.com</strong> and <strong>{user?.email}</strong>). An administrator will review your transfer and activate your lab access shortly.
              </p>
            </div>
          )}

          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* Course / Subject Specification */}
            <div className="sm:col-span-2 rounded-xl border border-teal/30 bg-teal/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <span>🎯</span> Course / Subject & Manual Selection
                </span>
                <span className="text-[11px] text-muted-foreground">
                  A manual caters for multiple courses
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Target Course / Subject Code & Title">
                  <select
                    value={courseChoice}
                    onChange={(e) => setCourseChoice(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring font-medium"
                  >
                    {POPULAR_COURSES.map((c) => (
                      <option key={c} value={c}>
                        {c === "OTHER" ? "✏️ Other (Specify Custom Course...)" : c}
                      </option>
                    ))}
                  </select>
                </Field>

                {courseChoice === "OTHER" ? (
                  <Field label="Specify Course Code & Title">
                    <Input
                      required
                      placeholder="e.g. GSY303 - Gas Technology"
                      value={customCourse}
                      onChange={(e) => setCustomCourse(e.target.value)}
                    />
                  </Field>
                ) : (
                  <Field label="Associated Practical Lab Manual">
                    <select
                      value={selectedManualId}
                      onChange={(e) => setSelectedManualId(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">📚 All Applicable Course Manuals & Datasets</option>
                      {INITIAL_RESOURCES.filter((r) => r.category === "Lab Manuals").map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.course})
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {courseChoice === "OTHER" && (
                  <div className="sm:col-span-2">
                    <Field label="Associated Practical Lab Manual">
                      <select
                        value={selectedManualId}
                        onChange={(e) => setSelectedManualId(e.target.value)}
                        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="all">📚 All Applicable Course Manuals & Datasets</option>
                        {INITIAL_RESOURCES.filter((r) => r.category === "Lab Manuals").map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title} ({r.course})
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </div>

              {/* Primary Coding Tool / Environment Needed (Multi-select Checkboxes) */}
              <div className="space-y-2 pt-1 border-t border-teal/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-teal block">
                      Primary Coding Tool / Environment Needed (Pick One or More):
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Check each environment you require for your course practicals
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTools(["python", "r", "vscode", "notebook", "sql", "powerbi"])
                      }
                      className="rounded bg-teal/20 text-teal px-2 py-0.5 text-[11px] font-bold hover:bg-teal/30 transition"
                    >
                      Select All Tools
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTools([])}
                      className="rounded bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium hover:bg-muted/80 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: "python" as const, label: "Python Lab", icon: "🐍", desc: "NumPy, Pandas, Matplotlib" },
                    { id: "r" as const, label: "R Lab", icon: "📊", desc: "Statistical inference & OLS" },
                    { id: "sql" as const, label: "SQL Server Lab", icon: "🗄️", desc: "Relational queries & T-SQL" },
                    { id: "powerbi" as const, label: "Power BI Studio", icon: "📈", desc: "Interactive dashboards & DAX" },
                    { id: "notebook" as const, label: "Jupyter Notebook", icon: "📓", desc: "Interactive .ipynb runtime" },
                    { id: "vscode" as const, label: "VS Code Online", icon: "💻", desc: "Full online code editor" },
                  ].map((tool) => {
                    const isChecked = selectedTools.includes(tool.id);
                    return (
                      <label
                        key={tool.id}
                        className={cn(
                          "flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition text-xs",
                          isChecked
                            ? "border-teal bg-teal/15 shadow-sm font-semibold"
                            : "border-border hover:bg-muted/40",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTools([...selectedTools, tool.id]);
                            } else {
                              setSelectedTools(selectedTools.filter((t) => t !== tool.id));
                            }
                          }}
                          className="mt-0.5 accent-teal h-4 w-4 rounded"
                        />
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1">
                            <span>{tool.icon}</span>
                            <span>{tool.label}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-normal">
                            {tool.desc}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {selectedTools.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-medium">
                    ⚠️ No tools selected. Only practical manual & textbook access will be requested.
                  </p>
                )}
              </div>
            </div>

            {/* Matriculation / Student ID Number (Compulsory for students) */}
            <div className="sm:col-span-2 rounded-xl border border-teal/40 bg-teal/10 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-teal">
                  Matriculation / Student ID Number{" "}
                  {user.accountType === "student" ? (
                    <span className="text-destructive">* (Compulsory for Students)</span>
                  ) : (
                    <span className="text-muted-foreground font-normal">(Optional for non-students)</span>
                  )}
                </label>
                {user.accountType === "student" && (
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
                    Required Field
                  </span>
                )}
              </div>
              <Input
                required={user.accountType === "student"}
                placeholder="e.g. 19/02345 or CSC/2022/1042"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
                className="font-medium bg-card text-foreground"
              />
              <p className="text-[11px] text-muted-foreground">
                Required for student identity validation on payment receipts, lab roster enrollment, and administrator manual content assignment.
              </p>
            </div>

            <Field label="Choose Access Duration / Plan">
              <select
                value={plan?.id}
                onChange={up("plan")}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatNaira(p.price)} ({p.days} days)
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Amount Paid (₦)">
              <Input
                type="number"
                step="1"
                placeholder={String(plan?.price ?? "")}
                value={f.amount}
                onChange={up("amount")}
              />
            </Field>

            <Field label="Sender Bank">
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </Field>

            {selectedBank === "Other Nigerian Bank" ? (
              <Field label="Specify Bank Name">
                <Input
                  required
                  placeholder="e.g. Parallex Bank, LOTUS Bank"
                  value={customBank}
                  onChange={(e) => setCustomBank(e.target.value)}
                />
              </Field>
            ) : (
              <Field label="Transaction Reference / Session ID">
                <Input
                  required
                  placeholder="e.g. GTB-9281729 or NIP Session ID"
                  value={f.reference}
                  onChange={up("reference")}
                />
              </Field>
            )}

            {selectedBank === "Other Nigerian Bank" && (
              <Field label="Transaction Reference / Session ID">
                <Input
                  required
                  placeholder="e.g. Transfer Reference / NIP Session ID"
                  value={f.reference}
                  onChange={up("reference")}
                />
              </Field>
            )}

            <Field label="Date Paid">
              <Input type="date" required value={f.paidOn} onChange={up("paidOn")} />
            </Field>

            <Field label="Account Name on Transfer">
              <Input
                required
                placeholder="Full name as shown in your bank app"
                value={f.payerName}
                onChange={up("payerName")}
              />
            </Field>

            <div className="sm:col-span-2">
              <Field label="Transfer Note (Optional)">
                <textarea
                  value={f.note}
                  onChange={up("note")}
                  placeholder="Any additional information or transaction remarks..."
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </Field>
            </div>

            <div className="sm:col-span-2">
              <Button variant="lime" className="w-full sm:w-auto py-2.5 px-6">
                Submit Payment for Approval
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Payment History Table (Device-Friendly Horizontal Scroll) */}
      <Card className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-primary">Your Payment History</h3>
          <span className="text-xs text-muted-foreground font-medium">
            {mine.length} {mine.length === 1 ? "record" : "records"}
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="mt-2 w-full text-sm min-w-[580px]">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5">Date</th>
                <th>Reference</th>
                <th>Course / Subject</th>
                <th>Manual & Tools</th>
                <th>Sender Bank</th>
                <th>Amount (₦)</th>
                <th>Status</th>
                <th>Admin Note</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/40 transition">
                  <td className="py-2.5 whitespace-nowrap text-xs">{p.paidOn}</td>
                  <td className="font-mono text-xs font-semibold">{p.reference}</td>
                  <td className="text-xs">
                    <span className="font-semibold text-primary">
                      {p.courseCode || user.course || "General"}
                    </span>
                    <div className="text-[10px] text-muted-foreground">
                      Plan: {plans.find((x) => x.id === p.plan)?.name ?? p.plan}
                    </div>
                  </td>
                  <td className="text-xs">
                    <div className="font-medium text-foreground line-clamp-1">
                      {p.manualTitle || "Course Manuals & Materials"}
                    </div>
                    {p.requestedTools && p.requestedTools.length > 0 && (
                      <div className="text-[10px] text-teal font-medium mt-0.5">
                        Tools: {p.requestedTools.join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="text-muted-foreground text-xs">{p.bank || "Bank Transfer"}</td>
                  <td className="font-semibold text-primary">{formatNaira(p.amount)}</td>
                  <td>
                    <Badge v={p.status} />
                  </td>
                  <td className="text-xs text-muted-foreground">{p.adminNote ?? "—"}</td>
                </tr>
              ))}
              {!mine.length && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground">
                    No payment records logged yet. Make a transfer and submit above to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
