-- ============================================================
--  צדקת רבי שמעון — עדכון אבטחה והרשאות
--  הרצה (פעם אחת): Supabase Dashboard → SQL Editor → New query → הדבק הכל → Run
--  אפשר להריץ שוב בבטחה (idempotent).
--
--  מה העדכון עושה:
--  1. ההרשאות של כל משתמש נאכפות בשרת, ולא רק במסך:
--     - צפייה בהוצאות רק למי שיש לו הרשאת "הוצאות"
--     - כתובות פורים רק למי שיש לו הרשאת "הכנסות"
--     - מענקים וקבלות רק למי שיש לו הרשאת "מענקים"
--     - הוספה ועריכה רק למי שיש לו הרשאת "עריכה"
--     - מחיקת בחור / הפקדה / הוצאה והגדרות מערכת - רק למנהל
--  2. משתמש לא יכול יותר לשנות לעצמו הרשאות. רק מנהל יכול (ממסך "משתמשים").
--  3. יומן פעולות: מי רשם / שינה / מחק מה ומתי.
--  4. תיקייה מאובטחת לקבלות של תשלומים לחנויות.
-- ============================================================

-- ---------- פונקציות עזר: ההרשאות של המשתמש המחובר ----------
-- מנהל = is_admin או שם המשתמש "מנהל" (כמו באפליקציה). למנהל יש את כל ההרשאות.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin or p.username = 'מנהל' from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.can_edit()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.can_edit or p.is_admin or p.username = 'מנהל' from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.can_view_income()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.can_view_income or p.is_admin or p.username = 'מנהל' from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.can_view_expenses()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.can_view_expenses or p.is_admin or p.username = 'מנהל' from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.can_view_grants()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.can_view_grants or p.is_admin or p.username = 'מנהל' from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin(), public.can_edit(), public.can_view_income(), public.can_view_expenses(), public.can_view_grants() from public, anon;
grant execute on function public.is_admin(), public.can_edit(), public.can_view_income(), public.can_view_expenses(), public.can_view_grants() to authenticated;

-- ---------- הסרת ההרשאות הישנות ("כל משתמש מחובר יכול הכל") ----------
drop policy if exists "auth_all_members"         on public.members;
drop policy if exists "auth_all_donations"       on public.donations;
drop policy if exists "auth_all_expenses"        on public.expenses;
drop policy if exists "auth_all_purim_addresses" on public.purim_addresses;
drop policy if exists "auth_all_grants_archive"  on public.grants_archive;
drop policy if exists "auth_all_settings"        on public.settings;

-- ---------- בחורים ----------
drop policy if exists "members_select" on public.members;
drop policy if exists "members_insert" on public.members;
drop policy if exists "members_update" on public.members;
drop policy if exists "members_delete" on public.members;
create policy "members_select" on public.members for select to authenticated using (true);
create policy "members_insert" on public.members for insert to authenticated with check (public.can_edit());
create policy "members_update" on public.members for update to authenticated using (public.can_edit()) with check (public.can_edit());
create policy "members_delete" on public.members for delete to authenticated using (public.is_admin());

-- ---------- הפקדות (כולם רואים - צריך לחישוב "נאסף השנה" של כל בחור) ----------
drop policy if exists "donations_select" on public.donations;
drop policy if exists "donations_insert" on public.donations;
drop policy if exists "donations_update" on public.donations;
drop policy if exists "donations_delete" on public.donations;
create policy "donations_select" on public.donations for select to authenticated using (true);
create policy "donations_insert" on public.donations for insert to authenticated with check (public.can_edit());
create policy "donations_update" on public.donations for update to authenticated using (public.can_edit()) with check (public.can_edit());
create policy "donations_delete" on public.donations for delete to authenticated using (public.is_admin());

-- ---------- הוצאות ----------
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_select" on public.expenses for select to authenticated using (public.can_view_expenses());
create policy "expenses_insert" on public.expenses for insert to authenticated with check (public.can_edit());
create policy "expenses_update" on public.expenses for update to authenticated using (public.can_edit() and public.can_view_expenses()) with check (public.can_edit());
create policy "expenses_delete" on public.expenses for delete to authenticated using (public.is_admin());

-- ---------- כתובות פורים ----------
drop policy if exists "purim_select" on public.purim_addresses;
drop policy if exists "purim_insert" on public.purim_addresses;
drop policy if exists "purim_update" on public.purim_addresses;
drop policy if exists "purim_delete" on public.purim_addresses;
create policy "purim_select" on public.purim_addresses for select to authenticated using (public.can_view_income());
create policy "purim_insert" on public.purim_addresses for insert to authenticated with check (public.can_edit() and public.can_view_income());
create policy "purim_update" on public.purim_addresses for update to authenticated using (public.can_edit() and public.can_view_income()) with check (public.can_edit() and public.can_view_income());
create policy "purim_delete" on public.purim_addresses for delete to authenticated using (public.is_admin());

-- ---------- מענקים ----------
drop policy if exists "grants_select" on public.grants_archive;
drop policy if exists "grants_insert" on public.grants_archive;
drop policy if exists "grants_update" on public.grants_archive;
create policy "grants_select" on public.grants_archive for select to authenticated using (public.can_view_grants());
create policy "grants_insert" on public.grants_archive for insert to authenticated with check (public.can_edit() and public.can_view_grants());
create policy "grants_update" on public.grants_archive for update to authenticated using (public.can_edit() and public.can_view_grants()) with check (public.can_edit() and public.can_view_grants());

-- ---------- הגדרות מערכת (כולם קוראים - יעדים; רק מנהל משנה) ----------
drop policy if exists "settings_select" on public.settings;
drop policy if exists "settings_insert" on public.settings;
drop policy if exists "settings_update" on public.settings;
create policy "settings_select" on public.settings for select to authenticated using (true);
create policy "settings_insert" on public.settings for insert to authenticated with check (public.is_admin());
create policy "settings_update" on public.settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- משתמשים והרשאות ----------
-- הסרת האפשרות של משתמש לשנות לעצמו הרשאות (היה אפשר להפוך את עצמך למנהל)
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- יומן פעולות ----------
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid default auth.uid(),
  username   text,
  action     text not null,
  entity     text not null,
  entity_id  text,
  details    jsonb
);
create index if not exists audit_log_created_idx on public.audit_log(created_at desc);
alter table public.audit_log enable row level security;
drop policy if exists "audit_insert" on public.audit_log;
drop policy if exists "audit_select" on public.audit_log;
-- כל משתמש מחובר רושם פעולות בשם עצמו בלבד; רק מנהל קורא; אי אפשר לשנות או למחוק רשומות
create policy "audit_insert" on public.audit_log for insert to authenticated with check (user_id = auth.uid());
create policy "audit_select" on public.audit_log for select to authenticated using (public.is_admin());
grant select, insert on public.audit_log to authenticated;

-- ---------- תיקייה מאובטחת לקבלות (Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "receipts_select" on storage.objects;
drop policy if exists "receipts_insert" on storage.objects;
drop policy if exists "receipts_update" on storage.objects;
drop policy if exists "receipts_delete" on storage.objects;
create policy "receipts_select" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and public.can_view_grants());
create policy "receipts_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and public.can_view_grants() and public.can_edit());
create policy "receipts_update" on storage.objects for update to authenticated
  using (bucket_id = 'receipts' and public.can_view_grants() and public.can_edit())
  with check (bucket_id = 'receipts' and public.can_view_grants() and public.can_edit());
create policy "receipts_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and public.can_view_grants() and public.can_edit());
