/* נטען בראש הדף, לפני שהמסך מצויר.
   אם יש סשן פעיל (רענון דף) - מסתיר את מסך הכניסה מראש, כדי שלא יהבהב לרגע. */
(function () {
  try {
    var raw = sessionStorage.getItem("ezer_sb_session");
    if (raw && JSON.parse(raw).access_token) {
      document.documentElement.style.setProperty("--login-init-display", "none");
    }
  } catch (e) {}
})();
