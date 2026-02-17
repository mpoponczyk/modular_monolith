
'use server';

import { SectionService } from './application/SectionService';
import { revalidatePath } from 'next/cache';

// Actions for UI interaction (Server Actions)

export async function createSectionAction(
    tenantId: string,
    orgId: string,
    translations: Record<string, string>
) {
    try {
        await SectionService.createSection(tenantId, orgId, translations);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateSectionAction(
    tenantId: string,
    orgId: string,
    sectionId: string,
    translations: Record<string, string>,
    isPartial: boolean = true
) {
    try {
        await SectionService.updateSection(tenantId, orgId, sectionId, translations, isPartial);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteSectionAction(
    tenantId: string,
    orgId: string,
    sectionId: string
) {
    try {
        await SectionService.deleteSection(tenantId, orgId, sectionId);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function reorderSectionsAction(
    tenantId: string,
    orgId: string,
    sectionIds: string[]
) {
    try {
        await SectionService.reorderSections(tenantId, orgId, sectionIds);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function linkAppAction(
    tenantId: string,
    orgId: string,
    sectionId: string,
    moduleId: string
) {
    try {
        await SectionService.linkApp(tenantId, orgId, sectionId, moduleId);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function unlinkItemAction(
    tenantId: string,
    orgId: string,
    itemId: string
) {
    try {
        await SectionService.unlinkItem(tenantId, orgId, itemId);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function reorderItemsAction(
    tenantId: string,
    orgId: string,
    sectionId: string,
    itemIds: string[]
) {
    try {
        await SectionService.reorderItems(tenantId, orgId, sectionId, itemIds);
        revalidatePath('/admin/menu');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
