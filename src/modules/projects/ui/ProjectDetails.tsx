import React from 'react';
import { getProject, getProjectCompanies, getOrgCompanies } from '../actions';
import { ProjectCompanyManager } from './ProjectCompanyManager';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface ProjectDetailsProps {
    tenantSlug?: string;
    slug?: string[];
}

export const ProjectDetails = async ({ tenantSlug, slug }: ProjectDetailsProps) => {
    // slug=['projects', 'project_id']
    if (!slug || slug.length < 2) return <div>Invalid URL</div>;

    const projectId = slug[1];

    const project = await getProject(projectId);
    if (!project) notFound();

    // Fetch assigned and organization companies
    const [assigned, orgCompanies] = await Promise.all([
        getProjectCompanies(projectId),
        getOrgCompanies(project.organization_id)
    ]);

    // Filter available companies (those in Org but NOT in assigned)
    const assignedIds = new Set(assigned.map(c => c.id));
    const available = orgCompanies.filter(c => !assignedIds.has(c.id));

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link href={`/admin/t/${tenantSlug}/projects`} className="text-indigo-600 hover:text-indigo-900">
                    &larr; Back to Projects
                </Link>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
                <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        {project.name}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Project Details
                    </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                    <dl className="sm:divide-y sm:divide-gray-200">
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{project.organization_id}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            <ProjectCompanyManager
                projectId={project.id}
                assignedCompanies={assigned}
                availableCompanies={available}
            />
        </div>
    );
};
