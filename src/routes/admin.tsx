import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, Card, Badge, Button, Input, Field } from "@/components/ui-kit";
import {
  actions,
  useStore,
  hasAccess,
  formatNaira,
  type Env,
  type Plan,
  type User,
  type AccountType,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  NIGERIAN_BANKS,
  type Institution,
  type Department,
  type Course,
  type NigeriaState,
  type Organization,
  type OrganizationSector,
} from "@/lib/nigerian-academic-data";
import {
  AdminLoginGate,
  AdminUnauthorizedGate,
  AdminHeaderBar,
  AdminProfileModal,
} from "@/components/admin/AdminAuthGate";
import { UserManagement } from "@/components/admin/UserManagement";
import { WebAnalyticsModule } from "@/components/admin/WebAnalyticsModule";
import { LabAssessmentModule } from "@/components/admin/LabAssessmentModule";
import { EmailNotificationsModule } from "@/components/admin/EmailNotificationsModule";
import { INITIAL_RESOURCES } from "@/lib/resources-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — GardiaLab" },
      {
        name: "description",
        content:
          "Manage users, academic institutions, departments, courses, Nigerian states, web analytics, payments, and portal settings.",
      },
      { property: "og:title", content: "Admin console — GardiaLab" },
      { property: "og:description", content: "GardiaLab administration & academic catalog." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const tabs = [
  "Overview",
  "Users",
  "Assessments",
  "Analytics",
  "Catalog",
  "Payments",
  "Plans",
  "Emails",
  "Activity",
  "Settings",
] as const;

const ENVS: Env[] = ["python", "r", "vscode", "notebook", "sql", "powerbi"];

function Admin() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const sessionId = useStore((s) => s.sessionId);
  const users = useStore((s) => s.users);
  const currentUser = users.find((u) => u.id === sessionId) ?? null;
  const pending = useStore((s) => s.payments.filter((p) => p.status === "pending").length);

  // Synchronize remote database changes on mount and poll periodically
  useEffect(() => {
    actions.refreshFromSupabase();
    const interval = setInterval(() => {
      actions.refreshFromSupabase();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 1. Authentication Gates: If unauthenticated, render dedicated Admin Login Gate
  if (!currentUser) {
    return <AdminLoginGate />;
  }

  // 2. Authorization Gate: If signed in as non-admin, render Unauthorized clearance notice
  if (currentUser.role !== "admin") {
    return <AdminUnauthorizedGate user={currentUser} onSwitch={() => {}} />;
  }

  // 3. Fully Authenticated Administrator Console
  return (
    <AppShell title="Admin console" admin>
      <AdminHeaderBar
        user={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="mb-6 flex flex-wrap gap-1.5 rounded-xl glass p-1.5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition touch-manipulation",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {t === "Users"
              ? "👥 " + t
              : t === "Assessments"
                ? "🎓 " + t
                : t === "Analytics"
                  ? "📊 " + t
                  : t === "Catalog"
                    ? "🏛 " + t
                    : t === "Emails"
                      ? "✉️ " + t
                      : t}
            {t === "Users" && (
              <span className="ml-1.5 rounded-full bg-teal/20 px-1.5 py-0.5 text-xs text-teal font-bold">
                {users.length}
              </span>
            )}
            {t === "Payments" && pending > 0 && (
              <span className="ml-1.5 rounded-full bg-lime px-1.5 py-0.5 text-xs text-lime-foreground font-bold">
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview go={setTab} />}
      {tab === "Users" && <UserManagement />}
      {tab === "Assessments" && <LabAssessmentModule />}
      {tab === "Analytics" && <WebAnalyticsModule />}
      {tab === "Catalog" && <CatalogManager />}
      {tab === "Payments" && <Payments />}
      {tab === "Plans" && <Plans />}
      {tab === "Emails" && <EmailNotificationsModule />}
      {tab === "Activity" && <Activity />}
      {tab === "Settings" && <Settings />}

      {isProfileModalOpen && (
        <AdminProfileModal
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </AppShell>
  );
}

function Overview({ go }: { go: (t: (typeof tabs)[number]) => void }) {
  const users = useStore((s) => s.users);
  const payments = useStore((s) => s.payments);
  const runs = useStore((s) => s.runs);
  const institutions = useStore((s) => s.institutions);
  const audit = useStore((s) => s.audit);
  const revenue = payments.filter((p) => p.status === "approved").reduce((a, p) => a + p.amount, 0);

  const stats = [
    ["Total Users", users.filter((u) => u.role === "user").length],
    ["Active Access", users.filter((u) => u.role === "user" && hasAccess(u)).length],
    ["Pending Payments", payments.filter((p) => p.status === "pending").length],
    ["Revenue Approved", formatNaira(revenue)],
    ["Code Runs", runs],
    ["Universities", institutions.length],
  ];

  const byStatus = (["approved", "pending", "rejected"] as const).map(
    (s) => [s, payments.filter((p) => p.status === s).length] as const,
  );
  const max = Math.max(1, ...byStatus.map((b) => b[1]));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([k, v]) => (
          <Card key={k} className="p-4 sm:p-5">
            <div className="text-xs font-semibold uppercase text-muted-foreground truncate">{k}</div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold text-primary truncate">{v}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-primary">Payments by status</h3>
            <Button variant="ghost" className="text-xs text-teal py-1" onClick={() => go("Payments")}>
              View all →
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {byStatus.map(([s, n]) => (
              <div key={s}>
                <div className="flex justify-between text-sm capitalize">
                  <span className="font-medium">{s}</span>
                  <span className="font-semibold">{n}</span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      s === "approved"
                        ? "bg-success"
                        : s === "pending"
                          ? "bg-warning"
                          : "bg-destructive",
                    )}
                    style={{ width: `${(n / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" className="text-xs" onClick={() => go("Payments")}>
              Review pending payments
            </Button>
            <Button variant="ghost" className="text-xs" onClick={() => go("Analytics")}>
              Open Analytics 📊
            </Button>
            <Button variant="ghost" className="text-xs text-teal" onClick={() => go("Catalog")}>
              Manage Academic Catalog 🏛
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-primary">Recent system activity</h3>
            <span className="text-xs text-muted-foreground">{audit.length} total events</span>
          </div>
          <ul className="mt-3 space-y-2.5 text-sm">
            {audit.slice(0, 6).map((a) => (
              <li key={a.id} className="flex justify-between gap-3 border-b border-border/50 pb-2">
                <span className="truncate">{a.action}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(a.at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// WebAnalytics has been modularized and upgraded in '@/components/admin/WebAnalyticsModule'

// ==============================================================================
// 2. ACADEMIC & INSTITUTIONS CATALOG MANAGER (CRUD FOR UNIVERSITIES, DEPTS, COURSES, STATES)
// ==============================================================================
function CatalogManager() {
  const institutions = useStore((s) => s.institutions);
  const departments = useStore((s) => s.departments);
  const courses = useStore((s) => s.courses);
  const states = useStore((s) => s.states);
  const organizations = useStore((s) => s.organizations);
  const users = useStore((s) => s.users);

  const [subTab, setSubTab] = useState<
    "institutions" | "departments" | "courses" | "states" | "organizations"
  >("institutions");

  // Institution CRUD state
  const [instSearch, setInstSearch] = useState("");
  const [instCategoryFilter, setInstCategoryFilter] = useState("ALL");
  const [instStateFilter, setInstStateFilter] = useState("ALL");
  const [editInst, setEditInst] = useState<Institution | null>(null);
  const [isAddingInst, setIsAddingInst] = useState(false);
  const [instForm, setInstForm] = useState<Omit<Institution, "id">>({
    name: "",
    shortName: "",
    category: "Federal University",
    state: states[0]?.name || "Lagos",
  });

  // Department CRUD state
  const [deptSearch, setDeptSearch] = useState("");
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [deptForm, setDeptForm] = useState<Omit<Department, "id">>({
    name: "",
    faculty: "Science",
  });

  // Course CRUD state
  const [courseSearch, setCourseSearch] = useState("");
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState<Omit<Course, "id">>({
    name: "",
    faculty: "Sciences",
    departmentName: departments[0]?.name || "Computer Science",
  });

  // State CRUD state
  const [stateSearch, setStateSearch] = useState("");
  const [editState, setEditState] = useState<NigeriaState | null>(null);
  const [isAddingState, setIsAddingState] = useState(false);
  const [stateForm, setStateForm] = useState<Omit<NigeriaState, "id">>({
    name: "",
    zone: "South West",
  });

  // Organization CRUD state
  const [orgSearch, setOrgSearch] = useState("");
  const [orgSectorFilter, setOrgSectorFilter] = useState("ALL");
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [isAddingOrg, setIsAddingOrg] = useState(false);
  const [orgForm, setOrgForm] = useState<Omit<Organization, "id">>({
    name: "",
    sector: "Technology",
    state: states[0]?.name || "Lagos",
    website: "",
  });

  // Filtered institutions
  const filteredInsts = useMemo(() => {
    return institutions.filter((i) => {
      const matchSearch =
        i.name.toLowerCase().includes(instSearch.toLowerCase()) ||
        i.shortName.toLowerCase().includes(instSearch.toLowerCase()) ||
        i.state.toLowerCase().includes(instSearch.toLowerCase());
      const matchCategory = instCategoryFilter === "ALL" || i.category === instCategoryFilter;
      const matchState = instStateFilter === "ALL" || i.state === instStateFilter;
      return matchSearch && matchCategory && matchState;
    });
  }, [institutions, instSearch, instCategoryFilter, instStateFilter]);

  // Filtered departments
  const filteredDepts = useMemo(() => {
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
        d.faculty.toLowerCase().includes(deptSearch.toLowerCase()),
    );
  }, [departments, deptSearch]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.faculty.toLowerCase().includes(courseSearch.toLowerCase()) ||
        (c.departmentName && c.departmentName.toLowerCase().includes(courseSearch.toLowerCase())),
    );
  }, [courses, courseSearch]);

  // Filtered states
  const filteredStates = useMemo(() => {
    return states.filter(
      (s) =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
        s.zone.toLowerCase().includes(stateSearch.toLowerCase()),
    );
  }, [states, stateSearch]);

  // Filtered organizations
  const filteredOrgs = useMemo(() => {
    return organizations.filter((o) => {
      const matchSearch =
        o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
        o.sector.toLowerCase().includes(orgSearch.toLowerCase()) ||
        (o.state && o.state.toLowerCase().includes(orgSearch.toLowerCase()));
      const matchSector = orgSectorFilter === "ALL" || o.sector === orgSectorFilter;
      return matchSearch && matchSector;
    });
  }, [organizations, orgSearch, orgSectorFilter]);

  return (
    <div className="space-y-6 fade-up">
      {/* Sub tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["institutions", `Universities & Poly (${institutions.length})`],
              ["departments", `Departments (${departments.length})`],
              ["courses", `Courses (${courses.length})`],
              ["states", `Nigeria States (${states.length})`],
              ["organizations", `Organizations (${organizations.length})`],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={subTab === key ? "primary" : "outline"}
              className="text-xs py-1.5 px-3 capitalize"
              onClick={() => {
                setSubTab(key as any);
                setEditInst(null);
                setEditDept(null);
                setEditCourse(null);
                setEditState(null);
                setEditOrg(null);
                setIsAddingOrg(false);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <div>
          {subTab === "institutions" && (
            <Button
              variant="lime"
              className="text-xs py-1.5 px-3"
              onClick={() => {
                setIsAddingInst(true);
                setEditInst(null);
              }}
            >
              + Add Higher Institution
            </Button>
          )}
          {subTab === "departments" && (
            <Button
              variant="lime"
              className="text-xs py-1.5 px-3"
              onClick={() => {
                setIsAddingDept(true);
                setEditDept(null);
              }}
            >
              + Add Department
            </Button>
          )}
          {subTab === "courses" && (
            <Button
              variant="lime"
              className="text-xs py-1.5 px-3"
              onClick={() => {
                setIsAddingCourse(true);
                setEditCourse(null);
              }}
            >
              + Add Course of Study
            </Button>
          )}
          {subTab === "states" && (
            <Button
              variant="lime"
              className="text-xs py-1.5 px-3"
              onClick={() => {
                setIsAddingState(true);
                setEditState(null);
              }}
            >
              + Add State
            </Button>
          )}
          {subTab === "organizations" && (
            <Button
              variant="lime"
              className="text-xs py-1.5 px-3"
              onClick={() => {
                setIsAddingOrg(true);
                setEditOrg(null);
              }}
            >
              + Add Organization
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INSTITUTIONS CRUD */}
      {/* ========================================================================= */}
      {subTab === "institutions" && (
        <div className="space-y-4">
          {/* Add / Edit Institution Modal/Card */}
          {(isAddingInst || editInst) && (
            <Card className="border-teal bg-card p-5">
              <h3 className="font-bold text-primary">
                {editInst ? `Edit Institution: ${editInst.name}` : "Add New Higher Institution"}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editInst) {
                    actions.updateInstitution(editInst.id, instForm);
                    setEditInst(null);
                  } else {
                    actions.addInstitution({
                      ...instForm,
                      id: "inst-" + actions.newId(),
                    });
                    setIsAddingInst(false);
                  }
                  setInstForm({
                    name: "",
                    shortName: "",
                    category: "Federal University",
                    state: "Lagos",
                  });
                }}
                className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4"
              >
                <div className="sm:col-span-2">
                  <Field label="Institution Full Name">
                    <Input
                      required
                      placeholder="e.g. Federal University of Petroleum Resources"
                      value={instForm.name}
                      onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Short Name / Acronym">
                  <Input
                    required
                    placeholder="e.g. FUPRE"
                    value={instForm.shortName}
                    onChange={(e) => setInstForm({ ...instForm, shortName: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <select
                    value={instForm.category}
                    onChange={(e) =>
                      setInstForm({
                        ...instForm,
                        category: e.target.value as Institution["category"],
                      })
                    }
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Federal University">Federal University</option>
                    <option value="State University">State University</option>
                    <option value="Private University">Private University</option>
                    <option value="Polytechnic">Polytechnic</option>
                    <option value="College of Education">College of Education</option>
                  </select>
                </Field>
                <Field label="State Location in Nigeria">
                  <select
                    value={instForm.state}
                    onChange={(e) => setInstForm({ ...instForm, state: e.target.value })}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} State ({st.zone})
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="sm:col-span-4 flex gap-2 pt-2">
                  <Button variant="lime">
                    {editInst ? "Save Institution Changes" : "Save New Institution"}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsAddingInst(false);
                      setEditInst(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Input
              placeholder="Search university by name, acronym or state..."
              value={instSearch}
              onChange={(e) => setInstSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={instCategoryFilter}
                onChange={(e) => setInstCategoryFilter(e.target.value)}
                className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Categories</option>
                <option value="Federal University">Federal Universities</option>
                <option value="State University">State Universities</option>
                <option value="Private University">Private Universities</option>
                <option value="Polytechnic">Polytechnics</option>
              </select>

              <select
                value={instStateFilter}
                onChange={(e) => setInstStateFilter(e.target.value)}
                className="rounded-lg border border-input bg-card px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Nigeria States</option>
                {states.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} State
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[650px]">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5">Institution Name</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>State Location</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredInsts.map((i) => (
                    <tr key={i.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 font-semibold text-primary">{i.name}</td>
                      <td>
                        <span className="font-mono text-xs text-teal">{i.shortName || "—"}</span>
                      </td>
                      <td>
                        <span className="rounded bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                          {i.category}
                        </span>
                      </td>
                      <td>
                        <span className="rounded bg-lime/20 px-2 py-0.5 text-xs font-semibold text-primary">
                          📍 {i.state} State
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        <Button
                          variant="outline"
                          className="py-1 px-2.5 text-xs"
                          onClick={() => {
                            setEditInst(i);
                            setInstForm({
                              name: i.name,
                              shortName: i.shortName,
                              category: i.category,
                              state: i.state,
                            });
                            setIsAddingInst(false);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="py-1 px-2.5 text-xs"
                          onClick={() => {
                            if (confirm(`Delete ${i.name}?`)) {
                              actions.deleteInstitution(i.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!filteredInsts.length && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No institutions match the filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEPARTMENTS CRUD */}
      {/* ========================================================================= */}
      {subTab === "departments" && (
        <div className="space-y-4">
          {(isAddingDept || editDept) && (
            <Card className="border-teal bg-card p-5">
              <h3 className="font-bold text-primary">
                {editDept ? `Edit Department: ${editDept.name}` : "Add New Academic Department"}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editDept) {
                    actions.updateDepartment(editDept.id, deptForm);
                    setEditDept(null);
                  } else {
                    actions.addDepartment({
                      ...deptForm,
                      id: "dept-" + actions.newId(),
                    });
                    setIsAddingDept(false);
                  }
                  setDeptForm({ name: "", faculty: "Science" });
                }}
                className="mt-4 grid gap-4 sm:grid-cols-2"
              >
                <Field label="Department Name">
                  <Input
                    required
                    placeholder="e.g. Data Science & Artificial Intelligence"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Faculty / School">
                  <Input
                    required
                    placeholder="e.g. Computing & Informatics"
                    value={deptForm.faculty}
                    onChange={(e) => setDeptForm({ ...deptForm, faculty: e.target.value })}
                  />
                </Field>
                <div className="sm:col-span-2 flex gap-2">
                  <Button variant="lime">
                    {editDept ? "Save Department" : "Add Department"}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsAddingDept(false);
                      setEditDept(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Input
              placeholder="Search departments or faculty..."
              value={deptSearch}
              onChange={(e) => setDeptSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5">Department Name</th>
                    <th>Faculty</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDepts.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 font-semibold text-primary">Department of {d.name}</td>
                      <td>
                        <span className="rounded bg-teal/15 px-2 py-0.5 text-xs text-teal">
                          {d.faculty}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        <Button
                          variant="outline"
                          className="py-1 px-2.5 text-xs"
                          onClick={() => {
                            setEditDept(d);
                            setDeptForm({ name: d.name, faculty: d.faculty });
                            setIsAddingDept(false);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="py-1 px-2.5 text-xs"
                          onClick={() => {
                            if (confirm(`Delete Department of ${d.name}?`)) {
                              actions.deleteDepartment(d.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. COURSES CRUD */}
      {/* ========================================================================= */}
      {subTab === "courses" && (
        <div className="space-y-4">
          {(isAddingCourse || editCourse) && (
            <Card className="border-teal bg-card p-5">
              <h3 className="font-bold text-primary">
                {editCourse ? `Edit Course: ${editCourse.name}` : "Add New Course of Study"}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editCourse) {
                    actions.updateCourse(editCourse.id, courseForm);
                    setEditCourse(null);
                  } else {
                    actions.addCourse({
                      ...courseForm,
                      id: "course-" + actions.newId(),
                    });
                    setIsAddingCourse(false);
                  }
                  setCourseForm({
                    name: "",
                    faculty: "Sciences",
                    departmentName: departments[0]?.name || "Computer Science",
                  });
                }}
                className="mt-4 grid gap-4 sm:grid-cols-3"
              >
                <Field label="Course Title">
                  <Input
                    required
                    placeholder="e.g. Cybersecurity Engineering"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Parent Department">
                  <select
                    value={courseForm.departmentName || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, departmentName: e.target.value })}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.faculty})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Faculty">
                  <Input
                    required
                    placeholder="e.g. Engineering & Technology"
                    value={courseForm.faculty}
                    onChange={(e) => setCourseForm({ ...courseForm, faculty: e.target.value })}
                  />
                </Field>
                <div className="sm:col-span-3 flex gap-2">
                  <Button variant="lime">{editCourse ? "Save Course" : "Add Course"}</Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsAddingCourse(false);
                      setEditCourse(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Input
              placeholder="Search courses of study..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5">Course Name</th>
                    <th>Department</th>
                    <th>Faculty</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCourses.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 font-semibold text-primary">{c.name}</td>
                      <td>
                        <span className="text-xs text-muted-foreground">
                          {c.departmentName || "General Department"}
                        </span>
                      </td>
                      <td>
                        <span className="rounded bg-teal/15 px-2 py-0.5 text-xs text-teal">
                          {c.faculty}
                        </span>
                      </td>
                      <td className="text-right space-x-2">
                        <Button
                          variant="outline"
                          className="py-1 px-2.5 text-xs"
                          onClick={() => {
                            setEditCourse(c);
                            setCourseForm({
                              name: c.name,
                              faculty: c.faculty,
                              departmentName: c.departmentName,
                            });
                            setIsAddingCourse(false);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          className="py-1 px-2.5 text-xs"
                          onClick={() => {
                            if (confirm(`Delete course ${c.name}?`)) {
                              actions.deleteCourse(c.id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NIGERIA STATES CRUD */}
      {/* ========================================================================= */}
      {subTab === "states" && (
        <div className="space-y-4">
          {(isAddingState || editState) && (
            <Card className="border-teal bg-card p-5">
              <h3 className="font-bold text-primary">
                {editState ? `Edit State: ${editState.name}` : "Add Nigerian State / Region"}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editState) {
                    actions.updateState(editState.id, stateForm);
                    setEditState(null);
                  } else {
                    actions.addState({
                      ...stateForm,
                      id: "st-" + actions.newId(),
                    });
                    setIsAddingState(false);
                  }
                  setStateForm({ name: "", zone: "South West" });
                }}
                className="mt-4 grid gap-4 sm:grid-cols-2"
              >
                <Field label="State Name">
                  <Input
                    required
                    placeholder="e.g. Lagos"
                    value={stateForm.name}
                    onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                  />
                </Field>
                <Field label="Geopolitical Zone">
                  <select
                    value={stateForm.zone}
                    onChange={(e) =>
                      setStateForm({
                        ...stateForm,
                        zone: e.target.value as NigeriaState["zone"],
                      })
                    }
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="South West">South West</option>
                    <option value="South East">South East</option>
                    <option value="South South">South South</option>
                    <option value="North Central">North Central</option>
                    <option value="North West">North West</option>
                    <option value="North East">North East</option>
                  </select>
                </Field>
                <div className="sm:col-span-2 flex gap-2">
                  <Button variant="lime">{editState ? "Save State" : "Add State"}</Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsAddingState(false);
                      setEditState(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <Input
              placeholder="Search states by name or zone..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5">State Name</th>
                    <th>Geopolitical Zone</th>
                    <th>Institutions Count</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredStates.map((st) => {
                    const instCount = institutions.filter(
                      (i) => i.state.toLowerCase() === st.name.toLowerCase(),
                    ).length;
                    return (
                      <tr key={st.id} className="hover:bg-muted/30 transition">
                        <td className="py-3 font-semibold text-primary">{st.name} State</td>
                        <td>
                          <span className="rounded bg-teal/15 px-2 py-0.5 text-xs text-teal">
                            {st.zone}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs font-bold text-primary">
                            {instCount} institutions
                          </span>
                        </td>
                        <td className="text-right space-x-2">
                          <Button
                            variant="outline"
                            className="py-1 px-2.5 text-xs"
                            onClick={() => {
                              setEditState(st);
                              setStateForm({ name: st.name, zone: st.zone });
                              setIsAddingState(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="py-1 px-2.5 text-xs"
                            onClick={() => {
                              if (confirm(`Delete ${st.name} State?`)) {
                                actions.deleteState(st.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ORGANIZATIONS CRUD (WHERE NON-ACADEMIC USERS PICK) */}
      {/* ========================================================================= */}
      {subTab === "organizations" && (
        <div className="space-y-4">
          {(isAddingOrg || editOrg) && (
            <Card className="border-teal bg-card p-5">
              <h3 className="font-bold text-primary">
                {editOrg ? `Edit Organization: ${editOrg.name}` : "Add New Organization / Employer"}
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editOrg) {
                    actions.updateOrganization(editOrg.id, orgForm);
                    setEditOrg(null);
                  } else {
                    actions.addOrganization({
                      ...orgForm,
                      id: "org-" + actions.newId(),
                    });
                    setIsAddingOrg(false);
                  }
                  setOrgForm({
                    name: "",
                    sector: "Technology",
                    state: "Lagos",
                    website: "",
                  });
                }}
                className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4"
              >
                <div className="sm:col-span-2">
                  <Field label="Organization / Company Name">
                    <Input
                      required
                      placeholder="e.g. Paystack, NITDA, Shell, Dangote Group"
                      value={orgForm.name}
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    />
                  </Field>
                </div>
                <Field label="Industry Sector">
                  <select
                    value={orgForm.sector}
                    onChange={(e) =>
                      setOrgForm({
                        ...orgForm,
                        sector: e.target.value as OrganizationSector,
                      })
                    }
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Technology">Technology & Software</option>
                    <option value="Research & Development">Research & Development</option>
                    <option value="Government & Public Sector">Government & Public Sector</option>
                    <option value="Financial Services">Financial Services & Banking</option>
                    <option value="Energy & Oil/Gas">Energy & Oil/Gas</option>
                    <option value="Healthcare & Pharmaceuticals">Healthcare & Pharmaceuticals</option>
                    <option value="Consulting & Professional Services">Consulting & Professional</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                    <option value="Non-Profit / NGO">Non-Profit / NGO</option>
                    <option value="Other">Other Sector</option>
                  </select>
                </Field>
                <Field label="Headquarter State in Nigeria">
                  <select
                    value={orgForm.state || "Lagos"}
                    onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {states.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} State
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Website / Portal URL (Optional)">
                    <Input
                      placeholder="https://..."
                      value={orgForm.website || ""}
                      onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="sm:col-span-2 flex items-end gap-2">
                  <Button variant="lime">
                    {editOrg ? "Save Organization" : "Create Organization"}
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setIsAddingOrg(false);
                      setEditOrg(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Search & Sector Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search organizations by name or location..."
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                className="w-64"
              />
              <select
                value={orgSectorFilter}
                onChange={(e) => setOrgSectorFilter(e.target.value)}
                className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All Industry Sectors</option>
                <option value="Technology">Technology</option>
                <option value="Research & Development">Research & Development</option>
                <option value="Government & Public Sector">Government & Public Sector</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Energy & Oil/Gas">Energy & Oil/Gas</option>
                <option value="Healthcare & Pharmaceuticals">Healthcare</option>
                <option value="Consulting & Professional Services">Consulting</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Manufacturing & Industrial">Manufacturing</option>
                <option value="Non-Profit / NGO">NGO</option>
              </select>
            </div>
            <div className="text-xs text-muted-foreground">
              Showing <b className="text-primary">{filteredOrgs.length}</b> of{" "}
              {organizations.length} organizations
            </div>
          </div>

          {/* Organizations Table */}
          <Card>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-2.5">Organization / Employer</th>
                    <th>Industry Sector</th>
                    <th>Headquarters</th>
                    <th>Registered Members</th>
                    <th>Website</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredOrgs.map((org) => {
                    const memberCount = users.filter(
                      (u) =>
                        u.accountType === "non-academic" &&
                        u.employer?.toLowerCase() === org.name.toLowerCase(),
                    ).length;

                    return (
                      <tr key={org.id} className="hover:bg-muted/30 transition">
                        <td className="py-3 font-semibold text-primary">
                          <div className="flex items-center gap-2">
                            <span>🏢</span>
                            <span>{org.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="rounded bg-teal/15 px-2 py-0.5 text-xs font-semibold text-teal">
                            {org.sector}
                          </span>
                        </td>
                        <td>
                          <span className="rounded bg-lime/20 px-2 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1 w-fit">
                            <span>📍</span> {org.state || "Nigeria"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={cn(
                              "font-mono text-xs font-bold px-2 py-0.5 rounded",
                              memberCount > 0
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground bg-muted/40",
                            )}
                          >
                            {memberCount} staff
                          </span>
                        </td>
                        <td>
                          {org.website ? (
                            <a
                              href={org.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-teal hover:underline truncate max-w-[150px] inline-block font-mono"
                            >
                              {org.website.replace(/^https?:\/\//, "")} ↗
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-right space-x-2">
                          <Button
                            variant="outline"
                            className="py-1 px-2.5 text-xs"
                            onClick={() => {
                              setEditOrg(org);
                              setOrgForm({
                                name: org.name,
                                sector: org.sector,
                                state: org.state || "Lagos",
                                website: org.website || "",
                              });
                              setIsAddingOrg(false);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="py-1 px-2.5 text-xs"
                            onClick={() => {
                              if (confirm(`Delete organization "${org.name}"?`)) {
                                actions.deleteOrganization(org.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrgs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No organizations found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// 3. PAYMENTS MANAGEMENT
// ==============================================================================
function Payments() {
  const payments = useStore((s) => s.payments);
  const users = useStore((s) => s.users);
  const plans = useStore((s) => s.plans);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // Granular Scope Approval Modal State
  const [customizingPayment, setCustomizingPayment] = useState<any | null>(null);
  const [approvalCourse, setApprovalCourse] = useState("");
  const [approvalManuals, setApprovalManuals] = useState<string[]>([]);
  const [approvalEnvs, setApprovalEnvs] = useState<Env[]>([
    "python",
    "r",
    "vscode",
    "notebook",
    "sql",
    "powerbi",
  ]);

  const syncData = async () => {
    setIsSyncing(true);
    await actions.refreshFromSupabase();
    setIsSyncing(false);
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    // Initial fetch when opening Payments tab
    syncData();
  }, []);

  const openCustomModal = (p: any, u: any) => {
    setCustomizingPayment(p);
    setApprovalCourse(p.courseCode || u?.course || "GSY303 - Gas Technology");
    setApprovalManuals(p.manualId ? [p.manualId] : []);
    setApprovalEnvs(
      p.requestedTools && p.requestedTools.length > 0
        ? p.requestedTools
        : ["python", "r", "vscode", "notebook", "sql", "powerbi"],
    );
  };

  const list = payments.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (!q.trim()) return true;
    const query = q.toLowerCase();
    const u = users.find((x) => x.id === p.userId);
    return (
      (p.reference || "").toLowerCase().includes(query) ||
      (p.matricNumber || "").toLowerCase().includes(query) ||
      (u?.matricNumber || "").toLowerCase().includes(query) ||
      (p.payerName || "").toLowerCase().includes(query) ||
      (p.bank || "").toLowerCase().includes(query) ||
      (p.courseCode || "").toLowerCase().includes(query) ||
      (p.manualTitle || "").toLowerCase().includes(query) ||
      (u?.name || "").toLowerCase().includes(query) ||
      (u?.email || "").toLowerCase().includes(query) ||
      (p.userId || "").toLowerCase().includes(query)
    );
  });

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex flex-wrap items-center gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => {
            const count = payments.filter((p) => (f === "all" ? true : p.status === f)).length;
            return (
              <Button
                key={f}
                variant={filter === f ? "primary" : "outline"}
                className="capitalize text-xs py-1.5 px-3 flex items-center gap-1.5"
                onClick={() => setFilter(f)}
              >
                <span>{f}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                    filter === f
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-xs py-1.5 px-3 flex items-center gap-1.5 border-teal/40 text-teal hover:bg-teal/10"
            disabled={isSyncing}
            onClick={syncData}
            title={`Fetch latest payments directly from Supabase. Last synced: ${lastSyncTime}`}
          >
            <span className={isSyncing ? "animate-spin" : ""}>🔄</span>
            {isSyncing ? "Syncing DB..." : "Refresh Payments"}
          </Button>

          <Input
            placeholder="Search ref, course, manual, student..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs text-xs"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto w-full">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="text-left text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="py-2.5">User / Student</th>
              <th>Course / Subject</th>
              <th>Manual & Tools</th>
              <th>Plan & Amount</th>
              <th>Bank / Ref</th>
              <th>Paid on</th>
              <th>Status</th>
              <th>Approval Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const u = users.find(
                (x) =>
                  x.id === p.userId ||
                  (p.payerName &&
                    (x.name?.toLowerCase() === p.payerName.toLowerCase() ||
                      x.email?.toLowerCase() === p.payerName.toLowerCase())),
              );
              const plan = plans.find((x) => x.id === p.plan);
              const mismatch = plan && p.amount < plan.price;

              return (
                <tr
                  key={p.id}
                  className="border-t border-border align-top hover:bg-muted/30 transition"
                >
                  <td className="py-3">
                    <div className="font-semibold text-primary">
                      {u?.name || p.payerName || "Student"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u?.email || (p.userId ? `ID: ${p.userId}` : "Unlinked")}
                    </div>
                    {(p.matricNumber || u?.matricNumber) && (
                      <div className="text-[11px] font-mono font-bold text-teal flex items-center gap-1 mt-0.5">
                        <span>Matric:</span>
                        <span className="bg-teal/15 px-1 py-0.2 rounded">
                          {p.matricNumber || u?.matricNumber}
                        </span>
                      </div>
                    )}
                    {u?.institution && (
                      <div className="text-xs text-teal font-medium mt-0.5">
                        {u.institution} {u.department ? `• ${u.department}` : ""}
                      </div>
                    )}
                    <div className="text-xs mt-1 text-muted-foreground">
                      Payer: <span className="font-medium text-foreground">{p.payerName}</span>
                    </div>
                    {p.note && (
                      <div className="text-xs italic text-muted-foreground mt-0.5">"{p.note}"</div>
                    )}
                  </td>
                  <td>
                    <div className="font-semibold text-foreground text-xs">
                      {p.courseCode || u?.course || "GSY303 - Gas Technology"}
                    </div>
                    <span className="text-[10px] text-teal font-medium">
                      Multi-course manual support
                    </span>
                  </td>
                  <td>
                    <div className="text-xs font-medium text-primary line-clamp-1">
                      {p.manualTitle || "All Course Manuals"}
                    </div>
                    {p.requestedTools && p.requestedTools.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Tools: {p.requestedTools.join(", ")}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="font-semibold text-primary">{formatNaira(p.amount)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {plan?.name ?? p.plan}
                    </div>
                    {mismatch && (
                      <div className="text-[10px] text-destructive">
                        Below {formatNaira(plan.price)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="font-medium text-xs">{p.bank || "Bank Transfer"}</div>
                    <div className="font-mono text-xs text-primary font-semibold tracking-wide mt-0.5">
                      {p.reference}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-xs">{p.paidOn}</td>
                  <td>
                    <Badge v={p.status} />
                    {p.adminNote && (
                      <div className="mt-1 text-xs text-muted-foreground">{p.adminNote}</div>
                    )}
                  </td>
                  <td className="min-w-56">
                    {p.status === "pending" ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Admin note (optional)"
                          value={notes[p.id] ?? ""}
                          onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })}
                          className="text-xs py-1"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant="lime"
                            className="py-1 px-2.5 text-xs flex items-center gap-1 font-semibold"
                            onClick={async () => {
                              actions.reviewPayment(p.id, true, notes[p.id]);
                              await actions.refreshFromSupabase();
                            }}
                            title="Approve Course, Manual, and Tools in one click"
                          >
                            ✓ Quick Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="py-1 px-2 text-xs flex items-center gap-1 text-teal border-teal/40 hover:bg-teal/10 font-medium"
                            onClick={() => openCustomModal(p, u)}
                            title="Configure manual, course, or tool approval"
                          >
                            ⚙️ Scope
                          </Button>
                          <Button
                            variant="danger"
                            className="py-1 px-2 text-xs flex items-center gap-1"
                            onClick={async () => {
                              actions.reviewPayment(
                                p.id,
                                false,
                                notes[p.id] || "Payment verification failed",
                              );
                              await actions.refreshFromSupabase();
                            }}
                          >
                            ✕ Reject
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        <div>Reviewed: {p.reviewedAt ? new Date(p.reviewedAt).toLocaleDateString() : "Yes"}</div>
                        {p.approvalScopes && p.approvalScopes.length > 0 && (
                          <div className="text-[10px] text-teal font-semibold mt-0.5">
                            Approved by: {p.approvalScopes.join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No payment records matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* GRANULAR APPROVAL MODAL (MANUAL / COURSE / TOOL) */}
      {customizingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-5 bg-card border-teal shadow-2xl fade-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-primary text-base">
                  Granular Approval Configuration
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ref: <span className="font-mono text-foreground font-semibold">{customizingPayment.reference}</span> · Payer: {customizingPayment.payerName}
                </p>
              </div>
              <button
                onClick={() => setCustomizingPayment(null)}
                className="text-muted-foreground hover:text-foreground p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs bg-muted/40 p-2 rounded-lg">
              <span className="font-semibold text-muted-foreground">Quick Presets:</span>
              <button
                type="button"
                className="rounded bg-teal/20 text-teal px-2 py-0.5 font-bold hover:bg-teal/30"
                onClick={() => {
                  setApprovalEnvs(["python", "r", "vscode", "notebook", "sql", "powerbi"]);
                  if (customizingPayment.manualId) setApprovalManuals([customizingPayment.manualId]);
                }}
              >
                Full Suite (Course + Manual + All Tools)
              </button>
              <button
                type="button"
                className="rounded bg-primary/15 text-primary px-2 py-0.5 font-bold hover:bg-primary/25"
                onClick={() => {
                  setApprovalEnvs([]);
                  if (customizingPayment.manualId) setApprovalManuals([customizingPayment.manualId]);
                }}
              >
                Manual & Course Only (No Coding Tools)
              </button>
              <button
                type="button"
                className="rounded bg-warning/20 text-warning px-2 py-0.5 font-bold hover:bg-warning/30"
                onClick={() => {
                  setApprovalManuals([]);
                }}
              >
                Coding Tools Only
              </button>
            </div>

            {/* 1. Course Approval */}
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal uppercase tracking-wide">
                  1. Approve by Course / Subject
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Unlocks all manuals catering for this course
                </span>
              </div>
              <Input
                value={approvalCourse}
                onChange={(e) => setApprovalCourse(e.target.value)}
                placeholder="e.g. GSY303 - Gas Technology"
                className="text-xs py-1.5 font-medium"
              />
            </div>

            {/* 2. Manual Approval */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wide">
                  2. Approve by Specific Manual
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Direct manual unlocking
                </span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {INITIAL_RESOURCES.filter((r) => r.category === "Lab Manuals").map((res) => {
                  const checked = approvalManuals.includes(res.id);
                  return (
                    <label
                      key={res.id}
                      className="flex items-start gap-2 p-1.5 rounded text-xs hover:bg-muted/40 cursor-pointer border border-border/50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setApprovalManuals(
                            e.target.checked
                              ? [...approvalManuals, res.id]
                              : approvalManuals.filter((id) => id !== res.id),
                          );
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-foreground">{res.title}</div>
                        <div className="text-[10px] text-muted-foreground">{res.course}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Tool / Environment Approval */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wide block">
                3. Approve by Tool / Environment
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "python" as const, label: "🐍 Python Lab" },
                  { id: "r" as const, label: "📊 R Lab" },
                  { id: "sql" as const, label: "🗄️ SQL Server" },
                  { id: "powerbi" as const, label: "📈 Power BI" },
                  { id: "notebook" as const, label: "📓 Notebook" },
                  { id: "vscode" as const, label: "💻 VS Code" },
                ].map((tool) => (
                  <label
                    key={tool.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-xs cursor-pointer hover:bg-muted/40"
                  >
                    <input
                      type="checkbox"
                      checked={approvalEnvs.includes(tool.id)}
                      onChange={(e) => {
                        setApprovalEnvs(
                          e.target.checked
                            ? [...approvalEnvs, tool.id]
                            : approvalEnvs.filter((id) => id !== tool.id),
                        );
                      }}
                    />
                    <span className="font-semibold text-foreground">{tool.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Admin Note */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Admin Note / Audit Remark (Optional):
              </label>
              <Input
                placeholder="e.g. Approved for GSY303 course manual & Python environment"
                value={notes[customizingPayment.id] ?? ""}
                onChange={(e) =>
                  setNotes({ ...notes, [customizingPayment.id]: e.target.value })
                }
                className="text-xs py-1.5"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="text-xs py-1.5 px-3"
                onClick={() => setCustomizingPayment(null)}
              >
                Cancel
              </Button>
              <Button
                variant="lime"
                className="text-xs py-1.5 px-4 font-bold"
                onClick={async () => {
                  actions.reviewPayment(
                    customizingPayment.id,
                    true,
                    notes[customizingPayment.id] || "Approved with custom scope",
                    {
                      approvedCourses: [approvalCourse].filter(Boolean),
                      approvedManuals: approvalManuals,
                      envs: approvalEnvs,
                    },
                  );
                  await actions.refreshFromSupabase();
                  setCustomizingPayment(null);
                }}
              >
                ✓ Grant Configured Scope Approval
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}

// UserManagement has been modularized and upgraded in '@/components/admin/UserManagement'

// ==============================================================================
// 5. PLANS MANAGEMENT
// ==============================================================================
function Plans() {
  const plans = useStore((s) => s.plans);
  const blank: Plan = { id: "", name: "", days: 30, price: 12000, envs: ["python", "r", "notebook"] };
  const [f, setF] = useState<Plan>(blank);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary">Access Subscription Tiers</h3>
          <span className="text-xs text-muted-foreground">{plans.length} configured plans</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id} className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-primary">{p.name}</h4>
                  <span className="text-2xl font-extrabold text-teal">{formatNaira(p.price)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {p.days} days access · {p.envs.join(", ")}
                </p>
              </div>
              <div className="mt-4 flex gap-2 pt-3 border-t border-border">
                <Button variant="outline" className="py-1 px-3 text-xs" onClick={() => setF(p)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  className="py-1 px-3 text-xs"
                  onClick={() => {
                    if (confirm(`Delete plan ${p.name}?`)) actions.deletePlan(p.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <h3 className="font-bold text-primary">{f.id ? "Edit Plan" : "Create New Plan"}</h3>
        <div className="mt-4 space-y-3">
          <Field label="Plan Name">
            <Input
              placeholder="e.g. Semester Access"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duration (Days)">
              <Input
                type="number"
                value={f.days}
                onChange={(e) => setF({ ...f, days: +e.target.value })}
              />
            </Field>
            <Field label="Price (₦)">
              <Input
                type="number"
                step="100"
                value={f.price}
                onChange={(e) => setF({ ...f, price: +e.target.value })}
              />
            </Field>
          </div>
          <Field label="Accessible Environments">
            <div className="grid grid-cols-2 gap-2 mt-1">
              {ENVS.map((e) => (
                <label key={e} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={f.envs.includes(e)}
                    onChange={(ev) =>
                      setF({
                        ...f,
                        envs: ev.target.checked ? [...f.envs, e] : f.envs.filter((x) => x !== e),
                      })
                    }
                  />
                  <span className="capitalize">{e}</span>
                </label>
              ))}
            </div>
          </Field>
          <div className="flex gap-2 pt-2">
            <Button
              disabled={!f.name}
              onClick={() => {
                actions.savePlan({ ...f, id: f.id || "plan-" + actions.newId() });
                setF(blank);
              }}
            >
              Save Plan
            </Button>
            {f.id && (
              <Button variant="ghost" onClick={() => setF(blank)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ==============================================================================
// 6. ACTIVITY LOG
// ==============================================================================
function Activity() {
  const audit = useStore((s) => s.audit);

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-primary">System Audit Trail</h3>
        <span className="text-xs text-muted-foreground">{audit.length} records</span>
      </div>
      <ul className="mt-3 divide-y divide-border text-sm">
        {audit.map((a) => (
          <li key={a.id} className="flex justify-between gap-4 py-2.5">
            <div>
              <b className="text-primary">{a.actor}</b> — {a.action}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(a.at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ==============================================================================
// 7. SETTINGS & BANK CONFIGURATION
// ==============================================================================
function Settings() {
  const settings = useStore((s) => s.settings);
  const [f, setF] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [selectedBankOption, setSelectedBankOption] = useState(
    NIGERIAN_BANKS.includes(settings.bankName) ? settings.bankName : "Other Nigerian Bank",
  );

  return (
    <Card className="max-w-2xl">
      <h3 className="font-bold text-primary">Official Nigerian Bank Details (Shown to Users)</h3>
      <p className="text-xs text-muted-foreground mt-0.5">
        Account where students and researchers transfer their plan fees
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Bank Name">
          <select
            value={selectedBankOption}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedBankOption(val);
              if (val !== "Other Nigerian Bank") {
                setF({ ...f, bankName: val });
              }
            }}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {NIGERIAN_BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>

        {selectedBankOption === "Other Nigerian Bank" && (
          <Field label="Custom Bank Name">
            <Input
              value={f.bankName}
              placeholder="e.g. Parallex Bank"
              onChange={(e) => setF({ ...f, bankName: e.target.value })}
            />
          </Field>
        )}

        <Field label="Account Name">
          <Input
            value={f.accountName}
            placeholder="GardiaLab Technologies Ltd"
            onChange={(e) => setF({ ...f, accountName: e.target.value })}
          />
        </Field>

        <Field label="Account Number (10-Digit NUBAN)">
          <Input
            value={f.accountNumber}
            placeholder="0123456789"
            maxLength={10}
            onChange={(e) => setF({ ...f, accountNumber: e.target.value })}
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Transfer Narration Instructions">
            <textarea
              value={f.instructions || ""}
              onChange={(e) => setF({ ...f, instructions: e.target.value })}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              rows={2}
            />
          </Field>
        </div>
      </div>

      <h3 className="mt-6 font-bold text-primary">Portal Controls</h3>
      <div className="mt-3 space-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={f.allowRegistration}
            onChange={(e) => setF({ ...f, allowRegistration: e.target.checked })}
          />
          Allow new registrations (Students, Lecturers & Non-Academic)
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={f.maintenance}
            onChange={(e) => setF({ ...f, maintenance: e.target.checked })}
          />
          Maintenance mode (temporarily lock access)
        </label>
      </div>

      <div className="mt-6 flex gap-2">
        <Button
          onClick={() => {
            actions.saveSettings(f);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          {saved ? "Saved ✓" : "Save settings"}
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (confirm("Reset demo data to default Nigerian campus state?")) actions.reset();
          }}
        >
          Reset demo data
        </Button>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-primary flex items-center gap-2">
              <span>⚡</span> Supabase Remote PostgreSQL Integration
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live connection parameters for database schema, auth & tables
            </p>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
            Active
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-accent/30 p-4 space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-muted-foreground font-sans">Project URL:</span>
            <span className="text-teal font-semibold">https://egnstirfqhpgzfuezlwo.supabase.co</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-muted-foreground font-sans">Project ID:</span>
            <span className="text-primary font-semibold">egnstirfqhpgzfuezlwo</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground font-sans">Target Tables:</span>
            <span className="text-primary font-sans font-medium truncate max-w-sm">
              institutions, departments, courses, nigeria_states, users, payments, plans
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-teal/10 border border-teal/20 p-3 text-xs text-teal leading-relaxed">
          <strong>Migration DDL:</strong> Complete schema for institutions, departments, courses,
          degrees, and Nigerian states is available at{" "}
          <code className="font-mono bg-teal/20 px-1 py-0.5 rounded">supabase/schema.sql</code>.
        </div>
      </div>
    </Card>
  );
}
