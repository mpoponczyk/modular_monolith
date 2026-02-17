# Release 009: Organization Menu & Variants System

## Overview
This release introduces the **Organization Menu & Variants System**, a critical architectural component for handling SaaS-level menu structures, tenant isolation, and strict variant management. It also includes the consolidated architectural documentation up to Chapter 11.

## Key Features

### 1. Organization Menu & Variants System
- **Strict SaaS Boundary**: Organization-level menu keys, prohibiting Company/Project overrides.
- **Relational Model**: Fully normalized database schema for Sections (A), Apps (B), and Links (A<->B).
- **Variant Engine**: Support for Global and User-specific menu variants (Sparse Overlays).
- **Strict Isolation**: Composite Keys `(id, tenant_id, organization_id)` enforced across all structural tables.
- **RPC-Only Mutations**: All write operations mandated via `SECURITY DEFINER` RPCs.
- **Server-Side Resolution**: `resolve_menu_structure` RPC for performant, RBAC-aware menu fetching.

### 2. Documentation Consolidation
- **Modular Monolith Architecture v0.0.1-prealpha.1**: Consolidated documentation including Chapters 01-11.
- **New Chapter 11**: Detailed specification for "Menus and Variants".

## Database Changes
- **New Migrations**:
    - `20260217000000_org_menu_variants.sql`: Structural tables, RLS policies, and Indexes.
    - `20260217000001_org_menu_rpcs.sql`: RPCs for resolution and management.

## Application Layer
- **MenuService**: Server-side service for strictly consuming menu RPCs.
- **Cookie-Based State**: Secure `active_variant_id` handling via HTTP-only cookies.

## Verification
- **Paranoid Audit**: Full audit of SQL constraints, RLS policies, and RPC security.
- **Strict Compliance**: All findings from the audit have been remediated.

## Artifacts
- `docs/Modular_monolith_architecture_v0.0.2-prealfa.md`: The complete architectural guide.
