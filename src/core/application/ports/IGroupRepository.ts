import { Group, GroupMember } from '../../domain/types';

export interface IGroupRepository {
    getGroups(tenantId: string): Promise<Group[]>;
    getGroup(tenantId: string, groupId: string): Promise<Group | null>;
    createGroup(tenantId: string, name: string): Promise<Group>;
    renameGroup(tenantId: string, groupId: string, name: string): Promise<void>;
    deleteGroup(tenantId: string, groupId: string): Promise<void>;
    addGroupMember(tenantId: string, groupId: string, userId: string): Promise<void>;
    removeGroupMember(tenantId: string, groupId: string, userId: string): Promise<void>;
    getGroupMembers(tenantId: string, groupId: string): Promise<GroupMember[]>;
}
