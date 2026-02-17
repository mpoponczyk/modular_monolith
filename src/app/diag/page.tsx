import { createAuthClient } from '@/infra/supabase/server-auth';

export default async function DiagPage() {
    // 1. Basic Render Check
    console.log("[DIAG] Rendering DiagPage...");

    // 2. Env Var Check
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log(`[DIAG] URL: ${url}, Has Key: ${hasKey}`);

    // 3. Cookie/Supabase Check
    let authStatus = "Not Checked";
    try {
        const supabase = createAuthClient();
        const { data, error } = await supabase.auth.getUser();
        authStatus = error ? `Error: ${error.message}` : `User: ${data.user?.id || 'None'}`;
    } catch (e: any) {
        authStatus = `Exception: ${e.message}`;
        console.error("[DIAG] Supabase Exception:", e);
    }

    return (
        <div className="p-10 font-mono space-y-4">
            <h1 className="text-2xl font-bold">Diagnostics</h1>
            <div>
                <strong>Supabase URL:</strong> {url || "MISSING"}
            </div>
            <div>
                <strong>Anon Key:</strong> {hasKey ? "PRESENT" : "MISSING"}
            </div>
            <div>
                <strong>Auth Status:</strong> {authStatus}
            </div>
            <div className="p-4 bg-blue-100 text-blue-900 rounded">
                If you see this, Tailwind is working.
            </div>
        </div>
    );
}
