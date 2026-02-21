
import { listRolesAction } from '../application/actions';
import { AdminPageHeader } from "@/components/admin-page-header";
import { RolesContent } from "./roles-content";

export default async function RolesPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
    const { tenantSlug } = await params;

    let roles: any[] = [];

    try {
        roles = await listRolesAction(tenantSlug);
    } catch (e) {
        console.error('Failed to load roles data', e);
    }

    const availableApps = [
        // Cockpits
        { id: 'cockpits', name: 'Global: Cockpit Section' },
        { id: 'sales', name: 'Sales Analytics' },
        { id: 'services', name: 'Services & Fleet Cockpit' },

        // Planning & Operations
        { id: 'clnt_trips', name: 'Unified Hub (Scheduling)' },
        { id: 'gantt', name: 'Gantt Chart View' },
        { id: 'calendar-visual', name: 'Graphical Calendar' },
        { id: 'calendar-list', name: 'List Calendar Search' },
        { id: 'manifest', name: 'Manifest Reports' },
        { id: 'planning', name: 'Drafts & Planning' },

        // Management
        { id: 'partners', name: 'Business Partners' },
        { id: 'clnt_ferries', name: 'Ferries Management' },
        { id: 'clnt_locations', name: 'Locations & Harbors' },
        { id: 'clnt_routes', name: 'Naval Routes' },
        { id: 'templates', name: 'Schedule Templates' },
        { id: 'pricing', name: 'Global Pricing' },

        // Operations
        { id: 'clnt_reservations', name: 'Reservations Management' },
        { id: 'clnt_orders', name: 'Financial Orders' },
        { id: 'clnt_invoices', name: 'Invoices & Billing' },

        // Security & System
        { id: 'roles', name: 'Role Management' },
        { id: 'users', name: 'User Management' },
        { id: 'migration', name: 'Data Migration' },
        { id: 'sys_settings', name: 'Global App Settings' }
    ];

    return (
        <div className="space-y-6">
            <AdminPageHeader
                titleKey="admin.roles.title"
                subtitleKey="admin.roles.subtitle"
                title="Role Management"
                description="Define access levels and assign applications"
            />
            <RolesContent tenantSlug={tenantSlug} roles={roles} availableApps={availableApps} />
        </div>
    );
}
