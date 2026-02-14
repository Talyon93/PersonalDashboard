/**
 * Merchant Mappings Module - Gestione Mappature con Supabase
 * VERSION: FIXED - Returns data for cache system
 */

const MerchantMappings = {
    mappings: {},

    // Tags that exclude expenses from normal counting
    excludedTags: ['Investimenti', 'Risparmi', 'Trasferimenti'],

    /**
     * Inizializza le mappature
     */
    async init() {
        // FIX: Restituisce il risultato per il sistema di cache
        return await this.loadMappings();
    },

    /**
     * Carica le mappature da Supabase
     */
    async loadMappings() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                this.mappings = {};
                return {}; // FIX: Ritorna oggetto vuoto invece di undefined
            }

            // Fetch mappings from Supabase
            const { data, error } = await window.supabaseClient
                .from('merchant_mappings')
                .select('*')
                .eq('user_id', user.data.user.id);

            if (error) {
                console.error('Error loading merchant mappings:', error);
                this.mappings = {};
                return {}; // FIX: Ritorna oggetto vuoto su errore
            }

            // Convert array to object format
            this.mappings = {};
            if (data) {
                data.forEach(mapping => {
                    this.mappings[mapping.merchant_name] = {
                        category: mapping.category_id,
                        tags: [] // Tags can be added later if needed
                    };
                });
            }
            
            // FIX: Restituisce i dati caricati per data-cache.js
            return this.mappings;

        } catch (e) {
            console.error('Error in loadMappings:', e);
            this.mappings = {};
            return {}; // FIX: Ritorna oggetto vuoto su eccezione
        }
    },

    /**
     * Ottiene tutte le mappature
     */
    getAll() {
        return this.mappings;
    },

    /**
     * Ottiene la mappatura per un merchant
     */
    get(merchant) {
        return this.mappings[merchant];
    },

    /**
     * Aggiunge o aggiorna una mappatura
     */
    async set(merchant, categoryId, tags = []) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const merchantKey = merchant.toLowerCase().trim();

            // Upsert into Supabase
            const { error } = await window.supabaseClient
                .from('merchant_mappings')
                .upsert({
                    user_id: user.data.user.id,
                    merchant_name: merchantKey,
                    category_id: categoryId
                }, {
                    onConflict: 'user_id,merchant_name'
                });

            if (error) {
                console.error('Error saving merchant mapping:', error);
                throw new Error('Errore nel salvataggio della mappatura');
            }

            // Update local cache
            this.mappings[merchantKey] = {
                category: categoryId,
                tags: tags
            };
        } catch (e) {
            console.error('Error in set:', e);
            throw e;
        }
    },

    /**
     * Elimina una mappatura
     */
    async delete(merchant) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const merchantKey = merchant.toLowerCase().trim();

            // Delete from Supabase
            const { error } = await window.supabaseClient
                .from('merchant_mappings')
                .delete()
                .eq('user_id', user.data.user.id)
                .eq('merchant_name', merchantKey);

            if (error) {
                console.error('Error deleting merchant mapping:', error);
                throw new Error('Errore nell\'eliminazione della mappatura');
            }

            // Remove from local cache
            delete this.mappings[merchantKey];
        } catch (e) {
            console.error('Error in delete:', e);
            throw e;
        }
    },

    /**
     * Verifica se un merchant ha una mappatura
     */
    has(merchant) {
        return merchant in this.mappings;
    },

    /**
     * Ottiene il conteggio delle mappature
     */
    count() {
        return Object.keys(this.mappings).length;
    },

    /**
     * Applica la mappatura a una spesa basandosi sul merchant
     */
    applyToExpense(expense) {
        if (!expense.merchant) return expense; // Safety check
        
        const mapping = this.get(expense.merchant.toLowerCase().trim());
        if (mapping) {
            expense.category = mapping.category;
            expense.tags = mapping.tags || [];
        }
        return expense;
    },

    /**
     * Verifica se una spesa ha tag esclusi
     */
    isExcluded(expense) {
        if (!expense.tags || !Array.isArray(expense.tags)) {
            return false;
        }
        return expense.tags.some(tag => this.excludedTags.includes(tag));
    }
};

// Export globale
window.MerchantMappings = MerchantMappings;
console.log('✅ MerchantMappings module loaded');