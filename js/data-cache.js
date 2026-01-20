/**
 * DataCache Module - Intelligent caching for Supabase data
 * Reduces API calls and speeds up navigation
 */

const DataCache = {
    cache: {
        expenses: { data: null, timestamp: null, ttl: 30000 }, // 30 seconds
        tasks: { data: null, timestamp: null, ttl: 30000 },
        goals: { data: null, timestamp: null, ttl: 30000 },
        categories: { data: null, timestamp: null, ttl: 300000 }, // 5 minutes (rarely changes)
        merchantMappings: { data: null, timestamp: null, ttl: 300000 },
        settings: { data: null, timestamp: null, ttl: 60000 } // 1 minute
    },

    /**
     * Get cached data or fetch fresh if expired
     */
    async get(key, fetchFunction) {
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
            this.set(key, data);
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
        const promises = [
            this.get('expenses', () => ExpenseCRUD.getAll()),
            this.get('tasks', () => TaskCRUD.getAll()),
            this.get('goals', () => GoalCRUD.getAll()),
            this.get('categories', () => Promise.resolve(Categories.getAll())),
            this.get('merchantMappings', () => Promise.resolve(MerchantMapping.getAll()))
        ];

        try {
            await Promise.all(promises);
            console.log('✅ Preload complete!');
        } catch (e) {
            console.error('Preload error:', e);
        }
    }
};

// Export globale
window.DataCache = DataCache;
console.log('✅ DataCache module loaded');
