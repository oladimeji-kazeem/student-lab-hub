export interface Institution {
  id: string;
  name: string;
  shortName: string;
  category:
    | "Federal University"
    | "State University"
    | "Private University"
    | "Polytechnic"
    | "College of Education";
  state: string;
}

export interface Department {
  id: string;
  name: string;
  faculty: string;
}

export interface NigeriaState {
  id: string;
  name: string;
  zone: "South West" | "South East" | "South South" | "North Central" | "North West" | "North East";
}

export interface Course {
  id: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  faculty: string;
}

export interface DegreeLevel {
  id: string;
  code: string;
  name: string;
  category: "Undergraduate" | "Polytechnic / Diploma" | "Postgraduate";
}

export type OrganizationSector =
  | "Technology"
  | "Research & Development"
  | "Government & Public Sector"
  | "Financial Services"
  | "Energy & Oil/Gas"
  | "Healthcare & Pharmaceuticals"
  | "Consulting & Professional Services"
  | "Telecommunications"
  | "Manufacturing & Industrial"
  | "Non-Profit / NGO"
  | "Other";

export interface Organization {
  id: string;
  name: string;
  sector: OrganizationSector;
  state?: string;
  website?: string;
}

export const NIGERIAN_INSTITUTIONS: Institution[] = [
  // Federal Universities
  {
    id: "inst-unilag",
    name: "University of Lagos",
    shortName: "UNILAG",
    category: "Federal University",
    state: "Lagos",
  },
  {
    id: "inst-ui",
    name: "University of Ibadan",
    shortName: "UI",
    category: "Federal University",
    state: "Oyo",
  },
  {
    id: "inst-oau",
    name: "Obafemi Awolowo University",
    shortName: "OAU",
    category: "Federal University",
    state: "Osun",
  },
  {
    id: "inst-abu",
    name: "Ahmadu Bello University",
    shortName: "ABU",
    category: "Federal University",
    state: "Kaduna",
  },
  {
    id: "inst-unn",
    name: "University of Nigeria, Nsukka",
    shortName: "UNN",
    category: "Federal University",
    state: "Enugu",
  },
  {
    id: "inst-uniben",
    name: "University of Benin",
    shortName: "UNIBEN",
    category: "Federal University",
    state: "Edo",
  },
  {
    id: "inst-unilorin",
    name: "University of Ilorin",
    shortName: "UNILORIN",
    category: "Federal University",
    state: "Kwara",
  },
  {
    id: "inst-futa",
    name: "Federal University of Technology, Akure",
    shortName: "FUTA",
    category: "Federal University",
    state: "Ondo",
  },
  {
    id: "inst-futminna",
    name: "Federal University of Technology, Minna",
    shortName: "FUTMINNA",
    category: "Federal University",
    state: "Niger",
  },
  {
    id: "inst-futo",
    name: "Federal University of Technology, Owerri",
    shortName: "FUTO",
    category: "Federal University",
    state: "Imo",
  },
  {
    id: "inst-uniport",
    name: "University of Port Harcourt",
    shortName: "UNIPORT",
    category: "Federal University",
    state: "Rivers",
  },
  {
    id: "inst-unical",
    name: "University of Calabar",
    shortName: "UNICAL",
    category: "Federal University",
    state: "Cross River",
  },
  {
    id: "inst-unijos",
    name: "University of Jos",
    shortName: "UNIJOS",
    category: "Federal University",
    state: "Plateau",
  },
  {
    id: "inst-uniabuja",
    name: "University of Abuja",
    shortName: "UNIABUJA",
    category: "Federal University",
    state: "FCT",
  },
  {
    id: "inst-buk",
    name: "Bayero University Kano",
    shortName: "BUK",
    category: "Federal University",
    state: "Kano",
  },
  {
    id: "inst-funaab",
    name: "Federal University of Agriculture, Abeokuta",
    shortName: "FUNAAB",
    category: "Federal University",
    state: "Ogun",
  },
  {
    id: "inst-unizik",
    name: "Nnamdi Azikiwe University",
    shortName: "UNIZIK",
    category: "Federal University",
    state: "Anambra",
  },
  {
    id: "inst-udus",
    name: "Usmanu Danfodiyo University",
    shortName: "UDUS",
    category: "Federal University",
    state: "Sokoto",
  },
  {
    id: "inst-mouau",
    name: "Michael Okpara University of Agriculture, Umudike",
    shortName: "MOUAU",
    category: "Federal University",
    state: "Abia",
  },
  {
    id: "inst-noun",
    name: "National Open University of Nigeria",
    shortName: "NOUN",
    category: "Federal University",
    state: "FCT",
  },

  // State Universities
  {
    id: "inst-lasu",
    name: "Lagos State University",
    shortName: "LASU",
    category: "State University",
    state: "Lagos",
  },
  {
    id: "inst-oou",
    name: "Olabisi Onabanjo University",
    shortName: "OOU",
    category: "State University",
    state: "Ogun",
  },
  {
    id: "inst-lautech",
    name: "Ladoke Akintola University of Technology",
    shortName: "LAUTECH",
    category: "State University",
    state: "Oyo",
  },
  {
    id: "inst-rsu",
    name: "Rivers State University",
    shortName: "RSU",
    category: "State University",
    state: "Rivers",
  },
  {
    id: "inst-delsu",
    name: "Delta State University",
    shortName: "DELSU",
    category: "State University",
    state: "Delta",
  },
  {
    id: "inst-aaua",
    name: "Adekunle Ajasin University",
    shortName: "AAUA",
    category: "State University",
    state: "Ondo",
  },
  {
    id: "inst-eksu",
    name: "Ekiti State University",
    shortName: "EKSU",
    category: "State University",
    state: "Ekiti",
  },
  {
    id: "inst-aau",
    name: "Ambrose Alli University",
    shortName: "AAU",
    category: "State University",
    state: "Edo",
  },
  {
    id: "inst-kasu",
    name: "Kaduna State University",
    shortName: "KASU",
    category: "State University",
    state: "Kaduna",
  },
  {
    id: "inst-kwasu",
    name: "Kwara State University",
    shortName: "KWASU",
    category: "State University",
    state: "Kwara",
  },
  {
    id: "inst-uniosun",
    name: "Osun State University",
    shortName: "UNIOSUN",
    category: "State University",
    state: "Osun",
  },
  {
    id: "inst-ebsu",
    name: "Ebonyi State University",
    shortName: "EBSU",
    category: "State University",
    state: "Ebonyi",
  },

  // Private Universities
  {
    id: "inst-covenant",
    name: "Covenant University",
    shortName: "CU",
    category: "Private University",
    state: "Ogun",
  },
  {
    id: "inst-babcock",
    name: "Babcock University",
    shortName: "BU",
    category: "Private University",
    state: "Ogun",
  },
  {
    id: "inst-abuad",
    name: "Afe Babalola University",
    shortName: "ABUAD",
    category: "Private University",
    state: "Ekiti",
  },
  {
    id: "inst-bowen",
    name: "Bowen University",
    shortName: "BOWEN",
    category: "Private University",
    state: "Osun",
  },
  {
    id: "inst-landmark",
    name: "Landmark University",
    shortName: "LMU",
    category: "Private University",
    state: "Kwara",
  },
  {
    id: "inst-pau",
    name: "Pan-Atlantic University",
    shortName: "PAU",
    category: "Private University",
    state: "Lagos",
  },
  {
    id: "inst-baze",
    name: "Baze University",
    shortName: "BAZE",
    category: "Private University",
    state: "FCT",
  },
  {
    id: "inst-nile",
    name: "Nile University of Nigeria",
    shortName: "NILE",
    category: "Private University",
    state: "FCT",
  },
  {
    id: "inst-aun",
    name: "American University of Nigeria",
    shortName: "AUN",
    category: "Private University",
    state: "Adamawa",
  },
  {
    id: "inst-run",
    name: "Redeemer's University",
    shortName: "RUN",
    category: "Private University",
    state: "Osun",
  },
  {
    id: "inst-bells",
    name: "Bells University of Technology",
    shortName: "BELLS",
    category: "Private University",
    state: "Ogun",
  },

  // Polytechnics & Monotechnics
  {
    id: "inst-yabatech",
    name: "Yaba College of Technology",
    shortName: "YABATECH",
    category: "Polytechnic",
    state: "Lagos",
  },
  {
    id: "inst-polyibadan",
    name: "The Polytechnic, Ibadan",
    shortName: "POLYIBADAN",
    category: "Polytechnic",
    state: "Oyo",
  },
  {
    id: "inst-fedpolyilaro",
    name: "Federal Polytechnic, Ilaro",
    shortName: "FPI",
    category: "Polytechnic",
    state: "Ogun",
  },
  {
    id: "inst-fedpolynekede",
    name: "Federal Polytechnic, Nekede",
    shortName: "FPNO",
    category: "Polytechnic",
    state: "Imo",
  },
  {
    id: "inst-fedpolyede",
    name: "Federal Polytechnic, Ede",
    shortName: "FPE",
    category: "Polytechnic",
    state: "Osun",
  },
  {
    id: "inst-fedpolyado",
    name: "Federal Polytechnic, Ado-Ekiti",
    shortName: "FPA",
    category: "Polytechnic",
    state: "Ekiti",
  },
  {
    id: "inst-lasustech",
    name: "Lagos State University of Science and Technology",
    shortName: "LASUSTECH",
    category: "Polytechnic",
    state: "Lagos",
  },
  {
    id: "inst-kwarapoly",
    name: "Kwara State Polytechnic",
    shortName: "KWARAPOLY",
    category: "Polytechnic",
    state: "Kwara",
  },
  {
    id: "inst-kadpoly",
    name: "Kaduna Polytechnic",
    shortName: "KADPOLY",
    category: "Polytechnic",
    state: "Kaduna",
  },
  {
    id: "inst-auchipoly",
    name: "Auchi Polytechnic",
    shortName: "AUCHIPOLY",
    category: "Polytechnic",
    state: "Edo",
  },

  // Colleges of Education
  {
    id: "inst-adeyemi",
    name: "Adeyemi Federal University of Education, Ondo",
    shortName: "ACEONDO",
    category: "College of Education",
    state: "Ondo",
  },
  {
    id: "inst-fce-akoka",
    name: "Federal College of Education (Technical), Akoka",
    shortName: "FCETAKOKA",
    category: "College of Education",
    state: "Lagos",
  },
  {
    id: "inst-fce-zaria",
    name: "Federal College of Education, Zaria",
    shortName: "FCEZARIA",
    category: "College of Education",
    state: "Kaduna",
  },
];

export const COURSES_OF_STUDY: Course[] = [
  { id: "course-cs", name: "Computer Science", faculty: "Sciences & Computing" },
  { id: "course-se", name: "Software Engineering", faculty: "Sciences & Computing" },
  { id: "course-ds", name: "Data Science & Analytics", faculty: "Sciences & Computing" },
  { id: "course-cyber", name: "Cybersecurity", faculty: "Sciences & Computing" },
  { id: "course-it", name: "Information Technology", faculty: "Sciences & Computing" },
  { id: "course-stat", name: "Statistics", faculty: "Sciences & Computing" },
  { id: "course-math", name: "Mathematics", faculty: "Sciences & Computing" },
  { id: "course-ai", name: "Artificial Intelligence", faculty: "Sciences & Computing" },
  { id: "course-ece", name: "Electrical & Electronics Engineering", faculty: "Engineering" },
  { id: "course-ceng", name: "Computer Engineering", faculty: "Engineering" },
  { id: "course-mech", name: "Mechanical Engineering", faculty: "Engineering" },
  { id: "course-civil", name: "Civil Engineering", faculty: "Engineering" },
  { id: "course-chem-eng", name: "Chemical Engineering", faculty: "Engineering" },
  { id: "course-pet-gas", name: "Petroleum & Gas Engineering", faculty: "Engineering" },
  { id: "course-gas-tech", name: "GSY303 - Gas Technology", faculty: "Engineering" },
  { id: "course-mechatronics", name: "Mechatronics Engineering", faculty: "Engineering" },
  { id: "course-phys", name: "Physics / Industrial Physics", faculty: "Sciences & Computing" },
  { id: "course-chem", name: "Chemistry / Industrial Chemistry", faculty: "Sciences & Computing" },
  { id: "course-biochem", name: "Biochemistry", faculty: "Biological Sciences" },
  { id: "course-microbio", name: "Microbiology", faculty: "Biological Sciences" },
  { id: "course-biotech", name: "Biotechnology", faculty: "Biological Sciences" },
  { id: "course-econ", name: "Economics", faculty: "Social Sciences" },
  { id: "course-acc", name: "Accounting", faculty: "Management Sciences" },
  { id: "course-fin", name: "Finance & Banking", faculty: "Management Sciences" },
  { id: "course-bus-admin", name: "Business Administration", faculty: "Management Sciences" },
  { id: "course-mass-comm", name: "Mass Communication", faculty: "Social Sciences" },
  { id: "course-agric", name: "Agricultural Science", faculty: "Agriculture" },
  { id: "course-arch", name: "Architecture", faculty: "Environmental Sciences" },
  { id: "course-pharm", name: "Pharmacy", faculty: "Medical Sciences" },
  { id: "course-med", name: "Medicine & Surgery", faculty: "Medical Sciences" },
];

export const DEGREE_LEVELS: DegreeLevel[] = [
  { id: "deg-bsc", code: "B.Sc.", name: "Bachelor of Science", category: "Undergraduate" },
  { id: "deg-beng", code: "B.Eng.", name: "Bachelor of Engineering", category: "Undergraduate" },
  { id: "deg-btech", code: "B.Tech.", name: "Bachelor of Technology", category: "Undergraduate" },
  { id: "deg-ba", code: "B.A.", name: "Bachelor of Arts", category: "Undergraduate" },
  { id: "deg-bed", code: "B.Ed.", name: "Bachelor of Education", category: "Undergraduate" },
  { id: "deg-nd", code: "ND", name: "National Diploma", category: "Polytechnic / Diploma" },
  {
    id: "deg-hnd",
    code: "HND",
    name: "Higher National Diploma",
    category: "Polytechnic / Diploma",
  },
  { id: "deg-pgd", code: "PGD", name: "Postgraduate Diploma", category: "Postgraduate" },
  { id: "deg-msc", code: "M.Sc.", name: "Master of Science", category: "Postgraduate" },
  { id: "deg-meng", code: "M.Eng.", name: "Master of Engineering", category: "Postgraduate" },
  { id: "deg-mtech", code: "M.Tech.", name: "Master of Technology", category: "Postgraduate" },
  { id: "deg-phd", code: "Ph.D.", name: "Doctor of Philosophy", category: "Postgraduate" },
];

export const NIGERIAN_BANKS: string[] = [
  "Guaranty Trust Bank (GTBank)",
  "Zenith Bank",
  "Access Bank",
  "First Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Kuda Microfinance Bank",
  "OPay Digital Services",
  "Moniepoint MFB",
  "Stanbic IBTC Bank",
  "Fidelity Bank",
  "FCMB (First City Monument Bank)",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "Wema Bank / ALAT",
  "Polaris Bank",
  "Keystone Bank",
  "Taj Bank",
  "Jaiz Bank",
  "Other Nigerian Bank",
];

export const NIGERIAN_STATES: NigeriaState[] = [
  { id: "st-abia", name: "Abia", zone: "South East" },
  { id: "st-adamawa", name: "Adamawa", zone: "North East" },
  { id: "st-akwa-ibom", name: "Akwa Ibom", zone: "South South" },
  { id: "st-anambra", name: "Anambra", zone: "South East" },
  { id: "st-bauchi", name: "Bauchi", zone: "North East" },
  { id: "st-bayelsa", name: "Bayelsa", zone: "South South" },
  { id: "st-benue", name: "Benue", zone: "North Central" },
  { id: "st-borno", name: "Borno", zone: "North East" },
  { id: "st-cross-river", name: "Cross River", zone: "South South" },
  { id: "st-delta", name: "Delta", zone: "South South" },
  { id: "st-ebonyi", name: "Ebonyi", zone: "South East" },
  { id: "st-edo", name: "Edo", zone: "South South" },
  { id: "st-ekiti", name: "Ekiti", zone: "South West" },
  { id: "st-enugu", name: "Enugu", zone: "South East" },
  { id: "st-fct", name: "FCT Abuja", zone: "North Central" },
  { id: "st-gombe", name: "Gombe", zone: "North East" },
  { id: "st-imo", name: "Imo", zone: "South East" },
  { id: "st-jigawa", name: "Jigawa", zone: "North West" },
  { id: "st-kaduna", name: "Kaduna", zone: "North West" },
  { id: "st-kano", name: "Kano", zone: "North West" },
  { id: "st-katsina", name: "Katsina", zone: "North West" },
  { id: "st-kebbi", name: "Kebbi", zone: "North West" },
  { id: "st-kogi", name: "Kogi", zone: "North Central" },
  { id: "st-kwara", name: "Kwara", zone: "North Central" },
  { id: "st-lagos", name: "Lagos", zone: "South West" },
  { id: "st-nasarawa", name: "Nasarawa", zone: "North Central" },
  { id: "st-niger", name: "Niger", zone: "North Central" },
  { id: "st-ogun", name: "Ogun", zone: "South West" },
  { id: "st-ondo", name: "Ondo", zone: "South West" },
  { id: "st-osun", name: "Osun", zone: "South West" },
  { id: "st-oyo", name: "Oyo", zone: "South West" },
  { id: "st-plateau", name: "Plateau", zone: "North Central" },
  { id: "st-rivers", name: "Rivers", zone: "South South" },
  { id: "st-sokoto", name: "Sokoto", zone: "North West" },
  { id: "st-taraba", name: "Taraba", zone: "North East" },
  { id: "st-yobe", name: "Yobe", zone: "North East" },
  { id: "st-zamfara", name: "Zamfara", zone: "North West" },
];

export const DEPARTMENTS: Department[] = [
  { id: "dept-cs", name: "Computer Science", faculty: "Science" },
  { id: "dept-se", name: "Software Engineering", faculty: "Computing & Informatics" },
  { id: "dept-it", name: "Information Technology & Cybersecurity", faculty: "Computing & Informatics" },
  { id: "dept-eee", name: "Electrical & Electronics Engineering", faculty: "Engineering" },
  { id: "dept-me", name: "Mechanical Engineering", faculty: "Engineering" },
  { id: "dept-ce", name: "Civil & Environmental Engineering", faculty: "Engineering" },
  { id: "dept-che", name: "Chemical & Petroleum Engineering", faculty: "Engineering" },
  { id: "dept-mth", name: "Mathematics", faculty: "Science" },
  { id: "dept-sta", name: "Statistics & Data Analytics", faculty: "Science" },
  { id: "dept-phy", name: "Physics & Geophysics", faculty: "Science" },
  { id: "dept-chm", name: "Chemistry & Industrial Chemistry", faculty: "Science" },
  { id: "dept-bch", name: "Biochemistry", faculty: "Basic Medical Sciences" },
  { id: "dept-mcb", name: "Microbiology & Biotechnology", faculty: "Science" },
  { id: "dept-med", name: "Medicine & Surgery", faculty: "Clinical Sciences" },
  { id: "dept-pha", name: "Pharmacy", faculty: "Pharmacy" },
  { id: "dept-nur", name: "Nursing Science", faculty: "Clinical Sciences" },
  { id: "dept-mls", name: "Medical Laboratory Science", faculty: "Basic Medical Sciences" },
  { id: "dept-eco", name: "Economics", faculty: "Social Sciences" },
  { id: "dept-acc", name: "Accounting", faculty: "Management Sciences" },
  { id: "dept-fin", name: "Banking & Finance", faculty: "Management Sciences" },
  { id: "dept-bus", name: "Business Administration", faculty: "Management Sciences" },
  { id: "dept-mas", name: "Mass Communication & Media Studies", faculty: "Social Sciences" },
  { id: "dept-pol", name: "Political Science & Public Administration", faculty: "Social Sciences" },
  { id: "dept-law", name: "Law", faculty: "Law" },
  { id: "dept-agr", name: "Agricultural Science & Crop Production", faculty: "Agriculture" },
  { id: "dept-arc", name: "Architecture & Urban Planning", faculty: "Environmental Sciences" },
];

export const NIGERIAN_ORGANIZATIONS: Organization[] = [
  {
    id: "org-paystack",
    name: "Paystack Payments Limited",
    sector: "Technology",
    state: "Lagos",
    website: "https://paystack.com",
  },
  {
    id: "org-flutterwave",
    name: "Flutterwave",
    sector: "Technology",
    state: "Lagos",
    website: "https://flutterwave.com",
  },
  {
    id: "org-interswitch",
    name: "Interswitch Group",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://interswitchgroup.com",
  },
  {
    id: "org-andela",
    name: "Andela Nigeria",
    sector: "Technology",
    state: "Lagos",
    website: "https://andela.com",
  },
  {
    id: "org-nitda",
    name: "National Information Technology Development Agency (NITDA)",
    sector: "Government & Public Sector",
    state: "FCT Abuja",
    website: "https://nitda.gov.ng",
  },
  {
    id: "org-nnpc",
    name: "Nigerian National Petroleum Company (NNPC Limited)",
    sector: "Energy & Oil/Gas",
    state: "FCT Abuja",
    website: "https://nnpcgroup.com",
  },
  {
    id: "org-cbn",
    name: "Central Bank of Nigeria (CBN)",
    sector: "Financial Services",
    state: "FCT Abuja",
    website: "https://cbn.gov.ng",
  },
  {
    id: "org-ncc",
    name: "Nigerian Communications Commission (NCC)",
    sector: "Government & Public Sector",
    state: "FCT Abuja",
    website: "https://ncc.gov.ng",
  },
  {
    id: "org-ncdc",
    name: "Nigeria Centre for Disease Control (NCDC)",
    sector: "Healthcare & Pharmaceuticals",
    state: "FCT Abuja",
    website: "https://ncdc.gov.ng",
  },
  {
    id: "org-nasrda",
    name: "National Space Research and Development Agency (NASRDA)",
    sector: "Research & Development",
    state: "FCT Abuja",
    website: "https://nasrda.gov.ng",
  },
  {
    id: "org-iita",
    name: "International Institute of Tropical Agriculture (IITA)",
    sector: "Research & Development",
    state: "Oyo",
    website: "https://iita.org",
  },
  {
    id: "org-nimr",
    name: "Nigerian Institute of Medical Research (NIMR)",
    sector: "Research & Development",
    state: "Lagos",
    website: "https://nimr.gov.ng",
  },
  {
    id: "org-mtn",
    name: "MTN Nigeria Communications Plc",
    sector: "Telecommunications",
    state: "Lagos",
    website: "https://mtn.ng",
  },
  {
    id: "org-airtel",
    name: "Airtel Nigeria",
    sector: "Telecommunications",
    state: "Lagos",
    website: "https://airtel.com.ng",
  },
  {
    id: "org-dangote",
    name: "Dangote Group",
    sector: "Manufacturing & Industrial",
    state: "Lagos",
    website: "https://dangote.com",
  },
  {
    id: "org-bua",
    name: "BUA Group",
    sector: "Manufacturing & Industrial",
    state: "Lagos",
    website: "https://buagroup.com",
  },
  {
    id: "org-kpmg",
    name: "KPMG Nigeria",
    sector: "Consulting & Professional Services",
    state: "Lagos",
    website: "https://kpmg.com/ng",
  },
  {
    id: "org-pwc",
    name: "PwC Nigeria",
    sector: "Consulting & Professional Services",
    state: "Lagos",
    website: "https://pwc.com/ng",
  },
  {
    id: "org-gtco",
    name: "Guaranty Trust Holding Company (GTCO)",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://gtcoplc.com",
  },
  {
    id: "org-zenith",
    name: "Zenith Bank Plc",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://zenithbank.com",
  },
  {
    id: "org-access",
    name: "Access Holdings Plc",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://theaccessbankuk.com",
  },
  {
    id: "org-firstbank",
    name: "First Bank of Nigeria",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://firstbanknigeria.com",
  },
  {
    id: "org-uba",
    name: "United Bank for Africa (UBA Plc)",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://ubagroup.com",
  },
  {
    id: "org-stanbic",
    name: "Stanbic IBTC Holdings",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://stanbicibtc.com",
  },
  {
    id: "org-spdc",
    name: "Shell Petroleum Development Company (SPDC)",
    sector: "Energy & Oil/Gas",
    state: "Rivers",
    website: "https://shell.com.ng",
  },
  {
    id: "org-chevron",
    name: "Chevron Nigeria Limited",
    sector: "Energy & Oil/Gas",
    state: "Lagos",
    website: "https://chevron.com",
  },
  {
    id: "org-cchub",
    name: "Co-Creation Hub (CcHUB)",
    sector: "Technology",
    state: "Lagos",
    website: "https://cchub.africa",
  },
  {
    id: "org-kuda",
    name: "Kuda Microfinance Bank",
    sector: "Technology",
    state: "Lagos",
    website: "https://kuda.com",
  },
  {
    id: "org-opay",
    name: "OPay Digital Services",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://opayweb.com",
  },
  {
    id: "org-moniepoint",
    name: "Moniepoint Inc.",
    sector: "Financial Services",
    state: "Lagos",
    website: "https://moniepoint.com",
  },
];


