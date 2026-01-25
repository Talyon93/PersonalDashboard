/**
 * App Initialization - MAIN ENTRY POINT
 * Avvia ModuleManager e renderizza la sidebar dinamica.
 */

const AppInit = {
    initialized: false,

    async init() {
        if (this.initialized) return;

        try {
            // 1. Controllo Autenticazione
            if (!window.supabaseClient) throw new Error("Supabase client not found");
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                console.log('❌ No user, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            // 2. INIT SISTEMA MODULARE (Cruciale!)
            // Scarica lo stato dei moduli dal DB e inizializza quelli attivi
            if (window.ModuleManager) {
                await ModuleManager.init(); 
            }

            // 3. DISEGNA LA SIDEBAR (Cruciale!)
            // Ora che i moduli sono registrati, disegniamo i bottoni
            if (window.renderSidebar) {
                window.renderSidebar(); 
            }

            // 4. Carica impostazioni base
            if (window.SettingsManager) {
                await SettingsManager.load();
            }

            // 5. Preload Dati (in parallelo per velocità)
            if (window.DataCache) {
                await DataCache.preloadAll();
            }

            this.initialized = true;

            // 6. Mostra la sezione iniziale (Default: Dashboard)
            // Se c'è già una sezione visibile nell'HTML (es. dopo un reload) usala, altrimenti vai alla Dashboard
            const current = document.querySelector('.content-section:not(.hidden)');
            let sectionToLoad = 'dashboard';
            
            if (current) {
                sectionToLoad = current.id.replace('Content', '');
            }
            
            // Avvia la navigazione verso la sezione corretta
            if (window.showSection) {
                window.showSection(sectionToLoad);
            }

            // 7. Check Tour Iniziale (FTUE)
            // Parte solo se tutto il resto è finito
            if (window.FTUE) {
                setTimeout(() => window.FTUE.init(), 1000);
            }

        } catch (e) {
            console.error('Initialization error:', e);
            document.body.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold mb-4">Errore di Caricamento</h2>
                        <p class="text-slate-400 mb-6">${e.message}</p>
                        <button onclick="window.location.reload()" class="px-6 py-3 bg-indigo-600 rounded-lg font-bold">Ricarica</button>
                    </div>
                </div>
            `;
        }
    },

    // Helper per render manuale (mantenuto per compatibilità, ma ora fa tutto ModuleManager)
    async renderSection(sectionName) {
        // La logica di render è ora delegata ai moduli stessi via ModuleManager
        // Questa funzione rimane vuota o può essere rimossa se non usata altrove
    }
};

// Avvio automatico al caricamento del DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppInit.init());
} else {
    AppInit.init();
}

window.AppInit = AppInit;