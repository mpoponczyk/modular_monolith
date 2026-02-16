// mateusz poponczyk
import { ReactNode } from 'react';

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    // START: Pass-through wrapper.
    // Tenant resolution happens in t/[tenantSlug]/layout.tsx
    // Root handling happens in admin/[[...slug]]/page.tsx
    return (
        <>
            {children}
        </>
    );
}
