
import { createAuthClient } from "@/infra/supabase/server-auth";
import { IPartnerRepository, CreatePartnerDTO, UpdatePartnerDTO, Partner } from "../domain/ports";

export class SupabasePartnerRepository implements IPartnerRepository {
    private client: any;

    constructor(client?: any) {
        this.client = client;
    }

    private get supabase() {
        return this.client || createAuthClient();
    }

    async findAll(tenantId: string): Promise<Partner[]> {
        const { data, error } = await this.supabase
            .from('mnt_partners') // Use mnt_ prefix
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name'); // Alphabetical order by default

        if (error) throw error;
        return data.map((p: any) => this.mapToDomain(p));
    }

    async findById(tenantId: string, id: string): Promise<Partner | null> {
        const { data, error } = await this.supabase
            .from('mnt_partners')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapToDomain(data);
    }

    async create(tenantId: string, partner: CreatePartnerDTO): Promise<string> {
        const { data, error } = await this.supabase.rpc('create_partner', {
            p_tenant_id: tenantId,
            p_name: partner.name,
            p_email: partner.email || null,
            p_phone: partner.phone || null,
            p_commission_rate: partner.commissionRate || 0,
            p_is_active: partner.isActive ?? true,
            p_type: partner.type || 'SELLER',
            p_nip: partner.nip || null,
            p_address: partner.address || null,
            p_postal_code: partner.postalCode || null,
            p_city: partner.city || null
        });

        if (error) throw error;
        return data; // UUID
    }

    async update(tenantId: string, id: string, data: UpdatePartnerDTO): Promise<void> {
        // We pass all fields, utilizing nulls if undefined? 
        // Or we should fetch first? 
        // The RPC uses COALESCE, so we can pass null for undefined BUT undefined is not JSON serializable usually for RPC unless handled.
        // Actually, for RPC we should pass explicit values.
        // Let's pass undefined as null?
        // Or simpler: The DTO is Partial.
        // Since RPC expects all args, we need to pass strict values or handle logic here.
        // The RPC implementation I wrote does COALESCE(p_name, name).
        // If I pass NULL, it keeps existing.

        const { error } = await this.supabase.rpc('update_partner', {
            p_tenant_id: tenantId,
            p_partner_id: id,
            p_name: data.name || null,
            p_email: data.email || null,
            p_phone: data.phone || null,
            p_commission_rate: data.commissionRate ?? null,
            p_is_active: data.isActive ?? null,
            p_type: data.type || null,
            p_nip: data.nip || null,
            p_address: data.address || null,
            p_postal_code: data.postalCode || null,
            p_city: data.city || null
        });

        if (error) throw error;
    }

    async delete(tenantId: string, id: string): Promise<void> {
        const { error } = await this.supabase.rpc('delete_partner', {
            p_tenant_id: tenantId,
            p_partner_id: id
        });

        if (error) throw error;
    }

    private mapToDomain(raw: any): Partner {
        return {
            id: raw.id,
            tenantId: raw.tenant_id,
            name: raw.name,
            email: raw.email,
            phone: raw.phone,
            commissionRate: raw.commission_rate,
            isActive: raw.is_active,
            type: raw.type,
            nip: raw.nip,
            address: raw.address,
            postalCode: raw.postal_code,
            city: raw.city,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at
        };
    }
}
