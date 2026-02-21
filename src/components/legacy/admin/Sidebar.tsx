import { X, LayoutGrid, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    tenantSlug: string;
}

// SIMPLER: specific props for labels
interface SidebarLabels {
    appLibrary: string;
    dashboard: string;
    close: string;
}

export function Sidebar({ isOpen, onClose, tenantSlug, labels }: SidebarProps & { labels: SidebarLabels }) {
    const pathname = usePathname();

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const libraryPath = `/admin/t/${tenantSlug}`;
    const dashboardPath = `/admin/t/${tenantSlug}`; // Same root page for now since there's no separate dashboard module

    const isLibrary = pathname === libraryPath;
    const isDashboard = pathname === dashboardPath;

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar (Left-Aligned) */}
            <div
                className={cn(
                    "fixed top-0 left-0 h-full w-80 bg-sidebar text-sidebar-foreground shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-r border-sidebar-border flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-sidebar-border h-16">
                    <span className="font-bold text-lg tracking-tight flex items-center gap-2">
                        <LayoutGrid size={20} className="text-sidebar-primary" />
                        modMonolith
                    </span>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                        aria-label={labels.close}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* App Library - PRIORITY 1 */}
                    <Link
                        href={libraryPath}
                        onClick={onClose}
                        prefetch={false}
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                            isLibrary
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                    >
                        <LayoutGrid size={20} />
                        {labels.appLibrary}
                    </Link>

                    {/* Dashboard */}
                    <Link
                        href={dashboardPath}
                        onClick={onClose}
                        prefetch={false}
                        className={cn(
                            "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                            isDashboard
                                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        )}
                    >
                        <Home size={20} />
                        {labels.dashboard}
                    </Link>
                </nav>
            </div>
        </>
    );
}
