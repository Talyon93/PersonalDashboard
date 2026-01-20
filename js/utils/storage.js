/**
 * Storage Manager - Bridge between localStorage and Supabase
 * Mantiene retrocompatibilità con vecchio codice mentre usa Supabase
 */

const StorageManager = {
    /**
     * Get settings from localStorage (temporary until Settings table in Supabase)
     */
    getSettings() {
        try {
            const settings = localStorage.getItem('settings');
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (e) {
            console.error('Error loading settings from localStorage:', e);
        }
        
        // Default settings
        return {
            currency: '€',
            budget: 700,
            monthStartDay: 25,
            theme: 'dark'
        };
    },

    /**
     * Save settings to localStorage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem('settings', JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    /**
     * Get expenses - DEPRECATED, use ExpenseCRUD.getAll()
     */
    async getExpenses() {
        console.warn('⚠️ StorageManager.getExpenses() is deprecated. Use ExpenseCRUD.getAll() instead.');
        
        // Fallback to localStorage if Supabase not available
        try {
            const data = localStorage.getItem('personalDashboard');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.expenses || [];
            }
        } catch (e) {
            console.error('Error loading expenses from localStorage:', e);
        }
        
        return [];
    },

    /**
     * Get goals from localStorage
     */
    getGoals() {
        try {
            const data = localStorage.getItem('personalDashboard');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.goals || [];
            }
        } catch (e) {
            console.error('Error loading goals:', e);
        }
        return [];
    },

    /**
     * Save goals to localStorage
     */
    saveGoals(goals) {
        try {
            const data = localStorage.getItem('personalDashboard') || '{}';
            const parsed = JSON.parse(data);
            parsed.goals = goals;
            localStorage.setItem('personalDashboard', JSON.stringify(parsed));
            return true;
        } catch (e) {
            console.error('Error saving goals:', e);
            return false;
        }
    },

    /**
     * Get events from localStorage
     */
    getEvents() {
        try {
            const data = localStorage.getItem('personalDashboard');
            if (data) {
                const parsed = JSON.parse(data);
                return parsed.events || [];
            }
        } catch (e) {
            console.error('Error loading events:', e);
        }
        return [];
    },

    /**
     * Save events to localStorage
     */
    saveEvents(events) {
        try {
            const data = localStorage.getItem('personalDashboard') || '{}';
            const parsed = JSON.parse(data);
            parsed.events = events;
            localStorage.setItem('personalDashboard', JSON.stringify(parsed));
            return true;
        } catch (e) {
            console.error('Error saving events:', e);
            return false;
        }
    },

    /**
     * Export all data
     */
    exportData() {
        const data = {
            settings: this.getSettings(),
            goals: this.getGoals(),
            events: this.getEvents(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            
            if (data.goals) {
                this.saveGoals(data.goals);
            }
            
            if (data.events) {
                this.saveEvents(data.events);
            }
            
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },

    /**
     * Clear all localStorage data
     */
    clearAll() {
        try {
            localStorage.removeItem('personalDashboard');
            localStorage.removeItem('settings');
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    }
};

console.log('✅ StorageManager initialized (Supabase + localStorage)');
