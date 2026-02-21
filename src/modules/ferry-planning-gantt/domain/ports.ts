import type { FerryTrip, GanttRow, GanttTask } from "./types";

export interface ICalendarRepository {
    getTrips(tenantId: string, startDate: string, endDate: string): Promise<FerryTrip[]>;
}

export interface IGanttService {
    getGanttData(tenantId: string, startDate: string, endDate: string): Promise<GanttRow[]>;
}
