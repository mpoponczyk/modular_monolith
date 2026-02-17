'use client';

import { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { signOutAction } from '@/app/actions';

interface UserDropdownProps {
    email: string;
    initialTheme: string;
}

export function UserDropdown({ email, initialTheme }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-sidebar-accent text-sidebar-foreground px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-sidebar-border"
            >
                <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold border-2 border-sidebar-accent">
                    {email[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium hidden md:block">{email}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop to close */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-sidebar border border-sidebar-border rounded-xl shadow-2xl z-50 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 text-sidebar-foreground">

                        {/* 1. User Info (Read Only) */}
                        <div className="pb-3 border-b border-sidebar-border">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Signed in as</p>
                            <p className="font-medium truncate" title={email}>
                                {email}
                            </p>
                        </div>

                        {/* 2. Theme Switcher */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Appearance</p>
                            <ThemeSwitcher currentTheme={initialTheme} />
                        </div>

                        {/* 3. Actions */}

                    </div>
                </>
            )}
        </div>
    );
}
