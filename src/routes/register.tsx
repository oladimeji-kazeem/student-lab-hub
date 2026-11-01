import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Logo, Button, Input, Field, Card } from "@/components/ui-kit";
import { actions, useStore, type AccountType } from "@/lib/store";
import { DEGREE_LEVELS, type Institution, type Course } from "@/lib/nigerian-academic-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — e-Lab" },
      {
        name: "description",
        content:
          "Register for e-Lab to run Python, R and VS Code online with zero local setup. For Students, Lecturers, and Industry Professionals across Nigeria.",
      },
      { property: "og:title", content: "Create account — e-Lab" },
      {
        property: "og:description",
        content: "Cloud Computing & Online Coding Labs for Nigerian Higher Institutions and Industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const nav = useNavigate();

  // Dynamic catalog from store (synchronized with database)
  const institutions = useStore((s) => s.institutions);
  const departments = useStore((s) => s.departments);
  const courses = useStore((s) => s.courses);
  const states = useStore((s) => s.states);
  const organizations = useStore((s) => s.organizations);

  // Account Type Selection: Student, Lecturer, or Non-Academic
  const [accountType, setAccountType] = useState<AccountType>("student");

  // Common User Info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  // Student & Lecturer Fields
  const [institution, setInstitution] = useState(institutions[0]?.name || "University of Lagos");
  const [customInstitution, setCustomInstitution] = useState("");
  const [department, setDepartment] = useState(departments[0]?.name || "Computer Science");
  const [customDepartment, setCustomDepartment] = useState("");

  // Student-Only Fields
  const [course, setCourse] = useState(courses[0]?.name || "Computer Science");
  const [customCourse, setCustomCourse] = useState("");
  const [selectedDegreeId, setSelectedDegreeId] = useState(DEGREE_LEVELS[0]?.id || "deg-bsc");
  const [customDegree, setCustomDegree] = useState("");

  // Lecturer-Only Field
  const [designation, setDesignation] = useState("Lecturer I");

  // Non-Academic Fields
  const [currentRole, setCurrentRole] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [customEmployer, setCustomEmployer] = useState("");
  const [stateOfResidence, setStateOfResidence] = useState(states[0]?.name || "Lagos");

  // Search/Filter Helpers
  const [instFilter, setInstFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [err, setErr] = useState("");

  // Filtered institutions
  const filteredInstitutions = useMemo(() => {
    if (!instFilter.trim()) return institutions;
    const q = instFilter.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(q) ||
        inst.shortName.toLowerCase().includes(q) ||
        inst.state.toLowerCase().includes(q) ||
        inst.category.toLowerCase().includes(q),
    );
  }, [institutions, instFilter]);

  // Grouped institutions by category
  const groupedInstitutions = useMemo(() => {
    const groups: Record<string, Institution[]> = {};
    for (const inst of filteredInstitutions) {
      if (!groups[inst.category]) groups[inst.category] = [];
      groups[inst.category].push(inst);
    }
    return groups;
  }, [filteredInstitutions]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    if (!courseFilter.trim()) return courses;
    const q = courseFilter.toLowerCase();
    return courses.filter(
      (c) => c.name.toLowerCase().includes(q) || c.faculty.toLowerCase().includes(q),
    );
  }, [courses, courseFilter]);

  // Grouped courses by faculty
  const groupedCourses = useMemo(() => {
    const groups: Record<string, Course[]> = {};
    for (const c of filteredCourses) {
      if (!groups[c.faculty]) groups[c.faculty] = [];
      groups[c.faculty].push(c);
    }
    return groups;
  }, [filteredCourses]);

  const selectedDegree = useMemo(() => {
    return (
      DEGREE_LEVELS.find((d) => d.id === selectedDegreeId) ||
      DEGREE_LEVELS[0] || { code: "B.Sc.", name: "Bachelor of Science", category: "Undergraduate" }
    );
  }, [selectedDegreeId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setErr("Password must be at least 6 characters");
    if (pw !== pw2) return setErr("Passwords do not match");

    let resolvedInst: string | undefined;
    let resolvedDept: string | undefined;
    let resolvedCourse: string | undefined;
    let resolvedDegree: string | undefined;
    let resolvedRole: string | undefined;
    let resolvedEmployer: string | undefined;
    let resolvedState: string | undefined;

    if (accountType === "student") {
      resolvedInst = institution === "OTHER" ? customInstitution.trim() : institution;
      if (!resolvedInst) return setErr("Please select or enter your higher institution");

      resolvedDept = department === "OTHER" ? customDepartment.trim() : department;
      if (!resolvedDept) return setErr("Please select or enter your department name");

      resolvedCourse = course === "OTHER" ? customCourse.trim() : course;
      if (!resolvedCourse) return setErr("Please select or specify your course of study");

      resolvedDegree =
        selectedDegreeId === "OTHER"
          ? customDegree.trim()
          : `${selectedDegree.code} — ${selectedDegree.name} (${selectedDegree.category})`;
      if (!resolvedDegree) return setErr("Please select or specify your degree level");
    } else if (accountType === "lecturer") {
      resolvedInst = institution === "OTHER" ? customInstitution.trim() : institution;
      if (!resolvedInst) return setErr("Please select or enter your university");

      resolvedDept = department === "OTHER" ? customDepartment.trim() : department;
      if (!resolvedDept) return setErr("Please select or enter your department name");

      resolvedRole = designation;
    } else if (accountType === "non-academic") {
      if (!currentRole.trim()) return setErr("Please specify your current professional role");
      resolvedRole = currentRole.trim();
      if (selectedOrgId === "OTHER") {
        resolvedEmployer = customEmployer.trim() || undefined;
      } else if (selectedOrgId) {
        const found = organizations.find((o) => o.id === selectedOrgId);
        resolvedEmployer = found?.name || undefined;
      } else {
        resolvedEmployer = customEmployer.trim() || undefined;
      }
      resolvedState = stateOfResidence;
    }

    try {
      actions.register({
        name,
        email,
        password: pw,
        accountType,
        institution: resolvedInst,
        department: resolvedDept,
        course: resolvedCourse,
        degree: resolvedDegree,
        currentRole: resolvedRole,
        employer: resolvedEmployer,
        stateOfResidence: resolvedState,
      });
      nav({ to: "/payment" });
    } catch (x) {
      setErr((x as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 md:py-12">
      <div className="w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Link
            to="/login"
            className="flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline"
          >
            Already have an account? Sign in →
          </Link>
        </div>

        <Card className="p-6 md:p-8">
          <div className="border-b border-border pb-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
              <span>🇳🇬</span>
              <span>e-Lab Cloud Coding & Scientific Computing</span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold text-primary md:text-3xl">
              Create Your e-Lab Account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your user category below to set up your online Python, R, and VS Code development environment.
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-6">
            {/* Step 1: User Category Radio Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                I am registering as:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition touch-manipulation",
                    accountType === "student"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="student"
                    checked={accountType === "student"}
                    onChange={() => setAccountType("student")}
                    className="accent-primary h-4 w-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-primary flex items-center gap-1.5">
                      <span>🎓</span> Student
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Undergrad, Poly & Postgrad
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition touch-manipulation",
                    accountType === "lecturer"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="lecturer"
                    checked={accountType === "lecturer"}
                    onChange={() => setAccountType("lecturer")}
                    className="accent-primary h-4 w-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-primary flex items-center gap-1.5">
                      <span>👨‍🏫</span> Lecturer
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Faculty, Professors & Instructors
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition touch-manipulation",
                    accountType === "non-academic"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="non-academic"
                    checked={accountType === "non-academic"}
                    onChange={() => setAccountType("non-academic")}
                    className="accent-primary h-4 w-4"
                  />
                  <div>
                    <div className="font-bold text-sm text-primary flex items-center gap-1.5">
                      <span>💼</span> Non-Academic
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Professionals, Industry & Research
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 2: Personal Credentials */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name">
                <Input
                  required
                  placeholder={
                    accountType === "lecturer"
                      ? "e.g. Dr. Babatunde Fashola"
                      : "e.g. Amara Okafor"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Email Address">
                <Input
                  type="email"
                  required
                  placeholder={
                    accountType === "student"
                      ? "student@university.edu.ng"
                      : accountType === "lecturer"
                        ? "lecturer@university.edu.ng"
                        : "name@company.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>

              <Field label="Password (Min. 6 Characters)">
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                />
              </Field>

              <Field label="Confirm Password">
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                />
              </Field>
            </div>

            {/* Step 3: Conditional Fields based on User Category */}

            {/* === CATEGORY: STUDENT === */}
            {accountType === "student" && (
              <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5 fade-up">
                <div className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <span>🎓</span> Student Academic Profile
                </div>

                {/* Higher Institution */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Select Nigerian Higher Institution
                    </label>
                    <input
                      type="text"
                      placeholder="Quick search university..."
                      value={instFilter}
                      onChange={(e) => setInstFilter(e.target.value)}
                      className="rounded border border-input bg-card px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring w-48"
                    />
                  </div>
                  <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {Object.entries(groupedInstitutions).map(([category, instList]) => (
                      <optgroup key={category} label={`── ${category} ──`}>
                        {instList.map((inst) => (
                          <option key={inst.id} value={inst.name}>
                            {inst.name} ({inst.shortName || inst.state}) — {inst.state} State
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="OTHER">➕ Other Higher Institution (Type manually)...</option>
                  </select>
                  {institution === "OTHER" && (
                    <Input
                      required
                      placeholder="Type your Institution Name & State"
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Department Dropdown Menu (Required for all students) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">
                    Department (Dropdown Menu)
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        Department of {dept.name} ({dept.faculty})
                      </option>
                    ))}
                    <option value="OTHER">➕ Other Department (Type manually)...</option>
                  </select>
                  {department === "OTHER" && (
                    <Input
                      required
                      placeholder="Type your department name"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className="mt-2"
                    />
                  )}
                </div>

                {/* Course of Study & Degree Level */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">
                        Course of Study
                      </label>
                      <input
                        type="text"
                        placeholder="Search course..."
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="rounded border border-input bg-card px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring w-32"
                      />
                    </div>
                    <select
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {Object.entries(groupedCourses).map(([faculty, courseList]) => (
                        <optgroup key={faculty} label={`── Faculty of ${faculty} ──`}>
                          {courseList.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="OTHER">➕ Other Course (Type manually)...</option>
                    </select>
                    {course === "OTHER" && (
                      <Input
                        required
                        placeholder="Type your course title"
                        value={customCourse}
                        onChange={(e) => setCustomCourse(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Degree Name / Academic Level
                    </label>
                    <select
                      value={selectedDegreeId}
                      onChange={(e) => setSelectedDegreeId(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {DEGREE_LEVELS.map((deg) => (
                        <option key={deg.id} value={deg.id}>
                          {deg.code} — {deg.name} ({deg.category})
                        </option>
                      ))}
                      <option value="OTHER">➕ Other Degree / Level...</option>
                    </select>
                    {selectedDegreeId === "OTHER" && (
                      <Input
                        required
                        placeholder="e.g. Postgraduate Diploma (PGD) or Professional Cert"
                        value={customDegree}
                        onChange={(e) => setCustomDegree(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* === CATEGORY: LECTURER === */}
            {accountType === "lecturer" && (
              <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5 fade-up">
                <div className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <span>👨‍🏫</span> Faculty & Lecturer Details
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* University Selection */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      University / Institution of Affiliation
                    </label>
                    <select
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {institutions.map((inst) => (
                        <option key={inst.id} value={inst.name}>
                          {inst.name} ({inst.shortName || inst.state}) — {inst.state} State
                        </option>
                      ))}
                      <option value="OTHER">➕ Other University (Type manually)...</option>
                    </select>
                    {institution === "OTHER" && (
                      <Input
                        required
                        placeholder="Type University Name & Location"
                        value={customInstitution}
                        onChange={(e) => setCustomInstitution(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Department Dropdown Menu */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Department (Dropdown Menu)
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          Department of {dept.name} ({dept.faculty})
                        </option>
                      ))}
                      <option value="OTHER">➕ Other Department (Type manually)...</option>
                    </select>
                    {department === "OTHER" && (
                      <Input
                        required
                        placeholder="Type your department"
                        value={customDepartment}
                        onChange={(e) => setCustomDepartment(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>

                  {/* Academic Designation */}
                  <Field label="Academic Title / Designation">
                    <select
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Associate Professor / Reader">Associate Professor / Reader</option>
                      <option value="Senior Lecturer">Senior Lecturer</option>
                      <option value="Lecturer I">Lecturer I</option>
                      <option value="Lecturer II">Lecturer II</option>
                      <option value="Assistant Lecturer">Assistant Lecturer</option>
                      <option value="Graduate Assistant">Graduate Assistant</option>
                      <option value="Adjunct / Visiting Scholar">Adjunct / Visiting Scholar</option>
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* === CATEGORY: NON-ACADEMIC === */}
            {accountType === "non-academic" && (
              <div className="space-y-5 rounded-2xl border border-border bg-card/60 p-5 fade-up">
                <div className="text-xs font-bold uppercase tracking-wider text-teal flex items-center gap-1.5">
                  <span>💼</span> Professional & Industry Details
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current Role / Job Title">
                    <Input
                      required
                      placeholder="e.g. Data Scientist, Bioinformatics Specialist, Software Engineer"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                    />
                  </Field>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      Employer / Organization (Pick or Enter)
                    </label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select your employer / organization...</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.sector} — {org.state || "Nigeria"})
                        </option>
                      ))}
                      <option value="OTHER">➕ Other Organization / Freelance / Self-Employed...</option>
                    </select>
                    {selectedOrgId === "OTHER" && (
                      <Input
                        placeholder="Type organization name, Freelance, or Self-Employed"
                        value={customEmployer}
                        onChange={(e) => setCustomEmployer(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">
                      State of Residence (Nigeria)
                    </label>
                    <select
                      value={stateOfResidence}
                      onChange={(e) => setStateOfResidence(e.target.value)}
                      className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      {states.map((st) => (
                        <option key={st.id} value={st.name}>
                          {st.name} State ({st.zone})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {err && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {err}
              </div>
            )}

            <div>
              <Button variant="lime" className="w-full py-3 text-base shadow-glow">
                Complete Registration & Continue to Payment →
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
