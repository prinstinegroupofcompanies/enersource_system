# Enersource ERP — Phased Delivery Plan

## Phase 1 — Foundation ✅

**User Management & RBAC**

- Login, logout, session refresh
- MFA (TOTP)
- Password policy, lockout
- 11 system roles with module permissions
- 9 departments
- Admin user CRUD
- Profile & password change
- Audit log model and **Audit Trail UI** (`/audit`)
- Notification center
- Responsive app shell (sidebar, header, dashboard)

---

## Phase 2 — Financial Management ✅

- Chart of accounts (full solar COA taxonomy, import, CRUD)
- General journal (debit/credit, submit, approve, post, reverse, cancel)
- General ledger (daily/monthly/quarterly/annual, drill-down)
- Trial balance with auto-balance checks and error alerts
- Income statement, balance sheet, cash flow
- CSV export (ledger, trial balance)

---

## Phase 3 — Sales & Revenue ✅

- Customers, quotations (convert to orders), sales orders
- Contracts, invoices (send, payments, recurring flag)
- Accounts receivable aging & customer balances
- Accounts payable (suppliers, vendor bills)
- Sales dashboard KPIs & targets

---

## Phase 4 — Inventory ✅

- Warehouses and solar SKU catalog (6 default categories)
- Stock balances, receipts, issues, adjustments
- Inter-warehouse transfers with completion workflow
- Valuation, low-stock alerts, movement history

---

## Phase 5 — Procurement & Petty Cash ✅

- 5-step requisition workflow (staff → supervisor → finance → management → procurement)
- Payment requests with file attachments and approval chain
- Petty cash funds, expenses, allocations, reimbursements, daily/monthly reports

---

## Phase 6 — Projects ✅

- Solar installation / maintenance / engineering projects
- Tasks, milestones, budget tracking, material usage (optional stock issue from MAIN warehouse)
- Project dashboard KPIs (active, delayed, budget performance)

---

## Phase 7 — CRM ✅

- Lead capture with sources, stages, and estimated value
- Visual sales pipeline (New → Negotiation)
- Client directory with sales/project activity counts
- Activity log (calls, emails, meetings, site visits)
- Follow-up reminders with overdue tracking
- Lead-to-client conversion

---

## Phase 8 — HR ✅

- Employee records (linked optionally to system users)
- Daily attendance tracking (present, absent, late, remote)
- KPI assignment with progress and approval workflow
- Performance appraisals with ratings and goals

---

## Phase 9 — Communication & Documents ✅

- Staff messaging with department, general, and announcement channels
- Channel access scoped by user department
- Document archive with categories and full version history
- File upload with authenticated download

---

## Phase 10 — Assets & Support ✅

- Fixed asset registry with straight-line depreciation and book value
- Batch depreciation run for finance approval
- Internal and customer support tickets with priorities and comments

---

## Phase 11 — Reporting & BI ✅

- Centralized reporting hub aggregating finance, sales, inventory, projects, HR, CRM, and support
- Role-specific analytics dashboards with KPI cards and revenue trend charts
- Financial and operational report bundles with deep links to module reports
- CSV export of executive summary metrics
- Optional Power BI embed via `POWER_BI_EMBED_URL`

---

## Deliverables Checklist (Full Program)

1. Complete ERP system  
2. Financial accounting module  
3. Inventory module  
4. HR module  
5. CRM module  
6. Procurement module  
7. Project management module  
8. Document management  
9. Asset management  
10. Reporting & analytics  
11. Mobile-responsive interface  
12. Security & audit framework  
13. User manuals  
14. Administrator training guide  
15. Deployment documentation  
