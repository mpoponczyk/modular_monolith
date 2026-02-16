// mateusz poponczyk
import React from 'react';
import { getServiceOffering, getServiceOfferingCompanies, getProjectCompanies } from '../actions';
import { ServiceOfferingCompanyManager } from './ServiceOfferingCompanyManager';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ServiceOfferingDetailsProps {
    tenantSlug?: string;
    slug?: string[];
}

export const ServiceOfferingDetails = async ({ tenantSlug, slug }: ServiceOfferingDetailsProps) => {
    // slug=['service-offerings', 'offering_id']
    if (!slug || slug.length < 2) return <div>Invalid URL</div>;

    const offeringId = slug[1];

    const offering = await getServiceOffering(offeringId);
    if (!offering) notFound();

    // Fetch assigned and project companies
    const [assigned, projectCompanies] = await Promise.all([
        getServiceOfferingCompanies(offeringId),
        getProjectCompanies(offering.project_id)
    ]);

    // Filter available companies
    const assignedIds = new Set(assigned.map(c => c.id));
    const available = projectCompanies.filter(c => !assignedIds.has(c.id));

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href={`/admin/t/${tenantSlug}/service-offerings`} className="text-indigo-600 hover:text-indigo-900">
                    &larr; Back to Offerings
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {offering.name}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Service Offering Details
                    </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Project ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{offering.project_id}</dd>
                        </div>
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Owner Group ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{offering.owner_group_id}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <ServiceOfferingCompanyManager
                offeringId={offering.id}
                assignedCompanies={assigned}
                availableCompanies={available}
            />
        </div>
    );
};
