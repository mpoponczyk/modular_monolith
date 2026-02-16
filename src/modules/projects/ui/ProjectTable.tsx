'use client';

import React, { useState } from 'react';
import { Project } from '@/core/domain/types';
import { deleteProject } from '../actions';
import Link from 'next/link';

interface ProjectTableProps {
    projects: Project[];
    tenantSlug: string;
}

export const ProjectTable = ({ projects, tenantSlug }: ProjectTableProps) => {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        setIsDeleting(id);
        try {
            await deleteProject(id);
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {projects.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                No projects found.
                            </td>
                        </tr>
                    ) : (
                        projects.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                    <Link href={`/admin/t/${tenantSlug}/projects/${project.id}`}>
                                        {project.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{project.organization_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        disabled={isDeleting === project.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        {isDeleting === project.id ? 'Deleting...' : 'Delete'}
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
