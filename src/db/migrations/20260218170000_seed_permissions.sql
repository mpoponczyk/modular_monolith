-- 20260218170000_seed_permissions.sql
-- Seed Permissions for Phase 6 Legacy Parity Apps
-- Idempotent inserts

DO $$
DECLARE
    -- Helper to insert permission if not exists
    perm_name TEXT;
BEGIN
    -- 1. Operations (Ferries, Routes, Services, Trips, Reservations)
    INSERT INTO public.permissions (key, description) VALUES
    ('ferries.view', 'View Ferries'),
    ('ferries.manage', 'Manage Ferries'),
    ('routes.view', 'View Routes'),
    ('routes.manage', 'Manage Routes'),
    ('services.view', 'View Services'),
    ('services.manage', 'Manage Services'),
    ('trips.view', 'View Trips'),
    ('trips.manage', 'Manage Trips'),
    ('reservations.view', 'View Reservations'),
    ('reservations.manage', 'Manage Reservations'),
    ('reservations.cancel', 'Cancel Reservations')
    ON CONFLICT (key) DO NOTHING;

    -- 2. Sales (Orders, Invoices, Partners, Pricing)
    INSERT INTO public.permissions (key, description) VALUES
    ('orders.view', 'View Orders'),
    ('orders.manage', 'Manage Orders'),
    ('invoices.view', 'View Invoices'),
    ('partners.view', 'View Partners'),
    ('partners.manage', 'Manage Partners'),
    ('pricing.view', 'View Pricing Profiles'),
    ('pricing.manage', 'Manage Pricing Profiles')
    ON CONFLICT (key) DO NOTHING;

    -- 3. Scheduling (Gantt, Calendar, Templates)
    INSERT INTO public.permissions (key, description) VALUES
    ('planning.view', 'View Schedule/Gantt/Calendar'),
    ('planning.manage', 'Manage Schedule/Gantt/Calendar')
    ON CONFLICT (key) DO NOTHING;

    -- 4. Reporting (Manifests, Sales)
    INSERT INTO public.permissions (key, description) VALUES
    ('manifests.view', 'View Manifests'),
    ('reporting.view', 'View Sales Reports')
    ON CONFLICT (key) DO NOTHING;

    -- 5. System (Users, Roles, Sessions, Settings, Cockpits)
    INSERT INTO public.permissions (key, description) VALUES
    ('users.view', 'View Users'),
    ('users.manage', 'Manage Users'),
    ('roles.view', 'View Roles'),
    ('roles.manage', 'Manage Roles'),
    ('security.view', 'View Security/Sessions'), -- For Sessions App
    ('settings.view', 'View Settings'),
    ('settings.manage', 'Manage Settings'),
    ('cockpits.manage', 'Manage Cockpits UI')
    ON CONFLICT (key) DO NOTHING;

END $$;
