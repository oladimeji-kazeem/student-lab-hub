// Power BI Lab & Data Analytics Curriculum, Starter Datasets, and Exercise Briefs

export interface StarterDataset {
  id: string;
  title: string;
  filename: string;
  description: string;
  rowCount: number;
  fileSize: string;
  badge: string;
  columns: string[];
  csvContent: string;
}

export interface ExerciseBrief {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedHours: string;
  datasetId: string;
  datasetName: string;
  scenario: string;
  learningObjectives: string[];
  requiredVisuals: { title: string; type: string; purpose: string }[];
  keyDaxMeasures: { name: string; formula: string; explanation: string }[];
  deliverables: string[];
}

export interface EmbeddedReportPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  embedUrl: string;
}

// 1. Downloadable Starter Datasets
export const POWERBI_DATASETS: StarterDataset[] = [
  {
    id: "retail_sales",
    title: "Global & Nigerian Retail Sales & Profitability",
    filename: "retail_sales_kpi.csv",
    description: "Multi-regional sales transactions, customer demographics, product categories, discounts, and net profits.",
    rowCount: 50,
    fileSize: "6.2 KB",
    badge: "E-Commerce",
    columns: [
      "Order_ID",
      "Order_Date",
      "Customer_Name",
      "Segment",
      "State",
      "Region",
      "Category",
      "Sub_Category",
      "Product_Name",
      "Sales",
      "Quantity",
      "Discount",
      "Profit",
    ],
    csvContent: `Order_ID,Order_Date,Customer_Name,Segment,State,Region,Category,Sub_Category,Product_Name,Sales,Quantity,Discount,Profit
ORD-2026-1001,2026-01-05,Boluwatife Adeleke,Consumer,Lagos,South West,Technology,Phones,iPhone 15 Pro 128GB,1250000.00,2,0.05,187500.00
ORD-2026-1002,2026-01-06,Kazeem Oladimeji,Corporate,Ogun,South West,Technology,Laptops,HP Spectre x360,1450000.00,1,0.00,290000.00
ORD-2026-1003,2026-01-08,Amina Danjuma,Consumer,Abuja,North Central,Furniture,Chairs,Ergonomic Mesh Chair,125000.00,4,0.10,31250.00
ORD-2026-1004,2026-01-09,Chinedu Okeke,Home Office,Enugu,South East,Office Supplies,Storage,Heavy Duty Filing Cabinet,95000.00,2,0.00,28500.00
ORD-2026-1005,2026-01-11,Fatima Bello,Corporate,Kano,North West,Technology,Accessories,Logitech MX Master 3S,65000.00,5,0.05,22750.00
ORD-2026-1006,2026-01-14,Emeka Eze,Consumer,Rivers,South South,Furniture,Tables,Executive Standing Desk,350000.00,1,0.15,52500.00
ORD-2026-1007,2026-01-16,Folashade Bakare,Consumer,Oyo,South West,Office Supplies,Paper,Double A A4 Box (5 Reams),28500.00,8,0.00,7125.00
ORD-2026-1008,2026-01-18,Ibrahim Mohammed,Home Office,Kaduna,North West,Technology,Phones,Samsung Galaxy S24,980000.00,1,0.00,147000.00
ORD-2026-1009,2026-01-20,Temitope Ojo,Corporate,Lagos,South West,Furniture,Bookcases,Modern 5-Tier Bookshelf,85000.00,3,0.10,17850.00
ORD-2026-1010,2026-01-22,Ngozi Okonjo,Consumer,Abuja,North Central,Technology,Laptops,MacBook Air M3,1650000.00,1,0.05,247500.00
ORD-2026-1011,2026-01-25,Kabir Aliyu,Corporate,Kano,North West,Office Supplies,Binders,Clear View Binders Pack,18000.00,12,0.00,4500.00
ORD-2026-1012,2026-01-27,Blessing Nwosu,Consumer,Delta,South South,Technology,Accessories,Anker 65W GaN Charger,32000.00,6,0.05,9600.00
ORD-2026-1013,2026-02-01,Boluwatife Adeleke,Consumer,Lagos,South West,Office Supplies,Appliances,Electric Water Dispenser,110000.00,1,0.00,27500.00
ORD-2026-1014,2026-02-03,Kazeem Oladimeji,Corporate,Ogun,South West,Furniture,Chairs,High Back Leather Chair,210000.00,2,0.10,42000.00
ORD-2026-1015,2026-02-05,Amina Danjuma,Consumer,Abuja,North Central,Technology,Phones,Google Pixel 8,720000.00,1,0.00,108000.00
ORD-2026-1016,2026-02-08,Chinedu Okeke,Home Office,Enugu,South East,Technology,Laptops,Dell XPS 15,1850000.00,1,0.08,259000.00
ORD-2026-1017,2026-02-10,Fatima Bello,Corporate,Kano,North West,Furniture,Tables,Conference Meeting Table,620000.00,1,0.20,93000.00
ORD-2026-1018,2026-02-12,Emeka Eze,Consumer,Rivers,South South,Office Supplies,Storage,Archive Boxes (Pack of 10),35000.00,4,0.00,8750.00
ORD-2026-1019,2026-02-15,Folashade Bakare,Consumer,Oyo,South West,Technology,Accessories,JBL Bluetooth Speaker,55000.00,3,0.05,13750.00
ORD-2026-1020,2026-02-18,Ibrahim Mohammed,Home Office,Kaduna,North West,Office Supplies,Paper,HP Premium Glossy Paper,42000.00,5,0.00,10500.00
ORD-2026-1021,2026-02-21,Temitope Ojo,Corporate,Lagos,South West,Technology,Phones,iPhone 15 128GB,950000.00,2,0.05,142500.00
ORD-2026-1022,2026-02-24,Ngozi Okonjo,Consumer,Abuja,North Central,Furniture,Chairs,Ergonomic Kneeling Stool,78000.00,2,0.00,19500.00
ORD-2026-1023,2026-02-26,Kabir Aliyu,Corporate,Kano,North West,Technology,Laptops,Lenovo ThinkPad E14,890000.00,3,0.12,186900.00
ORD-2026-1024,2026-03-01,Blessing Nwosu,Consumer,Delta,South South,Office Supplies,Appliances,Heavy Duty Paper Shredder,85000.00,1,0.00,21250.00
ORD-2026-1025,2026-03-03,Boluwatife Adeleke,Consumer,Lagos,South West,Furniture,Tables,Adjustable Laptop Stand,28000.00,5,0.00,7000.00
ORD-2026-1026,2026-03-06,Kazeem Oladimeji,Corporate,Ogun,South West,Technology,Accessories,Dell 27-inch 4K Monitor,380000.00,4,0.08,91200.00
ORD-2026-1027,2026-03-09,Amina Danjuma,Consumer,Abuja,North Central,Office Supplies,Binders,Presentation Ring Folders,15000.00,10,0.00,3750.00
ORD-2026-1028,2026-03-12,Chinedu Okeke,Home Office,Enugu,South East,Technology,Phones,Nothing Phone 2,650000.00,1,0.00,97500.00
ORD-2026-1029,2026-03-15,Fatima Bello,Corporate,Kano,North West,Furniture,Bookcases,Steel Archive Shelving Unit,145000.00,2,0.10,29000.00
ORD-2026-1030,2026-03-18,Emeka Eze,Consumer,Rivers,South South,Technology,Laptops,Asus ZenBook 14,1150000.00,1,0.05,172500.00`,
  },
  {
    id: "fintech_channel",
    title: "Fintech & Digital Banking Transaction Stream",
    filename: "fintech_channel_analytics.csv",
    description: "Transaction logs across Mobile App, USSD, POS, and Web transfer with merchant tags, fee revenues, and latency.",
    rowCount: 45,
    fileSize: "5.1 KB",
    badge: "Fintech",
    columns: [
      "Tx_Reference",
      "Timestamp",
      "Customer_ID",
      "State",
      "Channel",
      "Tx_Type",
      "Amount_NGN",
      "Fee_NGN",
      "Status",
      "Response_Time_Sec",
    ],
    csvContent: `Tx_Reference,Timestamp,Customer_ID,State,Channel,Tx_Type,Amount_NGN,Fee_NGN,Status,Response_Time_Sec
TX-2026-9001,2026-02-01 08:14:10,CUST-4101,Lagos,Web Transfer,Debit,3500.00,25.00,Successful,0.85
TX-2026-9002,2026-02-01 09:22:45,CUST-4102,Abuja,Mobile App,Debit,15000.00,35.00,Successful,0.62
TX-2026-9003,2026-02-01 10:05:12,CUST-4103,Ogun,POS,Debit,4500.00,50.00,Successful,1.40
TX-2026-9004,2026-02-01 11:30:20,CUST-4104,Kano,USSD,Debit,2000.00,10.00,Successful,2.10
TX-2026-9005,2026-02-01 12:45:00,CUST-4105,Rivers,Web Transfer,Debit,85000.00,50.00,Successful,1.10
TX-2026-9006,2026-02-01 13:12:15,CUST-4106,Lagos,Mobile App,Debit,120000.00,50.00,Successful,0.55
TX-2026-9007,2026-02-01 14:18:30,CUST-4107,Enugu,POS,Debit,6800.00,50.00,Failed,5.20
TX-2026-9008,2026-02-01 15:40:10,CUST-4108,Oyo,USSD,Debit,1500.00,10.00,Successful,1.95
TX-2026-9009,2026-02-01 16:55:22,CUST-4109,Lagos,Mobile App,Credit,250000.00,0.00,Successful,0.48
TX-2026-9010,2026-02-01 17:20:05,CUST-4110,Kaduna,Web Transfer,Debit,45000.00,50.00,Successful,0.92
TX-2026-9011,2026-02-01 18:05:40,CUST-4111,Delta,POS,Debit,18500.00,50.00,Successful,1.65
TX-2026-9012,2026-02-01 19:30:10,CUST-4112,Lagos,Mobile App,Debit,8900.00,25.00,Successful,0.60
TX-2026-9013,2026-02-01 20:15:35,CUST-4113,Abuja,USSD,Debit,5000.00,10.00,Failed,4.80
TX-2026-9014,2026-02-01 21:00:15,CUST-4114,Ogun,Web Transfer,Debit,32000.00,50.00,Successful,0.80
TX-2026-9015,2026-02-02 08:10:00,CUST-4115,Lagos,Mobile App,Debit,75000.00,50.00,Successful,0.52
TX-2026-9016,2026-02-02 09:45:20,CUST-4116,Kano,POS,Debit,3400.00,50.00,Successful,1.35
TX-2026-9017,2026-02-02 11:20:10,CUST-4117,Rivers,Mobile App,Credit,500000.00,0.00,Successful,0.50
TX-2026-9018,2026-02-02 12:35:45,CUST-4118,Enugu,USSD,Debit,1000.00,10.00,Successful,2.05
TX-2026-9019,2026-02-02 14:15:00,CUST-4119,Lagos,Web Transfer,Debit,14500.00,35.00,Successful,0.78
TX-2026-9020,2026-02-02 15:50:30,CUST-4120,Abuja,POS,Debit,28000.00,50.00,Successful,1.55`,
  },
  {
    id: "higher_ed",
    title: "University Student Performance & Retention",
    filename: "student_retention_analytics.csv",
    description: "Academic enrollment, faculties, attendance percentages, continuous assessments, and graduation outcomes.",
    rowCount: 30,
    fileSize: "4.4 KB",
    badge: "Higher Ed",
    columns: [
      "Matric_No",
      "Full_Name",
      "Department",
      "Faculty",
      "Level",
      "Gender",
      "Attendance_Pct",
      "Continuous_Assessment",
      "Exam_Score",
      "Final_Grade",
      "CGPA",
      "Retention_Status",
    ],
    csvContent: `Matric_No,Full_Name,Department,Faculty,Level,Gender,Attendance_Pct,Continuous_Assessment,Exam_Score,Final_Grade,CGPA,Retention_Status
ELAB/2023/101,Oluwaseun Adeleke,Data Science & AI,Computing,300,Male,94,28,62,A,4.65,Good Standing
ELAB/2023/102,Chidinma Okafor,Computer Science,Computing,300,Female,98,30,65,A,4.88,Good Standing
ELAB/2023/103,Ibrahim Danjuma,Software Engineering,Computing,200,Male,78,22,50,B,3.85,Good Standing
ELAB/2023/104,Folashade Bakare,Economics & Analytics,Social Sciences,300,Female,88,26,58,A,4.40,Good Standing
ELAB/2023/105,Emeka Nwosu,Data Science & AI,Computing,400,Male,82,24,52,B,4.10,Good Standing
ELAB/2023/106,Aisha Mohammed,Statistics & Mathematics,Physical Sciences,200,Female,92,27,61,A,4.72,Good Standing
ELAB/2023/107,Temitope Ojo,Computer Science,Computing,100,Male,64,16,38,D,2.45,At Risk
ELAB/2023/108,Blessing Eze,Data Science & AI,Computing,400,Female,96,29,66,A,4.92,Good Standing
ELAB/2023/109,Kazeem Alabi,Software Engineering,Computing,200,Male,85,25,54,B,4.20,Good Standing
ELAB/2023/110,Ngozi Nnamdi,Economics & Analytics,Social Sciences,400,Female,90,27,59,A,4.55,Good Standing
ELAB/2023/111,Boluwatife Oyelakin,Statistics & Mathematics,Physical Sciences,300,Male,58,14,35,F,1.95,Academic Probation
ELAB/2023/112,Zainab Abubakar,Computer Science,Computing,200,Female,91,26,60,A,4.60,Good Standing
ELAB/2023/113,Chukwuemeka Obi,Software Engineering,Computing,300,Male,84,24,53,B,4.05,Good Standing
ELAB/2023/114,Halima Sani,Economics & Analytics,Social Sciences,100,Female,89,25,56,A,4.35,Good Standing
ELAB/2023/115,Tunde Badmus,Data Science & AI,Computing,200,Male,62,15,40,D,2.50,At Risk`,
  },
];

// 2. Structured Exercise Briefs (Student Guided Projects)
export const EXERCISE_BRIEFS: ExerciseBrief[] = [
  {
    id: "brief_retail_exec",
    title: "Project 1: Executive Sales & Profitability Dashboard",
    difficulty: "Beginner",
    estimatedHours: "2 - 3 hours",
    datasetId: "retail_sales",
    datasetName: "retail_sales_kpi.csv",
    scenario:
      "The Chief Commercial Officer (CCO) requires an executive Power BI dashboard to evaluate multi-regional sales performance, product category profitability, and customer segment contributions. You have been provided with the raw sales transactions dataset.",
    learningObjectives: [
      "Import, clean, and transform data using Power Query.",
      "Design an intuitive executive layout with standard brand palette.",
      "Create high-impact KPI Cards with dynamic formatting.",
      "Write foundational DAX measures: SUM, DIVIDE, and Profit Margin.",
      "Implement cross-filtering with Region and Category slicers.",
    ],
    requiredVisuals: [
      {
        title: "Executive KPI Cards",
        type: "Card Visuals (4x)",
        purpose: "Display Total Revenue (NGN), Total Net Profit (NGN), Total Units Sold, and Profit Margin %.",
      },
      {
        title: "Revenue by Product Category & Subcategory",
        type: "Clustered Bar Chart",
        purpose: "Identify top revenue-generating product lines (Technology vs Furniture vs Office Supplies).",
      },
      {
        title: "Regional Sales & Profit Heatmap",
        type: "Filled Map / Bar Chart by State",
        purpose: "Compare performance across Nigerian states (Lagos, Abuja, Ogun, Kano, Rivers).",
      },
      {
        title: "Monthly Sales Trend",
        type: "Area / Line Chart",
        purpose: "Visualize revenue progression over time with average trend line.",
      },
    ],
    keyDaxMeasures: [
      {
        name: "Total Sales",
        formula: "Total Sales = SUM(RetailSales[Sales])",
        explanation: "Calculates the overall gross revenue generated across all transactions.",
      },
      {
        name: "Total Profit",
        formula: "Total Profit = SUM(RetailSales[Profit])",
        explanation: "Computes total net profit after deductions and discounts.",
      },
      {
        name: "Profit Margin %",
        formula: "Profit Margin % = DIVIDE([Total Profit], [Total Sales], 0)",
        explanation: "Safely computes the profit margin percentage, avoiding divide-by-zero errors.",
      },
      {
        name: "Average Order Value (AOV)",
        formula: "Average Order Value = DIVIDE([Total Sales], DISTINCTCOUNT(RetailSales[Order_ID]), 0)",
        explanation: "Determines the average revenue generated per unique order ticket.",
      },
    ],
    deliverables: [
      "Power BI Report File (.pbix) or published web link.",
      "A 1-page PDF export of your completed executive dashboard.",
      "Brief commentary summarizing top 3 business recommendations based on your findings.",
    ],
  },
  {
    id: "brief_fintech_velocity",
    title: "Project 2: Fintech Channel Reliability & High-Value Payments",
    difficulty: "Intermediate",
    estimatedHours: "3 - 4 hours",
    datasetId: "fintech_channel",
    datasetName: "fintech_channel_analytics.csv",
    scenario:
      "A leading payment processing company needs an operational telemetry dashboard to track channel uptime (USSD vs Mobile App vs POS vs Web), fee revenues, and response times across geographic hubs.",
    learningObjectives: [
      "Calculate conditional DAX measures with CALCULATE and FILTER.",
      "Build a channel success rate metric (SLA Target: 98.5%).",
      "Construct a Gauge visual indicating system health.",
      "Analyze response latency and merchant failure hotspots.",
    ],
    requiredVisuals: [
      {
        title: "Transaction Volume by Channel",
        type: "Donut Chart",
        purpose: "Breakdown of payment volume across Mobile App, Web Transfer, POS, and USSD.",
      },
      {
        title: "System Success Rate SLA",
        type: "Gauge Visual",
        purpose: "Compare real-time Success Rate % against the 98.5% industry SLA target.",
      },
      {
        title: "Hourly Failure Distribution",
        type: "Matrix with Conditional Formatting",
        purpose: "Highlight failure clusters across hours of the day and payment channels.",
      },
      {
        title: "Total Fee Revenue by State",
        type: "Treemap",
        purpose: "Visualize merchant processing fee generation by territory.",
      },
    ],
    keyDaxMeasures: [
      {
        name: "Total Volume",
        formula: "Total Volume = SUM(Transactions[Amount_NGN])",
        explanation: "Sum of all monetary transactions routed through the payment gateway.",
      },
      {
        name: "Successful Tx Count",
        formula: "Successful Tx Count = CALCULATE(COUNTROWS(Transactions), Transactions[Status] = \"Successful\")",
        explanation: "Filters the transaction table for successful payments only.",
      },
      {
        name: "Channel Success Rate %",
        formula: "Channel Success Rate % = DIVIDE([Successful Tx Count], COUNTROWS(Transactions), 0)",
        explanation: "Calculates the overall delivery rate of the payment infrastructure.",
      },
      {
        name: "High Value Tx Volume",
        formula: "High Value Tx Volume = CALCULATE([Total Volume], Transactions[Amount_NGN] >= 100000)",
        explanation: "Aggregates revenue for payments exceeding ₦100,000 threshold.",
      },
    ],
    deliverables: [
      "Completed Power BI .pbix file with data model star schema.",
      "Interactive slicers for State, Status, and Channel.",
      "Technical report highlighting channels with failure rates above SLA threshold.",
    ],
  },
  {
    id: "brief_student_retention",
    title: "Project 3: Academic Performance & Student At-Risk Prediction",
    difficulty: "Advanced",
    estimatedHours: "4 - 5 hours",
    datasetId: "higher_ed",
    datasetName: "student_retention_analytics.csv",
    scenario:
      "The University Senate and Academic Dean require an early-warning dashboard to detect students at risk of academic probation based on midterm assessment results and class attendance percentages.",
    learningObjectives: [
      "Build a Star Schema with FactEnrollments and DimStudent/DimDepartment.",
      "Leverage Decomposition Tree for root-cause drill down.",
      "Write multi-condition logic DAX with SWITCH(TRUE(), ...).",
      "Deploy custom visual tooltips showing individual student histories.",
    ],
    requiredVisuals: [
      {
        title: "Attendance % vs CGPA Correlation",
        type: "Scatter Plot with Quadrant Lines",
        purpose: "Illustrate strong correlation between class attendance and final grade point average.",
      },
      {
        title: "Academic Risk Breakdown",
        type: "Decomposition Tree",
        purpose: "Allow Deans to drill from Faculty ➔ Department ➔ Level ➔ At-Risk Students.",
      },
      {
        title: "Departmental Performance Matrix",
        type: "Matrix Table",
        purpose: "Display student count, average CGPA, and % on Dean's Honor Roll.",
      },
    ],
    keyDaxMeasures: [
      {
        name: "Average CGPA",
        formula: "Average CGPA = AVERAGE(Students[CGPA])",
        explanation: "Mean cumulative grade point average across selected cohort.",
      },
      {
        name: "At Risk Count",
        formula: "At Risk Count = CALCULATE(DISTINCTCOUNT(Students[Matric_No]), Students[Retention_Status] = \"At Risk\" || Students[Attendance_Pct] < 70)",
        explanation: "Identifies vulnerable students requiring academic intervention.",
      },
      {
        name: "Risk Classification",
        formula: "Risk Level = SWITCH(TRUE(), [Average CGPA] >= 4.5, \"First Class / Honor\", [Average CGPA] >= 3.5, \"Second Class Upper\", [Average CGPA] >= 2.5, \"Second Class Lower\", \"Critical / At Risk\")",
        explanation: "Categorizes academic performance into standardized Nigerian university degree classifications.",
      },
    ],
    deliverables: [
      "Comprehensive multi-page Power BI report.",
      "Drill-through page detailing individual student attendance and grades.",
    ],
  },
];

// 3. Embedded Sample Reports & Interactive Demos
export const EMBEDDED_REPORTS: EmbeddedReportPreset[] = [
  {
    id: "sales_returns",
    title: "Global Sales & Profitability Executive Dashboard",
    category: "Commercial & Sales",
    description: "Official interactive Power BI report with dynamic cross-filtering, product breakdown, and regional KPI cards.",
    embedUrl:
      "https://app.powerbi.com/view?r=eyJrIjoiOGRhMDY4MmMtZTY0Yy00ZjVkLTkyZDQtYTBhMmIxYjA4Y2E4IiwidCI6ImM2ZTU0OWIzLTVmNDUtNDAzMi1hYWU5LWQ0MjQ0ZGM1YjJjNCIsImMiOjF9",
  },
  {
    id: "it_spend",
    title: "Financial & Operating Expense Analytics",
    category: "Finance & Operations",
    description: "Multi-departmental budget vs actuals, variance analysis, and operational cost decomposition.",
    embedUrl:
      "https://app.powerbi.com/view?r=eyJrIjoiMDY0ODIzYjYtYWIwOC00MTEyLWIyY2EtMmQ2YTUwZjNhODg2IiwidCI6ImM2ZTU0OWIzLTVmNDUtNDAzMi1hYWU5LWQ0MjQ0ZGM1YjJjNCIsImMiOjF9",
  },
];

// 4. DAX Quick Reference Cheat Sheet
export interface DaxSnippet {
  name: string;
  category: "Aggregation" | "Filter & Context" | "Logical" | "Time Intelligence";
  syntax: string;
  example: string;
  description: string;
}

export const DAX_CHEAT_SHEET: DaxSnippet[] = [
  {
    name: "SUM & DIVIDE (Safe Division)",
    category: "Aggregation",
    syntax: "DIVIDE(Numerator, Denominator, [AlternateResult])",
    example: "Margin % = DIVIDE(SUM(Sales[Profit]), SUM(Sales[Revenue]), 0)",
    description: "Always use DIVIDE instead of '/' to gracefully avoid division-by-zero errors in visual cards.",
  },
  {
    name: "CALCULATE (Context Transition)",
    category: "Filter & Context",
    syntax: "CALCULATE(Expression, Filter1, Filter2, ...)",
    example: "Lagos Sales = CALCULATE(SUM(Sales[Amount]), Customers[State] = \"Lagos\")",
    description: "The most vital function in DAX. Evaluates an expression under modified filter context.",
  },
  {
    name: "RELATED & RELATEDTABLE",
    category: "Filter & Context",
    syntax: "RELATED(ColumnName) / RELATEDTABLE(TableName)",
    example: "Customer Country = RELATED(Customers[Country])",
    description: "Fetches a related value from the one-side of a 1-to-many relationship.",
  },
  {
    name: "SWITCH (Multi-condition IF)",
    category: "Logical",
    syntax: "SWITCH(Expression, Val1, Result1, Val2, Result2, [Else])",
    example: "Performance = SWITCH(TRUE(), [Margin %] >= 0.25, \"High\", [Margin %] >= 0.10, \"Medium\", \"Low\")",
    description: "Cleaner alternative to nested IF statements for grading, classification, and KPI thresholds.",
  },
  {
    name: "SAMEPERIODLASTYEAR (YoY Comparison)",
    category: "Time Intelligence",
    syntax: "SAMEPERIODLASTYEAR(DateColumn)",
    example: "Sales LY = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Calendar'[Date]))",
    description: "Shifts the date filter context back by exactly one year for Year-over-Year (YoY) variance analysis.",
  },
];
