import Link from "next/link"
import { LayoutGrid, LogOut } from "lucide-react"
import LanguageSwitcher from "./LanguageSwitcher"
import { UserDropdown } from "@/components/ui/UserDropdown"
import { signOutAction } from "@/app/actions";

interface LegacyHeaderProps {
    user: {
        email?: string;
        id?: string;
    } | null;
    initialTheme: string;
    initialLocale: string;
}

export function LegacyHeader({ user, initialTheme, initialLocale }: LegacyHeaderProps) {
    return (
        <header className="h-12 bg-sidebar border-b border-sidebar-border text-sidebar-foreground flex items-center px-4 shadow-md z-50 sticky top-0 font-sans transition-colors duration-300">
            <div className="flex items-center gap-2">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-lg hover:text-sidebar-primary transition-colors"
                >
                    <LayoutGrid size={20} />
                    modMonolith
                </Link>
            </div>

            <nav className="ml-auto flex items-center gap-4">
                <LanguageSwitcher initialLocale={initialLocale} />
                {user && (
                    <>
                        <UserDropdown
                            user={user}
                            initialTheme={initialTheme}
                        />
                        <form action={signOutAction}>
                            <button
                                className="flex items-center justify-center p-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </button>
                        </form>
                    </>
                )}
            </nav>
        </header>
    )
}
