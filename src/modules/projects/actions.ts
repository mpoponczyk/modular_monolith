// mateusz poponczyk
'use server';

import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { SupabaseProjectRepository } from '@/infra/repositories/SupabaseProjectRepository';
import { SupabaseOrganizationRepository } from '@/infra/repositories/SupabaseOrganizationRepository';
import { Project, Company, Organization } from '@/core/domain/types';
import { revalidatePath } from 'next/cache';

const repo = new SupabaseProjectRepository();
const orgRepo = new SupabaseOrganizationRepository();

async function getContext() {
    const ctx = await resolveAuthContext();
    if (!ctx || !ctx.tenantContext) throw new Error('Unauthorized or Tenant Context Missing');
    return ctx;
}

// --- Project Actions ---

export async function getProjects(): Promise<Project[]> {
    const ctx = await getContext();
    return await repo.getProjects(ctx.tenantContext.tenantId);
}

export async function getProject(projectId: string): Promise<Project | null> {
    const ctx = await getContext();
    return await repo.getProject(ctx.tenantContext.tenantId, projectId);
}

export async function createProject(formData: FormData): Promise<Project> {
    const ctx = await getContext();
    const name = formData.get('name') as string;
    const organizationId = formData.get('organizationId') as string;

    if (!name || !organizationId) throw new Error('Missing required fields');

    const project = await repo.createProject(ctx.tenantContext.tenantId, organizationId, name);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/projects`);
    return project;
}

export async function deleteProject(projectId: string): Promise<void> {
    const ctx = await getContext();
    await repo.deleteProject(ctx.tenantContext.tenantId, projectId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/projects`);
}

// --- Company Assignment Actions ---

export async function linkCompany(projectId: string, companyId: string): Promise<void> {
    const ctx = await getContext();
    await repo.linkCompanyToProject(ctx.tenantContext.tenantId, projectId, companyId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/projects/${projectId}`);
}

export async function unlinkCompany(projectId: string, companyId: string): Promise<void> {
    const ctx = await getContext();
    await repo.unlinkCompanyFromProject(ctx.tenantContext.tenantId, projectId, companyId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/projects/${projectId}`);
}

export async function getProjectCompanies(projectId: string): Promise<Company[]> {
    const ctx = await getContext();
    return await repo.getProjectCompanies(ctx.tenantContext.tenantId, projectId);
}

// --- Helper Actions (for Dropdowns) ---

export async function getOrganizations(): Promise<Organization[]> {
    const ctx = await getContext();
    return await orgRepo.getOrganizations(ctx.tenantContext.tenantId);
}

export async function getOrgCompanies(orgId: string): Promise<Company[]> {
    // Used to list companies AVAILABLE to be linked to the project
    // Constraint: Project belongs to Org X. Only companies in Org X can be linked.
    const ctx = await getContext();
    return await orgRepo.getOrgCompanies(ctx.tenantContext.tenantId, orgId);
}
