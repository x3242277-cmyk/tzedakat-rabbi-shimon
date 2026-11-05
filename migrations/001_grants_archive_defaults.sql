-- ============================================================
--  001 - ברירות המחדל של המענקים עוברות מהקוד למסד
--  צדקת רבי שמעון · שלב 1.2
--
--  מה הקובץ עושה
--  -------------
--  היום הקובץ script.js מכיל קבוע בשם GRANTS_ARCHIVE עם תשלומים לחנויות, אחוזי הנחה ומחירי
--  חבילה, והוא גלוי לכל מי שפותח את האתר. האפליקציה משלימה ממנו ערכים שחסרים בשורה שבמסד.
--  הקובץ הזה כותב את אותם ערכים לשורה היחידה בטבלה grants_archive, ורק במקומות שבהם האפליקציה
--  משתמשת היום בברירת המחדל שבקוד. כך אפשר אחר כך לרוקן את הקבוע בלי שאף מספר ישתנה.
--
--  הכללים זהים בדיוק ל-mergeGrantsArchiveDefaults שבקוד:
--    perGroomValue - נכתב רק אם השדה לא קיים בשורה.
--    payments      - נכתב רק אם אין בשורה רשימת תשלומים (השדה חסר או שאינו רשימה).
--    package       - נכתב אם אין בשורה תכולת חבילה, או שיש תכולה בלי אף מחיר (storePrice / orgPrice).
--                    זה המקרה היחיד שבו ערך קיים מוחלף, וכך בדיוק מתנהגת האפליקציה היום.
--  שום שדה אחר (שנים, מקבלי מענק, תשלומים לפי מחצית, קבלות) לא משתנה.
--
--  איך מריצים
--  ----------
--  Supabase Dashboard → SQL Editor → New query → מדביקים את כל הקובץ → Run.
--  אפשר להריץ שוב בלי נזק: בהרצה שנייה כבר אין מה להשלים.
--  הכול בתוך טרנזקציה אחת: אם משהו נכשל, שום דבר לא משתנה.
--
--  איך מבטלים
--  ----------
--  לפני השינוי נשמר עותק של השורה בטבלה grants_archive_backup_001 (חסומה לגישה מהאתר).
--  להחזרת המצב הקודם:
--      update public.grants_archive g set data = b.data
--        from public.grants_archive_backup_001 b where g.id = b.id;
--  אחרי שמוודאים שהכול תקין אפשר למחוק את הגיבוי:
--      drop table public.grants_archive_backup_001;
-- ============================================================

begin;

-- בדיקת מבנה: עוצרים לפני כל שינוי אם הטבלה אינה במבנה שמוגדר ב-supabase/schema.sql
do $check$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'grants_archive' and column_name = 'data' and data_type = 'jsonb'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'grants_archive' and column_name = 'id' and data_type = 'boolean'
  ) then
    raise exception 'המבנה של public.grants_archive שונה מהצפוי (id boolean, data jsonb). לא בוצע שום שינוי.';
  end if;
end
$check$;

-- גיבוי של השורה כפי שהיא עכשיו. הטבלה נוצרת רק בהרצה הראשונה, כך שהגיבוי תמיד של המצב המקורי.
create table if not exists public.grants_archive_backup_001 as
  select g.*, now() as backed_up_at from public.grants_archive g;
-- הגיבוי מכיל פרטים של מקבלי מענק: חוסמים אותו לגמרי מפני גישה דרך האתר
alter table public.grants_archive_backup_001 enable row level security;
revoke all on public.grants_archive_backup_001 from anon, authenticated;

-- ברירות המחדל, כפי שהן מופיעות היום בקבוע GRANTS_ARCHIVE שב-script.js
create temporary table grants_defaults_001 on commit drop as
select $defaults${
  "perGroomValue": 8110.7,
  "payments": [
    {
      "year": "תשפ\"ד",
      "store": "רויאל",
      "date": "תשרי תשפ\"ד",
      "description": "תשלום בפועל לפי כרטיסיית תשלום לרויאל",
      "method": "מזומן",
      "amount": 39835.95
    },
    {
      "year": "תשפ\"ד",
      "store": "סאפרים",
      "date": "26.07.2023",
      "description": "תשלום בפועל לפי כרטיסיית סאפרים",
      "method": "העברה",
      "amount": 9360
    },
    {
      "year": "תשפ\"ד",
      "store": "סאפרים",
      "date": "י\"ג אדר ב'",
      "description": "תשלום בפועל לפי כרטיסיית סאפרים",
      "method": "העברה",
      "amount": 10000
    },
    {
      "year": "תשפ\"ד",
      "store": "סאפרים",
      "date": "ח' ניסן",
      "description": "תשלום בפועל לפי כרטיסיית סאפרים",
      "method": "העברה",
      "amount": 32500
    },
    {
      "year": "תשפ\"ד",
      "store": "אווניו 13 ביתר",
      "date": "ניסן תשפ\"ד",
      "description": "תשלום בפועל לפי כרטיסיית אווניו 13",
      "method": "תשלום",
      "amount": 7399.25
    },
    {
      "year": "תשפ\"ו",
      "store": "אווניו 13 ביתר",
      "date": "אדר תשפ\"ו",
      "description": "תשלום בפועל לפי כרטיסיית אווניו 13",
      "method": "תשלום",
      "amount": 6236
    }
  ],
  "package": [
    {
      "store": "רויאל",
      "discount": "30%",
      "items": [
        {
          "name": "חליפה 3 חלקים ביטנה מלאה",
          "qty": 1,
          "storePrice": 1375,
          "orgPrice": 960,
          "value": 960
        },
        {
          "name": "בעקיטשע חלק חצי בטנה",
          "qty": 1,
          "storePrice": 845,
          "orgPrice": 590,
          "value": 590
        },
        {
          "name": "בעקיטשע פירחוני חצי בטנה",
          "qty": 1,
          "storePrice": 850,
          "orgPrice": 510,
          "value": 510
        },
        {
          "name": "מכנס שחור פוליאסטר",
          "qty": 2,
          "storePrice": 170,
          "orgPrice": 110,
          "value": 220
        }
      ]
    },
    {
      "store": "רויאל",
      "discount": "15%",
      "items": [
        {
          "name": "חגורה יוקרתית מעור",
          "qty": 1,
          "storePrice": 59,
          "orgPrice": 50.15,
          "value": 50.15
        },
        {
          "name": "גרביים",
          "qty": 9,
          "storePrice": 13.9,
          "orgPrice": 11.815,
          "value": 106.34
        },
        {
          "name": "חולצות 24K",
          "qty": 8,
          "storePrice": 135,
          "orgPrice": 110,
          "value": 880
        },
        {
          "name": "סוודר",
          "qty": 1,
          "storePrice": 110,
          "orgPrice": 90,
          "value": 90
        },
        {
          "name": "הלבשה אישית",
          "qty": 4,
          "storePrice": 64.9,
          "orgPrice": 55.165,
          "value": 220.66
        },
        {
          "name": "גופיות",
          "qty": 8,
          "storePrice": 30,
          "orgPrice": 25.5,
          "value": 204
        },
        {
          "name": "כיפות",
          "qty": 2,
          "storePrice": 24,
          "orgPrice": 20.4,
          "value": 40.8
        },
        {
          "name": "טלית קטן צמר",
          "qty": 2,
          "storePrice": 117,
          "orgPrice": 99.45,
          "value": 198.9
        },
        {
          "name": "פיג'מה",
          "qty": 1,
          "storePrice": 85,
          "orgPrice": 72.25,
          "value": 72.25
        }
      ]
    },
    {
      "store": "סטייל שיך",
      "discount": "12%",
      "items": [
        {
          "name": "זיכוי לנעלי יום חול",
          "qty": 1,
          "storePrice": 250,
          "orgPrice": 220,
          "value": 220
        },
        {
          "name": "זיכוי לנעלי שבת",
          "qty": 1,
          "storePrice": 250,
          "orgPrice": 220,
          "value": 220
        }
      ]
    },
    {
      "store": "אווניו 13",
      "discount": "15%",
      "items": [
        {
          "name": "מגבת ידיים 50/90",
          "qty": 4,
          "storePrice": 33,
          "orgPrice": 28.05,
          "value": 112.2
        },
        {
          "name": "מגבת רחצה 90/130",
          "qty": 4,
          "storePrice": 66,
          "orgPrice": 56.1,
          "value": 224.4
        },
        {
          "name": "מגבת מטבח",
          "qty": 4,
          "storePrice": 16,
          "orgPrice": 13.6,
          "value": 54.4
        },
        {
          "name": "זיכוי לקניית מצעים",
          "qty": 0,
          "storePrice": 400,
          "orgPrice": 340,
          "value": 0
        }
      ]
    },
    {
      "store": "סאפרים",
      "discount": "",
      "items": [
        {
          "name": "זיכוי לכובע חסידי",
          "qty": 1,
          "storePrice": 1500,
          "orgPrice": 700,
          "value": 700
        }
      ]
    }
  ]
}$defaults$::jsonb as d;

-- השלמת השדות החסרים בשורה הקיימת
update public.grants_archive g
set data = g.data
  || case when g.data ? 'perGroomValue'
          then '{}'::jsonb
          else jsonb_build_object('perGroomValue', d.d -> 'perGroomValue') end
  || case when jsonb_typeof(g.data -> 'payments') = 'array'
          then '{}'::jsonb
          else jsonb_build_object('payments', d.d -> 'payments') end
  || case when jsonb_typeof(g.data -> 'package') = 'array'
           and exists (
                 select 1
                 from jsonb_array_elements(g.data -> 'package') as grp(val),
                      jsonb_array_elements(case when jsonb_typeof(grp.val -> 'items') = 'array' then grp.val -> 'items' else '[]'::jsonb end) as it(val)
                 where it.val ? 'storePrice' or it.val ? 'orgPrice')
          then '{}'::jsonb
          else jsonb_build_object('package', d.d -> 'package') end
from grants_defaults_001 d
where g.id = true;

-- אם אין שורה בכלל (מערכת חדשה): יוצרים אותה עם ברירות המחדל
insert into public.grants_archive (id, data)
select true, d.d || jsonb_build_object('years', '{}'::jsonb)
from grants_defaults_001 d
where not exists (select 1 from public.grants_archive);

commit;

-- ============================================================
--  בדיקה אחרי ההרצה (קריאה בלבד, בלי פרטים אישיים).
--  התוצאה הצפויה: per_groom_value = 8110.7 (או ערך אחר שכבר היה שמור),
--  payments ו-package מסוג array, ו-package_has_prices = true.
-- ============================================================
select
  g.data -> 'perGroomValue'                                   as per_groom_value,
  jsonb_typeof(g.data -> 'payments')                          as payments_type,
  jsonb_array_length(g.data -> 'payments')                    as payments_count,
  jsonb_typeof(g.data -> 'package')                           as package_type,
  jsonb_array_length(g.data -> 'package')                     as package_groups,
  g.data -> 'package' @? '$[*].items[*] ? (exists(@.storePrice) || exists(@.orgPrice))' as package_has_prices,
  (select b.data ? 'perGroomValue' from public.grants_archive_backup_001 b)              as had_per_groom_before,
  (select jsonb_typeof(b.data -> 'payments') from public.grants_archive_backup_001 b)    as payments_type_before,
  (select jsonb_typeof(b.data -> 'package') from public.grants_archive_backup_001 b)     as package_type_before
from public.grants_archive g;
