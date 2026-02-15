import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MenuItem } from '../menu';

interface AdminLayoutProps {
    children: ReactNode;
    menuItems: MenuItem[];
}

export function AdminLayout({ children, menuItems }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col font-sans">
            <Header />
            <div className="flex flex-1">
                <Sidebar menuItems={menuItems} />
                <main className="flex-1 p-4 md:p-6 w-full animate-in fade-in duration-500 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
