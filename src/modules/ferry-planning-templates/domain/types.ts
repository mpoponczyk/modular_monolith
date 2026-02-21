
export interface ScheduleTemplate {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTemplateDTO {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface UpdateTemplateDTO {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}

export interface GanttRow {
    resourceId: string; // Ferry ID
    resourceName: string;
    tasks: GanttTask[]; // Trips
}

export interface GanttTask {
    id: string; // Trip ID
    label: string; // Route Name
    startTime: string;
    endTime: string;
    color?: string;
    status: string;
}
