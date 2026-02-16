import React from 'react';
import { getOrganizations, getGroups } from '../actions';
import { OrganizationTable } from './OrganizationTable';
import { OrganizationForm } from './OrganizationForm';

export const OrganizationList = async () => {
    const [organizations, groups] = await Promise.all([
        getOrganizations(),
        getGroups()
    ]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                    <p className="text-gray-500">Manage hierarchal organizations for this tenant.</p>
                </div>
            </div>

            <OrganizationForm groups={groups} />
            <OrganizationTable orgs={organizations} />
        </div>
    );
};
