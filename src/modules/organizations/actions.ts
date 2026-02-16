// mateusz poponczyk
'use server'

import { resolveAuthContext } from '@/core/context/resolveAuthContext';
import { SupabaseOrganizationRepository } from '@/infra/repositories/SupabaseOrganizationRepository';
import { SupabaseGroupRepository } from '@/infra/repositories/SupabaseGroupRepository';
import { Organization, Company, Group } from '@/core/domain/types';
import { revalidatePath } from 'next/cache';

const repo = new SupabaseOrganizationRepository();
const groupRepo = new SupabaseGroupRepository();

async function getContext() {
    // Implicit resolution via Cookie/Header
    const ctx = await resolveAuthContext();
    if (!ctx || !ctx.tenantContext) throw new Error('Unauthorized or Tenant Context Missing');
    return ctx;
}

export async function getGroups(): Promise<Group[]> {
    const ctx = await getContext();
    return await groupRepo.getGroups(ctx.tenantContext.tenantId);
}

export async function getOrganizations(): Promise<Organization[]> {
    const ctx = await getContext();
    return await repo.getOrganizations(ctx.tenantContext.tenantId);
}

export async function createOrganization(formData: FormData): Promise<Organization> {
    const ctx = await getContext();
    const name = formData.get('name') as string;
    const ownerGroupId = formData.get('ownerGroupId') as string;

    if (!name || !ownerGroupId) throw new Error('Missing required fields');

    const org = await repo.createOrganization(ctx.tenantContext.tenantId, name, ownerGroupId);

    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/organizations`);
    return org;
}

export async function updateOrganization(orgId: string, formData: FormData): Promise<void> {
    const ctx = await getContext();
    const name = formData.get('name') as string | undefined;
    const ownerGroupId = formData.get('ownerGroupId') as string | undefined;

    await repo.updateOrganization(ctx.tenantContext.tenantId, orgId, name, ownerGroupId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/organizations`);
}

export async function deleteOrganization(orgId: string): Promise<void> {
    const ctx = await getContext();
    await repo.deleteOrganization(ctx.tenantContext.tenantId, orgId);
    revalidatePath(`/admin/t/${ctx.tenantContext.slug}/organizations`);
}

export async function getOrgCompanies(orgId: string): Promise<Company[]> {
    const ctx = await getContext();
    return await repo.getOrgCompanies(ctx.tenantContext.tenantId, orgId);
}
