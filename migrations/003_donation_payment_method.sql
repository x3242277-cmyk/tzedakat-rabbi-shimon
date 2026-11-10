-- ============================================================
--  003 - אמצעי תשלום להפקדה (מזומן / אשראי) כעמודה במסד
--  צדקת רבי שמעון · העיצוב החדש
--
--  מה הקובץ עושה
--  -------------
--  עד היום "אשראי" לא היה שדה: הוא נרשם כתחילית "(אשראי)" בהערות של ההפקדה,
--  והפקדות שנרשמו דרך נדרים פלוס קיבלו את ההערה "אשראי - נדרים פלוס" בלי התחילית.
--  הקובץ מוסיף לטבלת donations עמודה payment_method ('cash' או 'credit'),
--  וממלא אותה לכל ההפקדות הקיימות לפי ההערות, באותו כלל שהאתר משתמש בו:
--    ההערה מתחילה ב-"(אשראי)" או ב-"אשראי", או מכילה "נדרים פלוס"  ->  credit
--    כל השאר                                                          ->  cash
--  ההערות עצמן לא משתנות.
--
--  למה זה לא דחוף
--  ---------------
--  האתר עובד גם בלי הקובץ הזה: כל עוד העמודה לא קיימת, הוא מסיק את האמצעי מההערות
--  ולא שולח את השדה למסד. אחרי ההרצה הוא מזהה את העמודה לבד (בטעינה הבאה) ומתחיל לכתוב אליה.
--  אין צורך לתאם את ההרצה עם העלאת קוד.
--
--  איך מריצים
--  ----------
--  Supabase Dashboard -> SQL Editor -> New query -> מדביקים את כל הקובץ -> Run.
--  אפשר להריץ שוב בלי נזק. הכול בטרנזקציה אחת: אם משהו נכשל, שום דבר לא משתנה.
--
--  איך מבטלים
--  ----------
--    alter table public.donations drop column if exists payment_method;
--  (האתר חוזר להסיק את האמצעי מההערות.)
-- ============================================================

begin;

do $$
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'donations') then
    raise exception 'הטבלה public.donations לא נמצאה. הקובץ לא שינה כלום.';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'donations' and column_name = 'notes') then
    raise exception 'בטבלה public.donations אין עמודת notes. הקובץ לא שינה כלום.';
  end if;
end $$;

alter table public.donations add column if not exists payment_method text;

-- מילוי לפי ההערות, רק בשורות שעוד אין להן ערך (הרצה חוזרת לא דורסת בחירה שנעשתה באתר)
update public.donations
set payment_method = case
  when btrim(coalesce(notes, '')) like '(אשראי)%' then 'credit'
  when btrim(coalesce(notes, '')) like 'אשראי%' then 'credit'
  when coalesce(notes, '') like '%נדרים פלוס%' then 'credit'
  else 'cash'
end
where payment_method is null;

alter table public.donations alter column payment_method set default 'cash';
alter table public.donations alter column payment_method set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'donations_payment_method_check' and conrelid = 'public.donations'::regclass) then
    alter table public.donations add constraint donations_payment_method_check check (payment_method in ('cash', 'credit'));
  end if;
end $$;

comment on column public.donations.payment_method is 'אמצעי התשלום של ההפקדה: cash (מזומן) או credit (אשראי)';

commit;

-- בדיקה: כמה הפקדות וכמה כסף בכל אמצעי. אמורות להופיע שורות cash ו-credit בלבד.
select payment_method as "אמצעי", count(*) as "הפקדות", sum(amount) as "סכום"
from public.donations
group by payment_method
order by payment_method;
