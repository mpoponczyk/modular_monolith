'use client';

import React, { useState } from 'react';
import { Company } from '@/core/domain/types';
import { deleteCompany } from '../actions';
import Link from 'next/link';

interface CompanyTableProps {
    companies: Company[];
    tenantSlug: string;
}

export const CompanyTable = ({ companies, tenantSlug }: CompanyTableProps) => {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this company?')) return;

        setIsDeleting(id);
        try {
            await deleteCompany(id);
        } catch (e: any) {
            alert('Failed to delete: ' + e.message);
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
                <thead>
                    <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {companies.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                No companies found.
                            </td>
                        </tr>
                    ) : (
                        companies.map((company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                    <Link href={`/admin/t/${tenantSlug}/companies/${company.id}`}>
                                        {company.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                        onClick={() => handleDelete(company.id)}
                                        disabled={isDeleting === company.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        {isDeleting === company.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
