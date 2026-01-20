/**
 * Categories Module - Gestione Categorie con Supabase
 * VERSION: FIXED - Better duplicate handling & Returns data for cache
 */

const Categories = {
    // Default categories (expenses)
    defaultCategories: [
        { id: 'food', name: 'Cibo', icon: '🍕' },
        { id: 'transport', name: 'Trasporti', icon: '🚗' },
        { id: 'entertainment', name: 'Intrattenimento', icon: '🎬' },
        { id: 'utilities', name: 'Utenze', icon: '💡' },
        { id: 'shopping', name: 'Shopping', icon: '🛍️' },
        { id: 'health', name: 'Salute', icon: '🏥' },
        { id: 'other', name: 'Altro', icon: '📦' }
    ],

    // Income categories
    incomeCategories: [
        { id: 'salary', name: 'Stipendio', icon: '💼' },
        { id: 'freelance', name: 'Freelance', icon: '💻' },
        { id: 'investment_income', name: 'Investimenti', icon: '📈' },
        { id: 'gift', name: 'Regalo', icon: '🎁' },
        { id: 'refund', name: 'Rimborso', icon: '↩️' },
        { id: 'sale', name: 'Vendita', icon: '💰' },
        { id: 'bonus', name: 'Bonus', icon: '🎉' },
        { id: 'other_income', name: 'Altro', icon: '💵' }
    ],

    categories: [],

    /**
     * Inizializza le categorie
     */
    async init() {
        return await this.loadCategories();
    },

    /**
     * Carica le categorie da Supabase
     */
    async loadCategories() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user || !user.data.user) {
                this.categories = [...this.defaultCategories];
                return this.categories;
            }

            // Fetch categories from Supabase
            const { data, error } = await window.supabaseClient
                .from('categories')
                .select('*')
                .eq('user_id', user.data.user.id)
                .eq('type', 'expense');

            if (error) {
                console.error('Error loading categories:', error);
                this.categories = [...this.defaultCategories];
                return this.categories;
            }

            // Se non ci sono categorie custom, usa quelle default
            if (!data || data.length === 0) {
                this.categories = [...this.defaultCategories];
                // Salva le categorie default su Supabase in background
                this.initializeDefaultCategories();
            } else {
                // Mappa le categorie da Supabase al formato locale
                this.categories = data.map(cat => ({
                    id: cat.category_id,
                    name: cat.name,
                    icon: cat.icon
                }));
            }
            
            return this.categories;

        } catch (e) {
            console.error('Error in loadCategories:', e);
            this.categories = [...this.defaultCategories];
            return this.categories;
        }
    },

    /**
     * Inizializza le categorie default su Supabase
     */
    async initializeDefaultCategories() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) return;

            const categoriesToInsert = this.defaultCategories.map(cat => ({
                user_id: user.data.user.id,
                category_id: cat.id,
                name: cat.name,
                icon: cat.icon,
                type: 'expense'
            }));

            const { error } = await window.supabaseClient
                .from('categories')
                .insert(categoriesToInsert);

            if (error) {
                // Ignora errori di duplicati durante l'inizializzazione
                if (error.code !== '23505') {
                    console.error('Error initializing default categories:', error);
                }
            }
        } catch (e) {
            console.error('Error in initializeDefaultCategories:', e);
        }
    },

    /**
     * Ottiene tutte le categorie
     */
    getAll() {
        return this.categories.length > 0 ? this.categories : this.defaultCategories;
    },

    /**
     * Ottiene una categoria per ID
     */
    getById(id) {
        return this.getAll().find(c => c.id === id);
    },

    /**
     * Aggiunge una nuova categoria
     */
    async add(icon, name) {
        if (!icon || !name) {
            throw new Error('Icona e nome sono obbligatori');
        }

        // Generate ID from name
        const id = name.toLowerCase()
            .trim()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõö]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[^a-z0-9]/g, '_');

        // Check if category already exists locally
        if (this.getAll().find(c => c.id === id)) {
            throw new Error('Esiste già una categoria con questo nome (o simile).');
        }

        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Insert into Supabase
            const { error } = await window.supabaseClient
                .from('categories')
                .insert({
                    user_id: user.data.user.id,
                    category_id: id,
                    name: name,
                    icon: icon,
                    type: 'expense'
                });

            if (error) {
                if (error.code === '23505') { // Duplicate key error code
                     throw new Error('Questa categoria esiste già nel database.');
                }
                console.error('Error adding category:', error);
                throw new Error('Errore nel salvataggio della categoria');
            }

            // Add to local array
            this.categories.push({ id, name, icon });
            
            // Aggiorna cache
            if (window.DataCache) {
                window.DataCache.invalidate('categories');
            }

            return { id, name, icon };
        } catch (e) {
            console.error('Error in add:', e);
            throw e;
        }
    },

    /**
     * Elimina una categoria
     */
    async delete(categoryId) {
        // Don't allow deleting default categories
        if (this.defaultCategories.find(c => c.id === categoryId)) {
            throw new Error('Non puoi eliminare categorie predefinite');
        }

        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Check if any expenses use this category
            const { data: expenses, error: checkError } = await window.supabaseClient
                .from('expenses')
                .select('id')
                .eq('user_id', user.data.user.id)
                .eq('category', categoryId);

            if (checkError) {
                console.error('Error checking expenses:', checkError);
                throw new Error('Errore nel controllo delle spese');
            }

            const usedCount = expenses ? expenses.length : 0;

            if (usedCount > 0) {
                // Move expenses to "other"
                const { error: updateError } = await window.supabaseClient
                    .from('expenses')
                    .update({ category: 'other' })
                    .eq('user_id', user.data.user.id)
                    .eq('category', categoryId);

                if (updateError) {
                    console.error('Error updating expenses:', updateError);
                    throw new Error('Errore nello spostamento delle spese');
                }
            }

            // Delete from Supabase
            const { error } = await window.supabaseClient
                .from('categories')
                .delete()
                .eq('user_id', user.data.user.id)
                .eq('category_id', categoryId);

            if (error) {
                console.error('Error deleting category:', error);
                throw new Error('Errore nell\'eliminazione della categoria');
            }

            // Remove from local array
            this.categories = this.categories.filter(c => c.id !== categoryId);
            
            // Aggiorna cache
            if (window.DataCache) {
                window.DataCache.invalidate('categories');
            }

            return usedCount;
        } catch (e) {
            console.error('Error in delete:', e);
            throw e;
        }
    },

    /**
     * Verifica se una categoria è predefinita
     */
    isDefault(categoryId) {
        return this.defaultCategories.find(c => c.id === categoryId) !== undefined;
    }
};

// Export globale
window.Categories = Categories;
console.log('✅ Categories module loaded');