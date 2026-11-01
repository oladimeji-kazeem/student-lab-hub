import { useState, useMemo } from "react";
import { Card, Badge, Button, Input, Field } from "@/components/ui-kit";
import {
  actions,
  useStore,
  hasAccess,
  formatNaira,
  type Env,
  type User,
  type Role,
  type UserStatus,
  type AccountType,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const ENVS: Env[] = ["python", "r", "vscode", "notebook"];

export function UserManagement() {
  const users = useStore((s) => s.users);
  const institutions = useStore((s) => s.institutions);
  const departments = useStore((s) => s.departments);
  const courses = useStore((s) => s.courses);
  const states = useStore((s) => s.states);
  const organizations = useStore((s) => s.organizations);
  const payments = useStore((s) => s.payments);
  const accessLogs = useStore((s) => s.accessLogs);

  // Filters & Search
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "student" | "lecturer" | "non-academic" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "suspended" | "expired">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [envFilter, setEnvFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name" | "expiration">("newest");

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // New User Form State
  const initialNewUserForm = {
    name: "",
    email: "",
    password: "",
    role: "user" as Role,
    status: "active" as UserStatus,
    accountType: "student" as AccountType,
    institution: institutions[0]?.name || "University of Lagos",
    department: departments[0]?.name || "Computer Science",
    course: courses[0]?.name || "Computer Science",
    degree: "B.Sc. (Bachelor of Science)",
    currentRole: "",
    employer: organizations[0]?.name || "Tech Hub Nigeria",
    stateOfResidence: states[0]?.name || "Lagos",
    accessDuration: "30", // in days: "0", "7", "30", "120", "365", "permanent"
    envs: ["python", "r", "vscode", "notebook"] as Env[],
  };
  const [newUserForm, setNewUserForm] = useState(initialNewUserForm);
  const [newUserError, setNewUserError] = useState("");

  // Edit User State
  const [resetPwValue, setResetPwValue] = useState("");
  const [editSuccessMsg, setEditSuccessMsg] = useState("");

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Query match
        const searchStr = (
          u.name +
          " " +
          u.email +
          " " +
          (u.institution || "") +
          " " +
          (u.department || "") +
          " " +
          (u.course || "") +
          " " +
          (u.currentRole || "") +
          " " +
          (u.employer || "") +
          " " +
          (u.stateOfResidence || "")
        ).toLowerCase();
        const matchesQuery = !q.trim() || searchStr.includes(q.toLowerCase());

        // Account Type / Admin filter
        const matchesType =
          typeFilter === "all"
            ? true
            : typeFilter === "admin"
              ? u.role === "admin"
              : u.accountType === typeFilter;

        // Status filter
        const isExpired = !!u.accessUntil && new Date(u.accessUntil) <= new Date();
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "expired"
              ? isExpired
              : u.status === statusFilter;

        // State filter
        const userState = u.stateOfResidence || "";
        const matchesState = stateFilter === "all" || userState.toLowerCase() === stateFilter.toLowerCase();

        // Environment filter
        const matchesEnv =
          envFilter === "all" ? true : u.envs && u.envs.includes(envFilter as Env);

        return matchesQuery && matchesType && matchesStatus && matchesState && matchesEnv;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "expiration") {
          const timeA = a.accessUntil ? new Date(a.accessUntil).getTime() : 0;
          const timeB = b.accessUntil ? new Date(b.accessUntil).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [users, q, typeFilter, statusFilter, stateFilter, envFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => hasAccess(u)).length;
    const students = users.filter((u) => u.accountType === "student" && u.role !== "admin").length;
    const lecturers = users.filter((u) => u.accountType === "lecturer").length;
    const professionals = users.filter((u) => u.accountType === "non-academic").length;
    const admins = users.filter((u) => u.role === "admin").length;
    const pendingSuspended = users.filter((u) => u.status === "pending" || u.status === "suspended").length;
    const expired = users.filter((u) => !!u.accessUntil && new Date(u.accessUntil) <= new Date()).length;

    return { total, active, students, lecturers, professionals, admins, pendingSuspended, expired };
  }, [users]);

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBulkActivate = () => {
    actions.bulkUpdateUserStatus(selectedIds, "active");
    setSelectedIds([]);
  };

  const handleBulkSuspend = () => {
    actions.bulkUpdateUserStatus(selectedIds, "suspended");
    setSelectedIds([]);
  };

  const handleBulkExtendAccess = (days = 30) => {
    actions.bulkExtendUserAccess(selectedIds, days);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Permanently delete ${selectedIds.length} selected user(s)?`)) {
      actions.bulkDeleteUsers(selectedIds);
      setSelectedIds([]);
    }
  };

  // Export
  const exportCsv = () => {
    const headers = [
      "User ID",
      "Full Name",
      "Email Address",
      "Role",
      "Status",
      "Account Type",
      "Academic Institution",
      "Department",
      "Course of Study",
      "Degree Level",
      "Professional Role",
      "Employer / Organization",
      "State of Residence (Nigeria)",
      "Lab Access Valid Until",
      "Enabled Environments",
      "Registered Date",
    ];

    const rows = filteredUsers.map((u) => [
      `"${u.id}"`,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.accountType || "student"}"`,
      `"${u.institution || ""}"`,
      `"${u.department || ""}"`,
      `"${u.course || ""}"`,
      `"${u.degree || ""}"`,
      `"${u.currentRole || ""}"`,
      `"${u.employer || ""}"`,
      `"${u.stateOfResidence || ""}"`,
      `"${u.accessUntil ? new Date(u.accessUntil).toISOString().slice(0, 10) : "N/A"}"`,
      `"${(u.envs || []).join("; ")}"`,
      `"${u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elab_users_directory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportJson = () => {
    const dataStr = JSON.stringify(filteredUsers, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elab_users_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Helper to generate a random temporary password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    let pw = "";
    for (let i = 0; i < 10; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pw;
  };

  return (
    <div className="space-y-5 fade-up">
      {/* 1. Metric Header Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Total Users</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">{stats.total}</div>
        </Card>
        <Card className="p-3.5 border-success/30">
          <div className="text-[10px] font-bold uppercase text-success truncate">Active Access</div>
          <div className="mt-1 text-2xl font-extrabold text-success">{stats.active}</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-teal truncate">Students</div>
          <div className="mt-1 text-2xl font-extrabold text-teal">{stats.students}</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-primary truncate">Lecturers</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">{stats.lecturers}</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-brand truncate">Professionals</div>
          <div className="mt-1 text-2xl font-extrabold text-foreground">{stats.professionals}</div>
        </Card>
        <Card className="p-3.5 border-lime/40">
          <div className="text-[10px] font-bold uppercase text-lime-foreground font-bold truncate">Admins</div>
          <div className="mt-1 text-2xl font-extrabold text-lime-foreground">{stats.admins}</div>
        </Card>
        <Card className="p-3.5 border-warning/30">
          <div className="text-[10px] font-bold uppercase text-warning truncate">Pending / Suspend</div>
          <div className="mt-1 text-2xl font-extrabold text-warning">{stats.pendingSuspended}</div>
        </Card>
        <Card className="p-3.5 border-destructive/20">
          <div className="text-[10px] font-bold uppercase text-destructive truncate">Expired Access</div>
          <div className="mt-1 text-2xl font-extrabold text-destructive">{stats.expired}</div>
        </Card>
      </div>

      {/* 2. Search, Filter & Action Toolbar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
              <Input
                placeholder="Search by name, email, university, department, role, or state..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="max-w-md text-xs py-2"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="lime"
                onClick={() => {
                  setNewUserForm({
                    ...initialNewUserForm,
                    password: generateRandomPassword(),
                  });
                  setNewUserError("");
                  setIsAddingUser(true);
                }}
                className="text-xs py-2 px-3.5 font-bold shadow-sm"
              >
                + Add New User
              </Button>
              <Button variant="outline" onClick={exportCsv} className="text-xs py-2 px-3">
                📥 Export CSV
              </Button>
              <Button variant="ghost" onClick={exportJson} className="text-xs py-2 px-2.5">
                JSON
              </Button>
            </div>
          </div>

          {/* Filter Pills row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
            {/* Account Type Filters */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <span className="text-[11px] font-bold text-muted-foreground mr-1">Type:</span>
              {(
                [
                  ["all", "All Types"],
                  ["student", "Students"],
                  ["lecturer", "Lecturers"],
                  ["non-academic", "Professionals"],
                  ["admin", "Admins"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold transition touch-manipulation",
                    typeFilter === key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted bg-card border border-border/40",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired Access</option>
              </select>
            </div>

            {/* Nigerian State Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">📍 State:</span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="rounded-lg border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring max-w-[130px]"
              >
                <option value="all">All 36 States + FCT</option>
                {states.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} State
                  </option>
                ))}
              </select>
            </div>

            {/* Environment Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground">Lab Kernel:</span>
              <select
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                className="rounded-lg border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="all">All Environments</option>
                <option value="python">Python</option>
                <option value="r">R Lab</option>
                <option value="vscode">VS Code</option>
                <option value="notebook">Notebook</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-bold text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-input bg-card px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="expiration">Access Expiration</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Bulk Actions Toolbar (Active when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-teal/15 border border-teal/30 p-3 text-xs fade-up">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
              ✓ {selectedIds.length} user(s) selected
            </span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-muted-foreground hover:underline ml-2"
            >
              Deselect All
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="lime" onClick={handleBulkActivate} className="text-xs py-1 px-3">
              Bulk Activate
            </Button>
            <Button variant="outline" onClick={() => handleBulkExtendAccess(30)} className="text-xs py-1 px-3">
              Extend +30 Days Access
            </Button>
            <Button variant="ghost" onClick={handleBulkSuspend} className="text-xs py-1 px-3 text-warning">
              Suspend Selected
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} className="text-xs py-1 px-3">
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* 4. Users Table */}
      <Card>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[850px]">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="py-3 px-2 w-8">
                  <input
                    type="checkbox"
                    checked={
                      filteredUsers.length > 0 &&
                      selectedIds.length === filteredUsers.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </th>
                <th className="py-3">User & Credentials</th>
                <th>Category & Role</th>
                <th>Affiliation / Location (Nigeria)</th>
                <th>Lab Access & Status</th>
                <th>Environments</th>
                <th className="text-right py-3 pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                const hasValidAccess = hasAccess(u);
                const isExpired = !!u.accessUntil && new Date(u.accessUntil) <= new Date();

                return (
                  <tr
                    key={u.id}
                    className={cn(
                      "hover:bg-muted/30 transition",
                      isSelected && "bg-teal/5",
                    )}
                  >
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(u.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-primary flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.email.toLowerCase() === "olakazeem@gmail.com" ? (
                              <span className="rounded bg-primary/20 border border-primary/40 px-1.5 py-0.2 text-[9px] font-extrabold text-primary uppercase">
                                🛡️ Primary Admin
                              </span>
                            ) : u.role === "admin" ? (
                              <span className="rounded bg-lime/25 px-1.5 py-0.2 text-[9px] font-extrabold text-lime-foreground uppercase">
                                Admin
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs font-mono text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <span
                          className={cn(
                            "inline-block rounded px-2 py-0.5 text-[11px] font-bold capitalize",
                            u.accountType === "lecturer"
                              ? "bg-primary/10 text-primary"
                              : u.accountType === "non-academic"
                                ? "bg-accent text-accent-foreground"
                                : "bg-teal/15 text-teal",
                          )}
                        >
                          {u.accountType || "student"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {u.accountType === "non-academic" ? (
                        <div>
                          <div className="text-xs font-semibold text-foreground">
                            {u.currentRole || "Professional"}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                            <span>{u.employer || "Private Organization"}</span>
                            {u.stateOfResidence && (
                              <span className="text-teal font-medium">📍 {u.stateOfResidence}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-semibold text-foreground truncate max-w-[200px]">
                            {u.institution || "Higher Institution"}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {u.department ? `Dept: ${u.department}` : ""}
                            {u.course ? ` (${u.course})` : ""}
                          </div>
                          {u.degree && (
                            <div className="text-[10px] text-teal truncate">{u.degree}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge v={u.status} />
                          {hasValidAccess ? (
                            <span className="text-[10px] text-success font-semibold">Active</span>
                          ) : isExpired ? (
                            <span className="text-[10px] text-destructive font-semibold">Expired</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No Access</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {u.accessUntil ? (
                            <span>Expires: {new Date(u.accessUntil).toLocaleDateString()}</span>
                          ) : (
                            <span>No expiration date</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(u.envs || []).map((env) => (
                          <span
                            key={env}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-foreground uppercase"
                          >
                            {env === "notebook" ? "📓 Notebook" : env}
                          </span>
                        ))}
                        {(!u.envs || u.envs.length === 0) && (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          onClick={() => setViewingUser(u)}
                          className="py-1 px-2 text-xs text-teal font-medium"
                          title="View complete user dossier and logs"
                        >
                          Dossier
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingUser(u);
                            setResetPwValue("");
                            setEditSuccessMsg("");
                          }}
                          className="py-1 px-2.5 text-xs font-semibold"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            actions.bulkExtendUserAccess([u.id], 30);
                          }}
                          className="py-1 px-2 text-xs text-lime-foreground font-bold hover:bg-lime/20"
                          title="Quick extend lab access by 30 days"
                        >
                          +30d
                        </Button>
                        {u.email.toLowerCase() === "olakazeem@gmail.com" ? (
                          <span
                            className="inline-flex items-center justify-center h-6 px-1.5 rounded bg-primary/10 text-primary text-[10px] font-bold"
                            title="Primary system administrator cannot be deleted"
                          >
                            🔒 Locked
                          </span>
                        ) : (
                          <Button
                            variant="danger"
                            onClick={() => {
                              if (confirm(`Permanently delete user "${u.name}" (${u.email})?`)) {
                                actions.deleteUser(u.id);
                              }
                            }}
                            className="py-1 px-2 text-xs"
                            title="Delete user"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="text-2xl mb-1">🔍</div>
                    <p className="font-semibold text-foreground">No users match your current search and filters.</p>
                    <p className="text-xs mt-1">Try resetting the search bar or clearing category filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div>
            Showing <b className="text-foreground">{filteredUsers.length}</b> of{" "}
            <b className="text-foreground">{users.length}</b> total platform accounts
          </div>
          <div className="flex items-center gap-2">
            <span>Coverage: 36 Nigerian States + FCT Abuja</span>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 5. ADD NEW USER MODAL */}
      {/* ========================================================================= */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-teal shadow-2xl fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-primary text-base">Create New Platform User</h3>
                <p className="text-xs text-muted-foreground">
                  Direct administrative provisioning for students, lecturers, professionals, or administrators.
                </p>
              </div>
              <button
                onClick={() => setIsAddingUser(false)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {newUserError && (
              <div className="mt-3 rounded-lg bg-destructive/15 border border-destructive/20 p-2.5 text-xs text-destructive">
                {newUserError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewUserError("");

                if (!newUserForm.name.trim()) {
                  setNewUserError("Full name is required.");
                  return;
                }
                if (!newUserForm.email.trim()) {
                  setNewUserError("Email address is required.");
                  return;
                }
                if (!newUserForm.password) {
                  setNewUserError("Password is required.");
                  return;
                }

                // Compute access expiration date
                let accessUntil: string | undefined = undefined;
                if (newUserForm.accessDuration !== "0") {
                  if (newUserForm.accessDuration === "permanent") {
                    accessUntil = new Date(Date.now() + 3650 * 864e5).toISOString();
                  } else {
                    const days = parseInt(newUserForm.accessDuration, 10) || 30;
                    accessUntil = new Date(Date.now() + days * 864e5).toISOString();
                  }
                }

                try {
                  actions.createUser({
                    name: newUserForm.name,
                    email: newUserForm.email,
                    password: newUserForm.password,
                    role: newUserForm.role,
                    status: newUserForm.status,
                    accountType: newUserForm.accountType,
                    institution:
                      newUserForm.accountType !== "non-academic"
                        ? newUserForm.institution
                        : undefined,
                    department:
                      newUserForm.accountType !== "non-academic"
                        ? newUserForm.department
                        : undefined,
                    course:
                      newUserForm.accountType !== "non-academic"
                        ? newUserForm.course
                        : undefined,
                    degree:
                      newUserForm.accountType !== "non-academic"
                        ? newUserForm.degree
                        : undefined,
                    currentRole:
                      newUserForm.accountType === "non-academic"
                        ? newUserForm.currentRole
                        : undefined,
                    employer:
                      newUserForm.accountType === "non-academic"
                        ? newUserForm.employer
                        : undefined,
                    stateOfResidence: newUserForm.stateOfResidence,
                    envs: newUserForm.envs,
                    accessUntil,
                  });
                  setIsAddingUser(false);
                } catch (err: any) {
                  setNewUserError(err?.message || "Failed to create user.");
                }
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full Name">
                  <Input
                    required
                    placeholder="e.g. Oluwaseun Adeleke"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Email Address">
                  <Input
                    type="email"
                    required
                    placeholder="e.g. o.adeleke@university.edu.ng"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Password">
                  <div className="flex gap-2">
                    <Input
                      required
                      placeholder="Password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setNewUserForm({
                          ...newUserForm,
                          password: generateRandomPassword(),
                        })
                      }
                      className="text-xs whitespace-nowrap"
                    >
                      🎲 Generate
                    </Button>
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Account Type">
                    <select
                      value={newUserForm.accountType}
                      onChange={(e) =>
                        setNewUserForm({
                          ...newUserForm,
                          accountType: e.target.value as AccountType,
                        })
                      }
                      className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="student">Student</option>
                      <option value="lecturer">Lecturer</option>
                      <option value="non-academic">Professional</option>
                    </select>
                  </Field>

                  <Field label="System Role">
                    <select
                      value={newUserForm.role}
                      onChange={(e) =>
                        setNewUserForm({ ...newUserForm, role: e.target.value as Role })
                      }
                      className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="user">Standard User</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </Field>
                </div>
              </div>

              {/* Conditional Fields based on Account Type */}
              {newUserForm.accountType === "non-academic" ? (
                <div className="rounded-xl bg-accent/30 p-3.5 border border-border space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                    Professional Affiliation Details
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Current Job Title / Role">
                      <Input
                        placeholder="e.g. Lead Data Scientist"
                        value={newUserForm.currentRole}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, currentRole: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Employer / Company">
                      <select
                        value={newUserForm.employer}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, employer: e.target.value })
                        }
                        className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.name}>
                            {org.name} ({org.sector})
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-accent/30 p-3.5 border border-border space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                    Academic Institution & Department
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Higher Institution">
                      <select
                        value={newUserForm.institution}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, institution: e.target.value })
                        }
                        className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.name}>
                            {inst.name} ({inst.category})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Academic Department">
                      <select
                        value={newUserForm.department}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, department: e.target.value })
                        }
                        className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name} ({dept.faculty})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Course of Study">
                      <select
                        value={newUserForm.course}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, course: e.target.value })
                        }
                        className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        {courses.map((course) => (
                          <option key={course.id} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Degree Level">
                      <Input
                        placeholder="e.g. B.Sc. (Bachelor of Science)"
                        value={newUserForm.degree}
                        onChange={(e) =>
                          setNewUserForm({ ...newUserForm, degree: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )}

              {/* State & Duration */}
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="State of Residence (Nigeria)">
                  <select
                    value={newUserForm.stateOfResidence}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, stateOfResidence: e.target.value })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} State ({st.zone})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Initial Status">
                  <select
                    value={newUserForm.status}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, status: e.target.value as UserStatus })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </Field>

                <Field label="Lab Access Duration">
                  <select
                    value={newUserForm.accessDuration}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, accessDuration: e.target.value })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="0">No Paid Access (Trial)</option>
                    <option value="7">7 Days (Weekly)</option>
                    <option value="30">30 Days (Monthly)</option>
                    <option value="120">120 Days (Semester)</option>
                    <option value="365">1 Year (Annual)</option>
                    <option value="permanent">Unlimited / Permanent</option>
                  </select>
                </Field>
              </div>

              {/* Environments */}
              <Field label="Accessible Coding Lab Environments">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {ENVS.map((env) => (
                    <label
                      key={env}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-xs cursor-pointer hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={newUserForm.envs.includes(env)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...newUserForm.envs, env]
                            : newUserForm.envs.filter((x) => x !== env);
                          setNewUserForm({ ...newUserForm, envs: updated });
                        }}
                      />
                      <span className="capitalize font-semibold">
                        {env === "notebook" ? "📓 Notebook" : env}
                      </span>
                    </label>
                  ))}
                </div>
              </Field>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsAddingUser(false)} className="text-xs">
                  Cancel
                </Button>
                <Button variant="lime" className="text-xs font-bold">
                  Create User Account
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. EDIT USER MODAL */}
      {/* ========================================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-teal shadow-2xl fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-primary text-base">Edit User: {editingUser.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {editSuccessMsg && (
              <div className="mt-3 rounded-lg bg-success/15 border border-success/30 p-2.5 text-xs text-success font-medium">
                {editSuccessMsg}
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full Name">
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  />
                </Field>
                <Field label="Email Address">
                  <Input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Account Category">
                  <select
                    value={editingUser.accountType}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        accountType: e.target.value as AccountType,
                      })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="non-academic">Professional</option>
                  </select>
                </Field>

                <Field label="System Role">
                  <select
                    value={editingUser.role}
                    disabled={editingUser.email.toLowerCase() === "olakazeem@gmail.com"}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        role: e.target.value as Role,
                      })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {editingUser.email.toLowerCase() === "olakazeem@gmail.com" && (
                    <span className="text-[10px] text-primary font-semibold mt-1 block">
                      🛡️ Primary Administrator: Admin role is permanent
                    </span>
                  )}
                </Field>

                <Field label="Status">
                  <select
                    value={editingUser.status}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        status: e.target.value as UserStatus,
                      })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </Field>
              </div>

              {/* Affiliation / Location */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="State of Residence in Nigeria">
                  <select
                    value={editingUser.stateOfResidence || "Lagos"}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, stateOfResidence: e.target.value })
                    }
                    className="w-full rounded-lg border border-input bg-card px-2.5 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} State ({st.zone})
                      </option>
                    ))}
                  </select>
                </Field>

                {editingUser.accountType === "non-academic" ? (
                  <Field label="Employer / Organization">
                    <Input
                      value={editingUser.employer || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, employer: e.target.value })
                      }
                      placeholder="e.g. Flutterwave, Paystack, NNPC"
                    />
                  </Field>
                ) : (
                  <Field label="Higher Institution">
                    <Input
                      value={editingUser.institution || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, institution: e.target.value })
                      }
                      placeholder="University name"
                    />
                  </Field>
                )}
              </div>

              {/* Access Duration Controls */}
              <div className="rounded-xl bg-accent/30 p-3.5 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                    Lab Access Duration & Extension
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Current:{" "}
                    <b>
                      {editingUser.accessUntil
                        ? new Date(editingUser.accessUntil).toLocaleDateString()
                        : "No expiration"}
                    </b>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs py-1 px-2.5"
                    onClick={() => {
                      const base =
                        editingUser.accessUntil && new Date(editingUser.accessUntil) > new Date()
                          ? new Date(editingUser.accessUntil).getTime()
                          : Date.now();
                      setEditingUser({
                        ...editingUser,
                        status: "active",
                        accessUntil: new Date(base + 7 * 864e5).toISOString(),
                      });
                    }}
                  >
                    +7 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs py-1 px-2.5"
                    onClick={() => {
                      const base =
                        editingUser.accessUntil && new Date(editingUser.accessUntil) > new Date()
                          ? new Date(editingUser.accessUntil).getTime()
                          : Date.now();
                      setEditingUser({
                        ...editingUser,
                        status: "active",
                        accessUntil: new Date(base + 30 * 864e5).toISOString(),
                      });
                    }}
                  >
                    +30 Days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs py-1 px-2.5"
                    onClick={() => {
                      const base =
                        editingUser.accessUntil && new Date(editingUser.accessUntil) > new Date()
                          ? new Date(editingUser.accessUntil).getTime()
                          : Date.now();
                      setEditingUser({
                        ...editingUser,
                        status: "active",
                        accessUntil: new Date(base + 120 * 864e5).toISOString(),
                      });
                    }}
                  >
                    +120 Days (Semester)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs py-1 px-2.5"
                    onClick={() => {
                      setEditingUser({
                        ...editingUser,
                        status: "active",
                        accessUntil: new Date(Date.now() + 3650 * 864e5).toISOString(),
                      });
                    }}
                  >
                    Unlimited / Permanent
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs py-1 px-2 text-destructive ml-auto"
                    onClick={() => {
                      setEditingUser({
                        ...editingUser,
                        accessUntil: undefined,
                      });
                    }}
                  >
                    Revoke Access
                  </Button>
                </div>
              </div>

              {/* Lab Environments */}
              <Field label="Accessible Environments">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {ENVS.map((env) => (
                    <label
                      key={env}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-xs cursor-pointer hover:bg-muted/40"
                    >
                      <input
                        type="checkbox"
                        checked={editingUser.envs.includes(env)}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [...editingUser.envs, env]
                            : editingUser.envs.filter((x) => x !== env);
                          setEditingUser({ ...editingUser, envs: updated });
                        }}
                      />
                      <span className="capitalize font-semibold">
                        {env === "notebook" ? "📓 Notebook" : env}
                      </span>
                    </label>
                  ))}
                </div>
              </Field>

              {/* Password Reset Section */}
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">Direct Password Reset</span>
                  <span className="text-[11px] text-muted-foreground">Optional</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter new password for this user"
                    value={resetPwValue}
                    onChange={(e) => setResetPwValue(e.target.value)}
                    className="text-xs py-1.5"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs whitespace-nowrap py-1 px-2.5"
                    onClick={() => setResetPwValue(generateRandomPassword())}
                  >
                    🎲 Generate
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!resetPwValue.trim()}
                    className="text-xs whitespace-nowrap py-1 px-3"
                    onClick={() => {
                      actions.resetPassword(editingUser.id, resetPwValue);
                      setEditSuccessMsg(`Password successfully reset to: ${resetPwValue}`);
                      setResetPwValue("");
                    }}
                  >
                    Apply New Password
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="danger"
                  className="text-xs"
                  onClick={() => {
                    if (confirm(`Permanently delete user "${editingUser.name}"?`)) {
                      actions.deleteUser(editingUser.id);
                      setEditingUser(null);
                    }
                  }}
                >
                  Delete User Account
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingUser(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="lime"
                    className="text-xs font-bold"
                    onClick={() => {
                      actions.updateUser(editingUser.id, editingUser);
                      setEditSuccessMsg("User changes saved successfully!");
                      setTimeout(() => setEditingUser(null), 800);
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. USER DOSSIER (COMPLETE PROFILE VIEW & LOGS) */}
      {/* ========================================================================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-card border-teal shadow-2xl fade-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-base font-extrabold text-primary">
                  {viewingUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-primary text-base flex items-center gap-2">
                    <span>{viewingUser.name}</span>
                    <Badge v={viewingUser.status} />
                  </h3>
                  <div className="text-xs font-mono text-muted-foreground">{viewingUser.email}</div>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Profile Details Grid */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-accent/30 p-4 border border-border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Category:</span>
                  <span className="font-bold text-primary capitalize text-sm">
                    {viewingUser.accountType}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">System Role:</span>
                  <span className="font-bold text-primary capitalize text-sm">
                    {viewingUser.role}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Nigerian State Location:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <span>📍</span> {viewingUser.stateOfResidence || "Lagos"} State
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Account Created:</span>
                  <span className="font-mono text-foreground">
                    {new Date(viewingUser.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-1 border-t border-border/50">
                  <span className="text-muted-foreground block text-[11px]">Affiliation Details:</span>
                  <span className="font-semibold text-foreground">
                    {viewingUser.accountType === "non-academic"
                      ? `${viewingUser.currentRole || "Professional"} at ${viewingUser.employer || "Private Organization"}`
                      : `${viewingUser.institution || "Higher Institution"} · ${viewingUser.department || "General"} · ${viewingUser.course || "Degree Candidate"}`}
                  </span>
                </div>
              </div>

              {/* Lab Access & Entitlements */}
              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">Lab Access Entitlements:</span>
                  <span
                    className={cn(
                      "font-bold text-xs",
                      hasAccess(viewingUser) ? "text-success" : "text-destructive",
                    )}
                  >
                    {hasAccess(viewingUser) ? "Access Active ✓" : "Expired / Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Expiration Date:</span>
                  <span className="font-mono">
                    {viewingUser.accessUntil
                      ? new Date(viewingUser.accessUntil).toLocaleDateString()
                      : "No access expiration set"}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1">Active Coding Environments:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(viewingUser.envs || []).map((env) => (
                      <span
                        key={env}
                        className="rounded bg-teal/15 px-2 py-0.5 font-mono text-[11px] font-bold text-teal uppercase"
                      >
                        {env}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Payment History */}
              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">Payment & Subscription Transactions:</span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {payments.filter((p) => p.userId === viewingUser.id).length} recorded
                  </span>
                </div>

                <div className="divide-y divide-border/60">
                  {payments
                    .filter((p) => p.userId === viewingUser.id)
                    .map((p) => (
                      <div key={p.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-primary">{formatNaira(p.amount)}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.bank} · Ref: <span className="font-mono">{p.reference}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge v={p.status} />
                          <div className="text-[10px] text-muted-foreground mt-0.5">{p.paidOn}</div>
                        </div>
                      </div>
                    ))}
                  {payments.filter((p) => p.userId === viewingUser.id).length === 0 && (
                    <div className="py-3 text-center text-muted-foreground italic text-xs">
                      No payment records logged for this user.
                    </div>
                  )}
                </div>
              </div>

              {/* User Telemetry & Recent Activity Logs */}
              <div className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">Live Activity Telemetry:</span>
                  <span className="text-[11px] text-muted-foreground">Last 5 Sessions</span>
                </div>

                <div className="divide-y divide-border/60">
                  {accessLogs
                    .filter((l) => l.userName.toLowerCase().includes(viewingUser.name.toLowerCase()))
                    .slice(0, 5)
                    .map((log) => (
                      <div key={log.id} className="py-2 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{log.action}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {log.page} · 📍 {log.state} State · {log.device}
                          </div>
                        </div>
                        <div className="text-right text-muted-foreground text-[10px] whitespace-nowrap">
                          {log.time}
                        </div>
                      </div>
                    ))}
                  {accessLogs.filter((l) =>
                    l.userName.toLowerCase().includes(viewingUser.name.toLowerCase()),
                  ).length === 0 && (
                    <div className="py-3 text-center text-muted-foreground italic text-xs">
                      No telemetry logs recorded yet for this session.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setViewingUser(null)} className="text-xs">
                  Close Dossier
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
