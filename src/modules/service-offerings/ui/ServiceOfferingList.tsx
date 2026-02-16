// mateusz poponczyk
import React from 'react';
import { getServiceOfferings, getProjects, getGroups } from '../actions';
import { ServiceOfferingTable } from './ServiceOfferingTable';
import { ServiceOfferingForm } from './ServiceOfferingForm';

interface ServiceOfferingListProps {
    tenantSlug?: string;
    slug?: string[];
}

export const ServiceOfferingList = async ({ tenantSlug }: ServiceOfferingListProps) => {
    if (!tenantSlug) return <div>Error: Missing Tenant Context</div>;

    const [offerings, projects, groups] = await Promise.all([
        getServiceOfferings(),
        getProjects(),
        getGroups()
    ]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Offerings</h1>
                    <p className="text-gray-500">Manage service offerings linked to projects.</p>
                </div>
            </div>

            <ServiceOfferingForm projects={projects} groups={groups} />
            <ServiceOfferingTable offerings={offerings} tenantSlug={tenantSlug} />
        </div>
    );
};
