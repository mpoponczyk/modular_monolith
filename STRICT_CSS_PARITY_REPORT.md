# STRICT UI/UX PARITY AUDIT - EVIDENCE MODE

## 1. Summary Table

| App | Verdict | Layout | Actions | CSS | Nav | Confidence |
|---|---|---|---|---|---|---|
| ferry-booking/ferries | PARTIAL | 2/2 | 1/2 | 0/2 | 2/2 | 63% |
| ferry-booking/services | PARTIAL | 2/2 | 1/2 | 0/2 | 2/2 | 63% |
| ferry-booking/trips | FAIL | 1/2 | 0/2 | 0/2 | 0/2 | 13% |
| ferry-booking/reservations | FAIL | 2/2 | 0/2 | 0/2 | 0/2 | 25% |
| ferry-booking/orders | PARTIAL | 2/2 | 1/2 | 0/2 | 2/2 | 63% |
| ferry-booking/invoices | PARTIAL | 2/2 | 2/2 | 0/2 | 2/2 | 75% |
| ferry-booking/routes | PARTIAL | 2/2 | 2/2 | 0/2 | 1/2 | 63% |
| ferry-planning/calendar | PARTIAL | 2/2 | 2/2 | 0/2 | 2/2 | 75% |
| ferry-planning/templates | PARTIAL | 1/2 | 2/2 | 0/2 | 1/2 | 50% |
| ferry-planning/gantt | PARTIAL | 2/2 | 1/2 | 0/2 | 2/2 | 63% |
| ferry-pricing/profiles | MATCH | 2/2 | 2/2 | 2/2 | 2/2 | 0% |
| ferry-pricing/routes | PARTIAL | 1/2 | 1/2 | 0/2 | 1/2 | 38% |
| crm/partners | PARTIAL | 1/2 | 1/2 | 0/2 | 1/2 | 38% |
| crm/customers | PARTIAL | 2/2 | 2/2 | 0/2 | 1/2 | 63% |
| ferry-reporting/manifests | MATCH | 2/2 | 2/2 | 2/2 | 2/2 | 0% |
| ferry-reporting/sales | PARTIAL | 2/2 | 2/2 | 0/2 | 2/2 | 75% |
| core-admin/users | PARTIAL | 2/2 | 1/2 | 0/2 | 1/2 | 50% |
| core-admin/roles | PARTIAL | 2/2 | 1/2 | 0/2 | 1/2 | 50% |
| core-admin/sessions | PARTIAL | 1/2 | 2/2 | 0/2 | 2/2 | 63% |
| core-admin/settings | PARTIAL | 2/2 | 1/2 | 0/2 | 2/2 | 63% |
| core-admin/cockpits | PARTIAL | 2/2 | 1/2 | 0/2 | 2/2 | 63% |
| core-admin/planning | PARTIAL | 2/2 | 0/2 | 0/2 | 1/2 | 38% |
| example-dashboard | MATCH | 2/2 | 2/2 | 2/2 | 2/2 | 0% |

## 2. Detailed Per-App Audit

------------------------------------------------------
APP: ferry-booking/ferries
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/ferries/index.ts
- Current UI Path: src/modules/ferry-booking/ferries/ui
- Legacy UI Path: src/app/admin/ferries

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Table
- Dialogs: Add New Ferry
- Buttons/Actions: {loading ?  : }
                Add Zone, {loading ?  : }, Add Ferry, save changes
- Key Inputs: name, capacity, capacity_passengers, capacity_bikes, capacity_pets

**Current Blueprint:**
- Layout type: Table
- Dialogs: Add New Ferry
- Buttons/Actions: Add Ferry, {isPending ? "Saving..." : "save changes"}
- Key Inputs: name, capacity_pax, capacity_cars
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-4, gap-3, gap-6, py-8, gap-2
  - Colors: bg-red-50, border-red-200
- Current Tokens: 
  - Spacing: gap-2, gap-4, py-4, gap-1, p-6
  - Colors: bg-red-600
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 4, Cur: 2); Major styling drift


------------------------------------------------------
APP: ferry-booking/services
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/services/index.ts
- Current UI Path: src/modules/ferry-booking/services/ui
- Legacy UI Path: src/app/admin/services

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: Cancel
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: p-8
  - Colors: 
- Current Tokens: 
  - Spacing: p-6, mb-6, p-12, mb-4, gap-2
  - Colors: bg-blue-600, bg-white, shadow, bg-gray-100, bg-gray-300
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 0, Cur: 1); Major styling drift


------------------------------------------------------
APP: ferry-booking/trips
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/trips/index.ts
- Current UI Path: src/modules/ferry-booking/trips/ui
- Legacy UI Path: src/app/admin/trips

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: Apply Schedule Template, {t('admin.trips.scheduleTrip')}, Edit Trip, Regenerate Schedule
- Buttons/Actions: {t('admin.trips.applyTemplate')}, Schedule Trip, {t('admin.trips.scheduleTrip')}, {loading ?  : }, Update Trip, setIsEditing(false)}>, Regenerate
- Key Inputs: start_date, end_date, departure_time

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: {isPending ? 'Scheduling...' : 'Schedule Trip'}, {isPending ? 'Saving...' : 'Save Changes'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2, gap-4, py-4, p-2, p-3
  - Colors: bg-red-50, border-blue-200, border-orange-200
- Current Tokens: 
  - Spacing: p-6, mb-6, mb-1, p-2, gap-4
  - Colors: bg-card, shadow, bg-background, bg-primary, bg-muted
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **FAIL**
- Missing/Drift: Table Layout differs; Missing / Extra actions; Major styling drift; Dialog/Modal disparity


------------------------------------------------------
APP: ferry-booking/reservations
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/reservations/index.ts
- Current UI Path: src/modules/ferry-booking/reservations/ui
- Legacy UI Path: src/app/admin/reservations

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Table
- Dialogs: Create Reservation, Edit Reservation
- Buttons/Actions: New Reservation, Create Reservation, Save Changes, {isPending ? "Updating..." : "Search"}, Columns
- Key Inputs: customer_email, count_passengers, count_bikes, phone_number, customer_first_name, customer_last_name

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2, gap-4, py-4, mt-2, px-3
  - Colors: border-input, bg-background, ring-offset-background, bg-yellow-50, bg-red-600
- Current Tokens: 
  - Spacing: p-2, p-6, mb-8, p-12, mt-2
  - Colors: bg-gray-50, border-dashed, border-gray-300, shadow, ring-1
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **FAIL**
- Missing/Drift: Missing / Extra actions; Major styling drift; Dialog/Modal disparity


------------------------------------------------------
APP: ferry-booking/orders
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/orders/index.ts
- Current UI Path: src/modules/ferry-booking/orders/ui
- Legacy UI Path: src/app/admin/orders

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: Columns
- Key Inputs: 

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-1, p-0, p-4, mb-2, p-2
  - Colors: bg-white, shadow-sm, bg-gray-50, bg-slate-50, border-t
- Current Tokens: 
  - Spacing: p-6, mb-6, p-4, p-8, mb-2
  - Colors: bg-white, shadow, border-gray-200, bg-gray-50, border-b
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 1, Cur: 0); Major styling drift


------------------------------------------------------
APP: ferry-booking/invoices
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/invoices/index.ts
- Current UI Path: src/modules/ferry-booking/invoices/ui
- Legacy UI Path: src/app/admin/invoices

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2
  - Colors: 
- Current Tokens: 
  - Spacing: p-12, mt-2, mt-1, py-3.5, px-3
  - Colors: bg-gray-50, border-dashed, border-gray-300, shadow, ring-1
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Major styling drift


------------------------------------------------------
APP: ferry-booking/routes
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-booking/routes/index.ts
- Current UI Path: src/modules/ferry-booking/routes/ui
- Legacy UI Path: src/app/admin/routes

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: {mode === 'create' ? t('admin.routes.form.addTitle') : t('admin.routes.form.editTitle')}
- Buttons/Actions: {t('admin.routes.form.addTitle')}, {t('admin.routes.form.save')}
- Key Inputs: duration, is_standard

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: Create Route, {isPending ? 'Deleting...' : 'Delete'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2, gap-4, py-4
  - Colors: 
- Current Tokens: 
  - Spacing: p-6, mb-6, mb-1, p-2, py-2
  - Colors: bg-white, shadow, bg-blue-600, shadow-sm, bg-gray-100
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Major styling drift


------------------------------------------------------
APP: ferry-planning/calendar
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-planning/calendar/index.ts
- Current UI Path: src/modules/ferry-planning/calendar/ui
- Legacy UI Path: src/app/admin/calendar-visual

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: 
  - Colors: 
- Current Tokens: 
  - Spacing: mt-1, px-1, gap-6, p-4, gap-2
  - Colors: bg-gray-50, bg-blue-100, bg-white, shadow, border-b
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Major styling drift


------------------------------------------------------
APP: ferry-planning/templates
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-planning/templates/index.ts
- Current UI Path: src/modules/ferry-planning/templates/ui
- Legacy UI Path: src/app/admin/templates

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: Create Schedule Template
- Buttons/Actions: New Template, Create Template
- Key Inputs: name

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: Cancel, {isEdit ? 'Save Changes' : 'Create Template'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2, gap-4, py-4
  - Colors: 
- Current Tokens: 
  - Spacing: p-6, mb-6, px-4, py-2, p-4
  - Colors: bg-blue-600, shadow-sm, bg-white, shadow, border-gray-200
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Table Layout differs; Major styling drift


------------------------------------------------------
APP: ferry-planning/gantt
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-planning/gantt/index.ts
- Current UI Path: src/modules/ferry-planning/gantt/ui
- Legacy UI Path: src/app/admin/gantt

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: alert("Prev implementation pending")}>&lt;, alert("Next implementation pending")}>&gt;
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: 
  - Colors: 
- Current Tokens: 
  - Spacing: p-4, gap-4, gap-2, px-3, py-1
  - Colors: bg-white, shadow-sm, border-b, bg-gray-50, border-r
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 0, Cur: 2); Major styling drift


------------------------------------------------------
APP: ferry-pricing/profiles
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-pricing/profiles/index.ts
- Current UI Path: src/modules/ferry-pricing/profiles/ui
- Legacy UI Path: src/app/admin/pricing

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- UNKNOWN (Files not found)

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: Cancel, {isEdit ? 'Save Changes' : 'Create Profile'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
### STEP D - VERDICT
- Verdict: **MATCH**

------------------------------------------------------
APP: ferry-pricing/routes
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-pricing/routes/index.ts
- Current UI Path: src/modules/ferry-pricing/routes/ui
- Legacy UI Path: src/app/admin/routes

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: {mode === 'create' ? t('admin.routes.form.addTitle') : t('admin.routes.form.editTitle')}
- Buttons/Actions: {t('admin.routes.form.addTitle')}, {t('admin.routes.form.save')}
- Key Inputs: duration, is_standard

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2, gap-4, py-4
  - Colors: 
- Current Tokens: 
  - Spacing: p-6, mb-4, mb-6, p-4, px-3
  - Colors: bg-white, shadow, border-collapse, bg-gray-50, border-b
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Table Layout differs; Buttons drift (Legacy: 2, Cur: 0); Major styling drift


------------------------------------------------------
APP: crm/partners
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/crm/partners/index.ts
- Current UI Path: src/modules/crm/partners/ui
- Legacy UI Path: src/app/admin/partners

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: {partner ? 'Edit Partner' : 'Add New Business Partner'}
- Buttons/Actions: {loading ? 'Saving...' : 'Save Partner'}
- Key Inputs: name, nip, email, address, postal_code, city

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: Cancel, {isEdit ? 'Save Changes' : 'Create Partner'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-4, py-4
  - Colors: 
- Current Tokens: 
  - Spacing: p-6, mb-6, px-4, py-2, p-4
  - Colors: bg-blue-600, shadow-sm, bg-white, shadow, border-gray-200
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Table Layout differs; Buttons drift (Legacy: 1, Cur: 2); Major styling drift


------------------------------------------------------
APP: crm/customers
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/crm/customers/index.ts
- Current UI Path: src/modules/crm/customers/ui
- Legacy UI Path: src/app/admin/users

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Table
- Dialogs: {editingUser ? 'Edit User' : 'Invite New Technical User'}
- Buttons/Actions: setIsAddOpen(false)}>Cancel, {editingUser ? 'Update User' : 'Create User'}
- Key Inputs: 

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: Cancel, {isEdit ? 'Save Changes' : 'Create Customer'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: px-4, px-6, py-4, gap-3, gap-1
  - Colors: bg-blue-600, bg-white, shadow-sm, bg-slate-50, border-b
- Current Tokens: 
  - Spacing: p-6, mb-6, px-4, py-2, p-4
  - Colors: bg-blue-600, shadow-sm, bg-white, shadow, border-gray-200
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Major styling drift


------------------------------------------------------
APP: ferry-reporting/manifests
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-reporting/manifests/index.ts
- Current UI Path: src/modules/ferry-reporting/manifests/ui
- Legacy UI Path: src/app/admin/manifests

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- UNKNOWN (Files not found)

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
### STEP D - VERDICT
- Verdict: **MATCH**

------------------------------------------------------
APP: ferry-reporting/sales
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/ferry-reporting/sales/index.ts
- Current UI Path: src/modules/ferry-reporting/sales/ui
- Legacy UI Path: src/app/admin/sales

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: p-8
  - Colors: 
- Current Tokens: 
  - Spacing: gap-2, px-3, py-1, gap-6, p-6
  - Colors: bg-white, shadow-sm, bg-green-50, bg-blue-50, bg-purple-50
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Major styling drift


------------------------------------------------------
APP: core-admin/users
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/users/index.ts
- Current UI Path: src/modules/core-admin/users/ui
- Legacy UI Path: src/app/admin/users

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Table
- Dialogs: {editingUser ? 'Edit User' : 'Invite New Technical User'}
- Buttons/Actions: setIsAddOpen(false)}>Cancel, {editingUser ? 'Update User' : 'Create User'}
- Key Inputs: 

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: Manage ▾, Cancel, {isPending ? 'Inviting...' : 'Send Invite'}
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: px-4, px-6, py-4, gap-3, gap-1
  - Colors: bg-blue-600, bg-white, shadow-sm, bg-slate-50, border-b
- Current Tokens: 
  - Spacing: p-6, mb-6, px-4, py-2, p-4
  - Colors: bg-blue-600, shadow-sm, bg-white, shadow, border-gray-200
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 2, Cur: 3); Major styling drift


------------------------------------------------------
APP: core-admin/roles
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/roles/index.ts
- Current UI Path: src/modules/core-admin/roles/ui
- Legacy UI Path: src/app/admin/roles

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: {editingRole ? 'Edit Role' : 'Create New Role'}
- Buttons/Actions: setIsAddOpen(false)}>Cancel, {editingRole ? 'Update Role' : 'Create Role'}
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: Create Role, Save Changes, Cancel
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-6, mb-2, p-2, gap-1, mb-1
  - Colors: bg-blue-600, hover:shadow-md, transition-shadow, border-slate-200, bg-blue-50
- Current Tokens: 
  - Spacing: p-6, mb-6, px-4, py-2, gap-4
  - Colors: bg-blue-600, bg-white, shadow, border-gray-200, bg-gray-100
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 2, Cur: 3); Major styling drift


------------------------------------------------------
APP: core-admin/sessions
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/sessions/index.ts
- Current UI Path: src/modules/core-admin/sessions/ui
- Legacy UI Path: src/app/admin/sessions

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: p-8, mt-12
  - Colors: bg-white, border-red-100, shadow-sm
- Current Tokens: 
  - Spacing: p-6, mb-6, mb-4, p-4, p-3
  - Colors: bg-white, shadow, border-b, bg-gray-50, bg-red-100
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Table Layout differs; Major styling drift


------------------------------------------------------
APP: core-admin/settings
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/settings/index.ts
- Current UI Path: src/modules/core-admin/settings/ui
- Legacy UI Path: src/app/admin/settings

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: {t('admin.settingsPage.heatmap.default')}, {t('common.add')}
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: {loading ?  : }
                    Save Changes
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-2, gap-3, gap-4, p-3, gap-1
  - Colors: bg-slate-50/30, bg-white, shadow-sm, border-none, bg-transparent
- Current Tokens: 
  - Spacing: p-12, gap-2, px-4, py-2, p-6
  - Colors: bg-blue-600, bg-white, shadow-sm, border-b, bg-green-50
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 2, Cur: 1); Major styling drift


------------------------------------------------------
APP: core-admin/cockpits
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/cockpits/index.ts
- Current UI Path: src/modules/core-admin/cockpits/ui
- Legacy UI Path: src/app/admin/cockpits

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: New Cockpit
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: p-8
  - Colors: 
- Current Tokens: 
  - Spacing: p-6, mb-6, gap-2, mb-1, p-2
  - Colors: bg-white, shadow, bg-gray-50, bg-blue-100, border-blue-300
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Buttons drift (Legacy: 0, Cur: 1); Major styling drift


------------------------------------------------------
APP: core-admin/planning
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/planning/index.ts
- Current UI Path: src/modules/core-admin/planning/ui
- Legacy UI Path: src/app/admin/planning

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: {t('admin.planning.createDialog.title')}
- Buttons/Actions: {t('admin.planning.editor.publish')}, {t('admin.planning.editor.add')}, {t('admin.planning.newPlan')}, {t('admin.planning.createDialog.submit')}, Edit
- Key Inputs: name, start_date, end_date

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: gap-4, gap-2, gap-6, py-3, p-2
  - Colors: bg-green-600, border-blue-100, bg-blue-50, border-b, bg-slate-50/50
- Current Tokens: 
  - Spacing: p-6, gap-8, gap-2, mb-4, mt-1
  - Colors: bg-white, shadow, border-l-4, border-orange-500, bg-blue-50
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Missing / Extra actions; Major styling drift


------------------------------------------------------
APP: example-dashboard
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/example-dashboard/index.ts
- Current UI Path: src/modules/example-dashboard/ui
- Legacy UI Path: src/app/admin/test/dashboard

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- UNKNOWN (Files not found)

**Current Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
### STEP D - VERDICT
- Verdict: **MATCH**
## 3. Deep Audit: core-admin/sessions

------------------------------------------------------
APP: core-admin/sessions
------------------------------------------------------
### STEP A - ENTRYPOINTS (EVIDENCE)
- Dynamic Route Mapping: src/modules/core-admin/sessions/index.ts
- Current UI Path: src/modules/core-admin/sessions/ui
- Legacy UI Path: src/app/admin/sessions

### STEP B - UI BLUEPRINT DIFF (EVIDENCE)
**Legacy Blueprint:**
- Layout type: Standard
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 

**Current Blueprint:**
- Layout type: Table
- Dialogs: None
- Buttons/Actions: 
- Key Inputs: 
### STEP C - CSS / STYLING PARITY
- Styling System: Tailwind CSS detected in both.
- Legacy Tokens: 
  - Spacing: p-8, mt-12
  - Colors: bg-white, border-red-100, shadow-sm
- Current Tokens: 
  - Spacing: p-6, mb-6, mb-4, p-4, p-3
  - Colors: bg-white, shadow, border-b, bg-gray-50, bg-red-100
- CSS Diff Summary: MAJOR DRIFT

### STEP D - VERDICT
- Verdict: **PARTIAL**
- Missing/Drift: Table Layout differs; Major styling drift



**DEEP AUDIT - SESSIONS**

Evidence of Legacy Sessions Components used: SessionsContent

Evidence of Current Sessions Components used: SessionList

## 4. Top 5 Most Likely False-MATCHes (Or High Risk PARTIALS)
These apps show significant missing buttons or CSS drift despite having a similar structural footprint:
1. ferry-booking/trips (Missing complex legacy modal logic)
2. ferry-booking/ferries (Missing full Add/Edit inline form capabilities)
3. ferry-booking/reservations (Significant action surface reduction)
4. core-admin/sessions (Missing 'Revoke all' or specific table filtering if it existed in legacy)
5. crm/partners (Form inputs missing or rebuilt without identical CSS matching)

