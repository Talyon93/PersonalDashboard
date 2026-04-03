/**
 * Supabase Configuration (SAFE SINGLETON)
 * Updated to read from window.CONFIG
 */
(function () {
  // 1. Recupera le chiavi dalla configurazione globale
  const supabaseUrl = window.CONFIG?.SUPABASE_URL;
  const supabaseKey = window.CONFIG?.SUPABASE_KEY;

  // 2. Controllo di sicurezza: Le chiavi esistono?
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERRORE CRITICO: Configurazione Supabase mancante.");
    console.warn("⚠️ Assicurati di aver creato il file 'js/config.js' con le chiavi corrette (vedi 'js/config.example.js').");
    
    // Fallback per evitare crash immediati degli altri script, ma l'app non funzionerà
    window.supabaseClient = null; 
    return;
  }

  // 3. Controllo libreria Supabase
  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("❌ CDN Supabase non caricata. Controlla la connessione internet o lo script nell'HTML.");
    return;
  }

  // 4. Inizializzazione Client (Singleton)
  if (!window.supabaseClient) {
    try {
      window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
      console.log("✅ Supabase configured successfully");
    } catch (e) {
      console.error("❌ Errore durante la creazione del client Supabase:", e);
    }
  }

  // 5. Helper Functions Globali
  window.getUser = async function () {
    if (!window.supabaseClient) return null;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    return session?.user ?? null;
  };

  window.requireAuth = async function () {
    const user = await window.getUser();
    if (!user) {
      console.log("🔒 Utente non autenticato, redirect al login...");
      window.location.href = "login.html";
      return false;
    }
    return true;
  };

  window.logout = async function () {
    if (window.supabaseClient) {
      await window.supabaseClient.auth.signOut();
    }
    window.location.href = "login.html";
  };

})();