-- ==============================================================================
-- e-Lab (formerly Student Lab Hub) - Supabase Complete Database Schema & Seed Script
-- Project URL: https://egnstirfqhpgzfuezlwo.supabase.co
-- ==============================================================================

-- 1. INSTITUTIONS TABLE (Nigerian Higher Institutions)
CREATE TABLE IF NOT EXISTS public.institutions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    category VARCHAR(50) NOT NULL, -- 'Federal University', 'State University', 'Private University', 'Polytechnic', 'College of Education'
    state VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE (Academic Departments)
CREATE TABLE IF NOT EXISTS public.departments (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COURSES TABLE (Academic Courses / Majors)
CREATE TABLE IF NOT EXISTS public.courses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NIGERIA STATES TABLE (36 States + FCT Abuja)
CREATE TABLE IF NOT EXISTS public.nigeria_states (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    zone VARCHAR(50) NOT NULL, -- 'South West', 'South East', 'South South', 'North Central', 'North West', 'North East'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DEGREES TABLE (Degree Names & Academic Levels)
CREATE TABLE IF NOT EXISTS public.degrees (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) NOT NULL, -- e.g. B.Sc., B.Eng., HND
    name VARCHAR(100) NOT NULL, -- e.g. Bachelor of Science
    category VARCHAR(50) NOT NULL, -- 'Undergraduate', 'Polytechnic / Diploma', 'Postgraduate'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORGANIZATIONS TABLE (Where Non-Academic Users Pick)
CREATE TABLE IF NOT EXISTS public.organizations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    state VARCHAR(50),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    account_type VARCHAR(50) NOT NULL DEFAULT 'student', -- 'student' | 'lecturer' | 'non-academic'
    institution VARCHAR(255),
    department VARCHAR(255),
    course_of_study VARCHAR(255),
    degree_level VARCHAR(100),
    "current_role" VARCHAR(255),
    employer VARCHAR(255),
    state_of_residence VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'suspended'
    envs TEXT[] NOT NULL DEFAULT '{}', -- e.g. ['python', 'r', 'vscode', 'notebook']
    access_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migrations for existing users tables
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS account_type VARCHAR(50) DEFAULT 'student';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "current_role" VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS employer VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state_of_residence VARCHAR(100);

-- 7. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    envs TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(100) REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) REFERENCES public.plans(id),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    bank_name VARCHAR(100) NOT NULL,
    reference VARCHAR(100) NOT NULL UNIQUE,
    paid_on DATE NOT NULL,
    payer_name VARCHAR(150) NOT NULL,
    note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    reviewed_at TIMESTAMPTZ,
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PORTAL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.portal_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    bank_name VARCHAR(100) NOT NULL DEFAULT 'Guaranty Trust Bank (GTBank)',
    account_name VARCHAR(100) NOT NULL DEFAULT 'e-Lab Technologies Ltd',
    account_number VARCHAR(50) NOT NULL DEFAULT '0123456789',
    instructions TEXT NOT NULL DEFAULT 'Please include your Full Name or Registration Reference in the transfer narration.',
    allow_registration BOOLEAN NOT NULL DEFAULT TRUE,
    maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was created in an earlier state
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS account_number VARCHAR(50) DEFAULT '0123456789';
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS instructions TEXT DEFAULT 'Please include your Full Name or Registration Reference in the transfer narration.';

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    actor VARCHAR(150) NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nigeria_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.degrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Catalog tables policies (Idempotent DROP & CREATE)
DROP POLICY IF EXISTS "Public read institutions" ON public.institutions;
CREATE POLICY "Public read institutions" ON public.institutions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write institutions" ON public.institutions;
CREATE POLICY "Allow write institutions" ON public.institutions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read departments" ON public.departments;
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write departments" ON public.departments;
CREATE POLICY "Allow write departments" ON public.departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read courses" ON public.courses;
CREATE POLICY "Public read courses" ON public.courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write courses" ON public.courses;
CREATE POLICY "Allow write courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read nigeria_states" ON public.nigeria_states;
CREATE POLICY "Public read nigeria_states" ON public.nigeria_states FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write nigeria_states" ON public.nigeria_states;
CREATE POLICY "Allow write nigeria_states" ON public.nigeria_states FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read organizations" ON public.organizations;
CREATE POLICY "Public read organizations" ON public.organizations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow write organizations" ON public.organizations;
CREATE POLICY "Allow write organizations" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read degrees" ON public.degrees;
CREATE POLICY "Public read degrees" ON public.degrees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read plans" ON public.plans;
CREATE POLICY "Public read plans" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read settings" ON public.portal_settings;
CREATE POLICY "Public read settings" ON public.portal_settings FOR SELECT USING (true);

-- Users, payments, and audit policies (Idempotent DROP & CREATE)
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select users" ON public.users;
CREATE POLICY "Allow select users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update users" ON public.users;
CREATE POLICY "Allow update users" ON public.users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow insert payments" ON public.payments;
CREATE POLICY "Allow insert payments" ON public.payments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select payments" ON public.payments;
CREATE POLICY "Allow select payments" ON public.payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update payments" ON public.payments;
CREATE POLICY "Allow update payments" ON public.payments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow select audit logs" ON public.audit_logs;
CREATE POLICY "Allow select audit logs" ON public.audit_logs FOR SELECT USING (true);

-- ==============================================================================
-- SEED DATA: NIGERIAN HIGHER INSTITUTIONS
-- ==============================================================================
INSERT INTO public.institutions (id, name, short_name, category, state) VALUES
  ('inst-unilag', 'University of Lagos', 'UNILAG', 'Federal University', 'Lagos'),
  ('inst-ui', 'University of Ibadan', 'UI', 'Federal University', 'Oyo'),
  ('inst-oau', 'Obafemi Awolowo University', 'OAU', 'Federal University', 'Osun'),
  ('inst-abu', 'Ahmadu Bello University', 'ABU', 'Federal University', 'Kaduna'),
  ('inst-unn', 'University of Nigeria, Nsukka', 'UNN', 'Federal University', 'Enugu'),
  ('inst-uniben', 'University of Benin', 'UNIBEN', 'Federal University', 'Edo'),
  ('inst-unilorin', 'University of Ilorin', 'UNILORIN', 'Federal University', 'Kwara'),
  ('inst-futa', 'Federal University of Technology, Akure', 'FUTA', 'Federal University', 'Ondo'),
  ('inst-futminna', 'Federal University of Technology, Minna', 'FUTMINNA', 'Federal University', 'Niger'),
  ('inst-futo', 'Federal University of Technology, Owerri', 'FUTO', 'Federal University', 'Imo'),
  ('inst-uniport', 'University of Port Harcourt', 'UNIPORT', 'Federal University', 'Rivers'),
  ('inst-unical', 'University of Calabar', 'UNICAL', 'Federal University', 'Cross River'),
  ('inst-unijos', 'University of Jos', 'UNIJOS', 'Federal University', 'Plateau'),
  ('inst-uniabuja', 'University of Abuja', 'UNIABUJA', 'Federal University', 'FCT'),
  ('inst-buk', 'Bayero University Kano', 'BUK', 'Federal University', 'Kano'),
  ('inst-funaab', 'Federal University of Agriculture, Abeokuta', 'FUNAAB', 'Federal University', 'Ogun'),
  ('inst-nou', 'National Open University of Nigeria', 'NOUN', 'Federal University', 'FCT'),
  ('inst-lasu', 'Lagos State University', 'LASU', 'State University', 'Lagos'),
  ('inst-oou', 'Olabisi Onabanjo University', 'OOU', 'State University', 'Ogun'),
  ('inst-eksu', 'Ekiti State University', 'EKSU', 'State University', 'Ekiti'),
  ('inst-delsu', 'Delta State University, Abraka', 'DELSU', 'State University', 'Delta'),
  ('inst-aaue', 'Ambrose Alli University, Ekpoma', 'AAU', 'State University', 'Edo'),
  ('inst-lautech', 'Ladoke Akintola University of Technology', 'LAUTECH', 'State University', 'Oyo'),
  ('inst-kwasu', 'Kwara State University', 'KWASU', 'State University', 'Kwara'),
  ('inst-rsust', 'Rivers State University', 'RSU', 'State University', 'Rivers'),
  ('inst-esut', 'Enugu State University of Science and Technology', 'ESUT', 'State University', 'Enugu'),
  ('inst-tasued', 'Tai Solarin University of Education', 'TASUED', 'State University', 'Ogun'),
  ('inst-covenant', 'Covenant University', 'CU', 'Private University', 'Ogun'),
  ('inst-babcock', 'Babcock University', 'BU', 'Private University', 'Ogun'),
  ('inst-afe-babalola', 'Afe Babalola University', 'ABUAD', 'Private University', 'Ekiti'),
  ('inst-pan-atlantic', 'Pan-Atlantic University', 'PAU', 'Private University', 'Lagos'),
  ('inst-bowen', 'Bowen University', 'BOWEN', 'Private University', 'Osun'),
  ('inst-redemption', 'Redeemer''s University', 'RUN', 'Private University', 'Osun'),
  ('inst-lead-city', 'Lead City University', 'LCU', 'Private University', 'Oyo'),
  ('inst-nile', 'Nile University of Nigeria', 'NILE', 'Private University', 'FCT'),
  ('inst-baze', 'Baze University', 'BAZE', 'Private University', 'FCT'),
  ('inst-landmark', 'Landmark University', 'LMU', 'Private University', 'Kwara'),
  ('inst-veritas', 'Veritas University', 'VERITAS', 'Private University', 'FCT'),
  ('inst-yabatech', 'Yaba College of Technology', 'YABATECH', 'Polytechnic', 'Lagos'),
  ('inst-fedpoly-eko', 'Federal Polytechnic, Ilaro', 'FPI', 'Polytechnic', 'Ogun'),
  ('inst-fedpoly-ede', 'Federal Polytechnic, Ede', 'FEDPOLYEDE', 'Polytechnic', 'Osun'),
  ('inst-fedpoly-offa', 'Federal Polytechnic, Offa', 'FEDPOLYOFFA', 'Polytechnic', 'Kwara'),
  ('inst-fedpoly-nekede', 'Federal Polytechnic, Nekede', 'FPNO', 'Polytechnic', 'Imo'),
  ('inst-fedpoly-ado', 'Federal Polytechnic, Ado-Ekiti', 'FEDPOLYADO', 'Polytechnic', 'Ekiti'),
  ('inst-laspotech', 'Lagos State Polytechnic (LASUSTECH)', 'LASPOTECH', 'Polytechnic', 'Lagos'),
  ('inst-the-poly-ibadan', 'The Polytechnic, Ibadan', 'POLYIBADAN', 'Polytechnic', 'Oyo'),
  ('inst-kadpoly', 'Kaduna Polytechnic', 'KADPOLY', 'Polytechnic', 'Kaduna'),
  ('inst-fce-akoka', 'Federal College of Education (Technical), Akoka', 'FCETAKOKA', 'College of Education', 'Lagos'),
  ('inst-adeyemi', 'Adeyemi College of Education, Ondo', 'ACEONDO', 'College of Education', 'Ondo'),
  ('inst-fce-zaria', 'Federal College of Education, Zaria', 'FCEZARIA', 'College of Education', 'Kaduna')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: DEPARTMENTS
-- ==============================================================================
INSERT INTO public.departments (id, name, faculty) VALUES
  ('dept-cs', 'Computer Science', 'Science'),
  ('dept-se', 'Software Engineering', 'Computing & Informatics'),
  ('dept-it', 'Information Technology & Cybersecurity', 'Computing & Informatics'),
  ('dept-eee', 'Electrical & Electronics Engineering', 'Engineering'),
  ('dept-me', 'Mechanical Engineering', 'Engineering'),
  ('dept-ce', 'Civil & Environmental Engineering', 'Engineering'),
  ('dept-che', 'Chemical & Petroleum Engineering', 'Engineering'),
  ('dept-mth', 'Mathematics', 'Science'),
  ('dept-sta', 'Statistics & Data Analytics', 'Science'),
  ('dept-phy', 'Physics & Geophysics', 'Science'),
  ('dept-chm', 'Chemistry & Industrial Chemistry', 'Science'),
  ('dept-bch', 'Biochemistry', 'Basic Medical Sciences'),
  ('dept-mcb', 'Microbiology & Biotechnology', 'Science'),
  ('dept-med', 'Medicine & Surgery', 'Clinical Sciences'),
  ('dept-pha', 'Pharmacy', 'Pharmacy'),
  ('dept-nur', 'Nursing Science', 'Clinical Sciences'),
  ('dept-mls', 'Medical Laboratory Science', 'Basic Medical Sciences'),
  ('dept-eco', 'Economics', 'Social Sciences'),
  ('dept-acc', 'Accounting', 'Management Sciences'),
  ('dept-fin', 'Banking & Finance', 'Management Sciences'),
  ('dept-bus', 'Business Administration', 'Management Sciences'),
  ('dept-mas', 'Mass Communication & Media Studies', 'Social Sciences'),
  ('dept-pol', 'Political Science & Public Administration', 'Social Sciences'),
  ('dept-law', 'Law', 'Law'),
  ('dept-agr', 'Agricultural Science & Crop Production', 'Agriculture'),
  ('dept-arc', 'Architecture & Urban Planning', 'Environmental Sciences')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: COURSES OF STUDY
-- ==============================================================================
INSERT INTO public.courses (id, name, faculty) VALUES
  ('course-cs', 'Computer Science', 'Computing & Informatics'),
  ('course-se', 'Software Engineering', 'Computing & Informatics'),
  ('course-ds', 'Data Science & Analytics', 'Computing & Informatics'),
  ('course-cyber', 'Cyber Security', 'Computing & Informatics'),
  ('course-is', 'Information Systems', 'Computing & Informatics'),
  ('course-stat', 'Statistics', 'Sciences & Computing'),
  ('course-math', 'Mathematics', 'Sciences & Computing'),
  ('course-ai', 'Artificial Intelligence', 'Sciences & Computing'),
  ('course-ece', 'Electrical & Electronics Engineering', 'Engineering'),
  ('course-ceng', 'Computer Engineering', 'Engineering'),
  ('course-mech', 'Mechanical Engineering', 'Engineering'),
  ('course-civil', 'Civil Engineering', 'Engineering'),
  ('course-chem-eng', 'Chemical Engineering', 'Engineering'),
  ('course-mechatronics', 'Mechatronics Engineering', 'Engineering'),
  ('course-phys', 'Physics / Industrial Physics', 'Sciences & Computing'),
  ('course-chem', 'Chemistry / Industrial Chemistry', 'Sciences & Computing'),
  ('course-biochem', 'Biochemistry', 'Biological Sciences'),
  ('course-microbio', 'Microbiology', 'Biological Sciences'),
  ('course-biotech', 'Biotechnology', 'Biological Sciences'),
  ('course-econ', 'Economics', 'Social Sciences'),
  ('course-acc', 'Accounting', 'Management Sciences'),
  ('course-fin', 'Finance & Banking', 'Management Sciences'),
  ('course-bus-admin', 'Business Administration', 'Management Sciences'),
  ('course-mass-comm', 'Mass Communication', 'Social Sciences'),
  ('course-agric', 'Agricultural Science', 'Agriculture'),
  ('course-arch', 'Architecture', 'Environmental Sciences'),
  ('course-pharm', 'Pharmacy', 'Medical Sciences'),
  ('course-med', 'Medicine & Surgery', 'Medical Sciences')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: NIGERIAN STATES (36 States + FCT Abuja)
-- ==============================================================================
INSERT INTO public.nigeria_states (id, name, zone) VALUES
  ('st-abia', 'Abia', 'South East'),
  ('st-adamawa', 'Adamawa', 'North East'),
  ('st-akwa-ibom', 'Akwa Ibom', 'South South'),
  ('st-anambra', 'Anambra', 'South East'),
  ('st-bauchi', 'Bauchi', 'North East'),
  ('st-bayelsa', 'Bayelsa', 'South South'),
  ('st-benue', 'Benue', 'North Central'),
  ('st-borno', 'Borno', 'North East'),
  ('st-cross-river', 'Cross River', 'South South'),
  ('st-delta', 'Delta', 'South South'),
  ('st-ebonyi', 'Ebonyi', 'South East'),
  ('st-edo', 'Edo', 'South South'),
  ('st-ekiti', 'Ekiti', 'South West'),
  ('st-enugu', 'Enugu', 'South East'),
  ('st-fct', 'FCT Abuja', 'North Central'),
  ('st-gombe', 'Gombe', 'North East'),
  ('st-imo', 'Imo', 'South East'),
  ('st-jigawa', 'Jigawa', 'North West'),
  ('st-kaduna', 'Kaduna', 'North West'),
  ('st-kano', 'Kano', 'North West'),
  ('st-katsina', 'Katsina', 'North West'),
  ('st-kebbi', 'Kebbi', 'North West'),
  ('st-kogi', 'Kogi', 'North Central'),
  ('st-kwara', 'Kwara', 'North Central'),
  ('st-lagos', 'Lagos', 'South West'),
  ('st-nasarawa', 'Nasarawa', 'North Central'),
  ('st-niger', 'Niger', 'North Central'),
  ('st-ogun', 'Ogun', 'South West'),
  ('st-ondo', 'Ondo', 'South West'),
  ('st-osun', 'Osun', 'South West'),
  ('st-oyo', 'Oyo', 'South West'),
  ('st-plateau', 'Plateau', 'North Central'),
  ('st-rivers', 'Rivers', 'South South'),
  ('st-sokoto', 'Sokoto', 'North West'),
  ('st-taraba', 'Taraba', 'North East'),
  ('st-yobe', 'Yobe', 'North East'),
  ('st-zamfara', 'Zamfara', 'North West')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: DEGREE LEVELS
-- ==============================================================================
INSERT INTO public.degrees (id, code, name, category) VALUES
  ('deg-bsc', 'B.Sc.', 'Bachelor of Science', 'Undergraduate'),
  ('deg-beng', 'B.Eng.', 'Bachelor of Engineering', 'Undergraduate'),
  ('deg-btech', 'B.Tech.', 'Bachelor of Technology', 'Undergraduate'),
  ('deg-ba', 'B.A.', 'Bachelor of Arts', 'Undergraduate'),
  ('deg-bed', 'B.Ed.', 'Bachelor of Education', 'Undergraduate'),
  ('deg-nd', 'ND', 'National Diploma', 'Polytechnic / Diploma'),
  ('deg-hnd', 'HND', 'Higher National Diploma', 'Polytechnic / Diploma'),
  ('deg-pgd', 'PGD', 'Postgraduate Diploma', 'Postgraduate'),
  ('deg-msc', 'M.Sc.', 'Master of Science', 'Postgraduate'),
  ('deg-meng', 'M.Eng.', 'Master of Engineering', 'Postgraduate'),
  ('deg-mtech', 'M.Tech.', 'Master of Technology', 'Postgraduate'),
  ('deg-phd', 'Ph.D.', 'Doctor of Philosophy', 'Postgraduate')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: PLANS (Nigerian Naira ₦ Pricing)
-- ==============================================================================
INSERT INTO public.plans (id, name, duration_days, price, envs) VALUES
  ('plan-week', 'Weekly Access', 7, 3500.00, ARRAY['python', 'r', 'notebook']),
  ('plan-month', 'Monthly Access', 30, 12000.00, ARRAY['python', 'r', 'vscode', 'notebook']),
  ('plan-sem', 'Semester Access', 120, 35000.00, ARRAY['python', 'r', 'vscode', 'notebook'])
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: ORGANIZATIONS (Nigerian Employers & Research Hubs)
-- ==============================================================================
INSERT INTO public.organizations (id, name, sector, state, website) VALUES
  ('org-paystack', 'Paystack Payments Limited', 'Technology', 'Lagos', 'https://paystack.com'),
  ('org-flutterwave', 'Flutterwave', 'Technology', 'Lagos', 'https://flutterwave.com'),
  ('org-interswitch', 'Interswitch Group', 'Financial Services', 'Lagos', 'https://interswitchgroup.com'),
  ('org-andela', 'Andela Nigeria', 'Technology', 'Lagos', 'https://andela.com'),
  ('org-nitda', 'National Information Technology Development Agency (NITDA)', 'Government & Public Sector', 'FCT Abuja', 'https://nitda.gov.ng'),
  ('org-nnpc', 'Nigerian National Petroleum Company (NNPC Limited)', 'Energy & Oil/Gas', 'FCT Abuja', 'https://nnpcgroup.com'),
  ('org-cbn', 'Central Bank of Nigeria (CBN)', 'Financial Services', 'FCT Abuja', 'https://cbn.gov.ng'),
  ('org-ncc', 'Nigerian Communications Commission (NCC)', 'Government & Public Sector', 'FCT Abuja', 'https://ncc.gov.ng'),
  ('org-ncdc', 'Nigeria Centre for Disease Control (NCDC)', 'Healthcare & Pharmaceuticals', 'FCT Abuja', 'https://ncdc.gov.ng'),
  ('org-nasrda', 'National Space Research and Development Agency (NASRDA)', 'Research & Development', 'FCT Abuja', 'https://nasrda.gov.ng'),
  ('org-iita', 'International Institute of Tropical Agriculture (IITA)', 'Research & Development', 'Oyo', 'https://iita.org'),
  ('org-nimr', 'Nigerian Institute of Medical Research (NIMR)', 'Research & Development', 'Lagos', 'https://nimr.gov.ng'),
  ('org-mtn', 'MTN Nigeria Communications Plc', 'Telecommunications', 'Lagos', 'https://mtn.ng'),
  ('org-airtel', 'Airtel Nigeria', 'Telecommunications', 'Lagos', 'https://airtel.com.ng'),
  ('org-dangote', 'Dangote Group', 'Manufacturing & Industrial', 'Lagos', 'https://dangote.com'),
  ('org-bua', 'BUA Group', 'Manufacturing & Industrial', 'Lagos', 'https://buagroup.com'),
  ('org-kpmg', 'KPMG Nigeria', 'Consulting & Professional Services', 'Lagos', 'https://kpmg.com/ng'),
  ('org-pwc', 'PwC Nigeria', 'Consulting & Professional Services', 'Lagos', 'https://pwc.com/ng'),
  ('org-gtco', 'Guaranty Trust Holding Company (GTCO)', 'Financial Services', 'Lagos', 'https://gtcoplc.com'),
  ('org-zenith', 'Zenith Bank Plc', 'Financial Services', 'Lagos', 'https://zenithbank.com'),
  ('org-access', 'Access Holdings Plc', 'Financial Services', 'Lagos', 'https://theaccessbankuk.com'),
  ('org-firstbank', 'First Bank of Nigeria', 'Financial Services', 'Lagos', 'https://firstbanknigeria.com'),
  ('org-uba', 'United Bank for Africa (UBA Plc)', 'Financial Services', 'Lagos', 'https://ubagroup.com'),
  ('org-stanbic', 'Stanbic IBTC Holdings', 'Financial Services', 'Lagos', 'https://stanbicibtc.com'),
  ('org-spdc', 'Shell Petroleum Development Company (SPDC)', 'Energy & Oil/Gas', 'Rivers', 'https://shell.com.ng'),
  ('org-chevron', 'Chevron Nigeria Limited', 'Energy & Oil/Gas', 'Lagos', 'https://chevron.com'),
  ('org-cchub', 'Co-Creation Hub (CcHUB)', 'Technology', 'Lagos', 'https://cchub.africa'),
  ('org-kuda', 'Kuda Microfinance Bank', 'Technology', 'Lagos', 'https://kuda.com'),
  ('org-opay', 'OPay Digital Services', 'Financial Services', 'Lagos', 'https://opayweb.com'),
  ('org-moniepoint', 'Moniepoint Inc.', 'Financial Services', 'Lagos', 'https://moniepoint.com')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- SEED DATA: PORTAL SETTINGS (Nigerian Bank Details)
-- ==============================================================================
INSERT INTO public.portal_settings (id, bank_name, account_name, account_number, instructions, allow_registration, maintenance_mode)
VALUES (1, 'Guaranty Trust Bank (GTBank)', 'e-Lab Technologies Ltd', '0123456789', 'Please include your Full Name or Registration Reference in the transfer narration.', true, false)
ON CONFLICT (id) DO UPDATE SET
  bank_name = EXCLUDED.bank_name,
  account_name = EXCLUDED.account_name,
  account_number = EXCLUDED.account_number,
  instructions = EXCLUDED.instructions,
  updated_at = NOW();

-- ==============================================================================
-- SEED DATA: INITIAL USERS & SYSTEM ADMINISTRATORS
-- ==============================================================================
INSERT INTO public.users (
  id, name, email, account_type, "current_role", employer, state_of_residence, role, status, envs, access_until
)
VALUES 
  (
    'u-admin-ola',
    'Ola Kazeem',
    'olakazeem@gmail.com',
    'non-academic',
    'Lead System Administrator & Director',
    'e-Lab Technologies',
    'Lagos',
    'admin',
    'active',
    ARRAY['python', 'r', 'vscode', 'notebook'],
    NOW() + INTERVAL '10 years'
  ),
  (
    'u-admin',
    'e-Lab Admin',
    'admin@e-lab.ng',
    'non-academic',
    'Lead System Administrator',
    'e-Lab Technologies',
    'Lagos',
    'admin',
    'active',
    ARRAY['python', 'r', 'vscode', 'notebook'],
    NOW() + INTERVAL '10 years'
  ),
  (
    'u-1',
    'Amara Okafor',
    'student@e-lab.ng',
    'student',
    NULL,
    NULL,
    'Lagos',
    'user',
    'active',
    ARRAY['python', 'r', 'vscode', 'notebook'],
    NOW() + INTERVAL '30 days'
  )
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  envs = EXCLUDED.envs,
  access_until = EXCLUDED.access_until,
  updated_at = NOW();

-- ==============================================================================
-- LAB PRACTICAL ASSIGNMENTS & STUDENT SUBMISSIONS (AUTO-GRADING & ASSESSMENT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lab_assignments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL,
  institution TEXT NOT NULL DEFAULT 'All Institutions',
  department TEXT NOT NULL DEFAULT 'Computer Science',
  kernel TEXT NOT NULL DEFAULT 'python' CHECK (kernel IN ('python', 'r')),
  instructions TEXT NOT NULL,
  starter_code TEXT NOT NULL,
  expected_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  expect_plot BOOLEAN DEFAULT FALSE,
  max_score INTEGER NOT NULL DEFAULT 100,
  due_date TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lab_submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES public.lab_assignments(id) ON DELETE CASCADE,
  assignment_title TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  institution TEXT,
  department TEXT,
  kernel TEXT NOT NULL DEFAULT 'python',
  code TEXT NOT NULL,
  output TEXT NOT NULL DEFAULT '',
  auto_score INTEGER NOT NULL DEFAULT 0,
  final_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
  feedback TEXT,
  graded_by TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

ALTER TABLE public.lab_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read lab_assignments" ON public.lab_assignments;
CREATE POLICY "Public read lab_assignments" ON public.lab_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write lab_assignments" ON public.lab_assignments;
CREATE POLICY "Public write lab_assignments" ON public.lab_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read lab_submissions" ON public.lab_submissions;
CREATE POLICY "Public read lab_submissions" ON public.lab_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write lab_submissions" ON public.lab_submissions;
CREATE POLICY "Public write lab_submissions" ON public.lab_submissions FOR ALL USING (true);


