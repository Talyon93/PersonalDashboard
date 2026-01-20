// app.js
(function () {
  const required = ['supabaseClient', 'getUser', 'requireAuth'];

  for (const key of required) {
    if (!window[key]) {
      console.error(`❌ Missing dependency: ${key}`);
      return;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const ok = await window.requireAuth();
    if (!ok) return;
    console.log("✅ App ready");
  });
})();