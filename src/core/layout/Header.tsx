import Link from 'next/link';

export function Header() {
    return (
        <header className="h-12 bg-blue-950 dark:bg-black border-b border-blue-900/50 dark:border-zinc-800 text-white flex items-center px-4 shadow-md z-50 sticky top-0 font-sans transition-colors duration-300">
            <div className="flex items-center gap-2">
                <Link
                    href="/admin"
                    className="flex items-center gap-2 font-bold text-lg hover:text-blue-200 transition-colors"
                >
                    {/* Simple Icon Placeholder */}
                    <div className="w-5 h-5 bg-blue-500 rounded-sm" />
                    FerryAdmin
                </Link>
            </div>

            <nav className="ml-auto flex items-center gap-4">
                {/* Static User Placeholder */}
                <div className="flex items-center gap-2 border-l border-blue-800 dark:border-zinc-800 pl-4 ml-2">
                    <div className="text-sm">
                        <div className="font-medium leading-none">Admin User</div>
                        <div className="text-xs text-blue-300">admin@example.com</div>
                    </div>
                    <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                        A
                    </div>
                </div>
            </nav>
        </header>
    );
}
