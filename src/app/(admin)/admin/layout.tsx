import { ReactNode } from 'react';
import { getMenuItems } from '@/core/menu';
import Link from 'next/link';

// Mock Contexts (Same as in page.tsx)
const mockTenantContext = {
    activeModuleIds: []
};

const mockUserContext = {
    roles: ['admin']
};

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const menuItems = getMenuItems(mockTenantContext, mockUserContext);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Dynamic Sidebar */}
            <aside className="w-64 bg-white shadow-md">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">Admin Panel</h2>
                </div>
                <nav className="p-4">
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={item.path}
                                    className="block p-2 rounded hover:bg-gray-50 text-gray-700"
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
