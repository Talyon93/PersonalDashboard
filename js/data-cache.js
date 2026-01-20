/**
 * DataCache Module - Intelligent caching with LocalStorage persistence
 * VERSION: FIXED - Includes invalidateMultiple
 */

const DataCache = {
    // Configurazione durata cache
    config: {
        expenses: { ttl: 60000 },       // 1 minuto
        tasks: { ttl: 60000 },          // 1 minuto
        goals: { ttl: 60000 },          // 1 minuto
        categories: { ttl: 300000 },    // 5 minuti
        merchantMappings: { ttl: 300000 }, // 5 minuti
        settings: { ttl: 300000 }       // 5 minuti
    },

    // Memoria interna
    memoryCache: {},

    /**
     * Recupera dati
     */
    async get(key, fetchFunction) {
        // Safety Check
        if (!this.config[key]) {
            console.warn(`⚠️ Cache key '${key}' non configurata, procedo senza cache.`);
            try { return await fetchFunction(); } catch (e) { return []; }
        }

        const now = Date.now();
        
        // 1. Cerca in Memoria o LocalStorage
        let cached = this.memoryCache[key] || this.loadFromStorage(key);

        // 2. Verifica validità
        if (cached && cached.data && cached.timestamp) {
            const ttl = this.config[key].ttl;
            const age = now - cached.timestamp;

            if (age < ttl) {
                return cached.data;
            }
        }

        // 3. Scarica dati freschi
        try {
            const data = await fetchFunction();
            if (data !== undefined && data !== null) {
                this.set(key, data);
            }
            return data;
        } catch (e) {
            console.error(`❌ Errore fetch ${key}:`, e);
            if (cached && cached.data) return cached.data;
            throw e;
        }
    },

    /**
     * Salva dati
     */
    set(key, data) {
        const cacheEntry = {
            data: data,
            timestamp: Date.now()
        };
        this.memoryCache[key] = cacheEntry;
        try {
            localStorage.setItem(`app_cache_${key}`, JSON.stringify(cacheEntry));
        } catch (e) {
            console.warn('LocalStorage pieno');
        }
    },

    /**
     * Carica da Storage
     */
    loadFromStorage(key) {
        try {
            const stored = localStorage.getItem(`app_cache_${key}`);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.memoryCache[key] = parsed;
                return parsed;
            }
        } catch (e) {
            return null;
        }
        return null;
    },

    /**
     * Invalida una chiave
     */
    invalidate(key) {
        delete this.memoryCache[key];
        localStorage.removeItem(`app_cache_${key}`);
    },

    /**
     * Invalida chiavi multiple (QUELLA CHE MANCAVA!)
     */
    invalidateMultiple(keys) {
        if (!Array.isArray(keys)) return;
        keys.forEach(key => this.invalidate(key));
    },

    /**
     * Pulisce tutto
     */
    clearAll() {
        this.memoryCache = {};
        Object.keys(this.config).forEach(key => {
            localStorage.removeItem(`app_cache_${key}`);
        });
        console.log('🧹 Cache svuotata');
    },

    /**
     * Preload
     */
    async preloadAll() {
        const safeFetch = async (key, fn) => {
            const cached = this.loadFromStorage(key);
            const now = Date.now();
            const ttl = this.config[key]?.ttl || 30000;
            if (cached && (now - cached.timestamp < ttl)) return;
            return this.get(key, fn);
        };

        const safeGetAll = (Module) => {
            if (window[Module] && typeof window[Module].getAll === 'function') {
                return () => window[Module].getAll();
            }
            return () => Promise.resolve([]);
        };

        Promise.all([
            safeFetch('expenses', () => ExpenseCRUD.getAll()),
            safeFetch('tasks', () => TaskCRUD.getAll()),
            safeFetch('goals', () => GoalCRUD.getAll()),
            safeFetch('categories', safeGetAll('Categories')),
            safeFetch('merchantMappings', safeGetAll('MerchantMappings'))
        ]).then(() => {
            if (window.EventBus) window.EventBus.emit('dataChanged');
        });
    }
};

window.DataCache = DataCache;
console.log('✅ DataCache Loaded (with invalidateMultiple)');