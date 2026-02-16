// mateusz poponczyk
'use server';

import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { SupabaseCompanyRepository } from '@/infra/repositories/SupabaseCompanyRepository';
import { SupabaseCompanyRbacRepository } from '@/infra/repositories/SupabaseCompanyRbacRepository';
import { Company, CompanyRole } from '@/core/domain/types';
import { revalidatePath } from 'next/cache';

const repo = new SupabaseCompanyRepository();
const rbacRepo = new SupabaseCompanyRbacRepository();

async function getContext() {
    const ctx = await resolveAuthContext();
    if (!ctx || !ctx.tenantContext) throw new Error('Unauthorized or Tenant Context Missing');
    return ctx;
}

// --- Company Core Actions ---

export async function getCompanies(): Promise<Company[]> {
    const ctx = await getContext();
    return await repo.getCompanies(ctx.tenantContext.tenantId);
}

export async function getCompany(companyId: string): Promise<Company | null> {
    const ctx = await getContext();
    return await repo.getCompany(ctx.tenantContext.tenantId, companyId);
}

export async function createCompany(formData: FormData): Promise<Company> {
    const ctx = await getContext();
    const name = formData.get('name') as string;

    if (!name) throw new Error('Company name is required');

    const company = await repo.createCompany(ctx.tenantContext.tenantId, name);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/companies`);
    return company;
}

export async function deleteCompany(companyId: string): Promise<void> {
    const ctx = await getContext();
    await repo.deleteCompany(ctx.tenantContext.tenantId, companyId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/companies`);
}

// --- Company RBAC Actions ---

export async function getCompanyRoles(companyId: string): Promise<CompanyRole[]> {
    const ctx = await getContext();
    return await rbacRepo.getCompanyRoles(ctx.tenantContext.tenantId, companyId);
}

export async function getCompanyUsers(companyId: string): Promise<any[]> {
    const ctx = await getContext();
    return await rbacRepo.getCompanyUsers(ctx.tenantContext.tenantId, companyId);
}

export async function createCompanyRole(companyId: string, formData: FormData): Promise<CompanyRole> {
    const ctx = await getContext();
    const name = formData.get('name') as string;

    if (!name) throw new Error('Role name is required');

    const role = await rbacRepo.createCompanyRole(ctx.tenantContext.tenantId, companyId, name);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/companies/${companyId}`);
    return role;
}

export async function deleteCompanyRole(companyId: string, roleId: string): Promise<void> {
    const ctx = await getContext();
    await rbacRepo.deleteCompanyRole(ctx.tenantContext.tenantId, companyId, roleId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/companies/${companyId}`);
}

export async function addCompanyUser(companyId: string, formData: FormData): Promise<void> {
    const ctx = await getContext();
    const userId = formData.get('userId') as string;
    const roleId = formData.get('roleId') as string;

    if (!userId || !roleId) throw new Error('User ID and Role ID are required');

    await rbacRepo.addCompanyUser(ctx.tenantContext.tenantId, companyId, userId, roleId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/companies/${companyId}`);
}

export async function removeCompanyUser(companyId: string, userId: string): Promise<void> {
    const ctx = await getContext();
    await rbacRepo.removeCompanyUser(ctx.tenantContext.tenantId, companyId, userId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/companies/${companyId}`);
}

// ... Additional RBAC actions (add user, grant perm) can be added as needed for the UI
