'use client';

import { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { signOutAction } from '@/app/actions';

interface UserDropdownProps {
    user: {
        email?: string;
        full_name?: string;
    };
    initialTheme: string;
}

export function UserDropdown({ user, initialTheme }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    const displayName = user.full_name || user.email || 'User';

    // Extract initials
    let initials = 'U';
    if (user.full_name) {
        const parts = user.full_name.trim().split(/\s+/);
        if (parts.length > 1) {
            initials = `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        } else {
            initials = parts[0].substring(0, 2).toUpperCase();
        }
    } else if (user.email) {
        initials = user.email.substring(0, 2).toUpperCase();
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 hover:bg-blue-900/50 text-white px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-800"
            >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-blue-400">
                    {initials}
                </div>
                <span className="text-sm font-medium hidden md:block">{displayName}</span>
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
                            <p className="font-medium truncate text-foreground" title={displayName}>
                                {displayName}
                            </p>
                            {user.full_name && user.email && (
                                <p className="text-xs text-muted-foreground truncate" title={user.email}>{user.email}</p>
                            )}
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
