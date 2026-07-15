# HR Management System

## 1. Project Description
A comprehensive HR Management System for managing 10 branches under a main office. The system provides a centralized dashboard for HR administrators to handle employee onboarding, leave requests, payroll overview, and access various HR modules including IT management, finance, hiring, offboarding, org charts, tools, benefits, and settings.

**Target Users**: HR administrators, managers, and department heads across multiple branches.

**Core Value**: Streamline HR operations across branches with real-time analytics, centralized employee data, and quick administrative actions.

## 2. Page Structure
- `/` — Dashboard (Home) — Main dashboard with all 6 core sections
- `/employees` — Employee Directory
- `/onboarding` — Employee Onboarding
- `/leave` — Leave Requests
- `/payroll` — Payroll Overview
- `/payroll-module` — Full Payroll Module
- `/finance` — Finance Management
- `/it-management` — IT Management
- `/hire` — Recruitment & Hiring
- `/offboard` — Offboarding
- `/org-chart` — Organization Chart
- `/tools` — HR Tools
- `/benefits` — Benefits Administration
- `/settings` — System Settings
- `/unity-apps` — Unity Apps Integration
- `/notifications` — Notifications Center
- `/analytics` — Analytics Dashboard
- `/branches` — Branch Management

## 3. Core Features
- [x] Dashboard with real-time metrics, onboarding pipeline, leave requests, payroll overview
- [x] Employee onboarding workflow with approval pipeline
- [x] Leave request management with auto-approval queue
- [x] Payroll overview with monthly stats and charts
- [x] Notifications center for alerts and updates
- [x] Analytics charts for workforce trends
- [x] Quick-access shortcuts for administrative actions
- [x] Branch management (10 branches + main office)
- [x] Employee directory and search
- [x] IT asset management
- [x] Finance expense tracking
- [x] Recruitment pipeline (Hire)
- [x] Offboarding workflow
- [x] Organization chart viewer
- [x] Benefits administration
- [x] System settings and configurations

## 4. Data Model Design

### Table: branches
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | text | Branch name |
| location | text | City / address |
| manager_id | uuid | Branch manager |
| employee_count | int | Current employee count |
| status | text | active / inactive |
| created_at | timestamp |  |

### Table: employees
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| first_name | text |  |
| last_name | text |  |
| email | text |  |
| phone | text |  |
| branch_id | uuid | FK to branches |
| department | text | Department name |
| role | text | Job title |
| status | text | active / onboarding / offboarding / leave |
| join_date | date |  |
| avatar_url | text | Profile photo |
| created_at | timestamp |  |

### Table: onboarding_requests
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | FK to employees |
| branch_id | uuid | FK to branches |
| stage | text | document / it_setup / training / complete |
| day_count | int | Days in onboarding |
| status | text | pending / approved / completed |
| requested_by | text |  |
| created_at | timestamp |  |

### Table: leave_requests
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | FK to employees |
| leave_type | text | vacation / sick / personal / maternity |
| start_date | date |  |
| end_date | date |  |
| days | int | Number of days |
| status | text | pending / approved / rejected |
| reason | text |  |
| created_at | timestamp |  |

### Table: payroll_records
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | FK to employees |
| month | text | e.g., "2026-05" |
| base_salary | numeric |  |
| bonus | numeric |  |
| deductions | numeric |  |
| net_pay | numeric |  |
| status | text | pending / processed / paid |
| created_at | timestamp |  |

### Table: notifications
| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| title | text |  |
| message | text |  |
| type | text | info / warning / success |
| is_read | boolean |  |
| created_at | timestamp |  |

## 5. Backend / Third-party Integration Plan
- **Supabase**: Database for all HR data, Auth for user authentication
- **Recharts**: Client-side analytics charts
- **No Shopify needed** — internal HR system
- **No Stripe needed** — internal HR system

## 6. Development Phase Plan

### Phase 1: Core Layout & Dashboard ✅
- Goal: Build the main app layout with sidebar navigation, top bar, and the full dashboard with all 6 core sections
- Deliverable: Dashboard page with real-time metrics, onboarding pipeline, leave requests table, payroll overview, notifications, analytics charts, and quick-access shortcuts

### Phase 2: Database & Data Layer ✅
- Goal: Set up Supabase tables with demo data for branches, employees, onboarding, leave, payroll, and notifications
- Deliverable: All tables populated with realistic demo data for 10 branches

### Phase 3: Supporting Module Pages ✅
- Goal: Build stub pages for Payroll, Finance, IT Management, Hire, Off board, Org Chart, Tools, Benefits, Settings, Unity Apps
- Deliverable: All 10+ module pages with consistent layout and realistic placeholder content

### Phase 4: Employee & Branch Management ✅
- Goal: Build employee directory, branch management, and detail pages
- Deliverable: Employee listing with search/filter, branch cards, employee profile view

### Phase 5: Advanced Features ✅
- Goal: Add full onboarding workflow, leave approval system, org chart visualization, and notification center
- Deliverable: Interactive workflows for core HR processes

### Phase 6: Deep Features & Drill-Down Pages ✅
- Goal: Add candidate detail views, real-time dashboard, employee profile pages
- Deliverable: Full candidate profiles, live stats dashboard, editable employee profiles with reporting line

### Phase 7: Advanced Pages & Real Data ✅
- Goal: Upgrade remaining static pages to use real Supabase data with full CRUD
- Deliverable:
  - **Offboarding**: Real offboarding_requests + offboarding_tasks tables, task checklists, status pipeline, employee linking, create offboarding flow
  - **IT Management**: Real it_assets + it_tickets tables, asset registry with employee/branch linking, ticket workflow (open → in_progress → resolved → closed), security policies
  - **Finance**: Real expense_records table, category spending breakdown, approval workflow (pending → approved → paid), filters
  - **Benefits**: Real benefit_plans + benefit_enrollments tables, enrollment management, provider directory, enrollment rate tracking

### Phase 8: Polish & Final Integrations ✅
- Goal: Upgrade Tools, Unity Apps, Settings, Notifications to real data, add search and advanced filtering
- Deliverable:
  - **Global System-Wide Search** in TopBar: Searches employees by name/role/department, candidates by name/position, and all 22 HR modules by keyword. Results grouped by category (Employees, Candidates, Modules) in a live dropdown. Debounced 280ms. Keyboard-friendly with close button.
  - **Settings fully connected** to real `system_settings` Supabase table (general config, notification toggles). Branches tab now pulls live data from `branches` table with real employee counts and status badges.
  - **Notifications** fully real-time with Supabase subscriptions (INSERT/UPDATE/DELETE). Filter by type and source module.
  - **Tools** connected to real `tools`, `tool_assignments`, `tool_usages` tables. Full access management with grant/revoke, usage activity feed.

### Phase 9: Reports, Audit & Self-Service ✅
- Goal: Add reporting/export center, system-wide audit trail, and employee self-service portal
- Deliverable:
  - **Reports & Export Center** (`/reports`): 5 report types (leave, payroll, headcount, expenses, hire pipeline). Date range filters, quick presets (This Month, Last Month, Q1/Q2, YTD, All Time). Live data preview table with summary stat cards. CSV download (manual string generation) and PDF export (print window). Per-module export with timestamped filenames.
  - **Activity Audit Log** (`/audit-log`): New `audit_logs` table with 25 seeded events across all HR modules. Real-time Supabase subscriptions for INSERT with live badge + new-event counter. Module filter (13 modules), action filter, date range, full-text search. Expandable metadata panel per entry. Module-activity stat cards. CSV export. Timeline-style feed.
  - **Employee Self-Service** (`/self-service`): Employee picker switcher for admin-side preview. 3 tabs — My Payslips (with print/download per payslip), My Leave (request history + inline submit form with day calc), My Benefits (enrolled plans with coverage detail + plan enrollment modal).