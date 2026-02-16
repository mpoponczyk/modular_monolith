'use client';

import React, { useState } from 'react';
import { Company } from '@/core/domain/types';
import { linkCompany, unlinkCompany } from '../actions';

interface ProjectCompanyManagerProps {
    projectId: string;
    assignedCompanies: Company[];
    availableCompanies: Company[];
}

export const ProjectCompanyManager = ({
    projectId,
    assignedCompanies,
    availableCompanies
}: ProjectCompanyManagerProps) => {
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLink = async () => {
        if (!selectedCompanyId) return;
        setIsLoading(true);
        try {
            await linkCompany(projectId, selectedCompanyId);
            setSelectedCompanyId('');
        } catch (e: any) {
            alert('Failed to link company: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUnlink = async (companyId: string) => {
        if (!confirm('Unlink this company from the project?')) return;
        try {
            await unlinkCompany(projectId, companyId);
        } catch (e: any) {
            alert('Failed to unlink: ' + e.message);
        }
    };

    return (
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Participating Companies</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage companies assigned to this project.</p>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                {/* Link Form */}
                <div className="flex gap-4 items-end mb-6">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Add Company</label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                        >
                            <option value="">Select a company...</option>
                            {availableCompanies.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleLink}
                        disabled={!selectedCompanyId || isLoading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isLoading ? 'Adding...' : 'Add'}
                    </button>
                </div>

                {/* List */}
                <h4 className="text-md font-medium text-gray-900 mb-4">Assigned Companies</h4>
                <ul className="divide-y divide-gray-200">
                    {assignedCompanies.length === 0 ? (
                        <p className="text-sm text-gray-500">No companies assigned.</p>
                    ) : (
                        assignedCompanies.map((company) => (
                            <li key={company.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                                    <p className="text-xs text-gray-500">ID: {company.id}</p>
                                </div>
                                <button
                                    onClick={() => handleUnlink(company.id)}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                >
                                    Remove
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};
