/**
 * App Initialization - MAIN ENTRY POINT
 * Versione con Feedback di Caricamento Dinamico
 */

const AppInit = {
    initialized: false,

    // Helper per aggiornare il testo del loader
    updateStatus(main, sub = "") {
        const statusEl = document.getElementById('loader-status');
        const subStatusEl = document.getElementById('loader-substatus');
        if (statusEl) statusEl.textContent = main;
        if (subStatusEl) subStatusEl.textContent = sub;
    },

    async init() {
        if (this.initialized) return;

        try {
            // 1. Autenticazione
            this.updateStatus("Verifica identità...", "Controllo sessione Supabase");
            if (!window.supabaseClient) throw new Error("Supabase client not found");
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // 2. Moduli
            this.updateStatus("Caricamento moduli...", "Configurazione plugin di sistema");
            if (window.ModuleManager) {
                await ModuleManager.init();
            }

            // 3. UI Sidebar
            this.updateStatus("Costruzione interfaccia...", "Generazione menu laterale");
            if (window.renderSidebar) {
                window.renderSidebar();
            }

            // 4. Impostazioni
            this.updateStatus("Preferenze utente...", "Sincronizzazione impostazioni personalizzate");
            if (window.SettingsManager) {
                await SettingsManager.load();
            }

            // 5. DATA PRELOAD (La fase più lunga)
            this.updateStatus("Sincronizzazione dati...", "Recupero transazioni e obiettivi dal database");
            if (window.DataCache) {
                await DataCache.preloadAll();
            }

            this.initialized = true;

            // 6. Preparazione Dashboard
            this.updateStatus("Quasi pronto...", "Rendering della dashboard operativa");
            const current = document.querySelector('.content-section:not(.hidden)');
            let sectionToLoad = 'dashboard';
            
            if (current) {
                sectionToLoad = current.id.replace('Content', '');
            }
            
            if (window.showSection) {
                window.showSection(sectionToLoad);
            }

            // Fine: Nascondi Loader
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.remove(), 500); 
            }

            if (window.FTUE) {
                setTimeout(() => window.FTUE.init(), 1000);
            }

        } catch (e) {
            console.error('Initialization error:', e);
            const loader = document.getElementById('global-loader');
            if (loader) loader.remove();

            document.body.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
                    <div class="text-center max-w-md">
                        <div class="bg-red-500/10 p-4 rounded-full inline-block mb-4">
                            <svg class="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <h2 class="text-2xl font-bold mb-2">Errore Critico</h2>
                        <p class="text-slate-400 mb-6 text-sm">${e.message}</p>
                        <button onclick="window.location.reload()" class="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg font-bold transition-colors">Riprova Caricamento</button>
                    </div>
                </div>
            `;
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppInit.init());
} else {
    AppInit.init();
}

window.AppInit = AppInit;