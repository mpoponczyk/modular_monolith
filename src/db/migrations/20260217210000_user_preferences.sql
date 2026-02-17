-- 20260217210000_user_preferences.sql
-- Description: User Preferences (Theme) Storage
-- Scope: User (Global) - Accessibility setting, not tenant data.

create table if not exists public.user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
    updated_at timestamptz default now()
);

alter table public.user_preferences enable row level security;
alter table public.user_preferences force row level security;

-- Policies
create policy "Users can view own preferences"
    on public.user_preferences for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert own preferences"
    on public.user_preferences for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update own preferences"
    on public.user_preferences for update
    to authenticated
    using (user_id = auth.uid());

-- Permissions
revoke all on public.user_preferences from public, anon;
grant select, insert, update on public.user_preferences to authenticated;
