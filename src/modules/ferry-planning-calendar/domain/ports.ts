import type { FerryTrip } from "./types";

export interface ICalendarRepository {
    getTrips(tenantId: string, startDate: string, endDate: string): Promise<FerryTrip[]>;
}
