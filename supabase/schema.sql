-- ============================================================
--  צדקת רבי שמעון — סכימת Supabase
--  הרצה: Supabase Dashboard → SQL Editor → New query → הדבק הכל → Run
--  אפשר להריץ שוב בבטחה (idempotent).
-- ============================================================

-- ---------- טבלאות נתונים ----------

create table if not exists public.members (
  id           text primary key,
  first_name   text,
  last_name    text,
  father_name  text,
  phone        text,
  yeshiva      text,
  shiur        text,
  yeshiva_type text,
  marital_status text,
  address      text,
  notes        text,
  created_at   timestamptz default now()
);

create table if not exists public.donations (
  id                   text primary key,
  member_id            text,
  member_name_snapshot text,
  year                 text,
  amount               numeric,
  date                 text,   -- נשמר כטקסט: המקור מכיל תאריכים לא-אחידים
  notes                text,
  created_at           timestamptz default now()
);
create index if not exists donations_member_idx on public.donations(member_id);
create index if not exists donations_year_idx   on public.donations(year);

create table if not exists public.expenses (
  id          text primary key,
  year        text,
  category    text,
  description text,
  amount      numeric,
  date        text,
  approved_by text,
  created_at  timestamptz default now()
);
create index if not exists expenses_year_idx on public.expenses(year);

-- כתובות פורים: מבנה דינמי עם מפתחות בעברית → נשמר כ-JSON
create table if not exists public.purim_addresses (
  id         uuid primary key default gen_random_uuid(),
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

-- היסטוריית מענקים ו-הגדרות מערכת: שורה יחידה (singleton) עם JSON
create table if not exists public.grants_archive (
  id         boolean primary key default true,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint grants_archive_singleton check (id = true)
);

create table if not exists public.settings (
  id         boolean primary key default true,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint settings_singleton check (id = true)
);

-- ---------- פרופילים (משתמשים + הרשאות) ----------
-- מקושר ל-Supabase Auth. שדות ההרשאה מקבילים למערכת הקיימת.
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique,
  display_name      text,
  is_admin          boolean not null default false,
  can_edit          boolean not null default true,
  can_view_income   boolean not null default true,
  can_view_expenses boolean not null default true,
  can_view_grants   boolean not null default true,
  can_view_history  boolean not null default true,
  created_at        timestamptz default now()
);

-- יצירת פרופיל אוטומטית כשנוצר משתמש התחברות חדש
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
--  אבטחה (Row Level Security)
--  עיקרון: רק משתמש מחובר (authenticated) ניגש לנתונים. anon = אין גישה.
-- ============================================================

alter table public.members         enable row level security;
alter table public.donations       enable row level security;
alter table public.expenses        enable row level security;
alter table public.purim_addresses enable row level security;
alter table public.grants_archive  enable row level security;
alter table public.settings        enable row level security;
alter table public.profiles        enable row level security;

-- גישה מלאה למשתמשים מחוברים על טבלאות הנתונים
do $$
declare t text;
begin
  foreach t in array array['members','donations','expenses','purim_addresses','grants_archive','settings']
  loop
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$s;', t);
    execute format('create policy "auth_all_%1$s" on public.%1$s for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- profiles: משתמש מחובר יכול לקרוא פרופילים (כלי פנימי לצוות)
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select to authenticated using (true);

-- profiles: כל משתמש יכול לעדכן את הפרופיל של עצמו (ניהול הרשאות של אחרים נעשה דרך לוח הבקרה של Supabase)
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
