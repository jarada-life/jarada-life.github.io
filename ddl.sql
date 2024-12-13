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

-- pm 스키마의 scheduled_notifications 테이블 생성
CREATE TABLE woorytools.pm_scheduled_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ,
    error_message TEXT
);

-- 권한 설정
GRANT USAGE ON SCHEMA woorytools TO anon, authenticated;
GRANT ALL ON woorytools.pm_scheduled_notifications TO anon, authenticated;
grant select, insert, update, delete on table woorytools.pm_scheduled_notifications to anon;
grant select on table woorytools.pm_scheduled_notifications to anon;
grant select, insert, update, delete on table woorytools.pm_scheduled_notifications to authenticated;

