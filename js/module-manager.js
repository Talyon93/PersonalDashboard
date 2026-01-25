/**
 * MODULE MANAGER - Architettura Modulare
 * Centralizza la registrazione e la gestione dei moduli.
 */
const ModuleManager = {
    _modules: new Map(), // Registro di tutti i moduli
    _states: {},         // Stato attivazione dal DB (es. { expenses_enabled: true })

    /**
     * 1. REGISTRAZIONE MODULO
     * Ogni modulo chiama questa funzione per esistere nel sistema.
     */
    register(config) {
        if (!config.id) return console.error('❌ Errore: Modulo senza ID');

        const defaults = {
            id: '',             // ID univoco (es. 'crypto')
            dbKey: '',          // Nome colonna nel DB (es. 'crypto_enabled')
            name: '',           // Nome visibile (es. 'Criptovalute')
            icon: '📦',         // Icona SVG o Emoji
            category: 'main',   // 'main', 'finance', 'growth', 'tools'
            order: 50,          // Ordine visivo
            isCore: false,      // Se true, è sempre attivo (es. Agenda)
            
            // SOTTO-MENU (La parte che chiedevi)
            // Array di oggetti: { id: 'sub-1', label: 'Wallet', action: () => ... }
            subItems: [],       
            
            // Funzioni del modulo
            init: async () => {}, 
            render: async () => {} 
        };

        const moduleConfig = { ...defaults, ...config };
        
        // Se non viene specificata una chiave DB, la inventa basandosi sull'ID
        if (!moduleConfig.dbKey && !moduleConfig.isCore) {
            moduleConfig.dbKey = `${moduleConfig.id}_enabled`;
        }

        this._modules.set(config.id, moduleConfig);
        console.log(`🧩 Modulo registrato: ${config.id}`);
    },

    /**
     * 2. INIZIALIZZAZIONE SISTEMA
     * Carica i permessi dal DB e inizializza i moduli attivi.
     */
    async init() {
        await this.fetchPermissions(); // Scarica true/false dal DB

        // Inizializza solo i moduli attivi
        const activeModules = this.getActiveModules();
        for (const mod of activeModules) {
            try {
                if (mod.init) await mod.init();
            } catch (e) {
                console.error(`Errore init modulo ${mod.id}:`, e);
            }
        }
    },

    /**
     * 3. RECUPERA PERMESSI (Supabase)
     */
    async fetchPermissions() {
        if (!window.supabaseClient) return;
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            let { data, error } = await window.supabaseClient
                .from('user_modules')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            // Auto-fix se manca la riga
            if (!data) {
                const { data: newData } = await window.supabaseClient
                    .from('user_modules')
                    .upsert({ user_id: user.id })
                    .select().single();
                data = newData;
            }

            this._states = data || {};
            
            // Salva anche in localStorage per velocità
            localStorage.setItem('myfinance_module_states', JSON.stringify(this._states));

        } catch (e) { console.error("Err fetch modules", e); }
    },

    /**
     * 4. HELPER: Controlla se un modulo è attivo
     */
    isActive(moduleId) {
        const mod = this._modules.get(moduleId);
        if (!mod) return false;
        if (mod.isCore) return true; // I moduli core (Agenda) sono sempre attivi
        return !!this._states[mod.dbKey];
    },

    /**
     * 5. LISTA MODULI ATTIVI (Ordinati)
     * Usata dalla Sidebar per disegnarsi
     */
    getActiveModules() {
        return Array.from(this._modules.values())
            .filter(m => this.isActive(m.id))
            .sort((a, b) => a.order - b.order);
    },

    /**
     * 6. TOGGLE (Attiva/Disattiva)
     * Chiamato dall'Hub Moduli
     */
    async toggle(moduleId) {
        const mod = this._modules.get(moduleId);
        if (!mod || mod.isCore) return;

        const newState = !this._states[mod.dbKey];
        this._states[mod.dbKey] = newState; // Aggiornamento locale immediato

        // Aggiorna DB
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        await window.supabaseClient
            .from('user_modules')
            .update({ [mod.dbKey]: newState })
            .eq('user_id', user.id);

        // Ricarica la pagina per applicare le modifiche in modo pulito
        // (In un sistema più avanzato potremmo fare hot-reload, ma il reload è più sicuro per ora)
        window.location.reload();
    }
};

window.ModuleManager = ModuleManager;