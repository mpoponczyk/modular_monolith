// mateusz poponczyk
import React from 'react';
import { getCompanies } from '../actions';
import { CompanyTable } from './CompanyTable';
import { CompanyForm } from './CompanyForm';

interface CompanyListProps {
    tenantSlug?: string;
    slug?: string[];
}

export const CompanyList = async ({ tenantSlug }: CompanyListProps) => {
    // If tenantSlug is missing (shouldn't happen in t/... route), we can't link properly.
    if (!tenantSlug) return <div>Error: Missing Tenant Context</div>;

    const companies = await getCompanies();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
                    <p className="text-gray-500">Manage legal entities and their RBAC.</p>
                </div>
            </div>

            <CompanyForm />
            <CompanyTable companies={companies} tenantSlug={tenantSlug} />
        </div>
    );
};
