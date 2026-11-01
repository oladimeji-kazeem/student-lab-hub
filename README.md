# e-Lab

**e-Lab** is an online cloud coding and interactive lab platform tailored for Nigerian higher institutions (Universities, Polytechnics, and Colleges of Education), researchers, lecturers, and non-academic professionals. It allows users to write, execute, and export Python, R, and Jupyter notebooks online, as well as access a full VS Code workspace with zero local configuration.

## Key Features

- **Multi-Role User Onboarding**:
  - **Student**: Requires University, Department (from dropdown menu), Course of Study, and Degree Level.
  - **Lecturer**: Requires University, Department (from dropdown menu), and Academic Title.
  - **Non-Academic**: Requires Current Role, Employer / Organization (selected from managed organizations dropdown or custom), and Nigerian State of Residence.
- **Dynamic Database Architecture (Zero Hardcoding)**:
  - All catalog data feeds dynamically from database tables (Supabase PostgreSQL) with reactive client-side store sync.
  - **Admin Catalog CRUD**: Privileged administrators can create, edit, and delete:
    - Higher Institutions (with Nigerian State location, category, short name)
    - Academic Departments (with faculty classification)
    - Courses of Study (with faculty mapping)
    - Nigerian States (all 36 States + FCT Abuja with geopolitical zones)
    - Organizations & Employers (where non-academic professionals pick from, with industry sector, headquarter state, registered staff counts, and website)
- **Web Analytics & Nigerian State Telemetry**:
  - **Nigerian State Access Leaderboard**: Track user traffic and code executions by Nigerian State of access (Lagos, Oyo, Kaduna, Abuja FCT, Rivers, etc.).
  - **Real-Time Campus Telemetry Stream**: Live logs tagged with exact Nigerian state of access and user role.
  - Device, browser, and platform breakdown (Mobile, Tablet, Desktop).
  - Lab kernel execution breakdown (Notebook, Python, R, VS Code).
- **Native CodeMirror 6 Code Editor**:
  - Replaced basic `<textarea>` with modern CodeMirror 6 editors featuring syntax highlighting for Python (`@codemirror/lang-python`) and R (`@codemirror/legacy-modes`), line numbering, code folding, autocompletion (`@codemirror/autocomplete`), matching brackets, and custom e-Lab dark theme.
  - Keyboard shortcuts: `Ctrl+Enter` / `Cmd+Enter` to run code immediately.
- **WASM Runtime Loading States & Progress Feedback**:
  - Direct progress feedback and animated spinners on the `▶ Run` buttons during initial WebAssembly asset downloads (~10MB Pyodide and WebR binary chunks).
  - Informative stage banners reporting network fetch, virtual machine initialization, and package resolution.
- **Responsive Mobile Sliding Drawer Navigation**:
  - Collapsible slide-over drawer navigation with smooth CSS transitions, backdrop dismissal, touch targets, and `Escape` key listeners for effortless use on smartphones and tablets.
- **Interactive Jupyter Notebook**:
  - Run Python & R cells interactively in the browser.
  - Multi-format exports: `.ipynb` (official Jupyter format), `.py` (Python script), `.R` (R script), and `.RData` / `.rda` (R workspace binary image).
- **Python Lab**: In-browser Python 3 scientific computing powered by WebAssembly (Pyodide).
- **R Statistical Lab**: Interactive R runtime powered by WebR for statistics and coursework.
- **VS Code Online**: Full in-browser editor with multi-file workspace and project exports.
- **Nigerian Banking & Naira (₦) Currency**: Bank transfer support via Nigerian commercial and digital banks (GTBank, Zenith, Access, First Bank, UBA, Kuda, OPay, Moniepoint) using 10-digit NUBAN account numbers.
- **Device-Friendly Design**: 100% mobile-responsive layout with responsive slide-over drawer menu, bottom quick navigation bar, touch-friendly controls, and horizontal scroll tables.
- **Color Theme**: Glassmorphism with Navy Blue (`#071E5D`), Teal (`#189B9B`), Lemon Green (`#81B825`), and off-white.

## Development

```sh
npm install
npm run dev
```

Run test suite:

```sh
npm run test
```

## Database Schema

Supabase PostgreSQL schema and migration script with complete Nigerian institutions, departments, courses, and states catalog is located in:
`supabase/schema.sql`
