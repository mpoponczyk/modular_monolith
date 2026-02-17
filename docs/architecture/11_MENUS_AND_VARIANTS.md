# 11. Organization Menu & Variants System (Strict)

## 11.1. Conceptual Model & SaaS Boundary

The Organization Menu System defines the **SaaS Boundary** within the Multi-Tenant architecture. It strictly enforces the hierarchy: **Tenant > Organization > Section > App**.

### 11.1.1. Tenant vs. Organization Scope
*   **Tenant as Container**: The Tenant is a passive container for data and users. It **DOES NOT** define the application structure, menu, or available features.
*   **Organization as SaaS Universe**: The Organization is the active SaaS boundary. It defines:
    *   Which Modules are active.
    *   How the Menu is structured (Sections).
    *   Which Languages are supported.
    *   Default Layouts (Variants).
*   **No Downstream Overrides**: Menu structure is defined **exclusively** per `(tenant_id, organization_id)`. Companies and Projects **CANNOT** define or override menu structure.

### 11.1.2. Code vs. Data Authority
*   **ModuleRegistry (Code)**: The immutable source of truth for *available* software capabilities (Modules). It defines what *can* exist.
*   **Organization Apps (Data)**: The mutable record of what *is activated* for a specific Organization.
*   **Module Integrity Rule**: An App cannot be activated if it does not exist in the `ModuleRegistry`.

### 11.1.3. Relational Decomposition (Strict Contract)
The system rejects JSON blob storage for structure. It enforces a Mandatory Relational Decomposition Pattern:

*   **Object A (Section)**: `organization_sections`
*   **Object B (App Activation)**: `organization_apps`
*   **Relation A↔B (Link Item)**: `organization_section_items`
*   **Translation A_t**: `organization_section_translations`
*   **Translation B_t**: `organization_app_translations`

**Invariants**:
*   Apps **MUST** exist in **Object B** before being placed in **Relation A↔B**.
*   Variants **MUST NOT** replace the A↔B link table.
*   Decomposition is **mandatory**; no structural shortcut allowed.

---

## 11.2. Administrative Responsibility Model

### 1. Super Admin (System Operator)
*   **Capabilities**: Define `ModuleRegistry`, Block Modules System-wide (`organization_module_overrides`).
*   **Scope**: Cross-Tenant.

### 2. Organization Owner (Admin)
*   **Capabilities**:
    *   **Structure**: Manage Sections (Create/Edit/Disable).
    *   **Activation**: Activate/Deactivate Apps.
    *   **Linkage**: Link Apps to Sections.
    *   **Ordering**: Define Base Order of Sections and Apps.
    *   **Global Variants**: Create/Edit Organization-wide Variants.
    *   **Defaults**: Set Global Default Variant & Language.
*   **Scope**: Strict Organization Boundary.

### 3. End User (Member)
*   **Capabilities**:
    *   **Local Variants**: Create/Edit private User Variants.
    *   **Preferences**: Set "User Default Variant".
    *   **Selection**: Switch "Active Variant" for session.
    *   **Visibility**: Sees only sections/apps permitted by their RBAC.
*   **Scope**: Strict User/Organization Boundary.

---

## 11.3. Invariants & Isolation Rules

### 11.3.1. The Structural Gate Invariant
**An App must pass ALL structural gates before being visible:**
`System Block` → `Activation` → `Section Membership` → `RBAC` → `Variant Visibility`

Any failure results in the App being strictly invisible.

### 11.3.2. Variant Limitations (Strict Phase 1)
**A Variant cannot introduce structural nodes.**
*   **Base Structure** (Sections + Activation + A↔B) is the **only canonical structural layer**.
*   Variants are **sparse overlays** for **App Visibility** and **App Ordering within Sections**.
*   **Section Reordering**: NOT SUPPORTED in Variants. Sections always appear in their Base Structure order.
*   A Variant **MUST NOT**:
    *   Introduce new apps or sections.
    *   Move apps between sections.
    *   Bypass RBAC or System Blocks.

### 11.3.3. Security & RPC-Only Resolution
*   **RPC Authority**: Menu structure MUST be resolved exclusively via `resolve_menu_structure`.
*   **No Client Authority**: The Client **MUST NEVER** inject RBAC permissions (e.g., `p_allowed_modules` is FORBIDDEN). RBAC must be resolved server-side.
*   **No Direct Writes**: All mutations MUST occur via `SECURITY DEFINER` RPCs. Tables are `REVOKE ALL` from public.

### 11.3.4. Fail-Closed Principles
*   **Zero Structure**: If resolution yields 0 sections, return `[]`. No implicit default.
*   **System Block**: Overrides everything.
*   **Translation**: If translation is missing, return **NULL** (UI handles fallback). Database MUST NOT emit "MISSING_TRANS" markers.

---

## 11.4. Menu Resolution Algorithm (Authoritative)

The `resolve_menu_structure` RPC MUST implement this pipeline:

1.  **System Block** (Super Admin)
    *   Exclude `module_id` in `organization_module_overrides` (`is_blocked=true`).

2.  **App Activation** (Organization)
    *   Include only `organization_apps` with `is_active=true`.

3.  **Base Structure Assembly**
    *   Join `organization_sections` ↔ `organization_section_items` ↔ `organization_apps`.
    *   Filter `is_enabled=true`.

4.  **RBAC Filtering** (Internal Security)
    *   **Strict Rule**: Permissions are resolved **internally** by joining `auth.permissions` (or equivalent).
    *   **Input**: `auth.uid()`.
    *   **Logic**: Filter Apps based on server-side permission check.
    *   *Note*: If internal RBAC tables are not ready, default to "All Active Apps Visible to Members" (Fail-Open for members, Fail-Closed for non-members). **NEVER** accept client input.

5.  **Variant Selection** (Precedence)
    1.  **Active Session** (Arg `p_active_variant_id`).
    2.  **User Default** (`user_variant_preferences`).
    3.  **Global Default** (`organization_menu_variants`).
    4.  **Base Structure** (Null).

6.  **Variant Application** (Overlay)
    *   If Variant ID exists:
        *   Join `organization_menu_variant_items`.
        *   **Hide**: Exclude if `is_hidden=true`.
        *   **App Reorder**: Use `variant_items.order_index` for Apps within Sections.
    *   **Strictness**: Sections use Base Order. Apps without variant entry inherit Base Order.

7.  **Pruning & Cleanup**
    *   Remove empty Sections.
    *   Return JSONB.

---

## 11.5. Structural Tables (Reference)

### Category 1: Base Structure
*   `organization_sections`: (id, tenant_id, org_id, order_index, is_enabled)
*   `organization_section_items`: (id, tenant_id, org_id, section_id, app_id, order_index)

### Category 2: Activation
*   `organization_apps`: (id, tenant_id, org_id, module_id, is_active)

### Category 3: Translations
*   `organization_languages`, `organization_section_translations`, `organization_app_translations`.

### Category 4: Variants
*   `organization_menu_variants`: (id, tenant_id, org_id, is_global, is_default, owner_user_id)
*   `organization_menu_variant_items`: (id, tenant_id, org_id, variant_id, section_id, app_id, order_index, is_hidden)
    *   *Note*: `app_id` is NOT NULL (Section reorder not supported).

### Category 5: Preferences
*   `user_variant_preferences`: (user_id, org_id, variant_id)

### Category 6: Overrides
*   `organization_module_overrides`: (org_id, module_id, is_blocked)

---

## 11.6. Structural Integrity Guarantees

1.  **Composite Scope**: All FKs MUST include `(tenant_id, organization_id)`.
2.  **One Global Default**: Unique Index on `organization_menu_variants` (org_id, is_global=true, is_default=true).
3.  **One User Default**: Unique Index on `user_variant_preferences` (user_id, org_id).
4.  **A/B Separation**: `link_app_to_section` RPC MUST fail if App is not in `organization_apps`.
5.  **Strict Isolation**: No cross-org references allowed.
