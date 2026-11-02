import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { actions, useCurrentUser, hasAccess } from "@/lib/store";

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden="true"
    >
      {/* Top Layer: Teal Isometric Diamond */}
      <polygon points="120,8 230,68 120,128 10,68" fill="#189B9B" />
      {/* Middle Layer: Lime Green Isometric Chevron */}
      <polygon points="10,122 120,182 230,122 195,103 120,144 45,103" fill="#81B825" />
      {/* Bottom Layer: Navy Blue Isometric Chevron */}
      <polygon points="10,176 120,236 230,176 195,157 120,198 45,157" fill="#071E5D" />
    </svg>
  );
}

export function Logo({ light, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
      <span
        className={cn(
          "grid place-items-center rounded-xl transition-all",
          light ? "bg-white p-1.5 shadow-sm" : "p-0.5",
        )}
      >
        <LogoIcon
          className={cn(size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-7 w-7")}
        />
      </span>
      <span
        className={cn(
          "font-display tracking-tight font-extrabold whitespace-nowrap",
          size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg",
          light ? "text-primary-foreground" : "text-primary",
        )}
      >
        e-Lab
      </span>
    </Link>
  );
}

type BtnVariant = "primary" | "lime" | "ghost" | "outline" | "danger";
const variants: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90 shadow-card",
  lime: "bg-lime text-lime-foreground hover:brightness-95 shadow-glow",
  ghost: "hover:bg-muted text-foreground",
  outline: "border border-border bg-card hover:bg-muted text-foreground",
  danger: "bg-destructive text-destructive-foreground hover:opacity-90",
};
export function Button({
  variant = "primary",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 touch-manipulation",
        variants[variant],
        className,
      )}
    />
  );
}
export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...p}
      className={cn(
        "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[40px]",
        p.className,
      )}
    />
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("glass rounded-2xl p-4 sm:p-5 shadow-card fade-up overflow-hidden", className)}>
      {children}
    </div>
  );
}
const badge: Record<string, string> = {
  active: "bg-success/15 text-success",
  approved: "bg-success/15 text-success",
  pending: "bg-warning/20 text-warning",
  suspended: "bg-destructive/15 text-destructive",
  rejected: "bg-destructive/15 text-destructive",
  admin: "bg-primary/10 text-primary",
  user: "bg-teal/15 text-teal",
};
export function Badge({ v }: { v: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        badge[v] ?? "bg-muted text-muted-foreground",
      )}
    >
      {v}
    </span>
  );
}

const userNav = [
  { to: "/dashboard", label: "Overview", icon: "◧" },
  { to: "/payment", label: "Payments", icon: "₦" },
  { to: "/resources", label: "Library", icon: "📚" },
  { to: "/lab/notebook", label: "Notebook", icon: "📓" },
  { to: "/lab/python", label: "Python Lab", icon: "Py" },
  { to: "/lab/r", label: "R Lab", icon: "R" },
  { to: "/lab/sql", label: "SQL Lab", icon: "SQL" },
  { to: "/lab/powerbi", label: "Power BI", icon: "📊" },
  { to: "/lab/vscode", label: "VS Code", icon: "{}" },
] as const;

export function AppShell({
  title,
  children,
  admin,
}: {
  title: string;
  children: ReactNode;
  admin?: boolean;
}) {
  const user = useCurrentUser();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!user) nav({ to: "/login" });
      else if (admin && user.role !== "admin") nav({ to: "/dashboard" });
    }, 50);
    return () => clearTimeout(t);
  }, [user, admin, nav]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [loc.pathname]);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sticky Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar-grad p-4 text-primary-foreground md:flex">
        <Logo light />
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {userNav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-primary-foreground/10",
                loc.pathname === n.to && "bg-primary-foreground/15 font-semibold",
              )}
            >
              <span className="w-6 text-center font-mono text-xs text-lime">{n.icon}</span>
              {n.label}
            </Link>
          ))}
          {user.role === "admin" && (
            <Link
              to="/admin"
              className={cn(
                "mt-4 flex items-center gap-3 rounded-lg bg-lime/15 px-3 py-2 text-sm font-semibold text-lime",
                loc.pathname === "/admin" && "bg-lime text-lime-foreground",
              )}
            >
              <span className="w-6 text-center">⚙</span>Admin console
            </Link>
          )}
        </nav>
        <div className="rounded-xl bg-primary-foreground/10 p-3 text-xs">
          <div className="font-semibold truncate">{user.name}</div>
          <div className="opacity-70 truncate">{user.email}</div>
          {user.institution ? (
            <div className="mt-1 text-[11px] text-teal truncate">🏛 {user.institution}</div>
          ) : user.employer ? (
            <div className="mt-1 text-[11px] text-teal truncate">💼 {user.employer}</div>
          ) : user.currentRole ? (
            <div className="mt-1 text-[11px] text-teal truncate">💼 {user.currentRole}</div>
          ) : null}
          {user.department && (
            <div className="text-[10px] text-lime truncate">📚 {user.department}</div>
          )}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                hasAccess(user) ? "bg-success" : "bg-warning",
              )}
            />
            <span>{hasAccess(user) ? "Access active" : "Awaiting approval"}</span>
          </div>
          <button
            className="mt-2.5 underline opacity-80 hover:opacity-100 transition-opacity"
            onClick={() => {
              actions.logout();
              nav({ to: "/" });
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Collapsible Sliding Drawer Menu */}
      <div
        className={cn(
          "fixed inset-0 z-50 transition-all duration-300 md:hidden",
          mobileMenuOpen ? "pointer-events-auto visible" : "pointer-events-none invisible",
        )}
      >
        {/* Backdrop overlay with smooth fade transition */}
        <div
          className={cn(
            "fixed inset-0 bg-primary/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
            mobileMenuOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Sliding drawer panel with smooth translate animation */}
        <div
          className={cn(
            "relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-sidebar-grad p-5 text-primary-foreground shadow-2xl transition-transform duration-300 ease-out",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between pb-4 border-b border-primary-foreground/15">
            <Logo light size="sm" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-2 text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground transition touch-manipulation"
              aria-label="Close navigation drawer"
            >
              <span className="text-base font-bold">✕</span>
            </button>
          </div>

          <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto">
            {userNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition hover:bg-primary-foreground/10 touch-manipulation",
                  loc.pathname === n.to && "bg-primary-foreground/15 font-semibold text-lime",
                )}
              >
                <span className="w-6 text-center font-mono text-sm text-lime">{n.icon}</span>
                {n.label}
              </Link>
            ))}
            {user.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "mt-4 flex items-center gap-3.5 rounded-lg bg-lime/15 px-3.5 py-2.5 text-sm font-semibold text-lime transition touch-manipulation",
                  loc.pathname === "/admin" && "bg-lime text-lime-foreground",
                )}
              >
                <span className="w-6 text-center">⚙</span>Admin console
              </Link>
            )}
          </nav>

          <div className="mt-auto rounded-xl bg-primary-foreground/10 p-3.5 text-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lime text-primary font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{user.name}</div>
                <div className="opacity-70 truncate text-[11px]">{user.email}</div>
              </div>
            </div>

            {user.institution ? (
              <div className="mt-1 text-[11px] text-teal truncate">🏛 {user.institution}</div>
            ) : user.employer ? (
              <div className="mt-1 text-[11px] text-teal truncate">💼 {user.employer}</div>
            ) : user.currentRole ? (
              <div className="mt-1 text-[11px] text-teal truncate">💼 {user.currentRole}</div>
            ) : null}
            {user.department && (
              <div className="text-[10px] text-lime truncate">📚 {user.department}</div>
            )}
            <div className="mt-2 flex items-center gap-1.5 border-t border-primary-foreground/10 pt-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  hasAccess(user) ? "bg-success" : "bg-warning",
                )}
              />
              <span>{hasAccess(user) ? "Access active" : "Awaiting approval"}</span>
            </div>
            <button
              className="mt-2.5 block text-[11px] text-destructive-foreground/90 underline hover:opacity-100"
              onClick={() => {
                actions.logout();
                nav({ to: "/" });
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {/* Header with Mobile Responsive Nav */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 sm:px-6 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-primary shadow-sm hover:bg-muted md:hidden touch-manipulation transition-colors"
              aria-label="Open navigation drawer"
            >
              <span className="text-sm font-bold">☰</span>
              <span className="text-xs font-semibold">Menu</span>
            </button>
            <h1 className="text-base sm:text-lg font-bold text-primary truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground mr-1">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  hasAccess(user) ? "bg-success" : "bg-warning",
                )}
              />
              {hasAccess(user) ? "Active Access" : "Pending"}
            </div>
            {user.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-lg bg-lime/20 px-2.5 py-1 text-xs font-bold text-primary hover:bg-lime/30 transition flex items-center gap-1"
              >
                <span>⚙</span>
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Content: With pb-24 on mobile to prevent bottom nav bar overlap */}
        <div className="p-4 sm:p-6 pb-24 md:pb-6">{children}</div>

        {/* Mobile Bottom Navigation Bar (Device-Friendly) */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-background/95 px-2 py-2 backdrop-blur-md shadow-lg md:hidden">
          <Link
            to="/dashboard"
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
              loc.pathname === "/dashboard" ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <span className="text-base">◧</span>
            <span className="text-[10px]">Overview</span>
          </Link>
          <Link
            to="/lab/notebook"
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
              loc.pathname === "/lab/notebook" ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <span className="text-base">📓</span>
            <span className="text-[10px]">Notebook</span>
          </Link>
          <Link
            to="/lab/python"
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
              loc.pathname === "/lab/python" ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <span className="text-base font-mono font-bold text-teal">Py</span>
            <span className="text-[10px]">Python</span>
          </Link>
          <Link
            to="/payment"
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
              loc.pathname === "/payment" ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <span className="text-base font-bold text-lime-foreground">₦</span>
            <span className="text-[10px]">Payments</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:text-primary"
          >
            <span className="text-base">☰</span>
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </main>
    </div>
  );
}
