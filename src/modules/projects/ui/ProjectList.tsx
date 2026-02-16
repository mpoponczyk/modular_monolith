// mateusz poponczyk
import React from 'react';
import { getProjects, getOrganizations } from '../actions';
import { ProjectTable } from './ProjectTable';
import { ProjectForm } from './ProjectForm';

interface ProjectListProps {
    tenantSlug?: string;
    slug?: string[];
}

export const ProjectList = async ({ tenantSlug }: ProjectListProps) => {
    if (!tenantSlug) return <div>Error: Missing Tenant Context</div>;

    const [projects, organizations] = await Promise.all([
        getProjects(),
        getOrganizations()
    ]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
                    <p className="text-gray-500">Manage projects and their company assignments.</p>
                </div>
            </div>

            <ProjectForm organizations={organizations} />
            <ProjectTable projects={projects} tenantSlug={tenantSlug} />
        </div>
    );
};
