'use server';

import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { SupabaseServiceOfferingRepository } from '@/infra/repositories/SupabaseServiceOfferingRepository';
import { SupabaseProjectRepository } from '@/infra/repositories/SupabaseProjectRepository';
import { SupabaseGroupRepository } from '@/infra/repositories/SupabaseGroupRepository';
import { ServiceOffering, Company, Project, Group } from '@/core/domain/types';
import { revalidatePath } from 'next/cache';

const repo = new SupabaseServiceOfferingRepository();
const projectRepo = new SupabaseProjectRepository();
const groupRepo = new SupabaseGroupRepository();

async function getContext() {
    const ctx = await resolveAuthContext();
    if (!ctx || !ctx.tenantContext) throw new Error('Unauthorized or Tenant Context Missing');
    return ctx;
}

// --- Service Offering Actions ---

export async function getServiceOfferings(): Promise<ServiceOffering[]> {
    const ctx = await getContext();
    return await repo.getServiceOfferings(ctx.tenantContext.tenantId);
}

export async function getServiceOffering(offeringId: string): Promise<ServiceOffering | null> {
    const ctx = await getContext();
    return await repo.getServiceOffering(ctx.tenantContext.tenantId, offeringId);
}

export async function createServiceOffering(formData: FormData): Promise<ServiceOffering> {
    const ctx = await getContext();
    const name = formData.get('name') as string;
    const projectId = formData.get('projectId') as string;
    const ownerGroupId = formData.get('ownerGroupId') as string;

    if (!name || !projectId || !ownerGroupId) throw new Error('Missing required fields');

    const offering = await repo.createServiceOffering(ctx.tenantContext.tenantId, projectId, name, ownerGroupId);

    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/service-offerings`);
    return offering;
}

export async function deleteServiceOffering(offeringId: string): Promise<void> {
    const ctx = await getContext();
    await repo.deleteServiceOffering(ctx.tenantContext.tenantId, offeringId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/service-offerings`);
}

// --- Company Linking Actions ---

export async function linkCompany(offeringId: string, companyId: string): Promise<void> {
    const ctx = await getContext();
    await repo.linkCompanyToServiceOffering(ctx.tenantContext.tenantId, offeringId, companyId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/service-offerings/${offeringId}`);
}

export async function unlinkCompany(offeringId: string, companyId: string): Promise<void> {
    const ctx = await getContext();
    await repo.unlinkCompanyFromServiceOffering(ctx.tenantContext.tenantId, offeringId, companyId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/service-offerings/${offeringId}`);
}

export async function getServiceOfferingCompanies(offeringId: string): Promise<Company[]> {
    const ctx = await getContext();
    return await repo.getServiceOfferingCompanies(ctx.tenantContext.tenantId, offeringId);
}

// --- Helpers for Dropdowns ---

export async function getProjects(): Promise<Project[]> {
    const ctx = await getContext();
    return await projectRepo.getProjects(ctx.tenantContext.tenantId);
}

export async function getGroups(): Promise<Group[]> {
    const ctx = await getContext();
    return await groupRepo.getGroups(ctx.tenantContext.tenantId);
}

export async function getProjectCompanies(projectId: string): Promise<Company[]> {
    // Need this to find available companies for the offering
    // Constraint: Company must be in Project
    const ctx = await getContext();
    return await projectRepo.getProjectCompanies(ctx.tenantContext.tenantId, projectId);
}
