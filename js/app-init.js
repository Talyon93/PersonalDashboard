/**
 * App Initialization - Preload data and setup
 * UPDATED: Loads SettingsManager first
 */

const AppInit = {
    initialized: false,

    async init() {
        if (this.initialized) return;
        

        try {
            // Check authentication
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (!user) {
                console.log('❌ No user, redirecting to login');
                window.location.href = 'login.html';
                return;
            }

            // Load settings FIRST (before data preload)
            if (window.SettingsManager) {
                await SettingsManager.load();
            }

            // Preload all data in parallel
            const startTime = Date.now();
            
            await DataCache.preloadAll();
            
            const loadTime = Date.now() - startTime;

            this.initialized = true;

            // Trigger first render
            const currentSection = document.querySelector('.content-section:not(.hidden)');
            if (currentSection) {
                const sectionId = currentSection.id.replace('Content', '');
                this.renderSection(sectionId);
            }

        } catch (e) {
            console.error('Initialization error:', e);
            
            // Show error UI
            document.body.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-100">
                    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
                        <div class="text-6xl mb-4">⚠️</div>
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">Errore di Inizializzazione</h2>
                        <p class="text-gray-600 mb-6">${e.message}</p>
                        <button onclick="window.location.reload()" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            🔄 Ricarica Pagina
                        </button>
                    </div>
                </div>
            `;
        }
    },

    /**
     * Render section with cached data (instant!)
     */
    async renderSection(sectionName) {
        
        const components = {
            'dashboard': Dashboard,
            'expenses': Expenses,
            'statistics': Statistics,
            'agenda': Agenda,
            'goals': Goals,
            'settings': Settings
        };

        const component = components[sectionName];
        if (component && component.render) {
            await component.render();
        }
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AppInit.init());
} else {
    AppInit.init();
}

// Export globale
window.AppInit = AppInit;
console.log('✅ AppInit module loaded (with SettingsManager integration)');
