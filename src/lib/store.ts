import { useSyncExternalStore } from "react";
import {
  triggerWelcomeEmail,
  triggerPasswordResetEmail,
  triggerPaymentSubmittedEmail,
  triggerPaymentApprovedEmail,
} from "./email-service";
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
  syncAssignmentToSupabase,
  syncSubmissionToSupabase,
  getInstitutions,
  getDepartments,
  getCourses,
  getStates,
  getOrganizations,
  getPlans,
  getPortalSettings,
  getAssignments,
  getSubmissions,
  getUsersFromSupabase,
  getPaymentsFromSupabase,
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
export type Env = "python" | "r" | "vscode" | "notebook" | "sql";
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

export interface LabAssignment {
  id: string;
  title: string;
  courseCode: string;
  institution: string;
  department: string;
  kernel: "python" | "r";
  instructions: string;
  starterCode: string;
  expectedKeywords: string[];
  expectPlot?: boolean | undefined;
  maxScore: number;
  dueDate: string;
  createdBy: string;
  createdAt: string;
}

export interface LabSubmission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  institution?: string | undefined;
  department?: string | undefined;
  kernel: "python" | "r";
  code: string;
  output: string;
  plots: string[];
  autoScore: number;
  autoChecksPassed: string[];
  autoChecksFailed: string[];
  finalScore: number;
  maxScore: number;
  status: "submitted" | "graded";
  feedback?: string | undefined;
  gradedBy?: string | undefined;
  submittedAt: string;
  gradedAt?: string | undefined;
}

export function evaluateAutoGrade(
  assignment: LabAssignment,
  code: string,
  output: string,
  plots: string[] = [],
): { autoScore: number; passed: string[]; failed: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];
  const max = assignment.maxScore || 100;

  const cleanCode = code.trim();
  const cleanOut = output.trim();
  const hasError = /\b(Traceback|SyntaxError|NameError|TypeError|ValueError|Error:)\b/i.test(
    cleanOut,
  );

  // 1. Execution & non-error check (20% of score)
  let score = 0;
  const execWeight = max * 0.2;
  if (cleanCode.length > 10 && (cleanOut.length > 0 || plots.length > 0) && !hasError) {
    score += execWeight;
    passed.push("Clean code execution (no runtime errors)");
  } else {
    failed.push(
      hasError
        ? "Execution check failed (runtime error in output)"
        : "Run your code first so output is captured",
    );
  }

  // 2. Plot requirement check (20% if required)
  const plotWeight = assignment.expectPlot ? max * 0.2 : 0;
  if (assignment.expectPlot) {
    if (plots.length > 0) {
      score += plotWeight;
      passed.push(`Generated visual figure (${plots.length} plot${plots.length > 1 ? "s" : ""})`);
    } else {
      failed.push("Expected a rendered chart/plot (e.g. plt.show() or plot())");
    }
  }

  // 3. Expected keywords / metric checks (remaining 60% or 80%)
  const kwBudget = max - execWeight - plotWeight;
  const keywords = assignment.expectedKeywords.filter((k) => k.trim().length > 0);
  if (keywords.length === 0) {
    if (cleanCode.length > 10 && !hasError) {
      score += kwBudget;
    }
  } else {
    const perKw = kwBudget / keywords.length;
    const combined = `${cleanCode}\n${cleanOut}`.toLowerCase();
    for (const kw of keywords) {
      if (combined.includes(kw.toLowerCase())) {
        score += perKw;
        passed.push(`Verified "${kw}"`);
      } else {
        failed.push(`Missing expected symbol/output: "${kw}"`);
      }
    }
  }

  return {
    autoScore: Math.min(max, Math.max(0, Math.round(score))),
    passed,
    failed,
  };
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
  assignments: LabAssignment[];
  submissions: LabSubmission[];
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
  assignments: [
    {
      id: "asg-1",
      title: "Practical 1: Supervised ML Classification with Random Forest",
      courseCode: "CSC 301",
      institution: "All Institutions",
      department: "Computer Science",
      kernel: "python",
      instructions:
        "Load the Iris dataset using scikit-learn, split into train/test sets (test_size=0.25, random_state=42), train a RandomForestClassifier, print the test Accuracy and classification_report, and plot the Feature Importances using matplotlib.",
      starterCode: `import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# 1. Load dataset & split
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.25, random_state=42, stratify=iris.target
)

# 2. Fit RandomForestClassifier & print accuracy + report
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)
preds = clf.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, preds)*100:.2f}%")
print(classification_report(y_test, preds, target_names=iris.target_names))

# 3. Plot feature importances
plt.figure(figsize=(6.5, 3.8))
plt.barh(iris.feature_names, clf.feature_importances_, color="#189B9B")
plt.title("Random Forest Feature Importances")
plt.tight_layout()
plt.show()
`,
      expectedKeywords: ["RandomForestClassifier", "accuracy", "precision", "setosa"],
      expectPlot: true,
      maxScore: 100,
      dueDate: d(14).slice(0, 10),
      createdBy: "Dr. Chioma Nnamdi",
      createdAt: d(-5),
    },
    {
      id: "asg-2",
      title: "Practical 2: NumPy Statistical Simulation & Distribution Analysis",
      courseCode: "CSC 202",
      institution: "All Institutions",
      department: "Computer Science",
      kernel: "python",
      instructions:
        "Generate 1,000 normal random samples (loc=50, scale=12) using NumPy. Compute and print the Sample Mean, Standard Deviation, and Median, and plot a histogram of the distribution.",
      starterCode: `import numpy as np
import matplotlib.pyplot as plt

np.random.seed(42)
sample = np.random.normal(loc=50, scale=12, size=1000)

print(f"Mean   : {np.mean(sample):.3f}")
print(f"Std Dev: {np.std(sample):.3f}")
print(f"Median : {np.median(sample):.3f}")

plt.figure(figsize=(6.5, 3.8))
plt.hist(sample, bins=25, color="#189B9B", edgecolor="#071E5D")
plt.title("Normal Distribution Simulation (n=1000)")
plt.show()
`,
      expectedKeywords: ["np.random.normal", "Mean", "Std", "Median"],
      expectPlot: true,
      maxScore: 100,
      dueDate: d(10).slice(0, 10),
      createdBy: "Ola Kazeem",
      createdAt: d(-7),
    },
    {
      id: "asg-3",
      title: "Practical 3: Linear Regression & Variance Modeling in R",
      courseCode: "STA 304",
      institution: "All Institutions",
      department: "Statistics & Data Analytics",
      kernel: "r",
      instructions:
        "Using the built-in mtcars dataset in R, fit an ordinary least squares linear regression model (mpg ~ wt), print model coefficients and R-squared, and plot MPG vs. Weight with the regression line.",
      starterCode: `data(mtcars)
model <- lm(mpg ~ wt, data = mtcars)
print(coef(model))
cat("R-squared:", summary(model)$r.squared, "\\n")

plot(mtcars$wt, mtcars$mpg, pch = 19, col = "#189B9B",
     xlab = "Weight", ylab = "MPG", main = "OLS Regression: MPG vs Weight")
abline(model, col = "#071E5D", lwd = 2)
`,
      expectedKeywords: ["lm(", "R-squared", "Intercept", "wt"],
      expectPlot: true,
      maxScore: 100,
      dueDate: d(21).slice(0, 10),
      createdBy: "Dr. Chioma Nnamdi",
      createdAt: d(-3),
    },
  ],
  submissions: [
    {
      id: "sub-seed-1",
      assignmentId: "asg-1",
      assignmentTitle: "Practical 1: Supervised ML Classification with Random Forest",
      studentId: "u-1",
      studentName: "Amara Okafor",
      studentEmail: "student@e-lab.ng",
      institution: "University of Lagos",
      department: "Computer Science",
      kernel: "python",
      code: `import numpy as np\nfrom sklearn.datasets import load_iris\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import accuracy_score, classification_report\n\niris = load_iris()\nX_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target, test_size=0.25, random_state=42, stratify=iris.target)\nclf = RandomForestClassifier(n_estimators=100, random_state=42)\nclf.fit(X_train, y_train)\npreds = clf.predict(X_test)\nprint(f"Accuracy: {accuracy_score(y_test, preds)*100:.2f}%")\nprint(classification_report(y_test, preds, target_names=iris.target_names))`,
      output:
        "Accuracy: 92.11%\n              precision    recall  f1-score   support\n      setosa       1.00      1.00      1.00        12\n  versicolor       0.86      0.92      0.89        13\n   virginica       0.92      0.85      0.88        13\n",
      plots: [],
      autoScore: 80,
      autoChecksPassed: [
        "Clean code execution (no runtime errors)",
        'Verified "RandomForestClassifier"',
        'Verified "accuracy"',
        'Verified "precision"',
        'Verified "setosa"',
      ],
      autoChecksFailed: ["Expected a rendered chart/plot (e.g. plt.show() or plot())"],
      finalScore: 88,
      maxScore: 100,
      status: "graded",
      feedback:
        "Great Random Forest implementation and stratified train/test split! Remember to include the feature importance bar chart for full 100 marks.",
      gradedBy: "Dr. Chioma Nnamdi",
      submittedAt: d(-2),
      gradedAt: d(-1),
    },
  ],
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
        assignments:
          parsed.assignments && parsed.assignments.length > 0
            ? parsed.assignments
            : seed().assignments,
        submissions:
          parsed.submissions && parsed.submissions.length > 0
            ? parsed.submissions
            : seed().submissions,
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

  // Asynchronously hydrate fresh data from Supabase PostgreSQL
  if (typeof window !== "undefined") {
    Promise.allSettled([
      getInstitutions(),
      getDepartments(),
      getCourses(),
      getStates(),
      getOrganizations(),
      getPlans(),
      getPortalSettings(),
      getAssignments(),
      getSubmissions(),
      getUsersFromSupabase(),
      getPaymentsFromSupabase(),
    ]).then(([insts, depts, crss, sts, orgs, plns, settings, asgs, subs, usrs, pymts]) => {
      set((s) => {
        let changed = false;
        const next = { ...s };

        if (insts.status === "fulfilled" && insts.value.length > 0) {
          next.institutions = insts.value;
          changed = true;
        }
        if (depts.status === "fulfilled" && depts.value.length > 0) {
          next.departments = depts.value;
          changed = true;
        }
        if (crss.status === "fulfilled" && crss.value.length > 0) {
          next.courses = crss.value;
          changed = true;
        }
        if (sts.status === "fulfilled" && sts.value.length > 0) {
          next.states = sts.value;
          changed = true;
        }
        if (orgs.status === "fulfilled" && orgs.value.length > 0) {
          next.organizations = orgs.value;
          changed = true;
        }
        if (plns.status === "fulfilled" && plns.value.length > 0) {
          next.plans = plns.value;
          changed = true;
        }
        if (settings.status === "fulfilled" && settings.value) {
          next.settings = { ...next.settings, ...settings.value };
          changed = true;
        }
        if (asgs.status === "fulfilled" && asgs.value.length > 0) {
          next.assignments = asgs.value;
          changed = true;
        }
        if (subs.status === "fulfilled" && subs.value.length > 0) {
          next.submissions = subs.value;
          changed = true;
        }
        if (usrs.status === "fulfilled" && usrs.value.length > 0) {
          // Merge remote users with local passwords and sessions
          const map = new Map<string, User>();
          for (const u of s.users) map.set(u.id, u);
          for (const u of usrs.value) {
            const existing = map.get(u.id);
            map.set(u.id, {
              ...u,
              password: existing?.password || u.password,
            });
          }
          next.users = Array.from(map.values());
          changed = true;
        }
        if (pymts.status === "fulfilled" && pymts.value.length > 0) {
          const pMap = new Map<string, Payment>();
          for (const p of pymts.value) pMap.set(p.id, p);
          for (const p of s.payments) {
            if (!pMap.has(p.id)) {
              pMap.set(p.id, p);
            }
          }
          next.payments = Array.from(pMap.values());
          changed = true;
        }

        return changed ? next : s;
      });
    });
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
    ((env === "notebook" || env === "sql") &&
      (u.envs.includes("python") ||
        u.envs.includes("r") ||
        u.envs.includes("sql") ||
        u.envs.includes("notebook"))));

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

    // Scenario 1: Trigger customized welcome email to registered address
    triggerWelcomeEmail(u).catch((err) => {
      console.warn("Welcome email notice:", err);
    });

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

    // Scenario 3: When payment form is submitted, send email to info@ai-gardia.com copying olakazeem@gmail.com and the user email
    const currentUser = getState().users.find((u) => u.id === userId);
    const selectedPlan = getState().plans.find((pl) => pl.id === p.plan);
    triggerPaymentSubmittedEmail(
      {
        reference: newPayment.reference,
        amount: newPayment.amount,
        bank: newPayment.bank,
        paidOn: newPayment.paidOn,
        payerName: newPayment.payerName,
        planName: selectedPlan?.name || newPayment.plan,
        note: newPayment.note,
      },
      currentUser,
    ).catch((err) => {
      console.warn("Payment submitted email notice:", err);
    });
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

          // Scenario 4: When approval has been granted after receiving payment details,
          // the user should receive an email stating approval has been granted and they can now work on the platform.
          if (plan) {
            triggerPaymentApprovedEmail(
              { name: updatedUser.name, email: updatedUser.email },
              { name: plan.name, days: plan.days, envs: plan.envs },
              { reference: p.reference, amount: p.amount, paidOn: p.paidOn },
              updatedUser.accessUntil || new Date(Date.now() + plan.days * 864e5).toISOString(),
            ).catch((err) => {
              console.warn("Payment approval email notice:", err);
            });
          }
        }
      }

      // Sync reviewed payment status back to Supabase
      syncPaymentToSupabase({
        id: p.id,
        userId: p.userId,
        plan: p.plan,
        amount: p.amount,
        bank: p.bank,
        reference: p.reference,
        paidOn: p.paidOn,
        payerName: p.payerName,
        note: p.note,
        status: approve ? "approved" : "rejected",
      }).catch(() => {});

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

    // Scenario 2: Prepare customized password reset email to the user
    triggerPasswordResetEmail(u, code).catch((err) => {
      console.warn("Password reset email notice:", err);
    });

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

  // Lab Assignment & Student Assessment Actions
  addAssignment(
    payload: Omit<LabAssignment, "id" | "createdAt"> & { id?: string | undefined },
  ): LabAssignment {
    const newAsg: LabAssignment = {
      ...payload,
      id: payload.id || `asg-${uid()}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const updated = [newAsg, ...s.assignments];
      syncAssignmentToSupabase(newAsg).catch(() => {});
      return log(
        { ...s, assignments: updated },
        `Created lab practical: ${newAsg.courseCode} — ${newAsg.title}`,
      );
    });
    return newAsg;
  },

  deleteAssignment(id: string) {
    set((s) => {
      const target = s.assignments.find((a) => a.id === id);
      return log(
        {
          ...s,
          assignments: s.assignments.filter((a) => a.id !== id),
          submissions: s.submissions.filter((sub) => sub.assignmentId !== id),
        },
        `Deleted lab practical: ${target?.title || id}`,
      );
    });
  },

  submitLabPractice(payload: {
    assignmentId: string;
    code: string;
    output: string;
    plots?: string[] | undefined;
  }): LabSubmission {
    load();
    const user = state.users.find((u) => u.id === state.sessionId);
    if (!user) throw new Error("Please sign in to submit your lab practice.");
    const assignment = state.assignments.find((a) => a.id === payload.assignmentId);
    if (!assignment) throw new Error("Selected lab assignment was not found.");

    const plots = payload.plots ?? [];
    const { autoScore, passed, failed } = evaluateAutoGrade(
      assignment,
      payload.code,
      payload.output,
      plots,
    );

    const existing = state.submissions.find(
      (sub) => sub.assignmentId === assignment.id && sub.studentId === user.id,
    );

    const submission: LabSubmission = {
      id: existing ? existing.id : `sub-${uid()}`,
      assignmentId: assignment.id,
      assignmentTitle: `${assignment.courseCode}: ${assignment.title}`,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      institution: user.institution,
      department: user.department,
      kernel: assignment.kernel,
      code: payload.code,
      output: payload.output,
      plots,
      autoScore,
      autoChecksPassed: passed,
      autoChecksFailed: failed,
      finalScore: autoScore,
      maxScore: assignment.maxScore,
      status: "submitted",
      feedback: existing?.feedback,
      gradedBy: existing?.gradedBy,
      submittedAt: new Date().toISOString(),
      gradedAt: existing?.gradedAt,
    };

    set((s) => {
      const others = s.submissions.filter((item) => item.id !== submission.id);
      syncSubmissionToSupabase(submission).catch(() => {});
      return log(
        { ...s, submissions: [submission, ...others] },
        `Submitted lab practice for ${assignment.courseCode} (Auto-score: ${autoScore}/${assignment.maxScore})`,
      );
    });

    return submission;
  },

  gradeLabSubmission(
    submissionId: string,
    finalScore: number,
    feedback: string,
    graderName?: string,
  ) {
    set((s) => {
      const actor =
        graderName || s.users.find((u) => u.id === s.sessionId)?.name || "Lecturer / Admin";
      const updated = s.submissions.map((sub) => {
        if (sub.id !== submissionId) return sub;
        const clamped = Math.min(sub.maxScore, Math.max(0, Math.round(finalScore)));
        const nextSub: LabSubmission = {
          ...sub,
          finalScore: clamped,
          feedback: feedback.trim(),
          status: "graded",
          gradedBy: actor,
          gradedAt: new Date().toISOString(),
        };
        syncSubmissionToSupabase(nextSub).catch(() => {});
        return nextSub;
      });
      const target = updated.find((u) => u.id === submissionId);
      return log(
        { ...s, submissions: updated },
        `Graded ${target?.studentName || "student"}'s lab submission (${finalScore}/${target?.maxScore ?? 100})`,
      );
    });
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

  async refreshFromSupabase() {
    try {
      const [insts, depts, crss, sts, orgs, plns, settings, asgs, subs, usrs, pymts] =
        await Promise.allSettled([
          getInstitutions(),
          getDepartments(),
          getCourses(),
          getStates(),
          getOrganizations(),
          getPlans(),
          getPortalSettings(),
          getAssignments(),
          getSubmissions(),
          getUsersFromSupabase(),
          getPaymentsFromSupabase(),
        ]);

      set((s) => {
        let changed = false;
        const next = { ...s };

        if (insts.status === "fulfilled" && insts.value.length > 0) {
          next.institutions = insts.value;
          changed = true;
        }
        if (depts.status === "fulfilled" && depts.value.length > 0) {
          next.departments = depts.value;
          changed = true;
        }
        if (crss.status === "fulfilled" && crss.value.length > 0) {
          next.courses = crss.value;
          changed = true;
        }
        if (sts.status === "fulfilled" && sts.value.length > 0) {
          next.states = sts.value;
          changed = true;
        }
        if (orgs.status === "fulfilled" && orgs.value.length > 0) {
          next.organizations = orgs.value;
          changed = true;
        }
        if (plns.status === "fulfilled" && plns.value.length > 0) {
          next.plans = plns.value;
          changed = true;
        }
        if (settings.status === "fulfilled" && settings.value) {
          next.settings = { ...next.settings, ...settings.value };
          changed = true;
        }
        if (asgs.status === "fulfilled" && asgs.value.length > 0) {
          next.assignments = asgs.value;
          changed = true;
        }
        if (subs.status === "fulfilled" && subs.value.length > 0) {
          next.submissions = subs.value;
          changed = true;
        }
        if (usrs.status === "fulfilled" && usrs.value.length > 0) {
          const map = new Map<string, User>();
          for (const u of s.users) map.set(u.id, u);
          for (const u of usrs.value) {
            const existing = map.get(u.id);
            map.set(u.id, {
              ...u,
              password: existing?.password || u.password,
            });
          }
          next.users = Array.from(map.values());
          changed = true;
        }
        if (pymts.status === "fulfilled" && pymts.value.length > 0) {
          const pMap = new Map<string, Payment>();
          for (const p of pymts.value) pMap.set(p.id, p);
          for (const p of s.payments) {
            if (!pMap.has(p.id)) {
              pMap.set(p.id, p);
            }
          }
          next.payments = Array.from(pMap.values());
          changed = true;
        }

        return changed ? next : s;
      });
      return true;
    } catch (err) {
      console.warn("Manual refresh from Supabase notice:", err);
      return false;
    }
  },

  reset() {
    set(() => seed());
  },

  newId: uid,
};
