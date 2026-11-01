import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo, Button, Input, Field, Card } from "@/components/ui-kit";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — e-Lab" },
      { name: "description", content: "Reset your e-Lab account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const nav = useNavigate();
  const [step, setStep] = useState<"request" | "reset" | "success">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expectedCode, setExpectedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [targetName, setTargetName] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setIsLoading(true);
    try {
      const res = actions.requestPasswordReset(email);
      setExpectedCode(res.code);
      setCode(res.code);
      setTargetName(res.name);
      setStep("reset");
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (code.trim() !== expectedCode.trim()) {
      setErr("Invalid verification code. Please check and try again.");
      return;
    }
    if (newPassword.length < 6) {
      setErr("Password must contain at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      actions.resetPasswordWithEmail(email, newPassword);
      setStep("success");
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <Logo />

        {step === "request" && (
          <>
            <h1 className="mt-6 text-2xl font-bold text-primary">Reset Password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your registered email address to receive a 6-digit verification code.
            </p>

            {err && (
              <div className="mt-4 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2">
                <span className="text-sm font-bold">⚠️</span>
                <div className="flex-1 leading-relaxed">{err}</div>
              </div>
            )}

            <form onSubmit={handleRequest} className="mt-6 space-y-4">
              <Field label="Registered Email Address">
                <Input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@institution.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Button disabled={isLoading} className="w-full py-2.5 font-bold">
                {isLoading ? "Generating code..." : "Send Verification Code →"}
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="text-xs font-semibold text-teal hover:underline">
                  ← Back to Sign in
                </Link>
              </div>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 className="mt-6 text-2xl font-bold text-primary">Set New Password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Resetting password for <strong>{targetName || email}</strong>.
            </p>

            <div className="mt-4 rounded-xl bg-teal/10 border border-teal/30 p-3 text-xs text-teal space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span>📧</span> Verification Email Dispatched:
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                A customized password reset email has been sent to <strong>{email}</strong>. Please check your inbox or spam folder.
              </p>
              {expectedCode && (
                <div className="pt-1 border-t border-teal/20 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-teal">Dev / Quick Code:</span>
                  <span className="font-mono text-sm font-extrabold tracking-widest text-primary">
                    {expectedCode}
                  </span>
                </div>
              )}
            </div>

            {err && (
              <div className="mt-4 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2">
                <span className="text-sm font-bold">⚠️</span>
                <div className="flex-1 leading-relaxed">{err}</div>
              </div>
            )}

            <form onSubmit={handleReset} className="mt-5 space-y-4">
              <Field label="6-Digit Verification Code">
                <Input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  className="font-mono text-center tracking-widest text-base font-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>

              <Field label="New Password">
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </Field>

              <Field label="Confirm New Password">
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Field>

              <Button disabled={isLoading} variant="lime" className="w-full py-2.5 font-bold">
                {isLoading ? "Updating password..." : "Confirm & Save New Password →"}
              </Button>

              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setErr("");
                  }}
                  className="hover:text-foreground"
                >
                  ← Change email
                </button>
                <Link to="/login" className="hover:text-foreground">
                  Cancel
                </Link>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="mt-4 text-center space-y-4 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-3xl text-success">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-primary">Password Reset Complete</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully updated for <strong>{email}</strong>.
            </p>
            <Button
              type="button"
              onClick={() => nav({ to: "/login" })}
              className="w-full py-2.5 font-bold"
            >
              Proceed to Sign In →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
