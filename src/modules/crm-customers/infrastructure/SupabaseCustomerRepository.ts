
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/infra/database.types';
import { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../domain/types';

export class SupabaseCustomerRepository {
    constructor(private supabase: SupabaseClient<Database>) { }

    async findAll(tenantId: string): Promise<Customer[]> {
        const { data, error } = await this.supabase
            .from('crm_customers')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) {
            // If table doesn't exist yet, return empty to avoid crash during dev
            if (error.code === '42P01') return [];
            throw error;
        }

        return data.map((row: any) => this.mapToDomain(row));
    }

    async findById(tenantId: string, id: string): Promise<Customer | null> {
        const { data, error } = await this.supabase
            .from('crm_customers')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return this.mapToDomain(data);
    }

    async create(tenantId: string, dto: CreateCustomerDTO): Promise<string> {
        const { data, error } = await this.supabase
            .from('crm_customers')
            .insert({
                tenant_id: tenantId,
                first_name: dto.firstName,
                last_name: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                notes: dto.notes,
                source: dto.source || 'manual',
                is_active: dto.isActive
            })
            .select('id')
            .single();

        if (error) throw error;
        return (data as any).id;
    }

    async update(tenantId: string, id: string, dto: UpdateCustomerDTO): Promise<void> {
        const { error } = await this.supabase
            .from('crm_customers')
            .update({
                first_name: dto.firstName,
                last_name: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                notes: dto.notes,
                source: dto.source,
                is_active: dto.isActive,
                updated_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId)
            .eq('id', id);

        if (error) throw error;
    }

    async delete(tenantId: string, id: string): Promise<void> {
        const { error } = await this.supabase
            .from('crm_customers')
            .delete()
            .eq('tenant_id', tenantId)
            .eq('id', id);

        if (error) throw error;
    }

    private mapToDomain(row: any): Customer {
        return {
            id: row.id,
            tenantId: row.tenant_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            notes: row.notes,
            source: row.source,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}
