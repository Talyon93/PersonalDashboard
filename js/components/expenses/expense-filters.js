/**
 * Expense Filters Module - Filtri per Categorie e Tag
 */

const ExpenseFilters = {
    currentCategoryFilter: null,

    /**
     * Imposta il filtro per categoria
     */
    setCategory(categoryId) {
        this.currentCategoryFilter = categoryId;
    },

    /**
     * Resetta il filtro categoria
     */
    clearCategory() {
        this.currentCategoryFilter = null;
    },

    /**
     * Ottiene il filtro categoria corrente
     */
    getCategory() {
        return this.currentCategoryFilter;
    },

    /**
     * Verifica se un filtro categoria è attivo
     */
    hasCategory() {
        return this.currentCategoryFilter !== null;
    },

    /**
     * Filtra le spese in base ai criteri attivi
     */
    apply(expenses) {
        let filtered = [...expenses];

        // Apply category filter
        if (this.currentCategoryFilter) {
            filtered = filtered.filter(e => e.category === this.currentCategoryFilter);
        }

        return filtered;
    },

    /**
     * Filtra per tipo (income/expense)
     */
    byType(expenses, type) {
        return expenses.filter(e => e.type === type);
    },

    /**
     * Filtra per categoria
     */
    byCategory(expenses, categoryId) {
        return expenses.filter(e => e.category === categoryId);
    },

    /**
     * Filtra per tag
     */
    byTag(expenses, tag) {
        return expenses.filter(e => 
            e.tags && Array.isArray(e.tags) && e.tags.includes(tag)
        );
    },

    /**
     * Filtra spese escluse (investimenti, risparmi, etc.)
     */
    excluded(expenses) {
        return expenses.filter(e => MerchantMappings.isExcluded(e));
    },

    /**
     * Filtra spese non escluse
     */
    notExcluded(expenses) {
        return expenses.filter(e => !MerchantMappings.isExcluded(e));
    },

    /**
     * Cerca spese per testo (descrizione o merchant)
     */
    search(expenses, searchText) {
        if (!searchText || searchText.trim() === '') {
            return expenses;
        }

        const query = searchText.toLowerCase().trim();
        return expenses.filter(e => {
            const description = (e.description || '').toLowerCase();
            const merchant = (e.merchant || '').toLowerCase();
            return description.includes(query) || merchant.includes(query);
        });
    },

    /**
     * Ordina le spese
     */
    sort(expenses, sortBy = 'date', order = 'desc') {
        const sorted = [...expenses];

        sorted.sort((a, b) => {
            let compareValue = 0;

            switch (sortBy) {
                case 'date':
                    compareValue = new Date(a.date) - new Date(b.date);
                    break;
                case 'amount':
                    compareValue = Math.abs(a.amount) - Math.abs(b.amount);
                    break;
                case 'description':
                    compareValue = (a.description || '').localeCompare(b.description || '');
                    break;
                case 'category':
                    compareValue = (a.category || '').localeCompare(b.category || '');
                    break;
            }

            return order === 'desc' ? -compareValue : compareValue;
        });

        return sorted;
    }
};

// Export globale
window.ExpenseFilters = ExpenseFilters;
console.log('✅ ExpenseFilters module loaded');
