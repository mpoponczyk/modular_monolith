-- 20260217000000_org_menu_variants.sql
-- Strict Organization Menu & Variants System
-- Context: Tenant > Organization > Section > App

-- 1. Enable Dependencies
-- ensure UUID extension logic (usually already enabled)

-- =================================================================================================
-- CATEGORY 3: TRANSLATION TABLES (Must exist for FKs)
-- =================================================================================================

-- 3.1. Organization Languages
-- Registry of enabled languages for the Organization.
CREATE TABLE public.organization_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    language_code TEXT NOT NULL, -- e.g. 'en', 'pl'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint: Composite Scope
    UNIQUE(organization_id, language_code),
    -- Constraint: Only one default per organization (handled via partial index below)
    CONSTRAINT org_lang_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id)
);

-- Partial index for Is Default uniqueness
CREATE UNIQUE INDEX org_languages_one_default_idx ON public.organization_languages (organization_id) WHERE is_default = TRUE;

-- RLS
ALTER TABLE public.organization_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_languages FORCE ROW LEVEL SECURITY;

-- =================================================================================================
-- CATEGORY 1: BASE STRUCTURE TABLES
-- =================================================================================================

-- 1.1. Organization Sections (Object A)
CREATE TABLE public.organization_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    is_enabled BOOLEAN DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Composite FK
    CONSTRAINT org_sections_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    -- Constraint: Strict Composite Identity for Child FKs
    UNIQUE(id, tenant_id, organization_id)
);

ALTER TABLE public.organization_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_sections FORCE ROW LEVEL SECURITY;

-- 3.2. Section Translations (Translation A_t)
CREATE TABLE public.organization_section_translations (
    section_id UUID NOT NULL REFERENCES public.organization_sections(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    
    PRIMARY KEY (section_id, language_code),
    -- Composite FK for strict scoping validation
    CONSTRAINT sect_trans_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    -- Translation Source Validation
    CONSTRAINT sect_trans_lang_fk FOREIGN KEY (organization_id, language_code) REFERENCES public.organization_languages(organization_id, language_code) ON DELETE CASCADE
);

ALTER TABLE public.organization_section_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_section_translations FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- CATEGORY 2: ACTIVATION TABLES
-- =================================================================================================

-- 2.1. Organization Apps (Object B)
CREATE TABLE public.organization_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    module_id TEXT NOT NULL, -- Matched against ModuleRegistry code
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(organization_id, module_id),
    CONSTRAINT org_apps_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    -- Constraint: Strict Composite Identity for Child FKs
    UNIQUE(id, tenant_id, organization_id)
);

ALTER TABLE public.organization_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_apps FORCE ROW LEVEL SECURITY;

-- 3.3. App Translations (Translation B_t)
CREATE TABLE public.organization_app_translations (
    organization_app_id UUID NOT NULL REFERENCES public.organization_apps(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    short_name TEXT NOT NULL,
    short_description TEXT,
    long_description TEXT,

    PRIMARY KEY (organization_app_id, language_code),
    CONSTRAINT app_trans_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    CONSTRAINT app_trans_lang_fk FOREIGN KEY (organization_id, language_code) REFERENCES public.organization_languages(organization_id, language_code) ON DELETE CASCADE
);

ALTER TABLE public.organization_app_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_app_translations FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- LINKAGE (Contract A <-> B)
-- =================================================================================================

-- 1.2. Organization Section Items (Relation A<->B)
CREATE TABLE public.organization_section_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    section_id UUID NOT NULL REFERENCES public.organization_sections(id) ON DELETE CASCADE,
    organization_app_id UUID NOT NULL REFERENCES public.organization_apps(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN DEFAULT TRUE,

    UNIQUE(section_id, organization_app_id),
    CONSTRAINT sect_items_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    -- Strict Composite FKs
    CONSTRAINT sect_items_section_fk FOREIGN KEY (section_id, tenant_id, organization_id) REFERENCES public.organization_sections(id, tenant_id, organization_id) ON DELETE CASCADE,
    CONSTRAINT sect_items_app_fk FOREIGN KEY (organization_app_id, tenant_id, organization_id) REFERENCES public.organization_apps(id, tenant_id, organization_id) ON DELETE CASCADE,
    UNIQUE(id, tenant_id, organization_id)
);

ALTER TABLE public.organization_section_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_section_items FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- CATEGORY 4: VARIANT TABLES
-- =================================================================================================

-- 4.1. Menu Variants
CREATE TABLE public.organization_menu_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL, -- Internal Name, Not Translated
    is_global BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE, -- Only valid if is_global=TRUE (Enforced via index)
    owner_user_id UUID REFERENCES auth.users(id), -- NULL if global
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT menu_vars_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id),
    -- Constraint: Global variants have no owner, Local variants must have owner
    CONSTRAINT global_variant_rule CHECK (
        (is_global = TRUE AND owner_user_id IS NULL) OR 
        (is_global = FALSE AND owner_user_id IS NOT NULL)
    )
);

-- Unique Constraint: At most ONE Global Default per Organization
CREATE UNIQUE INDEX menu_vars_one_global_default_idx 
ON public.organization_menu_variants (organization_id) 
WHERE is_global = TRUE AND is_default = TRUE;

-- Unique Constraint: At most ONE Local Default per User/Org
CREATE UNIQUE INDEX menu_vars_one_local_default_idx
ON public.organization_menu_variants (owner_user_id, organization_id)
WHERE is_default = TRUE AND owner_user_id IS NOT NULL;

ALTER TABLE public.organization_menu_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_menu_variants FORCE ROW LEVEL SECURITY;

-- 4.2. Variant Items (Sparse Overlay)
CREATE TABLE public.organization_menu_variant_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    variant_id UUID NOT NULL,
    section_id UUID NOT NULL,
    organization_app_id UUID NOT NULL,
    
    -- Overrides
    order_index INTEGER NOT NULL DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,

    UNIQUE(variant_id, section_id, organization_app_id),
    CONSTRAINT var_items_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id),
    -- Strict Composite FKs
    CONSTRAINT var_items_variant_fk FOREIGN KEY (variant_id, tenant_id, organization_id) REFERENCES public.organization_menu_variants(id, tenant_id, organization_id) ON DELETE CASCADE,
    CONSTRAINT var_items_section_fk FOREIGN KEY (section_id, tenant_id, organization_id) REFERENCES public.organization_sections(id, tenant_id, organization_id) ON DELETE CASCADE,
    CONSTRAINT var_items_app_fk FOREIGN KEY (organization_app_id, tenant_id, organization_id) REFERENCES public.organization_apps(id, tenant_id, organization_id) ON DELETE CASCADE
);

ALTER TABLE public.organization_menu_variant_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_menu_variant_items FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- CATEGORY 5: VARIANT PREFERENCE TABLES
-- =================================================================================================

-- 5.1. User Variant Preferences
CREATE TABLE public.user_variant_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id UUID, -- Default variant (Nullable)
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(user_id, organization_id), -- Exactly one record per user per org
    CONSTRAINT user_prefs_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id),
    -- Strict Composite FK (Nullable)
    CONSTRAINT user_prefs_variant_fk FOREIGN KEY (variant_id, tenant_id, organization_id) REFERENCES public.organization_menu_variants(id, tenant_id, organization_id) ON DELETE SET NULL
);

ALTER TABLE public.user_variant_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_variant_preferences FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- CATEGORY 6: SUPER ADMIN OVERRIDES
-- =================================================================================================

-- 6.1. Module Overrides (Break Glass)
CREATE TABLE public.organization_module_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    module_id TEXT NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(organization_id, module_id),
    CONSTRAINT mods_over_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id)
);

ALTER TABLE public.organization_module_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_module_overrides FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- APP INTERNAL VARIANTS (Future Safe)
-- =================================================================================================

-- 7.1. App View Variants
CREATE TABLE public.app_view_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    module_id TEXT NOT NULL,
    owner_user_id UUID REFERENCES auth.users(id), -- NULL if global
    is_global BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT app_views_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id),
    CONSTRAINT app_views_global_rule CHECK (
        (is_global = TRUE AND owner_user_id IS NULL) OR 
        (is_global = FALSE AND owner_user_id IS NOT NULL)
    )
);

-- Unique Constraint: One Global Default per Module
CREATE UNIQUE INDEX app_views_one_global_default_idx
ON public.app_view_variants (organization_id, module_id)
WHERE is_global = TRUE AND is_default = TRUE;

-- Unique Constraint: One User Default per Module/User
CREATE UNIQUE INDEX app_views_one_local_default_idx
ON public.app_view_variants (owner_user_id, organization_id, module_id)
WHERE is_default = TRUE AND owner_user_id IS NOT NULL;

ALTER TABLE public.app_view_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_view_variants FORCE ROW LEVEL SECURITY;

-- 7.2. App View Config (Decomposed)
CREATE TABLE public.app_view_variant_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    
    config_type TEXT NOT NULL CHECK (config_type IN ('column', 'filter', 'sort')),
    config_key TEXT NOT NULL,
    value TEXT, 
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,

    CONSTRAINT app_view_cfg_tenant_org_fk FOREIGN KEY (tenant_id, organization_id) REFERENCES public.organizations(tenant_id, id),
    UNIQUE(id, tenant_id, organization_id),
    CONSTRAINT app_view_cfg_variant_fk FOREIGN KEY (variant_id, tenant_id, organization_id) REFERENCES public.app_view_variants(id, tenant_id, organization_id) ON DELETE CASCADE
);

ALTER TABLE public.app_view_variant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_view_variant_config FORCE ROW LEVEL SECURITY;


-- =================================================================================================
-- REVOCATIONS (Permissions)
-- =================================================================================================

REVOKE ALL ON public.organization_languages FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_sections FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_section_translations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_apps FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_app_translations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_section_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_menu_variants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_menu_variant_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.user_variant_preferences FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.organization_module_overrides FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.app_view_variants FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.app_view_variant_config FROM PUBLIC, anon, authenticated;

-- Allow SELECT only via RLS policies (see below, but explicit grant select might be needed depending on pg setup)
-- Actually, strict mode usually implies: GRANT SELECT TO authenticated; REVOKE INSERT/UPDATE/DELETE.
-- The spec says "No direct table writes: REVOKE INSERT/UPDATE/DELETE from authenticated".

GRANT SELECT ON public.organization_languages TO authenticated;
GRANT SELECT ON public.organization_sections TO authenticated;
GRANT SELECT ON public.organization_section_translations TO authenticated;
GRANT SELECT ON public.organization_apps TO authenticated;
GRANT SELECT ON public.organization_app_translations TO authenticated;
GRANT SELECT ON public.organization_section_items TO authenticated;
GRANT SELECT ON public.organization_menu_variants TO authenticated;
GRANT SELECT ON public.organization_menu_variant_items TO authenticated;
GRANT SELECT ON public.user_variant_preferences TO authenticated;
-- overrides is internal, maybe only admin select? for now authenticated read is safe as it's just blocking
GRANT SELECT ON public.organization_module_overrides TO authenticated;
GRANT SELECT ON public.app_view_variants TO authenticated;
GRANT SELECT ON public.app_view_variant_config TO authenticated;


-- =================================================================================================
-- RLS POLICIES (Strict Membership Path)
-- =================================================================================================

-- Access Rule: 
-- 1. Must be authenticated.
-- 2. Must be member of the Organization (via org_companies -> company_users) 
--    OR be in Owner Group.
-- 3. Variants/Prefs: Must be Owner if Local.

-- Helper for Org Membership Check (Inline for speed/clarity in policies)
-- (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id WHERE oc.organization_id = table.organization_id AND cu.user_id = auth.uid())

-- Generic Policy for Organization Scoped Data
CREATE POLICY "Org Member Read" ON public.organization_languages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_languages.organization_id AND org.tenant_id = organization_languages.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_languages.organization_id AND org.tenant_id = organization_languages.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);
-- Repeat for all standard tables
CREATE POLICY "Org Member Read" ON public.organization_sections FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_sections.organization_id AND org.tenant_id = organization_sections.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_sections.organization_id AND org.tenant_id = organization_sections.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org Member Read" ON public.organization_section_translations FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_section_translations.organization_id AND org.tenant_id = organization_section_translations.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_section_translations.organization_id AND org.tenant_id = organization_section_translations.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org Member Read" ON public.organization_apps FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_apps.organization_id AND org.tenant_id = organization_apps.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_apps.organization_id AND org.tenant_id = organization_apps.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org Member Read" ON public.organization_app_translations FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_app_translations.organization_id AND org.tenant_id = organization_app_translations.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_app_translations.organization_id AND org.tenant_id = organization_app_translations.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org Member Read" ON public.organization_section_items FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_section_items.organization_id AND org.tenant_id = organization_section_items.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_section_items.organization_id AND org.tenant_id = organization_section_items.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);
CREATE POLICY "Org Member Read" ON public.organization_module_overrides FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_module_overrides.organization_id AND org.tenant_id = organization_module_overrides.tenant_id AND cu.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_module_overrides.organization_id AND org.tenant_id = organization_module_overrides.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
);

-- Variant Policies (Global OR Owner)
CREATE POLICY "Variant Read" ON public.organization_menu_variants FOR SELECT TO authenticated USING (
    (
        -- Is Member
        (EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = organization_menu_variants.organization_id AND org.tenant_id = organization_menu_variants.tenant_id AND cu.user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = organization_menu_variants.organization_id AND org.tenant_id = organization_menu_variants.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())))
    )
    AND
    (
        is_global = TRUE OR owner_user_id = auth.uid()
    )
);

CREATE POLICY "Variant Items Read" ON public.organization_menu_variant_items FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.organization_menu_variants v
        WHERE v.id = organization_menu_variant_items.variant_id
        AND v.organization_id = organization_menu_variant_items.organization_id
        AND v.tenant_id = organization_menu_variant_items.tenant_id
        AND (v.is_global = TRUE OR v.owner_user_id = auth.uid())
        -- And Member check implicitly inherited via v's existence, but strictly we overlap
        AND (
            EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = v.organization_id AND org.tenant_id = v.tenant_id AND cu.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = v.organization_id AND org.tenant_id = v.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
        )
    )
);

-- User Preferences Policy (Strict Owner)
CREATE POLICY "User Pref Read" ON public.user_variant_preferences FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    AND (
        (EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = user_variant_preferences.organization_id AND org.tenant_id = user_variant_preferences.tenant_id AND cu.user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = user_variant_preferences.organization_id AND org.tenant_id = user_variant_preferences.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())))
    )
);

-- App View Policies (Global OR Owner)
CREATE POLICY "App View Read" ON public.app_view_variants FOR SELECT TO authenticated USING (
    (
        (EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = app_view_variants.organization_id AND org.tenant_id = app_view_variants.tenant_id AND cu.user_id = auth.uid()) OR
         EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = app_view_variants.organization_id AND org.tenant_id = app_view_variants.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())))
    )
    AND
    (
        is_global = TRUE OR owner_user_id = auth.uid()
    )
);

CREATE POLICY "App View Config Read" ON public.app_view_variant_config FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.app_view_variants v
        WHERE v.id = app_view_variant_config.variant_id
        AND v.organization_id = app_view_variant_config.organization_id
        AND v.tenant_id = app_view_variant_config.tenant_id
        AND (v.is_global = TRUE OR v.owner_user_id = auth.uid())
        AND (
            EXISTS (SELECT 1 FROM public.company_users cu JOIN public.org_companies oc ON cu.company_id = oc.company_id JOIN public.organizations org ON oc.organization_id = org.id WHERE org.id = v.organization_id AND org.tenant_id = v.tenant_id AND cu.user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM public.organizations org WHERE org.id = v.organization_id AND org.tenant_id = v.tenant_id AND org.owner_group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()))
        )
    )
);


-- =================================================================================================
-- WRITE HARDENING (Explicit Deny Policies)
-- =================================================================================================

-- Organization Languages
CREATE POLICY "No Direct Insert" ON public.organization_languages FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_languages FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_languages FOR DELETE TO authenticated USING (false);

-- Organization Sections
CREATE POLICY "No Direct Insert" ON public.organization_sections FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_sections FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_sections FOR DELETE TO authenticated USING (false);

-- Organization Apps
CREATE POLICY "No Direct Insert" ON public.organization_apps FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_apps FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_apps FOR DELETE TO authenticated USING (false);

-- Organization Section Items
CREATE POLICY "No Direct Insert" ON public.organization_section_items FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_section_items FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_section_items FOR DELETE TO authenticated USING (false);

-- Organization Menu Variants
CREATE POLICY "No Direct Insert" ON public.organization_menu_variants FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_menu_variants FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_menu_variants FOR DELETE TO authenticated USING (false);

-- Organization Menu Variant Items
CREATE POLICY "No Direct Insert" ON public.organization_menu_variant_items FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_menu_variant_items FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_menu_variant_items FOR DELETE TO authenticated USING (false);

-- User Variant Preferences
CREATE POLICY "No Direct Insert" ON public.user_variant_preferences FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.user_variant_preferences FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.user_variant_preferences FOR DELETE TO authenticated USING (false);

-- Organization Module Overrides
CREATE POLICY "No Direct Insert" ON public.organization_module_overrides FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_module_overrides FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_module_overrides FOR DELETE TO authenticated USING (false);

-- App View Variants
CREATE POLICY "No Direct Insert" ON public.app_view_variants FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.app_view_variants FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.app_view_variants FOR DELETE TO authenticated USING (false);

-- App View Variant Config
CREATE POLICY "No Direct Insert" ON public.app_view_variant_config FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.app_view_variant_config FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.app_view_variant_config FOR DELETE TO authenticated USING (false);

-- Section Translations
CREATE POLICY "No Direct Insert" ON public.organization_section_translations FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_section_translations FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_section_translations FOR DELETE TO authenticated USING (false);

-- App Translations
CREATE POLICY "No Direct Insert" ON public.organization_app_translations FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "No Direct Update" ON public.organization_app_translations FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No Direct Delete" ON public.organization_app_translations FOR DELETE TO authenticated USING (false);

