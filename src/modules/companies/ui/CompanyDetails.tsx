// mateusz poponczyk
import React from 'react';
import { getCompany, getCompanyRoles, getCompanyUsers } from '../actions';
import { CompanyRBACManager } from './CompanyRBACManager';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CompanyDetailsProps {
    tenantSlug?: string;
    slug?: string[];
}

export const CompanyDetails = async ({ tenantSlug, slug }: CompanyDetailsProps) => {
    // Expect slug to be ['companies', 'company_id', ...]
    if (!slug || slug.length < 2) {
        return <div>Invalid URL</div>;
    }

    // We might have deeper routes like /companies/123/users, but assuming flat for now
    // based on routes.ts { path: '*' }
    // slug[0] is 'companies' (or whatever the module id is mounted at? No, resolveRoute consumes the module ID)
    // Wait. In TenantPage:
    // const { module, route } = match;
    // The slug passed to resolveRoute is the FULL slug from params.
    // resolveRoute consumes: [moduleId, ...rest]

    // TenantPage calls match = resolveRoute(slug).
    // match.module is the found module.
    // match.route is the route definition.
    // TenantPage passes the ORIGINAL slug to Component.

    // So if URL is /admin/t/slug/companies/123
    // slug = ['companies', '123']
    // companyId = slug[1]

    const companyId = slug[1];

    const [company, roles, users] = await Promise.all([
        getCompany(companyId),
        getCompanyRoles(companyId),
        getCompanyUsers(companyId)
    ]);

    if (!company) {
        notFound();
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href={`/admin/t/${tenantSlug}/companies`} className="text-indigo-600 hover:text-indigo-900">
                    &larr; Back to Companies
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {company.name}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Details and settings.
                    </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Company ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{company.id}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Tenant ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{company.tenant_id}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <CompanyRBACManager companyId={company.id} initialRoles={roles} initialUsers={users} />
        </div>
    );
};
