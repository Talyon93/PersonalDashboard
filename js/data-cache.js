/**
 * DataCache Module - Intelligent caching for Supabase data
 * Reduces API calls and speeds up navigation
 * VERSION: FIXED - Corrected keys and added safety checks
 */

const DataCache = {
    cache: {
        expenses: { data: null, timestamp: null, ttl: 30000 }, // 30 seconds
        tasks: { data: null, timestamp: null, ttl: 30000 },
        goals: { data: null, timestamp: null, ttl: 30000 },
        categories: { data: null, timestamp: null, ttl: 300000 }, // 5 minutes
        merchantMappings: { data: null, timestamp: null, ttl: 300000 }, // PLURALE
        settings: { data: null, timestamp: null, ttl: 60000 } // 1 minute
    },

    /**
     * Get cached data or fetch fresh if expired
     */
    async get(key, fetchFunction) {
        // SAFETY CHECK: Verify key exists
        if (!this.cache[key]) {
            console.error(`❌ Cache key '${key}' does not exist! Check your spelling.`);
            // Prova a recuperare i dati comunque senza cache per non bloccare l'app
            try { return await fetchFunction(); } catch (e) { return null; }
        }

        const cached = this.cache[key];
        const now = Date.now();

        // Check if cache is valid
        if (cached.data && cached.timestamp && (now - cached.timestamp) < cached.ttl) {
            console.log(`✅ Cache HIT for ${key} (age: ${Math.round((now - cached.timestamp) / 1000)}s)`);
            return cached.data;
        }

        // Cache miss or expired - fetch fresh data
        console.log(`🔄 Cache MISS for ${key} - fetching...`);
        try {
            const data = await fetchFunction();
            // Salva solo se abbiamo dati validi
            if (data !== undefined) {
                this.set(key, data);
            }
            return data;
        } catch (e) {
            console.error(`Error fetching ${key}:`, e);
            // Return stale cache if available
            if (cached.data) {
                console.log(`⚠️ Using stale cache for ${key}`);
                return cached.data;
            }
            throw e;
        }
    },

    /**
     * Set cache data
     */
    set(key, data) {
        if (this.cache[key]) {
            this.cache[key].data = data;
            this.cache[key].timestamp = Date.now();
            console.log(`💾 Cache SET for ${key}`);
        }
    },

    /**
     * Invalidate specific cache key
     */
    invalidate(key) {
        if (this.cache[key]) {
            this.cache[key].data = null;
            this.cache[key].timestamp = null;
            console.log(`🗑️ Cache INVALIDATED for ${key}`);
        }
    },

    /**
     * Invalidate multiple keys
     */
    invalidateMultiple(keys) {
        keys.forEach(key => this.invalidate(key));
    },

    /**
     * Clear all cache
     */
    clearAll() {
        Object.keys(this.cache).forEach(key => this.invalidate(key));
        console.log('🗑️ All cache CLEARED');
    },

    /**
     * Preload data for faster navigation
     */
    async preloadAll() {
        console.log('🚀 Preloading all data...');
        
        // Safety checks for modules
        const safeGetAll = (Module, name) => {
            if (window[Module] && typeof window[Module].getAll === 'function') {
                return window[Module].getAll();
            }
            console.warn(`Module ${Module} not ready for preload`);
            return [];
        };

        const promises = [
            this.get('expenses', () => ExpenseCRUD.getAll()),
            this.get('tasks', () => TaskCRUD.getAll()),
            this.get('goals', () => GoalCRUD.getAll()),
            this.get('categories', () => Promise.resolve(safeGetAll('Categories', 'categories'))),
            // FIX: Corretto nome chiave (plurale) e nome oggetto (plurale)
            this.get('merchantMappings', () => Promise.resolve(safeGetAll('MerchantMappings', 'merchantMappings')))
        ];

        try {
            await Promise.all(promises);
            console.log('✅ Preload complete!');
        } catch (e) {
            console.error('Preload error (non-blocking):', e);
        }
    }
};

// Export globale
window.DataCache = DataCache;
console.log('✅ DataCache module loaded');