// Resource Library data models, cloud storage URL converters, and default library catalogue

export type ResourceCategory = "Lab Manuals" | "Textbooks" | "Datasets" | "Lecture Notes";
export type CloudProvider = "Google Drive" | "OneDrive" | "Direct Link";
export type FileType = "PDF" | "CSV" | "DOCX" | "XLSX" | "ZIP" | "PBIX";

export interface LibraryResource {
  id: string;
  title: string;
  category: ResourceCategory;
  provider: CloudProvider;
  fileType: FileType;
  fileSize: string;
  description: string;
  course: string;
  applicableCourses?: string[];
  authorOrDept: string;
  shareUrl: string;
  previewUrl: string;
  downloadUrl: string;
  featured?: boolean;
  requiredTool?: "python" | "r" | "vscode" | "notebook" | "sql" | "powerbi";
}

/**
 * Validates whether a subscriber/user has approved access to a specific manual,
 * either via:
 * 1. Direct manual approval (approvedManuals)
 * 2. Course approval (if any of the manual's applicable courses match the user's approved courses)
 * 3. Tool/environment access (if user has active environment access and meets tool requirements)
 * 4. System administrator privileges
 */
export function hasManualAccess(
  user: {
    role?: string;
    approvedCourses?: string[];
    approvedManuals?: string[];
    course?: string;
    status?: string;
    accessUntil?: string;
    envs?: string[];
  } | null,
  resource: LibraryResource,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;

  // 1. Direct Manual Approval
  if (user.approvedManuals?.includes(resource.id)) {
    return true;
  }

  // 2. Course Approval: Check if user's approved courses cover any of the manual's applicable courses
  const userCourses = [
    ...(user.approvedCourses || []),
    ...(user.course ? [user.course] : []),
  ];

  const manualCourses = [
    ...(resource.applicableCourses || []),
    ...(resource.course ? [resource.course] : []),
  ];

  const hasCourseMatch = userCourses.some((uc) =>
    manualCourses.some((mc) => {
      const uNorm = uc.trim().toLowerCase();
      const mNorm = mc.trim().toLowerCase();
      if (uNorm === mNorm) return true;
      if (uNorm.includes(mNorm) || mNorm.includes(uNorm)) return true;
      // Extract alphanumeric course codes (e.g. GSY303 or CSC301)
      const uCode = uc.match(/[A-Z]{2,4}\s*\d{3}/i)?.[0]?.replace(/\s+/, "").toUpperCase();
      const mCode = mc.match(/[A-Z]{2,4}\s*\d{3}/i)?.[0]?.replace(/\s+/, "").toUpperCase();
      return !!uCode && !!mCode && uCode === mCode;
    }),
  );

  if (hasCourseMatch) {
    return true;
  }

  // 3. Tool/Environment Access: If user has an active environment subscription
  const isActive =
    user.status === "active" &&
    (!user.accessUntil || new Date(user.accessUntil) > new Date());

  if (isActive && (!resource.requiredTool || user.envs?.includes(resource.requiredTool))) {
    return true;
  }

  return false;
}

/**
 * Intelligent helper to convert Google Drive and OneDrive links
 * into direct download and preview URLs.
 */
export function parseCloudStorageUrl(rawUrl: string): {
  provider: CloudProvider;
  previewUrl: string;
  downloadUrl: string;
  fileId?: string;
  pythonSnippet: string;
  rSnippet: string;
} {
  const url = rawUrl.trim();

  // 1. Google Drive link handling
  if (url.includes("drive.google.com")) {
    let fileId = "";
    // Matches /file/d/<ID>/ or id=<ID>
    const matchD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (matchD && matchD[1]) fileId = matchD[1];
    else if (matchId && matchId[1]) fileId = matchId[1];

    if (fileId) {
      const download = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const preview = `https://drive.google.com/file/d/${fileId}/preview`;
      return {
        provider: "Google Drive",
        previewUrl: preview,
        downloadUrl: download,
        fileId,
        pythonSnippet: `import pandas as pd\n\n# Direct stream from Google Drive\nurl = "${download}"\ndf = pd.read_csv(url)\nprint(df.head())`,
        rSnippet: `# Direct stream from Google Drive\nurl <- "${download}"\ndf <- read.csv(url)\nsummary(df)`,
      };
    }
  }

  // 2. Microsoft OneDrive link handling
  if (url.includes("onedrive.live.com") || url.includes("sharepoint.com") || url.includes("1drv.ms")) {
    // OneDrive direct download trick: change resid and authkey or append &download=1
    let download = url;
    if (url.includes("onedrive.live.com")) {
      download = url.replace("redir?", "download?").replace("view.aspx?", "download.aspx?");
    } else if (url.includes("sharepoint.com")) {
      download = url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
    }

    return {
      provider: "OneDrive",
      previewUrl: url,
      downloadUrl: download,
      pythonSnippet: `import pandas as pd\n\n# Direct stream from Microsoft OneDrive\nurl = "${download}"\ndf = pd.read_csv(url)\nprint(df.head())`,
      rSnippet: `# Direct stream from Microsoft OneDrive\nurl <- "${download}"\ndf <- read.csv(url)\nsummary(df)`,
    };
  }

  // 3. Fallback generic web link
  return {
    provider: "Direct Link",
    previewUrl: url,
    downloadUrl: url,
    pythonSnippet: `import pandas as pd\n\nurl = "${url}"\ndf = pd.read_csv(url)\nprint(df.head())`,
    rSnippet: `url <- "${url}"\ndf <- read.csv(url)\nsummary(df)`,
  };
}

export const INITIAL_RESOURCES: LibraryResource[] = [
  {
    id: "res-lab-gas-01",
    title: "Gas Processing & Natural Gas Engineering Practical Manual",
    category: "Lab Manuals",
    provider: "Google Drive",
    fileType: "PDF",
    fileSize: "8.4 MB",
    description: "Hands-on engineering laboratory worksheets covering natural gas composition, gas thermodynamics, compressibility factor (Z-factor), pipeline flow calculations, dehydration units, and numerical modeling.",
    course: "GSY303 - Gas Technology",
    applicableCourses: [
      "GSY303 - Gas Technology",
      "PET301 - Petroleum Production & Gas Refining",
      "CHE302 - Industrial Gas Thermodynamics",
      "ENG204 - Applied Fluid Mechanics in Energy Systems"
    ],
    authorOrDept: "Dept. of Petroleum & Gas Engineering",
    shareUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
    previewUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    featured: true,
    requiredTool: "python",
  },
  {
    id: "res-lab-01",
    title: "Python for Data Science Practical Lab Manual",
    category: "Lab Manuals",
    provider: "Google Drive",
    fileType: "PDF",
    fileSize: "4.8 MB",
    description: "Hands-on laboratory manual covering NumPy array manipulation, Pandas data cleaning, and Matplotlib data visualization routines.",
    course: "DSA301 - Computing Lab",
    applicableCourses: [
      "DSA301 - Computing Lab",
      "CSC201 - Python for Scientific Computing",
      "STA301 - Computational Data Science",
      "GSY303 - Gas Technology (Numerical Methods Module)"
    ],
    authorOrDept: "GardiaLab Faculty of Computing",
    shareUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view",
    previewUrl: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    featured: true,
    requiredTool: "python",
  },
  {
    id: "res-lab-02",
    title: "SQL Server & Relational Database Design Worksheets",
    category: "Lab Manuals",
    provider: "OneDrive",
    fileType: "PDF",
    fileSize: "3.2 MB",
    description: "Step-by-step T-SQL exercises, Entity-Relationship diagrams, indexing best practices, and transaction isolation levels.",
    course: "CSC301 - Database Systems",
    applicableCourses: [
      "CSC301 - Database Systems",
      "DSA202 - Relational Databases",
      "INF304 - Enterprise Database Engineering"
    ],
    authorOrDept: "Dept. of Computer Science",
    shareUrl: "https://onedrive.live.com/?id=sample_sql_server_manual",
    previewUrl: "https://onedrive.live.com/embed?resid=sample_sql_server_manual",
    downloadUrl: "https://onedrive.live.com/download?resid=sample_sql_server_manual",
    featured: true,
    requiredTool: "sql",
  },
  {
    id: "res-lab-03",
    title: "Statistical Computing & Inference with R Lab Guide",
    category: "Lab Manuals",
    provider: "Google Drive",
    fileType: "PDF",
    fileSize: "5.5 MB",
    description: "Comprehensive R laboratory guide: ANOVA, linear regression diagnostics, hypothesis testing, and ggplot2 visual formatting.",
    course: "STA211 - Statistics Lab",
    applicableCourses: [
      "STA211 - Statistics Lab",
      "ECO305 - Econometrics & Regression",
      "BIO204 - Biostatistics & Experimental Design",
      "STA304 - Multivariate Analysis"
    ],
    authorOrDept: "Dept. of Statistics & Mathematics",
    shareUrl: "https://drive.google.com/file/d/17b1qX43q6gM5l9jN9dY6r8k1tU3w4v7x/view",
    previewUrl: "https://drive.google.com/file/d/17b1qX43q6gM5l9jN9dY6r8k1tU3w4v7x/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=17b1qX43q6gM5l9jN9dY6r8k1tU3w4v7x",
    featured: false,
    requiredTool: "r",
  },
  {
    id: "res-lab-04",
    title: "Microsoft Power BI Executive Dashboard Step-by-Step",
    category: "Lab Manuals",
    provider: "Google Drive",
    fileType: "PDF",
    fileSize: "6.1 MB",
    description: "End-to-end practical guide from Power Query ETL to Star Schema modeling, DAX measure creation, and visual storytelling.",
    course: "DSA402 - Business Intelligence",
    applicableCourses: [
      "DSA402 - Business Intelligence",
      "MKT302 - Marketing Analytics",
      "FIN401 - Financial Dashboard Modeling",
      "GSY303 - Gas Technology (Production KPI Dashboards)"
    ],
    authorOrDept: "GardiaLab EdTech Academy",
    shareUrl: "https://drive.google.com/file/d/18c2rY54r7hN6m0kO0eZ7s9l2uV4x5w8y/view",
    previewUrl: "https://drive.google.com/file/d/18c2rY54r7hN6m0kO0eZ7s9l2uV4x5w8y/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=18c2rY54r7hN6m0kO0eZ7s9l2uV4x5w8y",
    featured: true,
    requiredTool: "powerbi",
  },
  {
    id: "res-book-01",
    title: "Foundations of Applied Data Science & Machine Learning",
    category: "Textbooks",
    provider: "Google Drive",
    fileType: "PDF",
    fileSize: "14.2 MB",
    description: "Curriculum textbook covering supervised and unsupervised learning algorithms, feature engineering, and cross-validation.",
    course: "DSA305 - Machine Learning",
    applicableCourses: [
      "DSA305 - Machine Learning",
      "CSC401 - Artificial Intelligence",
      "STA402 - Predictive Statistical Modeling"
    ],
    authorOrDept: "Prof. O. Balogun & Dr. A. Adebayo",
    shareUrl: "https://drive.google.com/file/d/19d3sZ65s8iO7n1lP1fa8t0m3vW5y6x9z/view",
    previewUrl: "https://drive.google.com/file/d/19d3sZ65s8iO7n1lP1fa8t0m3vW5y6x9z/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=19d3sZ65s8iO7n1lP1fa8t0m3vW5y6x9z",
    featured: true,
  },
  {
    id: "res-book-02",
    title: "Modern Business Intelligence & Data Warehousing",
    category: "Textbooks",
    provider: "OneDrive",
    fileType: "PDF",
    fileSize: "11.7 MB",
    description: "Textbook covering dimensional modeling (Kimball methodology), ETL orchestration, OLAP cubes, and enterprise reporting.",
    course: "DSA402 - Data Warehousing",
    applicableCourses: [
      "DSA402 - Data Warehousing",
      "INF403 - Enterprise Information Systems",
      "CSC301 - Database Systems"
    ],
    authorOrDept: "Faculty of Computing",
    shareUrl: "https://onedrive.live.com/?id=sample_bi_textbook",
    previewUrl: "https://onedrive.live.com/embed?resid=sample_bi_textbook",
    downloadUrl: "https://onedrive.live.com/download?resid=sample_bi_textbook",
    featured: false,
  },
  {
    id: "res-data-01",
    title: "Nigerian Consumer Retail & E-Commerce Dataset (2026)",
    category: "Datasets",
    provider: "Google Drive",
    fileType: "CSV",
    fileSize: "6.2 KB",
    description: "Clean transactional dataset containing order IDs, customer states, product lines, quantities, and net profit margins.",
    course: "DSA301 - Power BI Practice",
    applicableCourses: [
      "DSA301 - Power BI Practice",
      "MKT302 - Marketing Analytics",
      "DSA402 - Business Intelligence"
    ],
    authorOrDept: "GardiaLab Research Repository",
    shareUrl: "https://drive.google.com/file/d/10e4tA76t9jP8o2mQ2gb9u1n4wX6z7y0a/view",
    previewUrl: "https://drive.google.com/file/d/10e4tA76t9jP8o2mQ2gb9u1n4wX6z7y0a/preview",
    downloadUrl: "https://drive.google.com/uc?export=download&id=10e4tA76t9jP8o2mQ2gb9u1n4wX6z7y0a",
    featured: true,
  },
  {
    id: "res-data-02",
    title: "Fintech Digital Payment Channels & Latency Stream",
    category: "Datasets",
    provider: "OneDrive",
    fileType: "CSV",
    fileSize: "5.1 KB",
    description: "Banking transaction logs across Mobile App, USSD, POS, and Web transfer with merchant tags, fee revenues, and latency.",
    course: "CSC301 - Database SQL Lab",
    applicableCourses: [
      "CSC301 - Database SQL Lab",
      "FIN401 - Financial Technology",
      "INF304 - Enterprise Systems"
    ],
    authorOrDept: "Digital Finance Laboratory",
    shareUrl: "https://onedrive.live.com/?id=sample_fintech_dataset",
    previewUrl: "https://onedrive.live.com/embed?resid=sample_fintech_dataset",
    downloadUrl: "https://onedrive.live.com/download?resid=sample_fintech_dataset",
    featured: false,
  },
];

