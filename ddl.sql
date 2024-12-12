create table woorytools.pm_push_tokens (
    id uuid default uuid_generate_v4() primary key,
    user_id text not null,
    fcm_token text not null unique,
    device_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    last_used timestamp with time zone default timezone('utc'::text, now())
);

grant select, insert, update, delete on table woorytools.pm_push_tokens to anon;
grant usage on schema woorytools to anon, authenticated;
grant select on table woorytools.pm_push_tokens to anon;
grant select, insert, update, delete on table woorytools.pm_push_tokens to authenticated;