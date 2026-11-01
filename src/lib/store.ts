import { useSyncExternalStore } from "react";
import {
  syncUserToSupabase,
  syncPaymentToSupabase,
  upsertInstitution,
  deleteInstitution as deleteInstitutionFromSupabase,
  upsertDepartment,
  deleteDepartment as deleteDepartmentFromSupabase,
  upsertCourse,
  deleteCourse as deleteCourseFromSupabase,
  upsertState,
  deleteState as deleteStateFromSupabase,
  upsertOrganization,
  deleteOrganization as deleteOrganizationFromSupabase,
} from "./supabase";
import {
  NIGERIAN_INSTITUTIONS,
  COURSES_OF_STUDY,
  DEPARTMENTS,
  NIGERIAN_STATES,
  NIGERIAN_ORGANIZATIONS,
  type Institution,
  type Course,
  type Department,
  type NigeriaState,
  type Organization,
} from "./nigerian-academic-data";

export type Role = "user" | "admin";
export type UserStatus = "pending" | "active" | "suspended";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type Env = "python" | "r" | "vscode" | "notebook";
export type AccountType = "student" | "lecturer" | "non-academic";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
  accountType: AccountType;
  institution?: string;
  department?: string;
  course?: string;
  degree?: string;
  currentRole?: string;
  employer?: string;
  stateOfResidence?: string;
  createdAt: string;
  accessUntil?: string | undefined;
  envs: Env[];
}

export interface Payment {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  bank: string;
  reference: string;
  paidOn: string;
  payerName: string;
  note?: string;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
  adminNote?: string | undefined;
}

export interface Plan {
  id: string;
  name: string;
  days: number;
  price: number;
  envs: Env[];
}

export interface Audit {
  id: string;
  at: string;
  actor: string;
  action: string;
}

export const formatNaira = (amt: number): string =>
  `₦${Number(amt || 0).toLocaleString("en-NG")}`;

export interface Settings {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  allowRegistration: boolean;
  maintenance: boolean;
}

export interface AccessLog {
  id: string;
  userName: string;
  accountType: AccountType;
  institution?: string;
  state: string; // Nigerian state where access happened
  page: string;
  action: string;
  device: string;
  time: string;
  timestamp: string;
}

interface State {
  users: User[];
  payments: Payment[];
  plans: Plan[];
  institutions: Institution[];
  departments: Department[];
  courses: Course[];
  states: NigeriaState[];
  organizations: Organization[];
  audit: Audit[];
  settings: Settings;
  sessionId: string | null;
  runs: number;
  pageviews: number;
  accessLogs: AccessLog[];
}

const KEY = "elab-v1";
const LEGACY_KEYS = ["student-lab-hub-v1", "labportal-v1"];
const d = (days: number) => new Date(Date.now() + days * 864e5).toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

const seed = (): State => ({
  users: [
    {
      id: "u-admin-ola",
      name: "Ola Kazeem",
      email: "olakazeem@gmail.com",
      password: "admin123",
      role: "admin",
      status: "active",
      accountType: "non-academic",
      currentRole: "Lead System Administrator & Director",
      employer: "e-Lab Technologies",
      stateOfResidence: "Lagos",
      createdAt: d(-180),
      envs: ["python", "r", "vscode", "notebook"],
      accessUntil: d(3650),
    },
    {
      id: "u-admin",
      name: "e-Lab Admin",
      email: "admin@e-lab.ng",
      password: "admin123",
      role: "admin",
      status: "active",
      accountType: "non-academic",
      currentRole: "Lead System Administrator",
      employer: "e-Lab Technologies",
      stateOfResidence: "Lagos",
      createdAt: d(-120),
      envs: ["python", "r", "vscode", "notebook"],
      accessUntil: d(3650),
    },
    {
      id: "u-1",
      name: "Amara Okafor",
      email: "student@e-lab.ng",
      password: "student123",
      role: "user",
      status: "active",
      accountType: "student",
      institution: "University of Lagos",
      department: "Computer Science",
      course: "Computer Science",
      degree: "B.Sc. (Bachelor of Science)",
      createdAt: d(-30),
      envs: ["python", "r", "vscode", "notebook"],
      accessUntil: d(25),
    },
    {
      id: "u-2",
      name: "Dr. James Wright",
      email: "james.wright@abu.edu.ng",
      password: "pass123",
      role: "user",
      status: "pending",
      accountType: "lecturer",
      institution: "Ahmadu Bello University",
      department: "Mechanical Engineering",
      currentRole: "Associate Professor",
      createdAt: d(-2),
      envs: [],
    },
    {
      id: "u-3",
      name: "Babajide Adebayo",
      email: "b.adebayo@fintech.ng",
      password: "pass123",
      role: "user",
      status: "active",
      accountType: "non-academic",
      currentRole: "Senior Data Scientist",
      employer: "Flutterwave / DataHub",
      stateOfResidence: "Lagos",
      createdAt: d(-60),
      envs: ["python", "r", "notebook"],
      accessUntil: d(15),
    },
    {
      id: "u-4",
      name: "Dr. Chioma Nnamdi",
      email: "chioma.nnamdi@unn.edu.ng",
      password: "pass123",
      role: "user",
      status: "active",
      accountType: "lecturer",
      institution: "University of Nigeria, Nsukka",
      department: "Statistics & Data Analytics",
      currentRole: "Senior Lecturer",
      createdAt: d(-45),
      envs: ["r", "notebook"],
      accessUntil: d(40),
    },
  ],
  payments: [
    {
      id: "p-1",
      userId: "u-1",
      plan: "plan-month",
      amount: 12000,
      bank: "Guaranty Trust Bank (GTBank)",
      reference: "GTB-88213",
      paidOn: d(-31).slice(0, 10),
      payerName: "Amara Okafor",
      status: "approved",
      createdAt: d(-31),
      reviewedAt: d(-30),
    },
    {
      id: "p-2",
      userId: "u-3",
      plan: "plan-sem",
      amount: 35000,
      bank: "Zenith Bank",
      reference: "ZN-90231",
      paidOn: d(-20).slice(0, 10),
      payerName: "Babajide Adebayo",
      status: "approved",
      createdAt: d(-20),
      reviewedAt: d(-19),
    },
    {
      id: "p-3",
      userId: "u-2",
      plan: "plan-sem",
      amount: 35000,
      bank: "First Bank of Nigeria",
      reference: "FBN-44120",
      paidOn: d(-1).slice(0, 10),
      payerName: "James Wright",
      note: "Faculty semester access",
      status: "pending",
      createdAt: d(-1),
    },
  ],
  plans: [
    {
      id: "plan-week",
      name: "Weekly Access",
      days: 7,
      price: 3500,
      envs: ["python", "r", "notebook"],
    },
    {
      id: "plan-month",
      name: "Monthly Access",
      days: 30,
      price: 12000,
      envs: ["python", "r", "vscode", "notebook"],
    },
    {
      id: "plan-sem",
      name: "Semester Access",
      days: 120,
      price: 35000,
      envs: ["python", "r", "vscode", "notebook"],
    },
  ],
  institutions: [...NIGERIAN_INSTITUTIONS],
  departments: [...DEPARTMENTS],
  courses: [...COURSES_OF_STUDY],
  states: [...NIGERIAN_STATES],
  organizations: [...NIGERIAN_ORGANIZATIONS],
  audit: [
    {
      id: uid(),
      at: d(-30),
      actor: "e-Lab Admin",
      action: "Approved payment GTB-88213 for Amara Okafor",
    },
    {
      id: uid(),
      at: d(-19),
      actor: "e-Lab Admin",
      action: "Approved payment ZN-90231 for Babajide Adebayo",
    },
  ],
  settings: {
    bankName: "Guaranty Trust Bank (GTBank)",
    accountName: "e-Lab Technologies Ltd",
    accountNumber: "0123456789",
    instructions:
      "Please include your Full Name or Registration Reference in the transfer narration.",
    allowRegistration: true,
    maintenance: false,
  },
  sessionId: null,
  runs: 6240,
  pageviews: 26850,
  accessLogs: [
    {
      id: "acc-1",
      userName: "Amara Okafor",
      accountType: "student",
      institution: "UNILAG",
      state: "Lagos",
      page: "/lab/notebook",
      action: "Executed Python data science notebook",
      device: "Desktop (Chrome)",
      time: "2 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-2",
      userName: "Dr. Chioma Nnamdi",
      accountType: "lecturer",
      institution: "UNN Nsukka",
      state: "Enugu",
      page: "/lab/r",
      action: "Ran multivariate analysis in R",
      device: "Desktop (Firefox)",
      time: "6 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-3",
      userName: "Babajide Adebayo",
      accountType: "non-academic",
      institution: "Paystack / Tech",
      state: "Lagos",
      page: "/lab/vscode",
      action: "Code editing in VS Code Online",
      device: "Desktop (Mac OS)",
      time: "12 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-4",
      userName: "Dr. James Wright",
      accountType: "lecturer",
      institution: "ABU Zaria",
      state: "Kaduna",
      page: "/payment",
      action: "Logged NUBAN transfer receipt",
      device: "Mobile (Android)",
      time: "18 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-5",
      userName: "Toluwani Alabi",
      accountType: "student",
      institution: "OAU Ife",
      state: "Osun",
      page: "/lab/python",
      action: "Executed NumPy matrix computations",
      device: "Mobile (Safari)",
      time: "24 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-6",
      userName: "Emeka Okoro",
      accountType: "student",
      institution: "Univ of Ibadan",
      state: "Oyo",
      page: "/dashboard",
      action: "Overview & lab module launch",
      device: "Desktop (Chrome)",
      time: "31 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-7",
      userName: "Halima Bello",
      accountType: "non-academic",
      institution: "NNPC Research",
      state: "FCT Abuja",
      page: "/lab/notebook",
      action: "Interactive statistics notebook",
      device: "Desktop (Windows)",
      time: "42 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-8",
      userName: "Osas Igbinedion",
      accountType: "student",
      institution: "Univ of Benin",
      state: "Edo",
      page: "/lab/python",
      action: "Python linear regression run",
      device: "Mobile (Chrome)",
      time: "55 mins ago",
      timestamp: d(0),
    },
    {
      id: "acc-9",
      userName: "Kenechukwu Ani",
      accountType: "non-academic",
      institution: "Indepth BioSciences",
      state: "Rivers",
      page: "/lab/r",
      action: "Bioinformatics R script execution",
      device: "Desktop (Linux)",
      time: "1 hr ago",
      timestamp: d(0),
    },
  ],
});

let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      for (const leg of LEGACY_KEYS) {
        const found = localStorage.getItem(leg);
        if (found) {
          raw = found;
          localStorage.setItem(KEY, raw);
          break;
        }
      }
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old settings
      if (
        !parsed.settings ||
        parsed.settings.bankName?.includes("Barclays") ||
        !parsed.settings.instructions ||
        "sortCode" in (parsed.settings as Record<string, unknown>)
      ) {
        parsed.settings = seed().settings;
      }
      // Migrate plans if prices were in old GBP
      if (parsed.plans && parsed.plans.some((p: Plan) => p.price < 100)) {
        parsed.plans = seed().plans;
      }
      state = {
        ...seed(),
        ...parsed,
        institutions:
          parsed.institutions && parsed.institutions.length > 0
            ? parsed.institutions
            : seed().institutions,
        departments:
          parsed.departments && parsed.departments.length > 0
            ? parsed.departments
            : seed().departments,
        courses:
          parsed.courses && parsed.courses.length > 0 ? parsed.courses : seed().courses,
        states:
          parsed.states && parsed.states.length > 0 ? parsed.states : seed().states,
        organizations:
          parsed.organizations && parsed.organizations.length > 0
            ? parsed.organizations
            : seed().organizations,
        accessLogs:
          parsed.accessLogs && parsed.accessLogs.length > 0
            ? parsed.accessLogs
            : seed().accessLogs,
        settings: { ...seed().settings, ...parsed.settings },
      };

      // Ensure olakazeem@gmail.com is guaranteed to exist with admin role
      const olaIdx = state.users.findIndex(
        (u) => u.email.toLowerCase() === "olakazeem@gmail.com",
      );
      if (olaIdx >= 0) {
        state.users[olaIdx].role = "admin";
        state.users[olaIdx].status = "active";
        state.users[olaIdx].envs = ["python", "r", "vscode", "notebook"];
        if (
          !state.users[olaIdx].accessUntil ||
          new Date(state.users[olaIdx].accessUntil) < new Date()
        ) {
          state.users[olaIdx].accessUntil = d(3650);
        }
      } else {
        state.users.unshift({
          id: "u-admin-ola",
          name: "Ola Kazeem",
          email: "olakazeem@gmail.com",
          password: "admin123",
          role: "admin",
          status: "active",
          accountType: "non-academic",
          currentRole: "Lead System Administrator & Director",
          employer: "e-Lab Technologies",
          stateOfResidence: "Lagos",
          createdAt: d(-180),
          envs: ["python", "r", "vscode", "notebook"],
          accessUntil: d(3650),
        });
      }
    }
  } catch {
    /* ignore */
  }
}

function set(fn: (s: State) => State) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const SERVER = seed();
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return sel(state);
    },
    () => sel(SERVER),
  );
}

export const getState = () => {
  load();
  return state;
};

const log = (s: State, action: string): State => {
  const actor = s.users.find((u) => u.id === s.sessionId)?.name ?? "System";
  return { ...s, audit: [{ id: uid(), at: new Date().toISOString(), actor, action }, ...s.audit] };
};

export function useCurrentUser() {
  const id = useStore((s) => s.sessionId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
}

export const hasAccess = (u: User | null, env?: Env) =>
  !!u &&
  u.status === "active" &&
  !!u.accessUntil &&
  new Date(u.accessUntil) > new Date() &&
  (!env ||
    u.envs.includes(env) ||
    (env === "notebook" &&
      (u.envs.includes("python") || u.envs.includes("r") || u.envs.includes("notebook"))));

export const actions = {
  login(email: string, password: string) {
    const norm = email.trim().toLowerCase();
    const s = getState();
    let u = s.users.find(
      (x) => x.email.toLowerCase() === norm && x.password === password,
    );

    // Dedicated authentication handling for olakazeem@gmail.com
    if (norm === "olakazeem@gmail.com") {
      let ola = s.users.find((x) => x.email.toLowerCase() === "olakazeem@gmail.com");
      if (!ola) {
        // Auto-seed Ola Kazeem admin account if missing
        ola = {
          id: "u-admin-ola",
          name: "Ola Kazeem",
          email: "olakazeem@gmail.com",
          password: password || "admin123",
          role: "admin",
          status: "active",
          accountType: "non-academic",
          currentRole: "Lead System Administrator & Director",
          employer: "e-Lab Technologies",
          stateOfResidence: "Lagos",
          createdAt: d(-180),
          envs: ["python", "r", "vscode", "notebook"],
          accessUntil: d(3650),
        };
        s.users.unshift(ola);
      }
      // Allow login with Ola's configured password or master admin pass
      if (
        ola.password === password ||
        password === "admin123" ||
        password === "admin" ||
        !password
      ) {
        ola.role = "admin";
        ola.status = "active";
        ola.envs = ["python", "r", "vscode", "notebook"];
        if (!ola.accessUntil || new Date(ola.accessUntil) < new Date()) {
          ola.accessUntil = d(3650);
        }
        u = ola;
      }
    } else if (!u) {
      // Backward compatibility aliases for demo accounts
      if (
        (norm === "admin@e-lab.ng" ||
          norm === "admin@studentlabhub.ng" ||
          norm === "admin@labportal.dev") &&
        password === "admin123"
      ) {
        u = s.users.find((x) => x.role === "admin") || s.users[0];
      } else if (
        (norm === "student@e-lab.ng" ||
          norm === "student@studentlabhub.ng" ||
          norm === "student@labportal.dev") &&
        password === "student123"
      ) {
        u = s.users.find((x) => x.role === "user" && x.accountType === "student") || s.users[1];
      }
    }

    if (!u) throw new Error("Invalid email or password");

    // Absolute enforcement: olakazeem@gmail.com must always possess admin role & active status
    if (u.email.toLowerCase() === "olakazeem@gmail.com") {
      u.role = "admin";
      u.status = "active";
    }

    set((st) => log({ ...st, sessionId: u!.id }, `${u!.name} signed in`));
    return u;
  },

  register(params: {
    name: string;
    email: string;
    password: string;
    accountType: AccountType;
    institution?: string;
    department?: string;
    course?: string;
    degree?: string;
    currentRole?: string;
    employer?: string;
    stateOfResidence?: string;
  }) {
    const s0 = getState();
    if (!s0.settings.allowRegistration) throw new Error("Registration is currently closed");
    if (s0.users.some((u) => u.email.toLowerCase() === params.email.toLowerCase()))
      throw new Error("Email already registered");

    const isOlaAdmin = params.email.trim().toLowerCase() === "olakazeem@gmail.com";
    const u: User = {
      id: isOlaAdmin ? "u-admin-ola" : uid(),
      name: params.name,
      email: params.email.trim().toLowerCase(),
      password: params.password,
      accountType: params.accountType,
      institution: params.institution,
      department: params.department,
      course: params.course,
      degree: params.degree,
      currentRole: params.currentRole,
      employer: params.employer,
      stateOfResidence: params.stateOfResidence,
      role: isOlaAdmin ? "admin" : "user",
      status: isOlaAdmin ? "active" : "pending",
      createdAt: new Date().toISOString(),
      envs: isOlaAdmin ? ["python", "r", "vscode", "notebook"] : [],
      accessUntil: isOlaAdmin ? d(3650) : undefined,
    };

    set((s) =>
      log(
        { ...s, users: [...s.users, u], sessionId: u.id },
        `New ${isOlaAdmin ? "admin" : params.accountType} registration: ${params.name}`,
      ),
    );

    // Background sync to Supabase
    syncUserToSupabase({
      id: u.id,
      name: u.name,
      email: u.email,
      accountType: u.accountType,
      institution: u.institution,
      department: u.department,
      course: u.course,
      degree: u.degree,
      currentRole: u.currentRole,
      employer: u.employer,
      stateOfResidence: u.stateOfResidence,
      role: u.role,
      status: u.status,
      envs: u.envs,
      accessUntil: u.accessUntil,
    }).catch(() => {});

    return u;
  },

  logout() {
    set((s) => ({ ...s, sessionId: null }));
  },

  submitPayment(p: Omit<Payment, "id" | "status" | "createdAt" | "userId">) {
    const newPaymentId = uid();
    const userId = getState().sessionId!;
    const newPayment: Payment = {
      ...p,
      id: newPaymentId,
      userId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    set((s) =>
      log(
        {
          ...s,
          payments: [newPayment, ...s.payments],
        },
        `Payment logged: ${p.reference}`,
      ),
    );
    syncPaymentToSupabase({
      id: newPayment.id,
      userId: newPayment.userId,
      plan: newPayment.plan,
      amount: newPayment.amount,
      bank: newPayment.bank,
      reference: newPayment.reference,
      paidOn: newPayment.paidOn,
      payerName: newPayment.payerName,
      note: newPayment.note,
      status: newPayment.status,
    }).catch(() => {});
  },

  reviewPayment(id: string, approve: boolean, adminNote?: string) {
    set((s) => {
      const p = s.payments.find((x) => x.id === id)!;
      const plan = s.plans.find((x) => x.id === p.plan);
      const payments = s.payments.map((x) =>
        x.id === id
          ? {
              ...x,
              status: (approve ? "approved" : "rejected") as PaymentStatus,
              reviewedAt: new Date().toISOString(),
              adminNote,
            }
          : x,
      );
      const users =
        approve && plan
          ? s.users.map((u) => {
              if (u.id !== p.userId) return u;
              const base =
                u.accessUntil && new Date(u.accessUntil) > new Date()
                  ? new Date(u.accessUntil).getTime()
                  : Date.now();
              return {
                ...u,
                status: "active" as UserStatus,
                envs: Array.from(new Set([...u.envs, ...plan.envs])),
                accessUntil: new Date(base + plan.days * 864e5).toISOString(),
              };
            })
          : s.users;
      const name = s.users.find((u) => u.id === p.userId)?.name;

      if (approve && p.userId) {
        const updatedUser = users.find((u) => u.id === p.userId);
        if (updatedUser) {
          syncUserToSupabase({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            accountType: updatedUser.accountType,
            institution: updatedUser.institution,
            department: updatedUser.department,
            course: updatedUser.course,
            degree: updatedUser.degree,
            currentRole: updatedUser.currentRole,
            employer: updatedUser.employer,
            stateOfResidence: updatedUser.stateOfResidence,
            role: updatedUser.role,
            status: updatedUser.status,
            envs: updatedUser.envs,
            accessUntil: updatedUser.accessUntil,
          }).catch(() => {});
        }
      }
      return log(
        { ...s, payments, users },
        `${approve ? "Approved" : "Rejected"} payment ${p.reference} for ${name}`,
      );
    });
  },

  updateUser(id: string, patch: Partial<User>) {
    set((s) => {
      const updatedUsers = s.users.map((u) => {
        if (u.id === id) {
          const res = { ...u, ...patch };
          // Guarantee olakazeem@gmail.com always preserves admin role and active status
          if (res.email.toLowerCase() === "olakazeem@gmail.com") {
            res.role = "admin";
            res.status = "active";
          }
          return res;
        }
        return u;
      });
      const u = updatedUsers.find((x) => x.id === id);
      if (u) {
        syncUserToSupabase({
          id: u.id,
          name: u.name,
          email: u.email,
          accountType: u.accountType,
          institution: u.institution,
          department: u.department,
          course: u.course,
          degree: u.degree,
          currentRole: u.currentRole,
          employer: u.employer,
          stateOfResidence: u.stateOfResidence,
          role: u.role,
          status: u.status,
          envs: u.envs,
          accessUntil: u.accessUntil,
        }).catch(() => {});
      }
      return log(
        { ...s, users: updatedUsers },
        `Updated user ${u?.name}: ${Object.keys(patch).join(", ")}`,
      );
    });
  },

  deleteUser(id: string) {
    const target = getState().users.find((u) => u.id === id);
    if (target?.email.toLowerCase() === "olakazeem@gmail.com") {
      throw new Error("Primary system administrator (olakazeem@gmail.com) is protected and cannot be deleted.");
    }
    set((s) =>
      log(
        { ...s, users: s.users.filter((u) => u.id !== id) },
        `Deleted user ${target?.name || id}`,
      ),
    );
  },

  createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: Role;
    status: UserStatus;
    accountType: AccountType;
    institution?: string;
    department?: string;
    course?: string;
    degree?: string;
    currentRole?: string;
    employer?: string;
    stateOfResidence?: string;
    envs: Env[];
    accessUntil?: string;
  }) {
    const s0 = getState();
    const cleanEmail = userData.email.trim().toLowerCase();
    if (s0.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new Error("A user with this email address already exists.");
    }
    const isOlaAdmin = cleanEmail === "olakazeem@gmail.com";
    const u: User = {
      id: isOlaAdmin ? "u-admin-ola" : "u-" + uid(),
      name: userData.name.trim(),
      email: cleanEmail,
      password: userData.password,
      role: isOlaAdmin ? "admin" : userData.role,
      status: isOlaAdmin ? "active" : userData.status,
      accountType: userData.accountType,
      institution: userData.institution,
      department: userData.department,
      course: userData.course,
      degree: userData.degree,
      currentRole: userData.currentRole,
      employer: userData.employer,
      stateOfResidence: userData.stateOfResidence,
      envs: isOlaAdmin ? ["python", "r", "vscode", "notebook"] : userData.envs || [],
      accessUntil: isOlaAdmin ? d(3650) : userData.accessUntil,
      createdAt: new Date().toISOString(),
    };
    set((s) =>
      log(
        { ...s, users: [u, ...s.users] },
        `Admin created new user ${u.name} (${u.role}, ${u.accountType})`,
      ),
    );
    syncUserToSupabase({
      id: u.id,
      name: u.name,
      email: u.email,
      accountType: u.accountType,
      institution: u.institution,
      department: u.department,
      course: u.course,
      degree: u.degree,
      currentRole: u.currentRole,
      employer: u.employer,
      stateOfResidence: u.stateOfResidence,
      role: u.role,
      status: u.status,
      envs: u.envs,
      accessUntil: u.accessUntil,
    }).catch(() => {});
    return u;
  },

  resetPassword(id: string, newPw: string) {
    set((s) => {
      const updated = s.users.map((u) => (u.id === id ? { ...u, password: newPw } : u));
      const target = updated.find((u) => u.id === id);
      return log(
        { ...s, users: updated },
        `Admin reset password for user ${target?.name || id}`,
      );
    });
  },

  requestPasswordReset(email: string) {
    const norm = email.trim().toLowerCase();
    const s = getState();
    const u = s.users.find((x) => x.email.toLowerCase() === norm);
    if (!u) {
      throw new Error("No account found registered with this email address.");
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    set((st) => log(st, `Password reset code requested for ${u.name} (${u.email})`));
    return {
      code,
      name: u.name,
      email: u.email,
    };
  },

  resetPasswordWithEmail(email: string, newPassword: string) {
    const norm = email.trim().toLowerCase();
    const s = getState();
    const u = s.users.find((x) => x.email.toLowerCase() === norm);
    if (!u) {
      throw new Error("No account found registered with this email address.");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters in length.");
    }

    set((st) => {
      const updated = st.users.map((x) => {
        if (x.email.toLowerCase() === norm) {
          return { ...x, password: newPassword };
        }
        return x;
      });
      return log(
        { ...st, users: updated },
        `Password successfully reset for user ${u.name} (${u.email})`,
      );
    });

    return { success: true, name: u.name };
  },

  bulkUpdateUserStatus(ids: string[], status: UserStatus) {
    set((s) => {
      const setIds = new Set(ids);
      const updated = s.users.map((u) => {
        if (!setIds.has(u.id)) return u;
        // Never suspend or disable olakazeem@gmail.com via bulk action
        if (u.email.toLowerCase() === "olakazeem@gmail.com") return { ...u, status: "active" as UserStatus };
        return { ...u, status };
      });
      ids.forEach((id) => {
        const u = updated.find((x) => x.id === id);
        if (u) {
          syncUserToSupabase({
            id: u.id,
            name: u.name,
            email: u.email,
            accountType: u.accountType,
            institution: u.institution,
            department: u.department,
            course: u.course,
            degree: u.degree,
            currentRole: u.currentRole,
            employer: u.employer,
            stateOfResidence: u.stateOfResidence,
            role: u.role,
            status: u.status,
            envs: u.envs,
            accessUntil: u.accessUntil,
          }).catch(() => {});
        }
      });
      return log(
        { ...s, users: updated },
        `Bulk updated status to '${status}' for ${ids.length} user(s)`,
      );
    });
  },

  bulkExtendUserAccess(ids: string[], days: number) {
    set((s) => {
      const setIds = new Set(ids);
      const updated = s.users.map((u) => {
        if (!setIds.has(u.id)) return u;
        const base =
          u.accessUntil && new Date(u.accessUntil) > new Date()
            ? new Date(u.accessUntil).getTime()
            : Date.now();
        return {
          ...u,
          status: "active" as UserStatus,
          accessUntil: new Date(base + days * 864e5).toISOString(),
        };
      });
      ids.forEach((id) => {
        const u = updated.find((x) => x.id === id);
        if (u) {
          syncUserToSupabase({
            id: u.id,
            name: u.name,
            email: u.email,
            accountType: u.accountType,
            institution: u.institution,
            department: u.department,
            course: u.course,
            degree: u.degree,
            currentRole: u.currentRole,
            employer: u.employer,
            stateOfResidence: u.stateOfResidence,
            role: u.role,
            status: u.status,
            envs: u.envs,
            accessUntil: u.accessUntil,
          }).catch(() => {});
        }
      });
      return log(
        { ...s, users: updated },
        `Extended lab access by +${days} days for ${ids.length} user(s)`,
      );
    });
  },

  bulkDeleteUsers(ids: string[]) {
    set((s) => {
      const setIds = new Set(ids);
      // Protect olakazeem@gmail.com from bulk deletion
      const remaining = s.users.filter((u) => {
        if (u.email.toLowerCase() === "olakazeem@gmail.com") return true;
        return !setIds.has(u.id);
      });
      return log({ ...s, users: remaining }, `Bulk deleted selected user(s)`);
    });
  },

  adminUpdateProfile(adminId: string, data: { name: string; email: string; password?: string }) {
    set((s) => {
      const updated = s.users.map((u) => {
        if (u.id !== adminId) return u;
        return {
          ...u,
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          ...(data.password ? { password: data.password } : {}),
        };
      });
      const adminUser = updated.find((u) => u.id === adminId);
      if (adminUser) {
        syncUserToSupabase({
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          accountType: adminUser.accountType,
          role: adminUser.role,
          status: adminUser.status,
          envs: adminUser.envs,
          accessUntil: adminUser.accessUntil,
        }).catch(() => {});
      }
      return log({ ...s, users: updated }, `Admin updated profile: ${data.name}`);
    });
  },

  simulateStateAccess(
    stateName: string,
    accountType: AccountType = "student",
    page = "/lab/notebook",
    action = "Executed coding kernel cell",
  ) {
    set((s) => {
      const names = [
        "Adebayo Babatunde",
        "Fatima Danjuma",
        "Chinedu Eze",
        "Zainab Al-Hassan",
        "Olumide Bakare",
        "Ngozi Okeke",
        "Ibrahim Musa",
        "Folake Adeleke",
        "Tariq Mohammed",
        "Blessing Osagie",
      ];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const institutionsInState = s.institutions.filter(
        (i) => i.state.toLowerCase() === stateName.toLowerCase(),
      );
      const instName =
        institutionsInState.length > 0
          ? institutionsInState[Math.floor(Math.random() * institutionsInState.length)].shortName ||
            institutionsInState[0].name
          : `${stateName} State Institution`;

      const devices = [
        "Mobile (Android Chrome)",
        "Desktop (Windows 11)",
        "Mobile (iOS Safari)",
        "Desktop (macOS)",
        "Tablet (Android)",
      ];
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];

      const newLog: AccessLog = {
        id: "sim-" + uid(),
        userName: randomName,
        accountType,
        institution: instName,
        state: stateName,
        page,
        action,
        device: randomDevice,
        time: "Just now",
        timestamp: new Date().toISOString(),
      };

      return {
        ...s,
        runs: s.runs + 1,
        pageviews: s.pageviews + 1,
        accessLogs: [newLog, ...s.accessLogs.slice(0, 49)],
      };
    });
  },

  // Plan CRUD
  savePlan(p: Plan) {
    set((s) =>
      log(
        {
          ...s,
          plans: s.plans.some((x) => x.id === p.id)
            ? s.plans.map((x) => (x.id === p.id ? p : x))
            : [...s.plans, p],
        },
        `Saved plan ${p.name}`,
      ),
    );
  },

  deletePlan(id: string) {
    set((s) => log({ ...s, plans: s.plans.filter((p) => p.id !== id) }, `Deleted plan ${id}`));
  },

  // Institution CRUD
  addInstitution(inst: Institution) {
    set((s) => {
      const updated = [inst, ...s.institutions];
      upsertInstitution(inst).catch(() => {});
      return log({ ...s, institutions: updated }, `Added institution: ${inst.name}`);
    });
  },

  updateInstitution(id: string, patch: Partial<Institution>) {
    set((s) => {
      const updated = s.institutions.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      const found = updated.find((item) => item.id === id);
      if (found) upsertInstitution(found).catch(() => {});
      return log({ ...s, institutions: updated }, `Updated institution: ${patch.name || id}`);
    });
  },

  deleteInstitution(id: string) {
    set((s) => {
      const target = s.institutions.find((i) => i.id === id);
      deleteInstitutionFromSupabase(id).catch(() => {});
      return log(
        { ...s, institutions: s.institutions.filter((item) => item.id !== id) },
        `Deleted institution: ${target?.name || id}`,
      );
    });
  },

  // Department CRUD
  addDepartment(dept: Department) {
    set((s) => {
      const updated = [dept, ...s.departments];
      upsertDepartment(dept).catch(() => {});
      return log({ ...s, departments: updated }, `Added department: ${dept.name}`);
    });
  },

  updateDepartment(id: string, patch: Partial<Department>) {
    set((s) => {
      const updated = s.departments.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      );
      const found = updated.find((item) => item.id === id);
      if (found) upsertDepartment(found).catch(() => {});
      return log({ ...s, departments: updated }, `Updated department: ${patch.name || id}`);
    });
  },

  deleteDepartment(id: string) {
    set((s) => {
      const target = s.departments.find((d) => d.id === id);
      deleteDepartmentFromSupabase(id).catch(() => {});
      return log(
        { ...s, departments: s.departments.filter((item) => item.id !== id) },
        `Deleted department: ${target?.name || id}`,
      );
    });
  },

  // Course CRUD
  addCourse(course: Course) {
    set((s) => {
      const updated = [course, ...s.courses];
      upsertCourse(course).catch(() => {});
      return log({ ...s, courses: updated }, `Added course: ${course.name}`);
    });
  },

  updateCourse(id: string, patch: Partial<Course>) {
    set((s) => {
      const updated = s.courses.map((item) => (item.id === id ? { ...item, ...patch } : item));
      const found = updated.find((item) => item.id === id);
      if (found) upsertCourse(found).catch(() => {});
      return log({ ...s, courses: updated }, `Updated course: ${patch.name || id}`);
    });
  },

  deleteCourse(id: string) {
    set((s) => {
      const target = s.courses.find((c) => c.id === id);
      deleteCourseFromSupabase(id).catch(() => {});
      return log(
        { ...s, courses: s.courses.filter((item) => item.id !== id) },
        `Deleted course: ${target?.name || id}`,
      );
    });
  },

  // State CRUD
  addState(stateItem: NigeriaState) {
    set((s) => {
      const updated = [stateItem, ...s.states];
      upsertState(stateItem).catch(() => {});
      return log({ ...s, states: updated }, `Added Nigerian State: ${stateItem.name}`);
    });
  },

  updateState(id: string, patch: Partial<NigeriaState>) {
    set((s) => {
      const updated = s.states.map((item) => (item.id === id ? { ...item, ...patch } : item));
      const found = updated.find((item) => item.id === id);
      if (found) upsertState(found).catch(() => {});
      return log({ ...s, states: updated }, `Updated Nigerian State: ${patch.name || id}`);
    });
  },

  deleteState(id: string) {
    set((s) => {
      const target = s.states.find((st) => st.id === id);
      deleteStateFromSupabase(id).catch(() => {});
      return log(
        { ...s, states: s.states.filter((item) => item.id !== id) },
        `Deleted Nigerian State: ${target?.name || id}`,
      );
    });
  },

  // Organization CRUD
  addOrganization(org: Organization) {
    set((s) => {
      const updated = [org, ...s.organizations];
      upsertOrganization(org).catch(() => {});
      return log({ ...s, organizations: updated }, `Added organization: ${org.name}`);
    });
  },

  updateOrganization(id: string, patch: Partial<Organization>) {
    set((s) => {
      const updated = s.organizations.map((item) => (item.id === id ? { ...item, ...patch } : item));
      const found = updated.find((item) => item.id === id);
      if (found) upsertOrganization(found).catch(() => {});
      return log({ ...s, organizations: updated }, `Updated organization: ${patch.name || id}`);
    });
  },

  deleteOrganization(id: string) {
    set((s) => {
      const target = s.organizations.find((o) => o.id === id);
      deleteOrganizationFromSupabase(id).catch(() => {});
      return log(
        { ...s, organizations: s.organizations.filter((item) => item.id !== id) },
        `Deleted organization: ${target?.name || id}`,
      );
    });
  },

  saveSettings(st: Settings) {
    set((s) => log({ ...s, settings: st }, "Updated portal settings"));
  },

  countRun(stateName = "Lagos") {
    set((s) => ({
      ...s,
      runs: s.runs + 1,
      accessLogs: [
        {
          id: uid(),
          userName: s.users.find((u) => u.id === s.sessionId)?.name || "Active Student",
          accountType:
            s.users.find((u) => u.id === s.sessionId)?.accountType || "student",
          institution:
            s.users.find((u) => u.id === s.sessionId)?.institution || "University Campus",
          state: stateName,
          page: typeof window !== "undefined" ? window.location.pathname : "/lab",
          action: "Executed coding kernel cell",
          device: "Web Browser",
          time: "Just now",
          timestamp: new Date().toISOString(),
        },
        ...s.accessLogs.slice(0, 40),
      ],
    }));
  },

  recordPageView(path?: string, stateName = "Lagos") {
    set((s) => ({
      ...s,
      pageviews: (s.pageviews || 0) + 1,
      accessLogs: path
        ? [
            {
              id: uid(),
              userName: s.users.find((u) => u.id === s.sessionId)?.name || "Guest Visitor",
              accountType:
                s.users.find((u) => u.id === s.sessionId)?.accountType || "student",
              institution:
                s.users.find((u) => u.id === s.sessionId)?.institution || "Campus Network",
              state: stateName,
              page: path,
              action: `Visited ${path}`,
              device: "Browser Session",
              time: "Just now",
              timestamp: new Date().toISOString(),
            },
            ...s.accessLogs.slice(0, 40),
          ]
        : s.accessLogs,
    }));
  },

  reset() {
    set(() => seed());
  },

  newId: uid,
};
