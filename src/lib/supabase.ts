import { createClient } from "@supabase/supabase-js";
import {
  NIGERIAN_INSTITUTIONS,
  COURSES_OF_STUDY,
  DEGREE_LEVELS,
  DEPARTMENTS,
  NIGERIAN_STATES,
  NIGERIAN_ORGANIZATIONS,
  type Institution,
  type Course,
  type DegreeLevel,
  type Department,
  type NigeriaState,
  type Organization,
} from "./nigerian-academic-data";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://egnstirfqhpgzfuezlwo.supabase.co";
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_AvTKJf4RaBJGI84947KKBQ_l7e2IpLj";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetch Nigerian higher institutions from Supabase with graceful fallback
 */
export async function getInstitutions(): Promise<Institution[]> {
  try {
    const { data, error } = await supabase
      .from("institutions")
      .select("id, name, short_name, category, state")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((item) => ({
        id: item.id,
        name: item.name,
        shortName: item.short_name ?? "",
        category: item.category,
        state: item.state,
      }));
    }
  } catch (err) {
    console.warn("Supabase institutions fetch error:", err);
  }
  return NIGERIAN_INSTITUTIONS;
}

/**
 * Fetch Departments from Supabase with graceful fallback
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, faculty")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Supabase departments fetch error:", err);
  }
  return DEPARTMENTS;
}

/**
 * Fetch Courses from Supabase with graceful fallback
 */
export async function getCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("id, name, faculty, department_id, department_name")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((c) => ({
        id: c.id,
        name: c.name,
        faculty: c.faculty,
        departmentId: c.department_id,
        departmentName: c.department_name,
      }));
    }
  } catch (err) {
    console.warn("Supabase courses fetch error:", err);
  }
  return COURSES_OF_STUDY;
}

/**
 * Fetch Degree Levels from Supabase with graceful fallback
 */
export async function getDegreeLevels(): Promise<DegreeLevel[]> {
  try {
    const { data, error } = await supabase
      .from("degrees")
      .select("id, code, name, category")
      .order("category", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Supabase degrees fetch error:", err);
  }
  return DEGREE_LEVELS;
}

/**
 * Fetch Nigerian States from Supabase with graceful fallback
 */
export async function getStates(): Promise<NigeriaState[]> {
  try {
    const { data, error } = await supabase
      .from("nigeria_states")
      .select("id, name, zone")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Supabase states fetch error:", err);
  }
  return NIGERIAN_STATES;
}

/**
 * Fetch Organizations from Supabase with graceful fallback
 */
export async function getOrganizations(): Promise<Organization[]> {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, sector, state, website")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        sector: d.sector,
        state: d.state,
        website: d.website,
      }));
    }
  } catch (err) {
    console.warn("Supabase organizations fetch error:", err);
  }
  return NIGERIAN_ORGANIZATIONS;
}

/**
 * CRUD: Upsert Institution to Supabase
 */
export async function upsertInstitution(inst: Institution) {
  try {
    await supabase.from("institutions").upsert({
      id: inst.id,
      name: inst.name,
      short_name: inst.shortName,
      category: inst.category,
      state: inst.state,
    });
  } catch (err) {
    console.warn("Supabase upsertInstitution error:", err);
  }
}

/**
 * CRUD: Delete Institution from Supabase
 */
export async function deleteInstitution(id: string) {
  try {
    await supabase.from("institutions").delete().eq("id", id);
  } catch (err) {
    console.warn("Supabase deleteInstitution error:", err);
  }
}

/**
 * CRUD: Upsert Department to Supabase
 */
export async function upsertDepartment(dept: Department) {
  try {
    await supabase.from("departments").upsert({
      id: dept.id,
      name: dept.name,
      faculty: dept.faculty,
    });
  } catch (err) {
    console.warn("Supabase upsertDepartment error:", err);
  }
}

/**
 * CRUD: Delete Department from Supabase
 */
export async function deleteDepartment(id: string) {
  try {
    await supabase.from("departments").delete().eq("id", id);
  } catch (err) {
    console.warn("Supabase deleteDepartment error:", err);
  }
}

/**
 * CRUD: Upsert Course to Supabase
 */
export async function upsertCourse(course: Course) {
  try {
    await supabase.from("courses").upsert({
      id: course.id,
      name: course.name,
      faculty: course.faculty,
      department_id: course.departmentId,
      department_name: course.departmentName,
    });
  } catch (err) {
    console.warn("Supabase upsertCourse error:", err);
  }
}

/**
 * CRUD: Delete Course from Supabase
 */
export async function deleteCourse(id: string) {
  try {
    await supabase.from("courses").delete().eq("id", id);
  } catch (err) {
    console.warn("Supabase deleteCourse error:", err);
  }
}

/**
 * CRUD: Upsert State to Supabase
 */
export async function upsertState(state: NigeriaState) {
  try {
    await supabase.from("nigeria_states").upsert({
      id: state.id,
      name: state.name,
      zone: state.zone,
    });
  } catch (err) {
    console.warn("Supabase upsertState error:", err);
  }
}

/**
 * CRUD: Delete State from Supabase
 */
export async function deleteState(id: string) {
  try {
    await supabase.from("nigeria_states").delete().eq("id", id);
  } catch (err) {
    console.warn("Supabase deleteState error:", err);
  }
}

/**
 * CRUD: Upsert Organization to Supabase
 */
export async function upsertOrganization(org: Organization) {
  try {
    await supabase.from("organizations").upsert({
      id: org.id,
      name: org.name,
      sector: org.sector,
      state: org.state,
      website: org.website,
    });
  } catch (err) {
    console.warn("Supabase upsertOrganization error:", err);
  }
}

/**
 * CRUD: Delete Organization from Supabase
 */
export async function deleteOrganization(id: string) {
  try {
    await supabase.from("organizations").delete().eq("id", id);
  } catch (err) {
    console.warn("Supabase deleteOrganization error:", err);
  }
}

/**
 * Sync user profile (Students, Lecturers, Non-Academic) to Supabase
 */
export async function syncUserToSupabase(user: {
  id: string;
  name: string;
  email: string;
  accountType?: string;
  institution?: string;
  department?: string;
  course?: string;
  degree?: string;
  currentRole?: string;
  employer?: string;
  stateOfResidence?: string;
  role: string;
  status: string;
  envs: string[];
  accessUntil?: string;
}) {
  try {
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        account_type: user.accountType || "student",
        institution: user.institution,
        department: user.department,
        course_of_study: user.course,
        degree_level: user.degree,
        current_role: user.currentRole,
        employer: user.employer,
        state_of_residence: user.stateOfResidence,
        role: user.role,
        status: user.status,
        envs: user.envs,
        access_until: user.accessUntil,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) {
      console.warn("Supabase syncUser notice:", error.message);
    }
  } catch (err) {
    console.warn("Supabase syncUser failed:", err);
  }
}

/**
 * Sync submitted payment to Supabase 'payments' table
 */
export async function syncPaymentToSupabase(payment: {
  id: string;
  userId: string;
  plan: string;
  amount: number;
  bank: string;
  reference: string;
  paidOn: string;
  payerName: string;
  note?: string;
  status: string;
}) {
  try {
    const { error } = await supabase.from("payments").upsert(
      {
        id: payment.id,
        user_id: payment.userId,
        plan_id: payment.plan,
        amount: payment.amount,
        bank_name: payment.bank,
        reference: payment.reference,
        paid_on: payment.paidOn,
        payer_name: payment.payerName,
        note: payment.note,
        status: payment.status,
        created_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) {
      console.warn("Supabase syncPayment notice:", error.message);
    }
  } catch (err) {
    console.warn("Supabase syncPayment failed:", err);
  }
}

/**
 * Sync Lab Assignment to Supabase 'lab_assignments' table
 */
export async function syncAssignmentToSupabase(asg: {
  id: string;
  title: string;
  courseCode: string;
  institution: string;
  department: string;
  kernel: string;
  instructions: string;
  starterCode: string;
  expectedKeywords: string[];
  expectPlot?: boolean | undefined;
  maxScore: number;
  dueDate: string;
  createdBy: string;
  createdAt: string;
}) {
  try {
    await supabase.from("lab_assignments").upsert(
      {
        id: asg.id,
        title: asg.title,
        course_code: asg.courseCode,
        institution: asg.institution,
        department: asg.department,
        kernel: asg.kernel,
        instructions: asg.instructions,
        starter_code: asg.starterCode,
        expected_keywords: asg.expectedKeywords,
        expect_plot: Boolean(asg.expectPlot),
        max_score: asg.maxScore,
        due_date: asg.dueDate,
        created_by: asg.createdBy,
        created_at: asg.createdAt,
      },
      { onConflict: "id" },
    );
  } catch (err) {
    console.warn("Supabase syncAssignment notice:", err);
  }
}

/**
 * Sync Student Lab Submission / Grade to Supabase 'lab_submissions' table
 */
export async function syncSubmissionToSupabase(sub: {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  institution?: string | undefined;
  department?: string | undefined;
  kernel: string;
  code: string;
  output: string;
  autoScore: number;
  finalScore: number;
  maxScore: number;
  status: string;
  feedback?: string | undefined;
  gradedBy?: string | undefined;
  submittedAt: string;
  gradedAt?: string | undefined;
}) {
  try {
    await supabase.from("lab_submissions").upsert(
      {
        id: sub.id,
        assignment_id: sub.assignmentId,
        assignment_title: sub.assignmentTitle,
        student_id: sub.studentId,
        student_name: sub.studentName,
        student_email: sub.studentEmail,
        institution: sub.institution ?? null,
        department: sub.department ?? null,
        kernel: sub.kernel,
        code: sub.code,
        output: sub.output,
        auto_score: sub.autoScore,
        final_score: sub.finalScore,
        max_score: sub.maxScore,
        status: sub.status,
        feedback: sub.feedback ?? null,
        graded_by: sub.gradedBy ?? null,
        submitted_at: sub.submittedAt,
        graded_at: sub.gradedAt ?? null,
      },
      { onConflict: "id" },
    );
  } catch (err) {
    console.warn("Supabase syncSubmission notice:", err);
  }
}

/**
 * Fetch Lab Assignments from Supabase with graceful fallback
 */
export async function getAssignments(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("lab_assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        title: d.title,
        courseCode: d.course_code,
        institution: d.institution,
        department: d.department,
        kernel: d.kernel,
        instructions: d.instructions,
        starterCode: d.starter_code,
        expectedKeywords: d.expected_keywords || [],
        expectPlot: d.expect_plot,
        maxScore: d.max_score,
        dueDate: d.due_date,
        createdBy: d.created_by,
        createdAt: d.created_at,
      }));
    }
  } catch (err) {
    console.warn("Supabase assignments fetch error:", err);
  }
  return [];
}

/**
 * Fetch Lab Submissions from Supabase with graceful fallback
 */
export async function getSubmissions(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("lab_submissions")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        assignmentId: d.assignment_id,
        assignmentTitle: d.assignment_title,
        studentId: d.student_id,
        studentName: d.student_name,
        studentEmail: d.student_email,
        institution: d.institution,
        department: d.department,
        kernel: d.kernel,
        code: d.code,
        output: d.output,
        plots: [],
        autoScore: d.auto_score,
        autoChecksPassed: [],
        autoChecksFailed: [],
        finalScore: d.final_score,
        maxScore: d.max_score,
        status: d.status,
        feedback: d.feedback,
        gradedBy: d.graded_by,
        submittedAt: d.submitted_at,
        gradedAt: d.graded_at,
      }));
    }
  } catch (err) {
    console.warn("Supabase submissions fetch error:", err);
  }
  return [];
}

/**
 * Fetch Plans from Supabase with graceful fallback
 */
export async function getPlans(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("duration_days", { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        days: p.duration_days,
        price: Number(p.price),
        envs: p.envs || [],
      }));
    }
  } catch (err) {
    console.warn("Supabase plans fetch error:", err);
  }
  return [];
}

/**
 * Fetch Portal Settings from Supabase with graceful fallback
 */
export async function getPortalSettings(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("portal_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      return {
        bankName: data.bank_name,
        accountName: data.account_name,
        accountNumber: data.account_number,
        instructions: data.instructions,
        allowRegistration: data.allow_registration,
        maintenance: data.maintenance_mode,
      };
    }
  } catch (err) {
    console.warn("Supabase portal_settings fetch error:", err);
  }
  return null;
}

/**
 * Fetch Users from Supabase with graceful fallback
 */
export async function getUsersFromSupabase(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        password: "password123", // fallback placeholder for client auth
        role: u.role || "user",
        status: u.status || "active",
        accountType: u.account_type || "student",
        institution: u.institution,
        department: u.department,
        course: u.course_of_study,
        degree: u.degree_level,
        currentRole: u.current_role,
        employer: u.employer,
        stateOfResidence: u.state_of_residence,
        createdAt: u.created_at,
        accessUntil: u.access_until,
        envs: u.envs || [],
      }));
    }
  } catch (err) {
    console.warn("Supabase users fetch error:", err);
  }
  return [];
}

/**
 * Fetch Payments from Supabase with graceful fallback
 */
export async function getPaymentsFromSupabase(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        plan: p.plan_id,
        amount: Number(p.amount),
        bank: p.bank_name,
        reference: p.reference,
        paidOn: p.paid_on,
        payerName: p.payer_name,
        note: p.note,
        status: p.status,
        createdAt: p.created_at,
        reviewedAt: p.reviewed_at,
        adminNote: p.admin_note,
      }));
    }
  } catch (err) {
    console.warn("Supabase payments fetch error:", err);
  }
  return [];
}


