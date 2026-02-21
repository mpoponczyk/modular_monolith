-- Migration: Add capacity_vehicles to mnt_ferries
-- Date: 2026-02-18
-- Description: Fix missing column for vehicle capacity.

alter table public.mnt_ferries
add column if not exists capacity_vehicles integer default 0 not null;
