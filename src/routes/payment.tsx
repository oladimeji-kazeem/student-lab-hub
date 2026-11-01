import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, Badge, Button, Input, Field } from "@/components/ui-kit";
import { actions, useCurrentUser, useStore, formatNaira } from "@/lib/store";
import { NIGERIAN_BANKS } from "@/lib/nigerian-academic-data";

export const Route = createFileRoute("/payment")({
  head: () => ({
    meta: [
      { title: "Payments — e-Lab" },
      {
        name: "description",
        content: "Bank transfer details and payment logging for e-Lab access.",
      },
      { property: "og:title", content: "Payments — e-Lab" },
      {
        property: "og:description",
        content: "Log your Nigerian bank transfer to activate your e-Lab coding environment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const user = useCurrentUser();
  const plans = useStore((s) => s.plans);
  const settings = useStore((s) => s.settings);
  const payments = useStore((s) => s.payments);

  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [customBank, setCustomBank] = useState("");

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
    const effectiveBank =
      selectedBank === "Other Nigerian Bank" && customBank.trim()
        ? customBank.trim()
        : selectedBank;

    actions.submitPayment({
      plan: plan!.id,
      bank: effectiveBank,
      reference: f.reference,
      paidOn: f.paidOn,
      payerName: f.payerName,
      amount: Number(f.amount || plan!.price),
      note: f.note,
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
    <AppShell title="Payments">
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
            <div className="mt-3 rounded-lg border border-success/30 bg-success/15 p-3.5 text-sm text-success">
              ✓ Payment logged successfully! An administrator will review your transfer and activate your lab access shortly.
            </div>
          )}

          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Choose Plan">
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
                <th>Plan</th>
                <th>Sender Bank</th>
                <th>Amount (₦)</th>
                <th>Status</th>
                <th>Admin Note</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/40 transition">
                  <td className="py-2.5 whitespace-nowrap">{p.paidOn}</td>
                  <td className="font-mono text-xs font-semibold">{p.reference}</td>
                  <td>{plans.find((x) => x.id === p.plan)?.name ?? p.plan}</td>
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
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
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
