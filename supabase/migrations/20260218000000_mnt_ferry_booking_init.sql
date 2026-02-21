-- Migration: mnt_ferry_booking_init
-- Description: Parallel Tenant-Scoped Schema for Ferry Booking (Phase 1)
-- Author: Antigravity

-- 1. Locations
CREATE TABLE "public"."mnt_locations" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" text NOT NULL, -- Strict Tenant Scoping
    "name" text NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "mnt_locations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mnt_locations_tenant_name_key" UNIQUE ("tenant_id", "name") -- Constraint Retrofit
);

ALTER TABLE "public"."mnt_locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mnt_locations" FORCE ROW LEVEL SECURITY; -- Fail-Closed

CREATE POLICY "Tenant Read Locations" ON "public"."mnt_locations"
    FOR SELECT
    USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id')); -- Optimized Access

-- 2. Ferries
CREATE TABLE "public"."mnt_ferries" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" text NOT NULL,
    "name" text NOT NULL,
    "capacity_passengers" integer DEFAULT 0 NOT NULL,
    "capacity_bikes" integer DEFAULT 0 NOT NULL,
    "capacity_pets" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "mnt_ferries_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."mnt_ferries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mnt_ferries" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Read Ferries" ON "public"."mnt_ferries"
    FOR SELECT
    USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id'));

-- 3. Routes
CREATE TABLE "public"."mnt_routes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" text NOT NULL,
    "origin_id" uuid NOT NULL,
    "destination_id" uuid NOT NULL,
    "default_ferry_id" uuid, -- Optional default
    "estimated_duration_minutes" integer DEFAULT 60 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "mnt_routes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "mnt_routes_tenant_origin_dest_key" UNIQUE ("tenant_id", "origin_id", "destination_id"), -- Critical Logic Constraint
    CONSTRAINT "mnt_routes_origin_fkey" FOREIGN KEY ("origin_id") REFERENCES "public"."mnt_locations"("id") ON DELETE RESTRICT,
    CONSTRAINT "mnt_routes_dest_fkey" FOREIGN KEY ("destination_id") REFERENCES "public"."mnt_locations"("id") ON DELETE RESTRICT,
    CONSTRAINT "mnt_routes_ferry_fkey" FOREIGN KEY ("default_ferry_id") REFERENCES "public"."mnt_ferries"("id") ON DELETE SET NULL
);

ALTER TABLE "public"."mnt_routes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mnt_routes" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Read Routes" ON "public"."mnt_routes"
    FOR SELECT
    USING (tenant_id = (SELECT auth.jwt() ->> 'tenant_id'));

-- Permissions
GRANT SELECT ON "public"."mnt_locations" TO "authenticated";
GRANT SELECT ON "public"."mnt_ferries" TO "authenticated";
GRANT SELECT ON "public"."mnt_routes" TO "authenticated";

-- Note: Mutations (INSERT/UPDATE) will be handled via SECURITY DEFINER RPCs in Step 3.
-- Direct INSERT/UPDATE permissions are deliberately NOT granted to 'authenticated'.
