import { useState, useEffect } from "react";
import { Card, Badge, Button, Input } from "@/components/ui-kit";
import {
  getEmailNotifications,
  type EmailNotificationRecord,
  triggerWelcomeEmail,
  triggerPasswordResetEmail,
  triggerPaymentSubmittedEmail,
  triggerPaymentApprovedEmail,
} from "@/lib/email-service";
import { cn } from "@/lib/utils";

export function EmailNotificationsModule() {
  const [emails, setEmails] = useState<EmailNotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailNotificationRecord | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const loadEmails = async () => {
    setLoading(true);
    const data = await getEmailNotifications();
    setEmails(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const filtered = emails.filter((e) => {
    if (filterType !== "all" && e.email_type !== filterType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.recipient_email.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      (e.cc_emails || []).some((cc) => cc.toLowerCase().includes(q))
    );
  });

  const sendTest = async (
    type: "welcome" | "password_reset" | "payment_submitted" | "payment_approved",
  ) => {
    setTestStatus(`Sending test ${type}...`);
    try {
      if (type === "welcome") {
        await triggerWelcomeEmail({
          name: "Test User",
          email: "olakazeem@gmail.com",
          accountType: "student",
          institution: "University of Lagos",
          currentRole: "Computer Science Undergraduate",
          stateOfResidence: "Lagos",
        });
      } else if (type === "password_reset") {
        await triggerPasswordResetEmail(
          { name: "Test User", email: "olakazeem@gmail.com" },
          "543210",
        );
      } else if (type === "payment_submitted") {
        await triggerPaymentSubmittedEmail(
          {
            reference: "TEST-PAY-" + Math.floor(100000 + Math.random() * 900000),
            amount: 3500,
            bank: "Guaranty Trust Bank (GTBank)",
            paidOn: new Date().toISOString().slice(0, 10),
            payerName: "Test Student",
            planName: "Weekly Access (7 days)",
            note: "Test payment submission email verification",
          },
          {
            name: "Test Student",
            email: "student@e-lab.ng",
            institution: "UNILAG",
          },
        );
      } else if (type === "payment_approved") {
        await triggerPaymentApprovedEmail(
          { name: "Test Student", email: "student@e-lab.ng" },
          { name: "Weekly Access", days: 7, envs: ["python", "r", "vscode", "notebook"] },
          {
            reference: "TEST-PAY-889900",
            amount: 3500,
            paidOn: new Date().toISOString().slice(0, 10),
          },
          new Date(Date.now() + 7 * 864e5).toISOString(),
        );
      }
      setTestStatus(`✓ Test ${type} email logged & dispatched successfully!`);
      await loadEmails();
    } catch (e: any) {
      setTestStatus(`Error: ${e?.message || e}`);
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "welcome":
        return "secondary";
      case "password_reset":
        return "destructive";
      case "payment_submitted":
        return "outline";
      case "payment_approved":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Scenarios Overview */}
      <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
            <span>📬</span> Automated Email Flow Management
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Real-time audit log of all 4 transactional email scenarios: User Welcome, Password Reset Codes, Payment Submissions (routed to info@ai-gardia.com & copied to olakazeem@gmail.com), and Payment Approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-xs py-1.5 px-3 flex items-center gap-1.5"
            disabled={loading}
            onClick={loadEmails}
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            {loading ? "Refreshing..." : "Refresh Logs"}
          </Button>
        </div>
      </div>

      {/* Scenario Triggers Test Deck */}
      <Card className="p-4 bg-card/60">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
          <span>Test Trigger Email Scenarios</span>
          {testStatus && (
            <span className="font-semibold text-teal lowercase first-letter:uppercase animate-fade-in">
              {testStatus}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="text-xs py-1 px-3 border-teal/40 text-teal hover:bg-teal/10"
            onClick={() => sendTest("welcome")}
          >
            ✉️ Test Scenario 1: Welcome Email
          </Button>
          <Button
            variant="outline"
            className="text-xs py-1 px-3 border-amber-500/40 text-amber-600 hover:bg-amber-500/10"
            onClick={() => sendTest("password_reset")}
          >
            🔑 Test Scenario 2: Password Reset
          </Button>
          <Button
            variant="outline"
            className="text-xs py-1 px-3 border-blue-500/40 text-blue-600 hover:bg-blue-500/10"
            onClick={() => sendTest("payment_submitted")}
          >
            💳 Test Scenario 3: Payment Submitted (Info + Ola)
          </Button>
          <Button
            variant="outline"
            className="text-xs py-1 px-3 border-green-500/40 text-green-600 hover:bg-green-500/10"
            onClick={() => sendTest("payment_approved")}
          >
            🎉 Test Scenario 4: Payment Approval
          </Button>
        </div>
      </Card>

      {/* Main Email Table */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Emails" },
              { id: "welcome", label: "Welcome" },
              { id: "password_reset", label: "Password Resets" },
              { id: "payment_submitted", label: "Payment Submitted" },
              { id: "payment_approved", label: "Approved Access" },
            ].map((tab) => {
              const count = emails.filter((e) =>
                tab.id === "all" ? true : e.email_type === tab.id,
              ).length;
              return (
                <Button
                  key={tab.id}
                  variant={filterType === tab.id ? "primary" : "outline"}
                  className="text-xs py-1 px-2.5"
                  onClick={() => setFilterType(tab.id)}
                >
                  {tab.label} ({count})
                </Button>
              );
            })}
          </div>

          <Input
            placeholder="Search recipient, CC, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs text-xs"
          />
        </div>

        <div className="mt-4 overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5">Type</th>
                <th>Recipient (To)</th>
                <th>CC Recipients</th>
                <th>Subject</th>
                <th>Dispatched</th>
                <th>Status</th>
                <th>Preview</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-border align-middle hover:bg-muted/30 transition text-xs"
                >
                  <td className="py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        item.email_type === "welcome"
                          ? "bg-teal/15 text-teal"
                          : item.email_type === "password_reset"
                            ? "bg-amber-500/15 text-amber-600"
                            : item.email_type === "payment_submitted"
                              ? "bg-blue-500/15 text-blue-600"
                              : "bg-green-500/15 text-green-600",
                      )}
                    >
                      {item.email_type.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold text-primary">{item.recipient_email}</div>
                  </td>
                  <td>
                    {item.cc_emails && item.cc_emails.length > 0 ? (
                      <div className="text-[11px] text-muted-foreground space-y-0.5">
                        {item.cc_emails.map((cc, i) => (
                          <div key={i}>{cc}</div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td>
                    <div className="font-medium text-primary max-w-xs truncate" title={item.subject}>
                      {item.subject}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-muted-foreground">
                    {new Date(item.sent_at || item.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        item.status === "sent"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      <span>{item.status === "sent" ? "✓" : "!"}</span>
                      <span className="capitalize">{item.status}</span>
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="outline"
                      className="text-[11px] py-1 px-2.5 h-auto text-teal border-teal/30 hover:bg-teal/10"
                      onClick={() => setSelectedEmail(item)}
                    >
                      View HTML
                    </Button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {loading ? "Loading email records..." : "No email logs matching filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* HTML Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-primary text-sm sm:text-base">
                  {selectedEmail.subject}
                </h3>
                <div className="text-xs text-muted-foreground mt-0.5">
                  To: <strong>{selectedEmail.recipient_email}</strong>
                  {selectedEmail.cc_emails?.length ? ` | CC: ${selectedEmail.cc_emails.join(", ")}` : ""}
                </div>
              </div>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedEmail(null)}
              >
                ✕
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
              <div
                className="bg-white rounded-xl shadow-inner border border-border overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }}
              />
            </div>

            <div className="p-3 border-t border-border flex items-center justify-between bg-card text-xs">
              <span className="text-muted-foreground">
                Dispatched: {new Date(selectedEmail.sent_at).toLocaleString()}
              </span>
              <Button
                variant="primary"
                className="py-1 px-3 text-xs"
                onClick={() => setSelectedEmail(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
