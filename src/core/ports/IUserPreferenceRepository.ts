export interface IUserPreferenceRepository {
    getTheme(userId: string): Promise<string | null>;
    setTheme(userId: string, theme: 'light' | 'dark' | 'system'): Promise<void>;
}
