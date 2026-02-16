// mateusz poponczyk
import { createAuthClient } from '@/infra/supabase/server-auth';
import { IGroupRepository } from '@/core/application/ports/IGroupRepository';
import { Group, GroupMember } from '@/core/domain/types';

export class SupabaseGroupRepository implements IGroupRepository {
    async getGroups(tenantId: string): Promise<Group[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data as Group[];
    }

    async getGroup(tenantId: string, groupId: string): Promise<Group | null> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 is "Row not found"
        return data as Group | null;
    }

    async createGroup(tenantId: string, name: string): Promise<Group> {
        const supabase = createAuthClient();
        const { data: id, error } = await supabase.rpc('create_group', {
            p_tenant_id: tenantId,
            p_name: name
        });

        if (error) throw new Error(error.message);

        const group = await this.getGroup(tenantId, id);
        if (!group) throw new Error('Group created but not found');
        return group;
    }

    async renameGroup(tenantId: string, groupId: string, name: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('rename_group', {
            p_tenant_id: tenantId,
            p_group_id: groupId,
            p_name: name
        });

        if (error) throw new Error(error.message);
    }

    async deleteGroup(tenantId: string, groupId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('delete_group', {
            p_tenant_id: tenantId,
            p_group_id: groupId
        });

        if (error) throw new Error(error.message);
    }

    async addGroupMember(tenantId: string, groupId: string, userId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('add_group_member', {
            p_tenant_id: tenantId,
            p_group_id: groupId,
            p_user_id: userId
        });

        if (error) throw new Error(error.message);
    }

    async removeGroupMember(tenantId: string, groupId: string, userId: string): Promise<void> {
        const supabase = createAuthClient();
        const { error } = await supabase.rpc('remove_group_member', {
            p_tenant_id: tenantId,
            p_group_id: groupId,
            p_user_id: userId
        });

        if (error) throw new Error(error.message);
    }

    async getGroupMembers(tenantId: string, groupId: string): Promise<GroupMember[]> {
        const supabase = createAuthClient();
        const { data, error } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId)
            .eq('tenant_id', tenantId);

        if (error) throw new Error(error.message);
        return data as GroupMember[];
    }
}
