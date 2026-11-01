import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo, Button, Input, Field, Card } from "@/components/ui-kit";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — e-Lab" },
      { name: "description", content: "Sign in to your e-Lab coding environment." },
      { property: "og:title", content: "Sign in — e-Lab" },
      { property: "og:description", content: "Access your online Python, R, and VS Code labs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

type LoginMode = "login" | "forgot" | "reset" | "success";

function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<LoginMode>("login");

  // Login form state
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  // Forgot / Reset password state
  const [resetEmail, setResetEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [expectedCode, setExpectedCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [targetUserName, setTargetUserName] = useState("");
  const [resetNotice, setResetNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle standard login
  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const u = actions.login(email, pw);
      nav({ to: u.role === "admin" ? "/admin" : "/dashboard" });
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  // Handle forgot password request (Step 1)
  const handleRequestResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setIsLoading(true);

    try {
      const res = actions.requestPasswordReset(resetEmail);
      setExpectedCode(res.code);
      setVerificationCode(res.code); // Prefill code for seamless user experience
      setTargetUserName(res.name);
      setMode("reset");
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset confirmation (Step 2)
  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (verificationCode.trim() !== expectedCode.trim()) {
      setErr("Invalid verification code. Please check and try again.");
      return;
    }

    if (newPassword.length < 6) {
      setErr("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match. Please ensure both passwords match.");
      return;
    }

    setIsLoading(true);
    try {
      actions.resetPasswordWithEmail(resetEmail, newPassword);
      setEmail(resetEmail);
      setPw(newPassword);
      setResetNotice("Password updated successfully! You can now sign in.");
      setMode("success");
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

        {/* 1. STANDARD LOGIN VIEW */}
        {mode === "login" && (
          <>
            <h1 className="mt-6 text-2xl font-bold text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to access your coding labs and interactive notebooks
            </p>

            {resetNotice && (
              <div className="mt-4 rounded-xl bg-success/15 border border-success/30 p-3 text-xs text-success flex items-start gap-2">
                <span className="text-sm font-bold">✓</span>
                <div className="flex-1 leading-relaxed">{resetNotice}</div>
              </div>
            )}

            <form onSubmit={submitLogin} className="mt-6 space-y-4">
              <Field label="Email address">
                <Input
                  type="email"
                  required
                  placeholder="student@university.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Password
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setMode("forgot");
                      setErr("");
                      setResetNotice("");
                    }}
                    className="text-xs font-semibold text-teal hover:underline focus:outline-none"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </div>

              {err && <p className="text-sm text-destructive">{err}</p>}
              <Button className="w-full py-2.5">Sign in</Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Don't have an account yet?{" "}
              <Link to="/register" className="font-semibold text-teal hover:underline">
                Register now
              </Link>
            </p>
          </>
        )}

        {/* 2. FORGOT PASSWORD (STEP 1: REQUEST CODE) */}
        {mode === "forgot" && (
          <>
            <h1 className="mt-6 text-2xl font-bold text-primary">Reset Password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your registered account email to generate a 6-digit verification code and reset your password.
            </p>

            {err && (
              <div className="mt-4 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2">
                <span className="text-sm font-bold">⚠️</span>
                <div className="flex-1 leading-relaxed">{err}</div>
              </div>
            )}

            <form onSubmit={handleRequestResetCode} className="mt-6 space-y-4">
              <Field label="Registered Email Address">
                <Input
                  type="email"
                  required
                  autoFocus
                  placeholder="name@institution.edu.ng"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </Field>

              <Button disabled={isLoading} className="w-full py-2.5 font-bold">
                {isLoading ? "Generating code..." : "Send Verification Code →"}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErr("");
                }}
                className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground py-1"
              >
                ← Back to Sign in
              </button>
            </form>
          </>
        )}

        {/* 3. VERIFICATION & NEW PASSWORD (STEP 2) */}
        {mode === "reset" && (
          <>
            <h1 className="mt-6 text-2xl font-bold text-primary">Set New Password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Resetting password for <strong>{targetUserName || resetEmail}</strong>.
            </p>

            {expectedCode && (
              <div className="mt-4 rounded-xl bg-teal/10 border border-teal/30 p-3 text-xs text-teal space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <span>🔑</span> Verification Code Generated:
                </div>
                <div className="font-mono text-base font-extrabold tracking-widest text-primary">
                  {expectedCode}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  (Simulated instant dispatch for verification code)
                </div>
              </div>
            )}

            {err && (
              <div className="mt-4 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2">
                <span className="text-sm font-bold">⚠️</span>
                <div className="flex-1 leading-relaxed">{err}</div>
              </div>
            )}

            <form onSubmit={handleConfirmPasswordReset} className="mt-5 space-y-4">
              <Field label="6-Digit Verification Code">
                <Input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 123456"
                  className="font-mono text-center tracking-widest text-base font-bold"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
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
                    setMode("forgot");
                    setErr("");
                  }}
                  className="hover:text-foreground"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErr("");
                  }}
                  className="hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {/* 4. SUCCESS CONFIRMATION */}
        {mode === "success" && (
          <div className="mt-4 text-center space-y-4 py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-3xl text-success">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-primary">Password Reset Complete</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been successfully updated for <strong>{resetEmail}</strong>. You can now access your account with your new credentials.
            </p>
            <Button
              type="button"
              onClick={() => {
                setMode("login");
                setErr("");
              }}
              className="w-full py-2.5 font-bold"
            >
              Sign In with New Password →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
