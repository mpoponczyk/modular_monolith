
export interface SystemSettings {
    id: string;
    tenantId: string;
    theme: string;
    dateFormat: string;
    currency: string;
    emailSenderName?: string;
    emailSenderAddress?: string;
    supportPhone?: string;
    updatedAt: string;
}

export interface UpdateSettingsDTO {
    theme?: string;
    dateFormat?: string;
    currency?: string;
    emailSenderName?: string;
    emailSenderAddress?: string;
    supportPhone?: string;
}
