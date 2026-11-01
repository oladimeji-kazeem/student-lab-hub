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
