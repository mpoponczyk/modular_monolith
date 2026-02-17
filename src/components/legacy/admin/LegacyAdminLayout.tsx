"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut, LayoutGrid } from "lucide-react"
import { Button } from "@/components/legacy/ui/button"

export interface SidebarItem {
    id: string;
    name: string;
    path: string; // Abstract path e.g. /users
    order: number;
    group?: string;
}

interface LegacyAdminLayoutProps {
    children: React.ReactNode;
    sidebarItems: SidebarItem[];
    tenantSlug: string;
    user: {
        email?: string;
        full_name?: string;
    };
    onLogout: () => Promise<void>;
}

export function LegacyAdminLayout({
    children,
    sidebarItems,
    tenantSlug,
    user,
    onLogout
}: LegacyAdminLayoutProps) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-zinc-950 transition-colors duration-300 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-blue-950 dark:bg-black text-white flex flex-col border-r border-blue-900/50 dark:border-zinc-800 shadow-xl z-20 sticky top-0 h-screen">
                {/* Header Logo */}
                <div className="h-16 flex items-center px-6 border-b border-blue-900/50 dark:border-zinc-800 bg-blue-950/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
                        <LayoutGrid className="text-blue-400" size={24} />
                        <span>FerryAdmin</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {sidebarItems.map((item) => {
                        // CRITICAL ROUTING RULE: /admin/t/${tenantSlug}${item.path}
                        const href = `/admin/t/${tenantSlug}${item.path}`;
                        const isActive = pathname === href || pathname?.startsWith(`${href}/`);

                        return (
                            <Link
                                key={item.id}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                                        : "text-blue-100/70 hover:text-white hover:bg-blue-800/50"
                                )}
                            >
                                {/* Placeholder Icon since menu.ts might not have icons yet, or we assume item.icon if we add it later */}
                                <span className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-colors",
                                    isActive ? "bg-white" : "bg-blue-400/50 group-hover:bg-blue-300"
                                )} />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-blue-900/50 dark:border-zinc-800 bg-blue-950/30">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/30">
                            {user.email?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user.full_name || user.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-blue-300 truncate opacity-70">
                                {tenantSlug}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-blue-200 hover:text-white hover:bg-blue-900/50"
                        onClick={() => onLogout()}
                    >
                        <LogOut size={16} className="mr-2" />
                        Sign Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-y-auto">
                {/* Top Bar for Mobile could go here, omitting for strict safe port (Desktop focus first) */}
                <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
                    {children}
                </div>
            </main>
        </div>
    )
}
