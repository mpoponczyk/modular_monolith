-- Schema ownership strictly for core-admin/sessions module.

-- Core table tracking active interactive sessions/devices.
CREATE TABLE IF NOT EXISTS public.auth_trusted_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_heartbeat_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_trusted BOOLEAN DEFAULT true,
    session_type TEXT DEFAULT 'browser', -- 'browser', 'mobile', 'api'
    ip_address TEXT,
    user_agent TEXT
);
