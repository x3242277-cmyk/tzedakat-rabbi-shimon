/* ============================================================
   שכבת חיבור ל-Supabase — צדקת רבי שמעון
   מחליפה את שכבת גוגל שיטס. גישה ישירה ל-REST + Auth (ללא תלויות).
   נטען לפני script.js. חושף window.SB.
   ============================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://yyuiovoqwfekgtgfhiiu.supabase.co";
  const SUPABASE_KEY = "sb_publishable_wSWFcSZl2hFP9F6Sx7zwVg_d42h81P8";
  const SESSION_KEY = "ezer_sb_session";
  const REST = SUPABASE_URL + "/rest/v1/";
  const AUTH = SUPABASE_URL + "/auth/v1/";

  // ---------- ניהול סשן (נשמר ב-localStorage) ----------
  function getSession() {
    try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }
  function accessToken() { const s = getSession(); return s && s.access_token; }
  function isLoggedIn() { return !!accessToken(); }

  function baseHeaders(useUserToken) {
    const h = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
    const tok = useUserToken ? accessToken() : null;
    h.Authorization = "Bearer " + (tok || SUPABASE_KEY);
    return h;
  }

  // ---------- Auth ----------
  async function signIn(email, password) {
    const r = await fetch(AUTH + "token?grant_type=password", {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(email).trim(), password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = data.msg || data.error_description || data.error || "פרטי התחברות שגויים";
      throw new Error(msg);
    }
    setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600)),
      user: data.user,
    });
    return data.user;
  }

  async function refresh() {
    const s = getSession();
    if (!s || !s.refresh_token) throw new Error("אין סשן פעיל");
    const r = await fetch(AUTH + "token?grant_type=refresh_token", {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.access_token) { setSession(null); throw new Error("פג תוקף הסשן"); }
    setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || (Math.floor(Date.now() / 1000) + (data.expires_in || 3600)),
      user: data.user || s.user,
    });
    return data;
  }

  async function signOut() {
    const tok = accessToken();
    if (tok) {
      try { await fetch(AUTH + "logout", { method: "POST", headers: baseHeaders(true) }); } catch (e) {}
    }
    setSession(null);
  }

  // ---------- REST עם ניסיון רענון אוטומטי ב-401 ----------
  async function request(method, path, { body, prefer, range } = {}, _retried) {
    const headers = baseHeaders(true);
    if (prefer) headers.Prefer = prefer;
    if (range) headers.Range = range;
    const r = await fetch(REST + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401 && !_retried && getSession()) {
      try { await refresh(); return request(method, path, { body, prefer, range }, true); } catch (e) { setSession(null); throw new Error("ההתחברות פגה - יש להתחבר מחדש"); }
    }
    if (!r.ok && r.status !== 206) {
      const t = await r.text().catch(() => "");
      throw new Error(`שגיאת שרת (${r.status}): ${t.slice(0, 160)}`);
    }
    const txt = await r.text();
    const json = txt ? JSON.parse(txt) : null;
    return { json, contentRange: r.headers.get("content-range") };
  }

  // PostgREST מגביל כברירת מחדל ל-1000 שורות לבקשה - דוגמים בעמודים עד שמתקבל הכל
  async function selectAll(table, query) {
    const PAGE = 1000;
    let offset = 0;
    const all = [];
    while (true) {
      const { json, contentRange } = await request("GET", `${table}?select=*${query ? "&" + query : ""}`, {
        range: `${offset}-${offset + PAGE - 1}`,
      });
      const rows = json || [];
      all.push(...rows);
      const total = contentRange && contentRange.includes("/") ? contentRange.split("/")[1] : null;
      const totalCount = total && total !== "*" ? Number(total) : null;
      if (rows.length < PAGE || (totalCount != null && all.length >= totalCount)) break;
      offset += PAGE;
    }
    return all;
  }
  function upsert(table, rows) {
    const arr = Array.isArray(rows) ? rows : [rows];
    return request("POST", table, { body: arr, prefer: "resolution=merge-duplicates,return=minimal" });
  }
  function remove(table, filter) {
    return request("DELETE", `${table}?${filter}`, { prefer: "return=minimal" });
  }

  // ---------- מיפוי שדות: אפליקציה (camelCase) ↔ מסד (snake_case) ----------
  const clean = (obj) => { const o = {}; for (const k in obj) if (obj[k] !== undefined) o[k] = obj[k]; return o; };

  const memberToDb = (m) => clean({
    id: String(m.id), first_name: m.firstName || "", last_name: m.lastName || "", father_name: m.fatherName || "",
    phone: m.phone || "", yeshiva: m.yeshiva || "", shiur: m.shiur || "", yeshiva_type: m.yeshivaType || "",
    marital_status: m.maritalStatus || "", address: m.address || "", notes: m.notes || "", created_at: m.createdAt || null,
  });
  const memberFromDb = (r) => clean({
    id: r.id, firstName: r.first_name, lastName: r.last_name, fatherName: r.father_name, phone: r.phone,
    yeshiva: r.yeshiva, shiur: r.shiur, yeshivaType: r.yeshiva_type, maritalStatus: r.marital_status,
    address: r.address, notes: r.notes, createdAt: r.created_at,
  });

  const donationToDb = (d) => clean({
    id: String(d.id), member_id: d.memberId != null ? String(d.memberId) : null, member_name_snapshot: d.memberNameSnapshot || "",
    year: d.year || "", amount: Number(d.amount) || 0, date: d.date || "", notes: d.notes || "", created_at: d.createdAt || null,
  });
  const donationFromDb = (r) => clean({
    id: r.id, memberId: r.member_id, memberNameSnapshot: r.member_name_snapshot, year: r.year,
    amount: Number(r.amount) || 0, date: r.date, notes: r.notes, createdAt: r.created_at,
  });

  const expenseToDb = (e) => clean({
    id: String(e.id), year: e.year || "", category: e.category || "", description: e.description || "",
    amount: Number(e.amount) || 0, date: e.date || "", approved_by: e.approvedBy || "", created_at: e.createdAt || null,
  });
  const expenseFromDb = (r) => clean({
    id: r.id, year: r.year, category: r.category, description: r.description,
    amount: Number(r.amount) || 0, date: r.date, approvedBy: r.approved_by, createdAt: r.created_at,
  });

  // כתובות פורים: מבנה דינמי → נשמר ב-jsonb. משמרים __sbId לצורך עדכון.
  const purimToDb = (p) => { const data = Object.assign({}, p); delete data.__sbId; return clean({ id: p.__sbId || undefined, data }); };
  const purimFromDb = (r) => Object.assign({}, r.data, { __sbId: r.id });

  const profileFromDb = (p) => clean({
    id: p.id, username: p.username, displayName: p.display_name, isAdmin: !!p.is_admin,
    canEdit: !!p.can_edit, canViewIncome: !!p.can_view_income, canViewExpenses: !!p.can_view_expenses,
    canViewGrants: !!p.can_view_grants, canViewHistory: !!p.can_view_history,
  });

  // ---------- טעינה מלאה של כל הנתונים ----------
  async function loadAll() {
    const [members, donations, expenses, purim, profiles, settingsRows, grantsRows] = await Promise.all([
      selectAll("members"), selectAll("donations"), selectAll("expenses"),
      selectAll("purim_addresses"), selectAll("profiles"),
      selectAll("settings"), selectAll("grants_archive"),
    ]);
    return {
      members: (members || []).map(memberFromDb),
      donations: (donations || []).map(donationFromDb),
      expenses: (expenses || []).map(expenseFromDb),
      purimAddresses: (purim || []).map(purimFromDb),
      profiles: (profiles || []).map(profileFromDb),
      settings: (settingsRows && settingsRows[0] && settingsRows[0].data) || null,
      grantsArchive: (grantsRows && grantsRows[0] && grantsRows[0].data) || null,
    };
  }

  // ---------- שמירות נקודתיות ----------
  const saveMember   = (m) => upsert("members", memberToDb(m));
  const saveDonation = (d) => upsert("donations", donationToDb(d));
  const saveExpense  = (e) => upsert("expenses", expenseToDb(e));
  const savePurim    = (p) => upsert("purim_addresses", purimToDb(p));
  const saveSettings = (s) => upsert("settings", { id: true, data: s });
  const saveGrantsArchive = (a) => upsert("grants_archive", { id: true, data: a });
  const deleteMember   = (id) => remove("members", `id=eq.${encodeURIComponent(id)}`);
  const deleteDonation = (id) => remove("donations", `id=eq.${encodeURIComponent(id)}`);
  const deleteExpense  = (id) => remove("expenses", `id=eq.${encodeURIComponent(id)}`);

  window.SB = {
    URL: SUPABASE_URL,
    getSession, setSession, isLoggedIn, currentUser: () => { const s = getSession(); return s && s.user; },
    signIn, signOut, refresh,
    request, selectAll, upsert, remove,
    loadAll,
    saveMember, saveDonation, saveExpense, savePurim, saveSettings, saveGrantsArchive,
    deleteMember, deleteDonation, deleteExpense,
    map: { memberToDb, memberFromDb, donationToDb, donationFromDb, expenseToDb, expenseFromDb, purimToDb, purimFromDb, profileFromDb },
  };
})();
