import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Logo, Button, Input, Field, Card } from "@/components/ui-kit";
import { actions, type User } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AdminLoginGateProps {
  onSuccess?: () => void;
}

export function AdminLoginGate({ onSuccess }: AdminLoginGateProps) {
  const [email, setEmail] = useState("olakazeem@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [pin, setPin] = useState("2026-LAB");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const u = actions.login(email, password);
      if (u.role !== "admin") {
        actions.logout();
        throw new Error(
          "Access denied: Account possesses '" +
            u.accountType +
            "' credentials but lacks Level-1 Administrator clearance.",
        );
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Invalid administrator credentials or access denied.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantLogin = (targetEmail: string, targetPass: string) => {
    try {
      setEmail(targetEmail);
      setPassword(targetPass);
      actions.login(targetEmail, targetPass);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "Admin login failed");
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <div className="w-full max-w-lg space-y-4">
        {/* Top security banner */}
        <div className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <span className="inline-block h-2 w-2 rounded-full bg-warning animate-pulse" />
            <span>Restricted Gateway · Level-1 Administrative Clearance</span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">GardiaLab v2.4</span>
        </div>

        <Card className="p-6 sm:p-8 border-teal/40 shadow-xl">
          <div className="flex items-center justify-between">
            <Logo size="lg" />
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground tracking-wide">
              ADMIN CONSOLE
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-primary">Admin Sign In</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Authenticate to manage student users, Nigerian academic catalog, bank payments, and real-time state telemetry.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive flex items-start gap-2.5">
              <span className="text-base font-bold">⚠️</span>
              <div className="flex-1 leading-relaxed">
                <strong>Authentication Failed:</strong> {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="Administrator Email">
              <Input
                type="email"
                required
                autoComplete="email"
                placeholder="olakazeem@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Master Password">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-primary"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </Field>

            <Field label="Security PIN / 2FA Clearance Code (Optional)">
              <Input
                type="text"
                placeholder="e.g. 2026-LAB"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={rememberSession}
                  onChange={(e) => setRememberSession(e.target.checked)}
                  className="rounded text-teal"
                />
                Remember admin session
              </label>
              <span className="font-mono text-muted-foreground">TLS 1.3 256-bit</span>
            </div>

            <Button disabled={isLoading} className="w-full py-2.5 font-bold shadow-md">
              {isLoading ? "Verifying clearance..." : "Authenticate as Administrator →"}
            </Button>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 rounded-xl bg-accent/40 border border-border p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span>⚡</span> Rapid Administrative Authentication
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-mono">Instant Clearance</span>
            </div>

            {/* Primary Admin: Ola Kazeem */}
            <div className="rounded-lg bg-background/90 border border-primary/25 p-2.5 space-y-1.5 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary flex items-center gap-1">
                  <span>🛡️</span> Ola Kazeem (Lead Administrator)
                </span>
                <span className="text-[10px] rounded bg-primary/10 text-primary font-bold px-1.5 py-0.5">
                  ROLE: ADMIN
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono flex flex-wrap justify-between">
                <span>olakazeem@gmail.com</span>
                <span>pass: <b className="text-foreground">admin123</b></span>
              </div>
              <Button
                type="button"
                variant="lime"
                onClick={() => handleInstantLogin("olakazeem@gmail.com", "admin123")}
                className="w-full text-xs py-1.5 font-bold shadow-sm"
              >
                ⚡ 1-Click Sign In as Ola Kazeem (Admin)
              </Button>
            </div>

            {/* Secondary Admin: GardiaLab System Admin */}
            <div className="rounded-lg bg-background/50 border border-border p-2 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">GardiaLab System Administrator</span>
                <span className="text-[10px] rounded bg-muted text-muted-foreground font-mono px-1.5 py-0.2">
                  admin
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono flex flex-wrap justify-between">
                <span>admin@e-lab.ng</span>
                <span>pass: <b>admin123</b></span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleInstantLogin("admin@e-lab.ng", "admin123")}
                className="w-full text-xs py-1 font-semibold"
              >
                Sign In as System Admin (admin@e-lab.ng)
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            <Link to="/dashboard" className="text-teal hover:underline font-medium">
              ← Return to Student Hub
            </Link>
            <Link to="/login" className="hover:underline">
              Standard User Login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface AdminUnauthorizedGateProps {
  user: User;
  onSwitch: () => void;
}

export function AdminUnauthorizedGate({ user, onSwitch }: AdminUnauthorizedGateProps) {
  const nav = useNavigate();

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8 text-center border-warning/40 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/20 text-3xl">
          🛡️
        </div>

        <h1 className="mt-4 text-xl font-bold text-primary">Access Restricted</h1>
        <div className="mt-1 inline-block rounded-full bg-destructive/15 px-3 py-0.5 text-xs font-bold text-destructive">
          Insufficient Administrative Clearance
        </div>

        <div className="mt-4 rounded-xl bg-accent/40 border border-border p-3.5 text-left text-xs space-y-1.5">
          <div className="text-muted-foreground">Currently authenticated as:</div>
          <div className="font-bold text-sm text-primary">{user.name}</div>
          <div className="font-mono text-muted-foreground">{user.email}</div>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Account Type:</span>
            <span className="font-semibold text-teal capitalize">{user.accountType}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-semibold text-muted-foreground uppercase">{user.role}</span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          The <code>/admin</code> module contains sensitive student records, Nigerian state analytics, and university catalog controls. You must sign in with an account that has <strong>admin</strong> privileges.
        </p>

        <div className="mt-6 space-y-2">
          <Button
            variant="primary"
            onClick={() => {
              actions.logout();
              onSwitch();
            }}
            className="w-full py-2.5 font-bold"
          >
            Sign Out & Switch to Admin Account
          </Button>

          <Button
            variant="outline"
            onClick={() => nav({ to: "/dashboard" })}
            className="w-full py-2.5"
          >
            Return to Student Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface AdminHeaderBarProps {
  user: User;
  onOpenProfile: () => void;
}

export function AdminHeaderBar({ user, onOpenProfile }: AdminHeaderBarProps) {
  const nav = useNavigate();

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/30 bg-card p-3 sm:p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-grad text-base font-extrabold text-lime shadow-sm">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <span
            title="Session active and verified"
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-primary">{user.name}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-extrabold text-primary uppercase">
              Root Admin
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{user.email}</span>
            <span>•</span>
            <span className="text-success font-medium flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Authenticated Session
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={onOpenProfile}
          className="text-xs py-1.5 px-3"
        >
          ⚙ Admin Profile & Credentials
        </Button>

        <Button
          variant="ghost"
          onClick={() => nav({ to: "/dashboard" })}
          className="text-xs py-1.5 px-3 text-teal"
        >
          View Student Hub ↗
        </Button>

        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Sign out and lock the administrative console?")) {
              actions.logout();
              nav({ to: "/login" });
            }
          }}
          className="text-xs py-1.5 px-3 font-semibold"
        >
          Lock Console / Sign Out
        </Button>
      </div>
    </div>
  );
}

interface AdminProfileModalProps {
  user: User;
  onClose: () => void;
}

export function AdminProfileModal({ user, onClose }: AdminProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      actions.adminUpdateProfile(user.id, {
        name,
        email,
        password: password.trim() ? password : undefined,
      });
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to update admin profile");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 bg-card border-teal shadow-2xl fade-up">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-bold text-primary flex items-center gap-2">
            <span>🛡️</span> Administrator Profile & Security
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-destructive/15 border border-destructive/20 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {saved && (
          <div className="mt-3 rounded-lg bg-success/15 border border-success/20 p-2.5 text-xs text-success font-medium">
            Admin profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Admin Display Name">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lead Administrator"
            />
          </Field>

          <Field label="Admin Login Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@e-lab.ng"
            />
          </Field>

          <Field label="Change Password (leave empty to keep current)">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (optional)"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-primary"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </Field>

          <div className="rounded-xl bg-accent/40 p-3 text-[11px] text-muted-foreground">
            <strong>Security Tip:</strong> Updating your password will immediately apply to your future logins across the GardiaLab portal.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
              Cancel
            </Button>
            <Button variant="lime" className="text-xs font-bold">
              {saved ? "Saved ✓" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
