
export type { ScheduleTemplate, CreateTemplateDTO, UpdateTemplateDTO, GanttRow, GanttTask } from "./types";
import { ScheduleTemplate, CreateTemplateDTO, UpdateTemplateDTO, GanttRow, GanttTask } from "./types";

export interface ITemplateRepository {
    findAll(tenantId: string): Promise<ScheduleTemplate[]>;
    findById(tenantId: string, id: string): Promise<ScheduleTemplate | null>;
    create(tenantId: string, template: CreateTemplateDTO): Promise<string>;
    update(tenantId: string, id: string, data: UpdateTemplateDTO): Promise<void>;
    delete(tenantId: string, id: string): Promise<void>;
}

export interface IGanttService {
    getGanttData(tenantId: string, startDate: string, endDate: string): Promise<GanttRow[]>;
}
