

export type { PriceProfile, CreateProfileDTO, UpdateProfileDTO } from "./types";
import { PriceProfile, CreateProfileDTO, UpdateProfileDTO } from "./types";


export interface IPricingRepository {
    findAllProfiles(tenantId: string): Promise<PriceProfile[]>;
    findProfileById(tenantId: string, id: string): Promise<PriceProfile | null>;
    createProfile(tenantId: string, profile: CreateProfileDTO): Promise<string>;
    updateProfile(tenantId: string, id: string, data: UpdateProfileDTO): Promise<void>;
    deleteProfile(tenantId: string, id: string): Promise<void>;
}
