/**
 * MODULE MANAGER - ARCHITETTURA JSONB (FLESSIBILE)
 * Salva lo stato dei moduli in un campo JSON. Include supporto Widget Dashboard.
 */
const ModuleManager = {
    _modules: new Map(),
    _states: {}, // Esempio: { "diet": true, "goals": false }

    register(config) {
        if (!config.id) return console.error('❌ Errore: Modulo senza ID');

        const defaults = {
            id: '',             
            name: '',           
            icon: '📦',         
            category: 'main',   
            order: 50,          
            isCore: false,      
            subItems: [],
            widgets: [], // Array per i widget della dashboard (Default vuoto)
            init: async () => {}, 
            render: async () => {} 
        };

        this._modules.set(config.id, { ...defaults, ...config });
        console.log(`🧩 Modulo registrato: ${config.id}`);
    },

    async init() {
        await this.fetchPermissions(); 

        const activeModules = this.getActiveModules();
        for (const mod of activeModules) {
            try {
                if (mod.init) await mod.init();
            } catch (e) {
                console.error(`Errore init modulo ${mod.id}:`, e);
            }
        }
    },

    async fetchPermissions() {
        if (!window.supabaseClient) return;
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            if (!user) return;

            let { data, error } = await window.supabaseClient
                .from('user_modules')
                .select('modules_state') // Leggiamo solo il JSON
                .eq('user_id', user.id)
                .maybeSingle();

            // Se non esiste la riga, la creiamo vuota
            if (!data) {
                const { data: newData } = await window.supabaseClient
                    .from('user_modules')
                    .upsert({ user_id: user.id, modules_state: {} })
                    .select()
                    .single();
                data = newData;
            }

            // Carica lo stato (fallback oggetto vuoto)
            this._states = data?.modules_state || {};
            
            // Backup in locale per velocità
            localStorage.setItem('myfinance_module_states', JSON.stringify(this._states));

        } catch (e) { 
            console.error("Err fetch modules", e); 
            // Fallback offline
            const cached = localStorage.getItem('myfinance_module_states');
            if (cached) this._states = JSON.parse(cached);
        }
    },

    isActive(moduleId) {
        const mod = this._modules.get(moduleId);
        if (!mod) return false;
        if (mod.isCore) return true; // I moduli Core sono sempre attivi
        
        // Verifica nello stato JSON (es. _states["diet"] === true)
        return !!this._states[moduleId];
    },

    /**
     * Ritorna SOLO i moduli attivi (per la sidebar)
     */
    getActiveModules() {
        return Array.from(this._modules.values())
            .filter(m => this.isActive(m.id))
            .sort((a, b) => a.order - b.order);
    },

    /**
     * NUOVO: Ritorna TUTTI i moduli registrati (Attivi e non).
     * Serve alla Dashboard per elencare i widget disponibili nella modale "Personalizza".
     */
    getModules() {
        return Array.from(this._modules.values());
    },

    async toggle(moduleId) {
        const mod = this._modules.get(moduleId);
        if (!mod || mod.isCore) return;

        // 1. Inverti lo stato in memoria
        const newState = !this.isActive(moduleId);
        this._states[moduleId] = newState;

        // 2. Aggiorna Cache Locale (UI istantanea)
        localStorage.setItem('myfinance_module_states', JSON.stringify(this._states));

        // 3. Salva nel Database (Colonna JSONB)
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            const { error } = await window.supabaseClient
                .from('user_modules')
                .update({ modules_state: this._states }) 
                .eq('user_id', user.id);

            if (error) throw error;
            
            // Ricarica per applicare le modifiche (Navigation, Init, ecc.)
            window.location.reload();

        } catch (e) {
            console.error("Errore salvataggio modulo:", e);
            alert("Errore nel salvataggio. Controlla la console.");
        }
    }
};

window.ModuleManager = ModuleManager;