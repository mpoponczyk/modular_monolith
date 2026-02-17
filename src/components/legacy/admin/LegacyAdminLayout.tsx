"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut, LayoutGrid } from "lucide-react"
import { Button } from "@/components/legacy/ui/button"
import { UserDropdown } from "@/components/ui/UserDropdown"
import LanguageSwitcher from "@/components/legacy/admin/LanguageSwitcher"

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
    initialTheme: string;
}

export function LegacyAdminLayout({
    children,
    sidebarItems,
    tenantSlug,
    user,
    onLogout,
    initialTheme
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
                        <span>modMonolith</span>
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
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <UserDropdown
                                email={user.email || 'User'}
                                initialTheme={initialTheme}
                            />
                            <LanguageSwitcher />
                        </div>
                    </div>
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
