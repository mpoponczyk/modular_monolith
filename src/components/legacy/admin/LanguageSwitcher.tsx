'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/legacy/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/legacy/ui/dropdown-menu"
import { Globe } from "lucide-react"

// Import constant from settings to ensure consistency (e.g. cookie name)
// But to keep this component visual-only for now without deep imports if desired, 
// we can hardcode or use imports. The plan says "Import constant".
import { LOCALE_COOKIE_NAME } from '@/shared/i18n/settings';

const languages = [
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
]

export default function LanguageSwitcher() {
    const router = useRouter();
    const [currentCode, setCurrentCode] = useState('en'); // Default to en visually

    useEffect(() => {
        // Read cookie on mount to set initial visual state
        const match = document.cookie.match(new RegExp('(^| )' + LOCALE_COOKIE_NAME + '=([^;]+)'));
        if (match) setCurrentCode(match[2]);
    }, []);

    const handleLocaleChange = (newLocale: string) => {
        // 1. Set Cookie
        document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; Path=/; SameSite=Lax`;

        // 2. Update State
        setCurrentCode(newLocale);

        // 3. Refresh Server Components
        router.refresh();
    }

    const currentLanguage = languages.find(lang => lang.code === currentCode) || languages[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                    <span className="text-lg">{currentLanguage.flag}</span>
                    <Globe className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLocaleChange(lang.code)}
                        className={lang.code === currentCode ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}
                    >
                        <span className="mr-2 text-lg">{lang.flag}</span>
                        {lang.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
