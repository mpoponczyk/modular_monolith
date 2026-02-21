import { IFerryRouteRepository } from "../domain/ports";
import { FerryRoute } from "../domain/types";

export class FerryBookingService {
    constructor(private routeRepo: IFerryRouteRepository) { }

    async getRoutes(tenantId: string): Promise<FerryRoute[]> {
        return this.routeRepo.findAll(tenantId);
    }

    async getRouteById(tenantId: string, id: string): Promise<FerryRoute | null> {
        return this.routeRepo.findById(tenantId, id);
    }

    async createRoute(tenantId: string, route: Omit<FerryRoute, 'id' | 'tenantId' | 'isActive' | 'origin' | 'destination' | 'defaultFerry'>): Promise<string> {
        return this.routeRepo.create(tenantId, route);
    }

    async updateRoute(tenantId: string, routeId: string, route: Partial<FerryRoute>): Promise<void> {
        return this.routeRepo.update(tenantId, routeId, route);
    }

    async getLocations(tenantId: string) {
        return this.routeRepo.getLocations(tenantId);
    }

    async getFerries(tenantId: string) {
        return this.routeRepo.getFerries(tenantId);
    }
}
