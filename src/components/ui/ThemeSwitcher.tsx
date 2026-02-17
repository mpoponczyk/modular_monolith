'use strict';

import { Moon, Sun, Monitor } from 'lucide-react';
import { setTheme } from '@/app/actions/theme';
import { useState, useTransition, useEffect } from 'react';

// Simplified Theme Switcher
export function ThemeSwitcher({ currentTheme }: { currentTheme: string }) {
    const [isPending, startTransition] = useTransition();
    const [theme, setOptimisticTheme] = useState(currentTheme);




    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setOptimisticTheme(newTheme);

        // Client-side instant update
        const root = document.documentElement;
        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.toggle('dark', systemTheme === 'dark');
        } else {
            root.classList.toggle('dark', newTheme === 'dark');
        }

        startTransition(async () => {
            await setTheme(newTheme);
        });
    };

    // Listen for system changes if theme is system
    // We can add a useEffect here if we want real-time system updates, 
    // but for now let's keep it simple as requested.


    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                root.classList.toggle('dark', mediaQuery.matches);
            };

            // Initial check
            handleChange();

            // Listener
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            // Enforce explicit theme (important if cookie was stale vs DB)
            root.classList.toggle('dark', theme === 'dark');
        }
    }, [theme]);

    return (
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <button
                disabled={isPending}
                onClick={() => handleThemeChange('light')}
                className={`p-1 rounded ${theme === 'light' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                title="Light Mode"
            >
                <Sun size={16} />
            </button>
            <button
                disabled={isPending}
                onClick={() => handleThemeChange('dark')}
                className={`p-1 rounded ${theme === 'dark' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                title="Dark Mode"
            >
                <Moon size={16} />
            </button>
            <button
                disabled={isPending}
                onClick={() => handleThemeChange('system')}
                className={`p-1 rounded ${theme === 'system' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                title="System Mode"
            >
                <Monitor size={16} />
            </button>
        </div>
    );
}
