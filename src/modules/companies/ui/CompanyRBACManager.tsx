'use client';

import React, { useState } from 'react';
import { CompanyRole, CompanyUser } from '@/core/domain/types';
import { createCompanyRole, deleteCompanyRole, addCompanyUser, removeCompanyUser } from '../actions';

interface CompanyRBACManagerProps {
    companyId: string;
    initialRoles: CompanyRole[];
    initialUsers: CompanyUser[];
}

export const CompanyRBACManager = ({ companyId, initialRoles, initialUsers }: CompanyRBACManagerProps) => {
    // In strict architectural mode, we rely on Server Actions + Revalidation.
    // Next.js handles the UI update.

    const [isCreating, setIsCreating] = useState(false);

    // Roles Management
    const handleCreateRole = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await createCompanyRole(companyId, formData);
            e.currentTarget.reset();
        } catch (err: any) {
            alert('Failed to create role: ' + err.message);
        }
    };

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Delete this role?')) return;
        try {
            await deleteCompanyRole(companyId, roleId);
        } catch (err: any) {
            alert('Failed to delete role: ' + err.message);
        }
    };

    // User Assignment Management
    const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await addCompanyUser(companyId, formData);
            e.currentTarget.reset();
        } catch (err: any) {
            alert('Failed to add user: ' + err.message);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!confirm('Remove this user from the company?')) return;
        try {
            await removeCompanyUser(companyId, userId);
        } catch (err: any) {
            alert('Failed to remove user: ' + err.message);
        }
    };

    return (
        <div className="space-y-8 mt-8">
            {/* Roles Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Roles Management</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Define custom roles.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <form onSubmit={handleCreateRole} className="mb-6 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">New Role Name</label>
                            <input name="name" required placeholder="e.g. Viewer" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm" />
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Create Role</button>
                    </form>

                    <h4 className="text-md font-medium text-gray-900 mb-4">Existing Roles</h4>
                    <ul className="divide-y divide-gray-200">
                        {initialRoles.map((role) => (
                            <li key={role.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{role.name}</p>
                                    <p className="text-xs text-gray-500">ID: {role.id}</p>
                                </div>
                                <button onClick={() => handleDeleteRole(role.id)} className="text-red-600 hover:text-red-900 text-sm">Delete</button>
                            </li>
                        ))}
                        {initialRoles.length === 0 && <p className="text-sm text-gray-500">No roles found.</p>}
                    </ul>
                </div>
            </div>

            {/* Users Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">User Assignments</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Assign users to roles.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <form onSubmit={handleAddUser} className="mb-6 flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">User ID</label>
                            <input name="userId" required placeholder="User UUID" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">Role</label>
                            <select name="roleId" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm">
                                <option value="">Select Role...</option>
                                {initialRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Add User</button>
                    </form>

                    <h4 className="text-md font-medium text-gray-900 mb-4">Assigned Users</h4>
                    <ul className="divide-y divide-gray-200">
                        {initialUsers.map((u) => {
                            const roleName = initialRoles.find(r => r.id === u.role_id)?.name || u.role_id;
                            return (
                                <li key={u.user_id + u.role_id} className="py-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">User: {u.user_id}</p>
                                        <p className="text-xs text-gray-500">Role: {roleName}</p>
                                    </div>
                                    <button onClick={() => handleRemoveUser(u.user_id)} className="text-red-600 hover:text-red-900 text-sm">Remove</button>
                                </li>
                            );
                        })}
                        {initialUsers.length === 0 && <p className="text-sm text-gray-500">No users assigned.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};
