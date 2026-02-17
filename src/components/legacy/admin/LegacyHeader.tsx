"use client"

import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import LanguageSwitcher from "./LanguageSwitcher"

export function LegacyHeader() {
    return (
        <header className="h-12 bg-[#172554] border-b border-blue-900/50 text-white flex items-center px-4 shadow-md z-50 sticky top-0 font-sans transition-colors duration-300">
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className="flex items-center gap-2 font-bold text-lg hover:text-blue-200 transition-colors"
                >
                    <LayoutGrid size={20} />
                    mod-Monolith
                </Link>
            </div>

            <nav className="ml-auto flex items-center gap-4">
                <LanguageSwitcher />
            </nav>
        </header>
    )
}
