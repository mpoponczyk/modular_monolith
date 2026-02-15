import Link from 'next/link';
import { MenuItem } from '../menu';

interface SidebarProps {
    menuItems: MenuItem[];
}

export function Sidebar({ menuItems }: SidebarProps) {
    return (
        <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 hidden md:flex flex-col h-[calc(100vh-3rem)] sticky top-12">
            <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Modules
                </h3>
                <nav className="space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.path}
                            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                        >
                            <span className="truncate">{item.name}</span>
                        </Link>
                    ))}
                    {menuItems.length === 0 && (
                        <div className="text-sm text-gray-400 italic px-3">
                            No active modules
                        </div>
                    )}
                </nav>
            </div>
        </aside>
    );
}
