// Browser-based SQL Engine powered by sql.js WebAssembly
// Supports in-memory database execution, schema introspection, T-SQL compatibility, and sample datasets.

/* eslint-disable @typescript-eslint/no-explicit-any */
let sqlJsInstance: any = null;
let sqlJsLoadingPromise: Promise<any> | null = null;

export interface QueryResult {
  columns: string[];
  values: any[][];
  executionTimeMs: number;
  rowsAffected?: number;
}

export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  rowCount: number;
}

export interface DatasetPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  tables: string[];
  setupSql: string;
  starterQuery: string;
}

// 1. Preloaded Datasets
export const SQL_DATASETS: DatasetPreset[] = [
  {
    id: "northwind",
    name: "Northwind E-Commerce (SQL Server Classic)",
    description: "Classic Microsoft SQL Server sample database: Customers, Products, Categories, Orders, and Employees.",
    badge: "Microsoft Classic",
    tables: ["Customers", "Categories", "Products", "Employees", "Orders", "OrderDetails"],
    setupSql: `
CREATE TABLE Categories (
  CategoryID INTEGER PRIMARY KEY,
  CategoryName TEXT NOT NULL,
  Description TEXT
);

INSERT INTO Categories VALUES
(1, 'Beverages', 'Soft drinks, coffees, teas, beers, and ales'),
(2, 'Condiments', 'Sweet and savory sauces, relishes, spreads, and seasonings'),
(3, 'Confections', 'Desserts, candies, and sweet breads'),
(4, 'Dairy Products', 'Cheeses, butter, and milk'),
(5, 'Grains/Cereals', 'Breads, crackers, pasta, and cereal');

CREATE TABLE Products (
  ProductID INTEGER PRIMARY KEY,
  ProductName TEXT NOT NULL,
  CategoryID INTEGER,
  UnitPrice REAL NOT NULL,
  UnitsInStock INTEGER NOT NULL,
  Discontinued INTEGER DEFAULT 0,
  FOREIGN KEY (CategoryID) REFERENCES Categories (CategoryID)
);

INSERT INTO Products VALUES
(1, 'Chai Tea', 1, 18.00, 39, 0),
(2, 'Chang Beer', 1, 19.00, 17, 0),
(3, 'Aniseed Syrup', 2, 10.00, 13, 0),
(4, 'Chef Anton Cajun Seasoning', 2, 22.00, 53, 0),
(5, 'Grandma Boysenberry Spread', 2, 25.00, 120, 0),
(6, 'Uncle Bob Organic Pears', 3, 30.00, 15, 0),
(7, 'Northwoods Cranberry Sauce', 2, 40.00, 6, 0),
(8, 'Mishi Kobe Niku', 3, 97.00, 29, 0),
(9, 'Ikura Fish Roe', 1, 31.00, 31, 0),
(10, 'Queso Cabrales Cheese', 4, 21.00, 22, 0),
(11, 'Queso Manchego La Pastora', 4, 38.00, 86, 0),
(12, 'Gustaf Knäckebröd', 5, 21.00, 104, 0),
(13, 'Tunnbröd Flatbread', 5, 9.00, 61, 0),
(14, 'Guaraná Fantástica', 1, 4.50, 20, 0),
(15, 'NuNuCa Nut-Nougat-Cream', 3, 14.00, 76, 0);

CREATE TABLE Customers (
  CustomerID TEXT PRIMARY KEY,
  CompanyName TEXT NOT NULL,
  ContactName TEXT,
  City TEXT,
  Country TEXT,
  Phone TEXT
);

INSERT INTO Customers VALUES
('ALFKI', 'Alfreds Futterkiste', 'Maria Anders', 'Berlin', 'Germany', '030-0074321'),
('ANATR', 'Ana Trujillo Emparedados', 'Ana Trujillo', 'México D.F.', 'Mexico', '(5) 555-4729'),
('ANTON', 'Antonio Moreno Taquería', 'Antonio Moreno', 'México D.F.', 'Mexico', '(5) 555-3932'),
('AROUT', 'Around the Horn', 'Thomas Hardy', 'London', 'UK', '(171) 555-7788'),
('BERGS', 'Berglunds snabbköp', 'Christina Berglund', 'Luleå', 'Sweden', '0921-12 34 65'),
('BLAUS', 'Blauer See Delikatessen', 'Hanna Moos', 'Mannheim', 'Germany', '0621-08460'),
('BLONP', 'Blondel père et fils', 'Frédérique Citeaux', 'Strasbourg', 'France', '88.60.15.31'),
('BOLID', 'Bólido Comidas preparadas', 'Martín Sommer', 'Madrid', 'Spain', '(91) 555 22 82'),
('BONAP', 'Bon app', 'Laurence Lebihan', 'Marseille', 'France', '91.24.45.40'),
('BOTTM', 'Bottom-Dollar Markets', 'Elizabeth Lincoln', 'Tsawwassen', 'Canada', '(604) 555-4729');

CREATE TABLE Employees (
  EmployeeID INTEGER PRIMARY KEY,
  FirstName TEXT NOT NULL,
  LastName TEXT NOT NULL,
  Title TEXT,
  Department TEXT,
  Salary REAL,
  ReportsTo INTEGER
);

INSERT INTO Employees VALUES
(1, 'Nancy', 'Davolio', 'Sales Representative', 'Sales', 48000, 2),
(2, 'Andrew', 'Fuller', 'Vice President, Sales', 'Executive', 95000, NULL),
(3, 'Janet', 'Leverling', 'Sales Representative', 'Sales', 51000, 2),
(4, 'Margaret', 'Peacock', 'Senior Sales Specialist', 'Sales', 58000, 2),
(5, 'Steven', 'Buchanan', 'Sales Manager', 'Sales', 72000, 2),
(6, 'Michael', 'Suyama', 'Data & BI Analyst', 'Analytics', 65000, 2),
(7, 'Robert', 'King', 'IT Systems Specialist', 'IT', 61000, 2),
(8, 'Laura', 'Callahan', 'Inside Sales Coordinator', 'Sales', 47000, 5),
(9, 'Anne', 'Dodsworth', 'Junior Sales Analyst', 'Sales', 42000, 5);

CREATE TABLE Orders (
  OrderID INTEGER PRIMARY KEY,
  CustomerID TEXT,
  EmployeeID INTEGER,
  OrderDate TEXT,
  Freight REAL,
  ShipCountry TEXT,
  FOREIGN KEY (CustomerID) REFERENCES Customers (CustomerID),
  FOREIGN KEY (EmployeeID) REFERENCES Employees (EmployeeID)
);

INSERT INTO Orders VALUES
(10248, 'ALFKI', 5, '2026-01-04', 32.38, 'Germany'),
(10249, 'ANATR', 6, '2026-01-05', 11.61, 'Mexico'),
(10250, 'ANTON', 4, '2026-01-08', 65.83, 'Mexico'),
(10251, 'AROUT', 3, '2026-01-08', 41.34, 'UK'),
(10252, 'BERGS', 4, '2026-01-09', 51.30, 'Sweden'),
(10253, 'BLAUS', 3, '2026-01-10', 58.17, 'Germany'),
(10254, 'BLONP', 5, '2026-01-11', 22.98, 'France'),
(10255, 'BOLID', 9, '2026-01-12', 148.33, 'Spain'),
(10256, 'BONAP', 3, '2026-01-15', 13.97, 'France'),
(10257, 'BOTTM', 4, '2026-01-16', 81.91, 'Canada');

CREATE TABLE OrderDetails (
  OrderDetailID INTEGER PRIMARY KEY AUTOINCREMENT,
  OrderID INTEGER,
  ProductID INTEGER,
  UnitPrice REAL,
  Quantity INTEGER,
  Discount REAL DEFAULT 0,
  FOREIGN KEY (OrderID) REFERENCES Orders (OrderID),
  FOREIGN KEY (ProductID) REFERENCES Products (ProductID)
);

INSERT INTO OrderDetails (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES
(10248, 1, 14.00, 12, 0),
(10248, 4, 9.80, 10, 0),
(10249, 14, 4.50, 40, 0.05),
(10250, 10, 21.00, 35, 0.15),
(10250, 11, 38.00, 15, 0.15),
(10251, 2, 19.00, 6, 0.05),
(10252, 6, 30.00, 40, 0.05),
(10253, 7, 40.00, 25, 0),
(10254, 8, 97.00, 15, 0.10),
(10255, 12, 21.00, 20, 0),
(10256, 13, 9.00, 12, 0),
(10257, 15, 14.00, 15, 0.10);
`,
    starterQuery: `-- Northwind Revenue Analysis by Product & Category
SELECT 
    c.CategoryName,
    p.ProductName,
    p.UnitPrice,
    p.UnitsInStock,
    ROUND(p.UnitPrice * p.UnitsInStock, 2) AS InventoryValue
FROM Products p
INNER JOIN Categories c ON p.CategoryID = c.CategoryID
WHERE p.UnitsInStock > 15
ORDER BY InventoryValue DESC;`,
  },
  {
    id: "academic",
    name: "GardiaLab Academic & Student Information System",
    description: "Higher institutions, faculties, departments, courses, matriculated students, and semester grades.",
    badge: "Higher Ed",
    tables: ["Departments", "Courses", "Lecturers", "Students", "Enrollments"],
    setupSql: `
CREATE TABLE Departments (
  DepartmentID INTEGER PRIMARY KEY,
  DepartmentName TEXT NOT NULL,
  Faculty TEXT NOT NULL,
  HOD TEXT
);

INSERT INTO Departments VALUES
(1, 'Computer Science', 'School of Computing', 'Prof. O. Balogun'),
(2, 'Data Science & AI', 'School of Computing', 'Dr. A. Adebayo'),
(3, 'Software Engineering', 'School of Computing', 'Dr. C. Okeke'),
(4, 'Economics & Analytics', 'Social Sciences', 'Prof. K. Ibrahim'),
(5, 'Statistics & Mathematics', 'Physical Sciences', 'Dr. F. Adeleke');

CREATE TABLE Lecturers (
  LecturerID INTEGER PRIMARY KEY,
  FullName TEXT NOT NULL,
  Email TEXT,
  DepartmentID INTEGER,
  Rank TEXT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

INSERT INTO Lecturers VALUES
(1, 'Dr. Amina Adebayo', 'a.adebayo@elab.edu.ng', 2, 'Associate Professor'),
(2, 'Prof. Oluwaseun Balogun', 'o.balogun@elab.edu.ng', 1, 'Professor'),
(3, 'Dr. Chinedu Okeke', 'c.okeke@elab.edu.ng', 3, 'Senior Lecturer'),
(4, 'Dr. Fatima Adeleke', 'f.adeleke@elab.edu.ng', 5, 'Senior Lecturer'),
(5, 'Prof. Kabir Ibrahim', 'k.ibrahim@elab.edu.ng', 4, 'Professor');

CREATE TABLE Courses (
  CourseCode TEXT PRIMARY KEY,
  CourseTitle TEXT NOT NULL,
  CreditUnits INTEGER NOT NULL,
  DepartmentID INTEGER,
  Semester TEXT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

INSERT INTO Courses VALUES
('CSC301', 'Database Systems & SQL Design', 3, 1, 'First'),
('DSA305', 'Machine Learning Foundations', 4, 2, 'First'),
('DSA402', 'Data Warehousing & BI Modeling', 3, 2, 'Second'),
('SEN204', 'Object-Oriented Programming', 3, 3, 'Second'),
('STA211', 'Statistical Inference & Probability', 3, 5, 'First'),
('ECO312', 'Econometric Modeling', 3, 4, 'Second');

CREATE TABLE Students (
  MatricNo TEXT PRIMARY KEY,
  FullName TEXT NOT NULL,
  Gender TEXT,
  DepartmentID INTEGER,
  Level INTEGER,
  CGPA REAL,
  State TEXT,
  FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID)
);

INSERT INTO Students VALUES
('ELAB/2023/001', 'Oluwaseun Adeleke', 'M', 2, 300, 4.62, 'Lagos'),
('ELAB/2023/002', 'Chidinma Okafor', 'F', 2, 300, 4.85, 'Anambra'),
('ELAB/2023/003', 'Ibrahim Danjuma', 'M', 1, 300, 3.91, 'Kaduna'),
('ELAB/2023/004', 'Folashade Bakare', 'F', 3, 200, 4.35, 'Ogun'),
('ELAB/2023/005', 'Emeka Nwosu', 'M', 1, 400, 4.12, 'Enugu'),
('ELAB/2023/006', 'Aisha Mohammed', 'F', 4, 300, 4.70, 'Kano'),
('ELAB/2023/007', 'Temitope Ojo', 'M', 5, 200, 3.84, 'Ondo'),
('ELAB/2023/008', 'Blessing Eze', 'F', 2, 400, 4.90, 'Delta');

CREATE TABLE Enrollments (
  EnrollmentID INTEGER PRIMARY KEY AUTOINCREMENT,
  MatricNo TEXT,
  CourseCode TEXT,
  Score INTEGER,
  Grade TEXT,
  AcademicSession TEXT,
  FOREIGN KEY (MatricNo) REFERENCES Students(MatricNo),
  FOREIGN KEY (CourseCode) REFERENCES Courses(CourseCode)
);

INSERT INTO Enrollments (MatricNo, CourseCode, Score, Grade, AcademicSession) VALUES
('ELAB/2023/001', 'CSC301', 84, 'A', '2025/2026'),
('ELAB/2023/001', 'DSA305', 78, 'A', '2025/2026'),
('ELAB/2023/002', 'CSC301', 92, 'A', '2025/2026'),
('ELAB/2023/002', 'DSA305', 89, 'A', '2025/2026'),
('ELAB/2023/003', 'CSC301', 65, 'B', '2025/2026'),
('ELAB/2023/004', 'SEN204', 74, 'A', '2025/2026'),
('ELAB/2023/005', 'CSC301', 71, 'A', '2025/2026'),
('ELAB/2023/006', 'ECO312', 88, 'A', '2025/2026'),
('ELAB/2023/007', 'STA211', 69, 'B', '2025/2026'),
('ELAB/2023/008', 'DSA305', 95, 'A', '2025/2026'),
('ELAB/2023/008', 'CSC301', 91, 'A', '2025/2026');
`,
    starterQuery: `-- Student Performance & Departmental Ranking
SELECT 
    s.MatricNo,
    s.FullName,
    d.DepartmentName,
    s.Level,
    s.CGPA,
    RANK() OVER (PARTITION BY s.DepartmentID ORDER BY s.CGPA DESC) AS DepartmentRank
FROM Students s
JOIN Departments d ON s.DepartmentID = d.DepartmentID
ORDER BY s.CGPA DESC;`,
  },
  {
    id: "fintech",
    name: "Fintech Banking & Digital Ledger",
    description: "Account ledgers, customer wallets, transactions, transfers, balances, and payment channels.",
    badge: "Fintech Ledger",
    tables: ["Accounts", "Transactions", "Merchants"],
    setupSql: `
CREATE TABLE Accounts (
  AccountID INTEGER PRIMARY KEY,
  AccountNumber TEXT UNIQUE NOT NULL,
  AccountName TEXT NOT NULL,
  AccountType TEXT NOT NULL,
  Balance REAL NOT NULL,
  State TEXT,
  Tier INTEGER DEFAULT 1,
  CreatedAt TEXT
);

INSERT INTO Accounts VALUES
(1, '0129845612', 'Boluwatife Johnson', 'Savings', 142500.50, 'Lagos', 3, '2025-03-10'),
(2, '0245198273', 'Kazeem Oladimeji', 'Current', 485000.00, 'Ogun', 3, '2025-01-15'),
(3, '0398214561', 'Ngozi Okonjo', 'Savings', 87200.25, 'Abuja', 2, '2025-06-20'),
(4, '0451298374', 'Aliyu Bello', 'Savings', 31500.00, 'Kano', 1, '2025-09-01'),
(5, '0519283746', 'Amara Chigozie', 'Current', 920400.00, 'Rivers', 3, '2025-02-18'),
(6, '0698124537', 'Ubasify AI Enterprise', 'Corporate', 2450000.00, 'Lagos', 3, '2024-11-05');

CREATE TABLE Merchants (
  MerchantID INTEGER PRIMARY KEY,
  MerchantName TEXT NOT NULL,
  Category TEXT NOT NULL,
  City TEXT
);

INSERT INTO Merchants VALUES
(1, 'Jumia Superstore', 'Retail', 'Lagos'),
(2, 'GardiaLab Academy', 'Education & EdTech', 'Ikeja'),
(3, 'Konga Online', 'E-Commerce', 'Lagos'),
(4, 'Eko Electricity', 'Utilities', 'Lagos'),
(5, 'OPay Fast Food', 'Food & Dining', 'Abuja');

CREATE TABLE Transactions (
  TxID INTEGER PRIMARY KEY AUTOINCREMENT,
  AccountNumber TEXT,
  MerchantID INTEGER,
  Amount REAL NOT NULL,
  TxType TEXT NOT NULL,
  Channel TEXT NOT NULL,
  Status TEXT NOT NULL,
  TxDate TEXT NOT NULL,
  FOREIGN KEY (AccountNumber) REFERENCES Accounts (AccountNumber),
  FOREIGN KEY (MerchantID) REFERENCES Merchants (MerchantID)
);

INSERT INTO Transactions (AccountNumber, MerchantID, Amount, TxType, Channel, Status, TxDate) VALUES
('0129845612', 2, 3500.00, 'Debit', 'Web Transfer', 'Successful', '2026-02-01 10:14:22'),
('0245198273', 2, 12000.00, 'Debit', 'Card', 'Successful', '2026-02-01 11:32:05'),
('0398214561', 1, 15400.00, 'Debit', 'USSD', 'Successful', '2026-02-02 08:22:40'),
('0129845612', NULL, 50000.00, 'Credit', 'Bank Deposit', 'Successful', '2026-02-02 14:10:12'),
('0519283746', 3, 62000.00, 'Debit', 'Web Transfer', 'Successful', '2026-02-02 16:45:00'),
('0451298374', 4, 8500.00, 'Debit', 'Mobile App', 'Successful', '2026-02-03 09:05:14'),
('0698124537', NULL, 250000.00, 'Credit', 'NIP Transfer', 'Successful', '2026-02-03 12:40:00'),
('0245198273', 5, 4200.00, 'Debit', 'POS', 'Successful', '2026-02-03 18:22:19'),
('0398214561', 2, 3500.00, 'Debit', 'Card', 'Successful', '2026-02-04 07:44:11');
`,
    starterQuery: `-- Daily Transaction Volume & High-Value Payments
SELECT 
    DATE(t.TxDate) AS TransactionDate,
    t.Channel,
    COUNT(*) AS TotalTransactions,
    ROUND(SUM(t.Amount), 2) AS TotalVolume,
    ROUND(AVG(t.Amount), 2) AS AverageTicket
FROM Transactions t
WHERE t.Status = 'Successful'
GROUP BY DATE(t.TxDate), t.Channel
ORDER BY TransactionDate DESC, TotalVolume DESC;`,
  },
];

// 2. Practice SQL Query Templates (Curriculum Topics)
export interface SqlTemplate {
  name: string;
  category: "Basics" | "Aggregation" | "Joins" | "Advanced / T-SQL" | "Window Functions" | "DDL";
  description: string;
  query: string;
}

export const SQL_TEMPLATES: SqlTemplate[] = [
  {
    name: "1. Simple SELECT & WHERE Filter",
    category: "Basics",
    description: "Filters rows based on conditions and column projection.",
    query: `-- Basic SELECT with multiple WHERE conditions and ORDER BY
SELECT 
    ProductID,
    ProductName,
    UnitPrice,
    UnitsInStock
FROM Products
WHERE UnitPrice >= 20.00 
  AND UnitsInStock > 0
ORDER BY UnitPrice DESC;`,
  },
  {
    name: "2. Pattern Matching with LIKE & Wildcards",
    category: "Basics",
    description: "Search text using SQL LIKE and wildcards (% and _).",
    query: `-- Find all customers from Germany or UK with 'London' or 'Berlin'
SELECT CustomerID, CompanyName, ContactName, City, Country
FROM Customers
WHERE Country IN ('Germany', 'UK', 'France')
  AND (City LIKE '%erlin%' OR City LIKE 'London%')
ORDER BY Country, City;`,
  },
  {
    name: "3. Multi-Table INNER JOIN",
    category: "Joins",
    description: "Combines data from multiple related tables on primary/foreign keys.",
    query: `-- Customer Orders with Employee Rep details
SELECT 
    o.OrderID,
    c.CompanyName AS Customer,
    e.FirstName || ' ' || e.LastName AS SalesRep,
    o.OrderDate,
    o.ShipCountry,
    o.Freight
FROM Orders o
INNER JOIN Customers c ON o.CustomerID = c.CustomerID
INNER JOIN Employees e ON o.EmployeeID = e.EmployeeID
ORDER BY o.OrderDate DESC;`,
  },
  {
    name: "4. Aggregations (GROUP BY & HAVING)",
    category: "Aggregation",
    description: "Calculate SUM, AVG, COUNT, MIN, MAX per category with HAVING filter.",
    query: `-- Products per Category with average prices and inventory value
SELECT 
    c.CategoryName,
    COUNT(p.ProductID) AS TotalProducts,
    ROUND(AVG(p.UnitPrice), 2) AS AvgUnitPrice,
    SUM(p.UnitsInStock) AS TotalStock,
    ROUND(SUM(p.UnitPrice * p.UnitsInStock), 2) AS TotalInventoryValue
FROM Categories c
LEFT JOIN Products p ON c.CategoryID = p.CategoryID
GROUP BY c.CategoryID, c.CategoryName
HAVING COUNT(p.ProductID) > 1
ORDER BY TotalInventoryValue DESC;`,
  },
  {
    name: "5. Common Table Expression (CTE / WITH clause)",
    category: "Advanced / T-SQL",
    description: "Creates temporary named result sets for cleaner queries.",
    query: `-- Common Table Expression (CTE) to find high-value orders
WITH OrderTotals AS (
    SELECT 
        od.OrderID,
        ROUND(SUM(od.UnitPrice * od.Quantity * (1.0 - od.Discount)), 2) AS OrderTotal,
        COUNT(od.ProductID) AS ItemCount
    FROM OrderDetails od
    GROUP BY od.OrderID
)
SELECT 
    ot.OrderID,
    o.CustomerID,
    o.ShipCountry,
    ot.OrderTotal,
    ot.ItemCount
FROM OrderTotals ot
JOIN Orders o ON ot.OrderID = o.OrderID
WHERE ot.OrderTotal > 200.00
ORDER BY ot.OrderTotal DESC;`,
  },
  {
    name: "6. Window Functions (ROW_NUMBER & RANK)",
    category: "Window Functions",
    description: "SQL Server / ANSI Window functions: rank employees within departments.",
    query: `-- Rank employees by salary within each department
SELECT 
    EmployeeID,
    FirstName || ' ' || LastName AS FullName,
    Department,
    Salary,
    ROW_NUMBER() OVER (PARTITION BY Department ORDER BY Salary DESC) AS DeptSalaryRank,
    ROUND(AVG(Salary) OVER (PARTITION BY Department), 2) AS DeptAvgSalary,
    ROUND(Salary - AVG(Salary) OVER (PARTITION BY Department), 2) AS DiffFromDeptAvg
FROM Employees
ORDER BY Department, Salary DESC;`,
  },
  {
    name: "7. CREATE TABLE & INSERT Data (DDL / DML)",
    category: "DDL",
    description: "Creates a new table, inserts records, and queries the newly added data.",
    query: `-- Create a custom projects table and insert records
CREATE TABLE IF NOT EXISTS LabProjects (
    ProjectID INTEGER PRIMARY KEY AUTOINCREMENT,
    ProjectTitle TEXT NOT NULL,
    LeadEmployeeID INTEGER,
    Budget REAL,
    Status TEXT DEFAULT 'Planning',
    FOREIGN KEY (LeadEmployeeID) REFERENCES Employees(EmployeeID)
);

INSERT INTO LabProjects (ProjectTitle, LeadEmployeeID, Budget, Status) VALUES
('Power BI Executive Dashboard', 6, 250000.00, 'In Progress'),
('SQL Server Data Warehouse Migration', 7, 500000.00, 'Planning'),
('Customer Churn Prediction Model', 6, 180000.00, 'Completed');

SELECT * FROM LabProjects;`,
  },
];

// 3. WebAssembly sql.js Loader
export function loadSqlJs(onProgress?: (stage: string) => void): Promise<any> {
  if (sqlJsInstance) return Promise.resolve(sqlJsInstance);
  if (sqlJsLoadingPromise) return sqlJsLoadingPromise;

  onProgress?.("Loading SQL WebAssembly runtime (sql.js)...");

  sqlJsLoadingPromise = new Promise((resolve, reject) => {
    // Check if window.initSqlJs is already loaded on page
    if (typeof (window as any).initSqlJs === "function") {
      (window as any)
        .initSqlJs({
          locateFile: (file: string) =>
            `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
        })
        .then((SQL: any) => {
          sqlJsInstance = SQL;
          resolve(SQL);
        })
        .catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/sql-wasm.js";
    script.async = true;

    script.onload = () => {
      onProgress?.("Compiling WebAssembly SQL database engine...");
      if (typeof (window as any).initSqlJs === "function") {
        (window as any)
          .initSqlJs({
            locateFile: (file: string) =>
              `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
          })
          .then((SQL: any) => {
            sqlJsInstance = SQL;
            resolve(SQL);
          })
          .catch((err: any) => {
            reject(err);
          });
      } else {
        reject(new Error("initSqlJs is not defined on window"));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load sql.js WebAssembly from CDN"));
    };

    document.head.appendChild(script);
  });

  return sqlJsLoadingPromise;
}

// 4. Database Class Wrapper
export class SqlDatabaseSession {
  private db: any = null;
  private currentDatasetId: string = "northwind";

  constructor(private SQL: any) {
    this.initDatabase("northwind");
  }

  public initDatabase(datasetId: string) {
    if (this.db) {
      try {
        this.db.close();
      } catch (e) {
        // ignore
      }
    }

    this.db = new this.SQL.Database();
    this.currentDatasetId = datasetId;

    const preset = SQL_DATASETS.find((d) => d.id === datasetId) || SQL_DATASETS[0];
    if (preset && preset.setupSql) {
      this.db.run(preset.setupSql);
    }
  }

  public getCurrentDataset(): DatasetPreset {
    return (
      SQL_DATASETS.find((d) => d.id === this.currentDatasetId) || SQL_DATASETS[0]
    );
  }

  /**
   * Translates common T-SQL / SQL Server syntax to SQLite Wasm equivalents
   * e.g. SELECT TOP 10 * FROM table -> SELECT * FROM table LIMIT 10
   */
  public normalizeTSql(sqlQuery: string): { normalized: string; notices: string[] } {
    let clean = sqlQuery.trim();
    const notices: string[] = [];

    // Translate SELECT TOP <n> ... FROM <table> -> SELECT ... FROM <table> LIMIT <n>
    const topMatch = clean.match(/^SELECT\s+TOP\s+(\d+)\s+([\s\S]+)$/i);
    if (topMatch) {
      const limit = topMatch[1];
      const rest = topMatch[2];
      // If query does not already end with LIMIT, append it
      if (!/LIMIT\s+\d+/i.test(rest)) {
        clean = `SELECT ${rest} LIMIT ${limit}`;
        notices.push(`Converted SQL Server 'SELECT TOP ${limit}' to standard 'LIMIT ${limit}'`);
      }
    }

    // Replace ISNULL(a, b) with COALESCE(a, b) or IFNULL(a, b)
    if (/ISNULL\s*\(/i.test(clean)) {
      clean = clean.replace(/ISNULL\s*\(/gi, "COALESCE(");
      notices.push("Converted SQL Server 'ISNULL()' to standard 'COALESCE()'");
    }

    // Replace GETDATE() with CURRENT_TIMESTAMP
    if (/GETDATE\s*\(\s*\)/i.test(clean)) {
      clean = clean.replace(/GETDATE\s*\(\s*\)/gi, "CURRENT_TIMESTAMP");
      notices.push("Converted SQL Server 'GETDATE()' to 'CURRENT_TIMESTAMP'");
    }

    return { normalized: clean, notices };
  }

  /**
   * Executes one or more SQL queries, returning columns and values for the last SELECT
   */
  public execute(rawSql: string): QueryResult {
    if (!this.db) throw new Error("Database is not initialized");

    const startTime = performance.now();
    const { normalized } = this.normalizeTSql(rawSql);

    // Run query
    const results = this.db.exec(normalized);
    const endTime = performance.now();
    const executionTimeMs = Math.round((endTime - startTime) * 100) / 100;

    if (!results || results.length === 0) {
      // Query was a DDL/DML like CREATE, INSERT, UPDATE, DELETE with no result rows
      let rowsAffected = 0;
      try {
        const rowCountRes = this.db.exec("SELECT changes() AS affected;");
        if (rowCountRes?.[0]?.values?.[0]?.[0] !== undefined) {
          rowsAffected = rowCountRes[0].values[0][0];
        }
      } catch (e) {
        // ignore
      }

      return {
        columns: ["Status", "Details"],
        values: [
          [
            "✓ Query executed successfully",
            rowsAffected > 0 ? `${rowsAffected} rows affected` : "Command completed",
          ],
        ],
        executionTimeMs,
        rowsAffected,
      };
    }

    // Return the last statement's result
    const lastResult = results[results.length - 1];
    return {
      columns: lastResult.columns,
      values: lastResult.values,
      executionTimeMs,
      rowsAffected: lastResult.values.length,
    };
  }

  /**
   * Returns schema introspection info for all user tables in the database
   */
  public getSchema(): TableSchema[] {
    if (!this.db) return [];

    try {
      const tablesRes = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
      );
      if (!tablesRes || tablesRes.length === 0) return [];

      const tableNames: string[] = tablesRes[0].values.map((row: any) => row[0]);
      const schemas: TableSchema[] = [];

      for (const tName of tableNames) {
        const pragmaRes = this.db.exec(`PRAGMA table_info("${tName}");`);
        const countRes = this.db.exec(`SELECT COUNT(*) FROM "${tName}";`);

        const columns: TableColumn[] = (pragmaRes?.[0]?.values || []).map((c: any) => ({
          cid: c[0],
          name: c[1],
          type: c[2] || "TEXT",
          notnull: c[3],
          dflt_value: c[4],
          pk: c[5],
        }));

        const rowCount = countRes?.[0]?.values?.[0]?.[0] ?? 0;

        schemas.push({
          name: tName,
          columns,
          rowCount,
        });
      }

      return schemas;
    } catch (e) {
      console.error("Failed to inspect schema", e);
      return [];
    }
  }

  /**
   * Imports a CSV string as a newly created table
   */
  public importCsv(tableName: string, csvContent: string): { rowsImported: number } {
    if (!this.db) throw new Error("Database not ready");

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header and one data row.");
    }

    const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, "_");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").replace(/[^a-zA-Z0-9_]/g, "_"));

    // Detect column types from line 1
    const firstRowValues = lines[1].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const colDefs = headers.map((h, i) => {
      const val = firstRowValues[i] || "";
      if (/^-?\d+$/.test(val)) return `"${h}" INTEGER`;
      if (/^-?\d+\.\d+$/.test(val)) return `"${h}" REAL`;
      return `"${h}" TEXT`;
    });

    this.db.run(`DROP TABLE IF EXISTS "${cleanTableName}";`);
    this.db.run(`CREATE TABLE "${cleanTableName}" (${colDefs.join(", ")});`);

    const placeholders = headers.map(() => "?").join(", ");
    const insertStmt = this.db.prepare(
      `INSERT INTO "${cleanTableName}" (${headers.map((h) => `"${h}"`).join(", ")}) VALUES (${placeholders})`
    );

    let rowsImported = 0;
    for (let r = 1; r < lines.length; r++) {
      const rowVals = lines[r].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      if (rowVals.length === headers.length) {
        insertStmt.run(rowVals);
        rowsImported++;
      }
    }
    insertStmt.free();

    return { rowsImported };
  }

  /**
   * Exports the entire database to a Uint8Array binary file
   */
  public exportDatabaseFile(): Uint8Array {
    if (!this.db) throw new Error("Database not ready");
    return this.db.export();
  }
}

