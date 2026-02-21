import { FerryRoute } from "./types";

export interface IFerryRouteRepository {
    findAll(tenantId: string): Promise<FerryRoute[]>;
    findById(tenantId: string, id: string): Promise<FerryRoute | null>;
    create(tenantId: string, route: Omit<FerryRoute, 'id' | 'tenantId' | 'isActive' | 'origin' | 'destination' | 'defaultFerry'>): Promise<string>;
    update(tenantId: string, id: string, route: Partial<FerryRoute>): Promise<void>;
    delete(tenantId: string, id: string): Promise<void>;
    getLocations(tenantId: string): Promise<{ id: string; name: string }[]>;
    getFerries(tenantId: string): Promise<{ id: string; name: string }[]>;
}
