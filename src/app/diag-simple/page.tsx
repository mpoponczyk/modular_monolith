export default function DiagSimplePage() {
    return (
        <div style={{ padding: 50, fontFamily: 'monospace' }}>
            <h1>Simple Diagnostics</h1>
            <p>If you see this, Next.js is working.</p>
            <p>Supabase URL available: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'YES' : 'NO'}</p>
        </div>
    );
}
