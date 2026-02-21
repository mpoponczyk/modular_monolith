
export interface PriceProfile {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    basePriceAdult: number;
    basePriceChild: number;
    basePriceVehicle: number;
    basePriceBike: number;
    currency: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SeasonalityRule {
    id: string;
    tenantId: string;
    name: string;
    startDate: string; // MM-DD ideally, or full date
    endDate: string;
    multiplier: number; // e.g. 1.2 for 20% increase
}

export interface CreateProfileDTO {
    name: string;
    description?: string;
    basePriceAdult: number;
    basePriceChild: number;
    basePriceVehicle: number;
    basePriceBike: number;
    currency: string;
    isActive: boolean;
}

export interface UpdateProfileDTO {
    name?: string;
    description?: string;
    basePriceAdult?: number;
    basePriceChild?: number;
    basePriceVehicle?: number;
    basePriceBike?: number;
    currency?: string;
    isActive?: boolean;
}
