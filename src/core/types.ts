/**
 * Core Type Definitions for Modular Monolith Architecture
 * 
 * STRICT COMPLIANCE RULES:
 * 1. No React imports allowed in this file.
 * 2. No framework-specific imports.
 * 3. component must be typed as unknown (cast at usage).
 */

export interface RouteDefinition {
  /**
   * Path relative to module root.
   * MUST start with "/"
   * Example: "/", "/settings", "/users/list"
   */
  path: string;

  /**
   * The UI Component to render.
   * Typed as unknown to avoid React dependency in core types.
   * Casting happens in src/app/(admin)/admin/[[...slug]]/page.tsx
   */
  component: unknown;

  /**
   * Optional name for breadcrumbs or title
   */
  name?: string;
}

export interface ModuleDefinition {
  /**
   * Unique identifier for the module.
   * Used in URL: /admin/<id>
   */
  id: string;

  /**
   * Display name for the module.
   */
  name: string;
  
  /**
   * System Metadata
   */
  system: {
    /**
     * Global Hard Switch.
     * If false, module is disabled for EVERYONE.
     * Cannot be overridden by tenant config.
     */
    isActive: boolean;
  };

  /**
   * Permissions / RBAC Metadata
   */
  permissions: {
    /**
     * Roles required to access this module.
     * Empty array means public to all admin users.
     */
    requiredRoles: string[]; 
  };

  /**
   * Layout Metadata
   */
  layout: {
    /**
     * Show in main sidebar menu?
     */
    showInMenu: boolean;

    /**
     * Order in the menu.
     */
    order: number;

    /**
     * Optional grouping (e.g. "Create", "Settings")
     */
    menuGroup?: string;

    /**
     * Optional Icon component.
     * Typed as unknown to avoid React dependency.
     */
    icon?: unknown;
  };

  /**
   * Route definitions for this module.
   */
  routes: RouteDefinition[];
}

/**
 * Tenant Context for Activation Logic
 */
export interface TenantContext {
  /**
   * List of active module IDs for this tenant.
   * Acts as an ALLOW-LIST.
   * - If empty: ALL modules (with system.isActive=true) are enabled.
   * - If not empty: ONLY listed modules are enabled.
   */
  activeModuleIds: string[];
}

/**
 * User Context for RBAC Logic
 */
export interface UserContext {
  /**
   * List of roles assigned to the current user.
   */
  roles: string[];
}
