-- ============================================================
--  002 - יומן הפעולות נכתב במסד עצמו (טריגרים), ולא מהדפדפן
--  צדקת רבי שמעון · שלב 1.5
--
--  מה הקובץ עושה
--  -------------
--  היום הדפדפן הוא שכותב ליומן (audit_log), וכשהכתיבה נכשלת היא מושתקת. מי ששולט בדפדפן
--  יכול גם לא לכתוב, או לכתוב רשומה שקרית בשם עצמו.
--  אחרי הקובץ הזה:
--   1. כל הוספה, עדכון ומחיקה בטבלאות members, donations, expenses, purim_addresses,
--      settings, grants_archive וגם profiles (הרשאות) נרשמת אוטומטית על ידי המסד,
--      עם המשתמש המחובר לפי auth.uid().
--   2. לקוחות (הדפדפן) כבר לא יכולים לכתוב לטבלת היומן. רק המסד כותב אליה.
--   3. מבנה הטבלה לא משתנה: created_at, user_id, username, action, entity, entity_id, details.
--      בעדכון, details הוא { before: {...}, after: {...} } עם השדות שהשתנו בלבד,
--      בדיוק במבנה שמסך "יומן פעולות" כבר יודע להציג.
--  עדכון שלא שינה שום ערך (שמירה חוזרת של אותם נתונים) לא נרשם.
--
--  מה משתנה ביומן לעומת היום
--  -------------------------
--  היומן יתעד שינויים בנתונים, ולא לחיצות במסך. לכן:
--   - שינוי במענקים או בהגדרות יופיע כרשימת השדות שהשתנו (למשל "years › תשפ"ו › recipients:
--     2 פריטים ← 3 פריטים"), ולא כ"נוסף חתן".
--   - העלאת קובץ קבלה וייבוא גיבוי לא יופיעו כשורה משלהם. השינויים שהם גורמים בנתונים כן יופיעו.
--   - שינוי שנעשה ישירות מלוח הבקרה של Supabase יירשם בשם "לוח הבקרה של Supabase".
--
--  תנאי מוקדם
--  ----------
--  הקובץ supabase/security-update.sql כבר הורץ (הוא יוצר את הפונקציה is_admin ואת הטבלה audit_log).
--  אם לא, הקובץ הזה עוצר עם הודעה ולא משנה כלום.
--
--  סדר הפעולות מול הקוד
--  ---------------------
--  מריצים את הקובץ הזה לפני שמעלים לאתר את גרסת הקוד שבה הוסרו הקריאות ל-logAudit.
--  בין לבין אין בעיה: הקוד הישן ינסה לכתוב ליומן, ייחסם בשקט, והטריגרים כבר רושמים.
--
--  איך מריצים
--  ----------
--  Supabase Dashboard → SQL Editor → New query → מדביקים את כל הקובץ → Run.
--  אפשר להריץ שוב בלי נזק. הכול בטרנזקציה אחת: אם משהו נכשל, שום דבר לא משתנה.
--
--  איך מבטלים
--  ----------
--  מריצים את הבלוק שבסוף הקובץ ("ביטול"), אחרי שמסירים ממנו את סימני ההערה.
-- ============================================================

begin;

-- ---------- בדיקות מוקדמות: עוצרים לפני כל שינוי אם משהו חסר ----------
do $check$
declare
  t text;
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'הפונקציה public.is_admin() לא קיימת. יש להריץ קודם את supabase/security-update.sql. לא בוצע שום שינוי.';
  end if;
  if to_regclass('public.audit_log') is null then
    raise exception 'הטבלה public.audit_log לא קיימת. יש להריץ קודם את supabase/security-update.sql. לא בוצע שום שינוי.';
  end if;
  foreach t in array array['members','donations','expenses','purim_addresses','settings','grants_archive','profiles'] loop
    if to_regclass('public.' || t) is null then
      raise exception 'הטבלה public.% לא קיימת. לא בוצע שום שינוי.', t;
    end if;
  end loop;
  if (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'audit_log'
        and column_name in ('created_at','user_id','username','action','entity','entity_id','details')) <> 7 then
    raise exception 'המבנה של public.audit_log שונה מהצפוי. לא בוצע שום שינוי.';
  end if;
end
$check$;

-- ---------- פונקציות עזר ----------

-- תיאור קצר של ערך, כטקסט שאפשר להציג בשורה אחת ביומן
create or replace function public.audit_brief(v jsonb)
returns text language sql immutable as $fn$
  select case
    when v is null or jsonb_typeof(v) = 'null' then null
    when jsonb_typeof(v) = 'boolean' then case when v = 'true'::jsonb then 'כן' else 'לא' end
    when jsonb_typeof(v) = 'object' then (select count(*) from jsonb_object_keys(v))::text || ' שדות'
    when jsonb_typeof(v) = 'array' then jsonb_array_length(v)::text || ' פריטים'
    else left(v #>> '{}', 120)
  end
$fn$;

-- ההבדלים בין שני אובייקטים: שורה לכל שדה שהשתנה. אובייקטים מקוננים נפתחים (נתיב עם ›).
create or replace function public.audit_json_diff(p_old jsonb, p_new jsonb, p_prefix text default '')
returns table (path text, old_val text, new_val text)
language plpgsql immutable as $fn$
declare
  k text;
  o jsonb;
  n jsonb;
  v_old jsonb := case when jsonb_typeof(p_old) = 'object' then p_old else '{}'::jsonb end;
  v_new jsonb := case when jsonb_typeof(p_new) = 'object' then p_new else '{}'::jsonb end;
begin
  for k in
    select s.key from (
      select jsonb_object_keys(v_old) as key
      union
      select jsonb_object_keys(v_new)
    ) s order by s.key
  loop
    o := v_old -> k;
    n := v_new -> k;
    if o is not distinct from n then
      continue;
    end if;
    if jsonb_typeof(o) = 'object' and jsonb_typeof(n) = 'object' then
      return query select d.path, d.old_val, d.new_val from public.audit_json_diff(o, n, p_prefix || k || ' › ') d;
    else
      path := p_prefix || k;
      old_val := public.audit_brief(o);
      new_val := public.audit_brief(n);
      return next;
    end if;
  end loop;
end
$fn$;

-- מה נרשם מכל שורה: בטבלאות עם עמודת data (פורים, הגדרות, מענקים) - התוכן שלה;
-- בשאר הטבלאות - העמודות עם שם בעברית. מזהים פנימיים ותאריכי יצירה לא נרשמים.
create or replace function public.audit_payload(p_entity text, p_row jsonb)
returns jsonb language sql immutable as $fn$
  select case
    when p_entity in ('purim', 'settings', 'grants') then
      case when jsonb_typeof(p_row -> 'data') = 'object' then p_row -> 'data' else '{}'::jsonb end
    else coalesce((
      select jsonb_object_agg(l.label, e.value)
      from jsonb_each(p_row) e
      join (values
        ('first_name', 'שם פרטי'), ('last_name', 'שם משפחה'), ('father_name', 'שם האב'), ('phone', 'טלפון'),
        ('yeshiva', 'ישיבה'), ('shiur', 'שיעור'), ('yeshiva_type', 'סוג מסגרת'), ('marital_status', 'סטטוס משפחתי'),
        ('address', 'כתובת'), ('notes', 'הערות'),
        ('member_name_snapshot', 'בחור'), ('year', 'שנה'), ('amount', 'סכום'), ('date', 'תאריך'),
        ('category', 'קטגוריה'), ('description', 'פירוט'), ('approved_by', 'נרשם על ידי'),
        ('username', 'שם משתמש'), ('display_name', 'שם תצוגה'), ('is_admin', 'מנהל'),
        ('can_edit', 'הוספה ועריכה'), ('can_view_income', 'הכנסות ופורים'), ('can_view_expenses', 'הוצאות'),
        ('can_view_grants', 'מענקים'), ('can_view_history', 'היסטוריית זכאות')
      ) as l(col, label) on l.col = e.key
    ), '{}'::jsonb)
  end
$fn$;

-- ---------- הטריגר עצמו ----------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_entity   text := tg_argv[0];
  v_uid      uuid := auth.uid();
  v_username text;
  v_action   text;
  v_row      jsonb;
  v_old      jsonb := '{}'::jsonb;
  v_new      jsonb := '{}'::jsonb;
  v_id       text;
  v_subject  text;
  v_details  jsonb;
begin
  -- שמירה חוזרת של אותם ערכים בדיוק: אין מה לרשום
  if tg_op = 'UPDATE' and to_jsonb(new) = to_jsonb(old) then
    return null;
  end if;

  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;
  if tg_op <> 'INSERT' then
    v_old := public.audit_payload(v_entity, to_jsonb(old));
  end if;
  if tg_op <> 'DELETE' then
    v_new := public.audit_payload(v_entity, to_jsonb(new));
  end if;

  v_action := case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end;
  v_id := case
    when v_entity in ('settings', 'grants') then null
    when v_entity = 'profile' then v_row ->> 'username'
    else v_row ->> 'id'
  end;
  -- על מי / על מה הפעולה (מוצג ביומן לפני פירוט השינוי)
  v_subject := case v_entity
    when 'member'   then nullif(trim(coalesce(v_row ->> 'first_name', '') || ' ' || coalesce(v_row ->> 'last_name', '')), '')
    when 'donation' then nullif(v_row ->> 'member_name_snapshot', '')
    when 'expense'  then coalesce(nullif(v_row ->> 'description', ''), nullif(v_row ->> 'category', ''))
    when 'purim'    then nullif(concat_ws(' / ', v_row -> 'data' ->> 'עיר', v_row -> 'data' ->> 'קבוצה', v_row -> 'data' ->> 'משפחה'), '')
    when 'profile'  then nullif(v_row ->> 'username', '')
    else null
  end;

  if tg_op = 'UPDATE' then
    select jsonb_build_object(
             'before', coalesce(jsonb_object_agg(d.path, d.old_val), '{}'::jsonb),
             'after',  coalesce(jsonb_object_agg(d.path, d.new_val), '{}'::jsonb))
      into v_details
      from (select * from public.audit_json_diff(v_old, v_new) limit 40) d;
    -- השתנו רק עמודות שלא נרשמות (למשל תאריך עדכון): אין מה לרשום
    if v_details -> 'after' = '{}'::jsonb then
      return null;
    end if;
    if v_subject is not null then
      v_details := v_details || jsonb_build_object('subject', v_subject);
    end if;
  else
    select coalesce(jsonb_object_agg(e.key, public.audit_brief(e.value)), '{}'::jsonb)
      into v_details
      from jsonb_each(case when tg_op = 'DELETE' then v_old else v_new end) e
      where coalesce(public.audit_brief(e.value), '') <> '';
  end if;

  select p.username into v_username from public.profiles p where p.id = v_uid;

  insert into public.audit_log (user_id, username, action, entity, entity_id, details)
  values (
    v_uid,
    coalesce(v_username, case when v_uid is null then 'לוח הבקרה של Supabase' else 'משתמש לא מזוהה' end),
    v_action, v_entity, v_id, v_details
  );
  return null;
end
$fn$;

-- הפונקציות האלה לשימוש הטריגרים בלבד
revoke all on function public.audit_brief(jsonb) from public, anon, authenticated;
revoke all on function public.audit_json_diff(jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.audit_payload(text, jsonb) from public, anon, authenticated;
revoke all on function public.audit_row_change() from public, anon, authenticated;

-- ---------- חיבור הטריגר לטבלאות ----------
drop trigger if exists audit_members         on public.members;
drop trigger if exists audit_donations       on public.donations;
drop trigger if exists audit_expenses        on public.expenses;
drop trigger if exists audit_purim_addresses on public.purim_addresses;
drop trigger if exists audit_settings        on public.settings;
drop trigger if exists audit_grants_archive  on public.grants_archive;
drop trigger if exists audit_profiles        on public.profiles;

create trigger audit_members         after insert or update or delete on public.members
  for each row execute function public.audit_row_change('member');
create trigger audit_donations       after insert or update or delete on public.donations
  for each row execute function public.audit_row_change('donation');
create trigger audit_expenses        after insert or update or delete on public.expenses
  for each row execute function public.audit_row_change('expense');
create trigger audit_purim_addresses after insert or update or delete on public.purim_addresses
  for each row execute function public.audit_row_change('purim');
create trigger audit_settings        after insert or update or delete on public.settings
  for each row execute function public.audit_row_change('settings');
create trigger audit_grants_archive  after insert or update or delete on public.grants_archive
  for each row execute function public.audit_row_change('grants');
create trigger audit_profiles        after insert or update or delete on public.profiles
  for each row execute function public.audit_row_change('profile');

-- ---------- לקוחות לא כותבים יותר ליומן ----------
drop policy if exists "audit_insert" on public.audit_log;
revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;
-- קריאה נשארת למנהל בלבד, כמו היום
alter table public.audit_log enable row level security;
drop policy if exists "audit_select" on public.audit_log;
create policy "audit_select" on public.audit_log for select to authenticated using (public.is_admin());
grant select on public.audit_log to authenticated;

commit;

-- ============================================================
--  בדיקה אחרי ההרצה (קריאה בלבד): שבעה טריגרים, ואין הרשאת כתיבה ללקוחות
-- ============================================================
select
  (select count(distinct trigger_name) from information_schema.triggers
     where trigger_schema = 'public' and trigger_name like 'audit\_%')                         as audit_triggers,
  (select string_agg(privilege_type, ', ') from information_schema.role_table_grants
     where table_schema = 'public' and table_name = 'audit_log' and grantee = 'authenticated') as authenticated_privileges,
  (select string_agg(policyname, ', ') from pg_policies
     where schemaname = 'public' and tablename = 'audit_log')                                  as audit_policies;

-- ============================================================
--  ביטול (להחזרת המצב הקודם: הדפדפן כותב ליומן, בלי טריגרים).
--  כדי לבטל: להסיר את סימני ההערה מהשורות שבין /* ל-*/ ולהריץ רק אותן.
-- ============================================================
/*
begin;
drop trigger if exists audit_members         on public.members;
drop trigger if exists audit_donations       on public.donations;
drop trigger if exists audit_expenses        on public.expenses;
drop trigger if exists audit_purim_addresses on public.purim_addresses;
drop trigger if exists audit_settings        on public.settings;
drop trigger if exists audit_grants_archive  on public.grants_archive;
drop trigger if exists audit_profiles        on public.profiles;
drop function if exists public.audit_row_change();
drop function if exists public.audit_payload(text, jsonb);
drop function if exists public.audit_json_diff(jsonb, jsonb, text);
drop function if exists public.audit_brief(jsonb);
drop policy if exists "audit_insert" on public.audit_log;
create policy "audit_insert" on public.audit_log for insert to authenticated with check (user_id = auth.uid());
grant select, insert on public.audit_log to authenticated;
commit;
*/
