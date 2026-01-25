/**
 * App Initialization - Preload data and setup
 * FIXED: Launches FTUE Tour after initialization.
 */

const AppInit = {
    initialized: false,

    async init() {
        if (this.initialized) return;

        try {
            // 1. Check authentication
            if (!window.supabaseClient) throw new Error("Supabase client not found");
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                console.log('❌ No user, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            // 2. INIT MODULI (Priorità assoluta per sistemare la Sidebar)
            if (window.ModulesHub) {
                await ModulesHub.init();
            }

            // 3. Load settings
            if (window.SettingsManager) {
                await SettingsManager.load();
            }

            // 4. Preload data
            await DataCache.preloadAll();

            this.initialized = true;

            // 5. Trigger first render
            const currentSection = document.querySelector('.content-section:not(.hidden)');
            if (currentSection) {
                const sectionId = currentSection.id.replace('Content', '');
                
                // Fallback dashboard se il modulo corrente è disattivato
                if (sectionId === 'expenses' && !ModulesHub.states.expenses_enabled) {
                    window.showSection('dashboard');
                } else if (sectionId === 'goals' && !ModulesHub.states.goals_enabled) {
                    window.showSection('dashboard');
                } else {
                    await this.renderSection(sectionId);
                }
            }

            // === 6. AVVIA IL TOUR (FTUE) ===
            // Parte solo se tutto il resto è finito
            if (window.FTUE) {
                console.log('🚀 App Ready. Checking FTUE...');
                window.FTUE.init();
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

    async renderSection(sectionName) {
        const components = {
            'dashboard': Dashboard,
            'expenses': Expenses,
            'statistics': Statistics,
            'agenda': Agenda,
            'goals': Goals,
            'settings': Settings,
            'modules': ModulesHub
        };

        const component = components[sectionName];
        if (component) {
            if (component.init) await component.init();
            else if (component.render) await component.render();
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppInit.init());
} else {
    AppInit.init();
}

window.AppInit = AppInit;