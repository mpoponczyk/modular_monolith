"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutGrid, Menu, X, LogOut } from "lucide-react"
import { useState } from "react"
import { UserDropdown } from "@/components/ui/UserDropdown"
import LanguageSwitcher from "@/components/legacy/admin/LanguageSwitcher"
import { signOutAction } from "@/app/actions"

import { Sidebar } from "@/components/legacy/admin/Sidebar"

export interface HeaderItem {
    id: string;
    name: string;
    path: string;
    order: number;
    group?: string;
}

interface HeaderAdminLayoutProps {
    children: React.ReactNode;
    menuItems: HeaderItem[];
    tenantSlug: string;
    user: {
        email?: string;
        full_name?: string;
    };
    onLogout: () => Promise<void>;
    initialTheme: string;
    sidebarLabels: {
        appLibrary: string;
        dashboard: string;
        close: string;
    };
}

export function HeaderAdminLayout({
    children,
    menuItems,
    tenantSlug,
    user,
    onLogout,
    initialTheme,
    sidebarLabels
}: HeaderAdminLayoutProps) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen flex-col bg-background transition-colors duration-300 font-sans">
            {/* Header */}
            {/* Header */}
            <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border shadow-md sticky top-0 z-50">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* LEFT SIDE: Menu Button + Logo */}
                        <div className="flex items-center gap-4">
                            {/* Menu Toggle (Left Side) - Visible on ALL screens now as main nav */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent focus:outline-none"
                                aria-label="Menu"
                            >
                                <Menu size={24} />
                            </button>

                            {/* Logo & Brand */}
                            <div className="flex items-center gap-3 font-bold text-lg tracking-tight">
                                <LayoutGrid className="text-sidebar-primary" size={24} />
                                <span>modMonolith</span>
                                {/* Tenant Name REMOVED as per strict requirements */}
                            </div>
                        </div>

                        {/* RIGHT SIDE: User, Logout */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-4">
                                <UserDropdown
                                    email={user.email || 'User'}
                                    initialTheme={initialTheme}
                                />
                                <LanguageSwitcher />
                                <form action={signOutAction}>
                                    <button
                                        className="flex items-center justify-center p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                                        title="Sign Out"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </form>
                            </div>

                            {/* Mobile User/Logout could be handled here or inside sidebar if we wanted full convergence, 
                                but strict port kept top bar. 
                                For now, keeping user controls in top right. */}
                        </div>
                    </div>
                </div>

                {/* Left Sidebar Overlay */}
                <Sidebar
                    isOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                    tenantSlug={tenantSlug}
                    labels={sidebarLabels}
                />
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    )
}
