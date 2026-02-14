/**
 * Settings Manager - Global Settings Handler
 * Carica settings da Supabase e li rende disponibili a tutta l'app
 */

const SettingsManager = {
    settings: {
        monthlyBudget: 700,
        firstDayOfMonth: 25,
        currency: 'EUR',
        currencySymbol: '€',
        dateFormat: 'DD/MM/YYYY',
        notifications: {
            tasks: true,
            budget: true
        }
    },

    loaded: false,

    /**
     * Load settings from Supabase
     */
    async load() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                console.log('⚙️ No user, using default settings');
                this.loaded = true;
                return this.settings;
            }

            const { data, error } = await window.supabaseClient
                .from('user_settings')
                .select('*')
                .eq('user_id', user.data.user.id)
                .single();

            if (data) {
                this.settings = {
                    monthlyBudget: data.monthly_budget || 700,
                    firstDayOfMonth: data.first_day_of_month || 25,
                    currency: data.currency || 'EUR',
                    currencySymbol: data.currency_symbol || '€',
                    dateFormat: data.date_format || 'DD/MM/YYYY',
                    notifications: data.notifications || { tasks: true, budget: true }
                };
                console.log('✅ Settings loaded from Supabase:', this.settings);
            } else {
                console.log('⚙️ No settings found, using defaults');
            }

            this.loaded = true;
            return this.settings;
        } catch (e) {
            console.error('Error loading settings:', e);
            this.loaded = true;
            return this.settings;
        }
    },

    /**
     * Get a specific setting
     */
    get(key) {
        return this.settings[key];
    },

    /**
     * Get all settings
     */
    getAll() {
        return this.settings;
    },

    /**
     * Check if settings are loaded
     */
    isLoaded() {
        return this.loaded;
    },

    /**
     * Wait for settings to load
     */
    async waitForLoad() {
        if (this.loaded) return this.settings;
        
        // Poll every 100ms until loaded
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.loaded) {
                    clearInterval(checkInterval);
                    resolve(this.settings);
                }
            }, 100);
        });
    }
};

// Export globale
window.SettingsManager = SettingsManager;
console.log('✅ SettingsManager module loaded');
