/**
 * Settings WOW - Impostazioni Complete e Moderne
 * Features: Budget, Primo giorno mese, Formato data, Visualizzazione, Account
 */

const Settings = {
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

    async init() {
        console.log('⚙️ Settings.init()');
        await this.loadSettings();
        await this.render();
    },

    async loadSettings() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) return;

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
            }

            console.log('✅ Settings loaded:', this.settings);
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    },

    async saveSettings() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const settingsData = {
                user_id: user.data.user.id,
                monthly_budget: this.settings.monthlyBudget,
                first_day_of_month: this.settings.firstDayOfMonth,
                currency: this.settings.currency,
                currency_symbol: this.settings.currencySymbol,
                date_format: this.settings.dateFormat,
                notifications: this.settings.notifications,
                updated_at: new Date().toISOString()
            };

            const { error } = await window.supabaseClient
                .from('user_settings')
                .upsert(settingsData, {
                    onConflict: 'user_id'
                });

            if (error) throw error;

            console.log('✅ Settings saved');
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    async render() {
        const container = document.getElementById('settingsContent');
        if (!container) return;

        const user = await window.supabaseClient.auth.getUser();
        const userEmail = user.data?.user?.email || 'Loading...';

        container.innerHTML = `
            <div class="p-6 animate-fadeIn">
                <!-- Header -->
                <div class="mb-8">
                    <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        ⚙️ Impostazioni
                    </h2>
                    <p class="text-slate-400">Configura l'applicazione secondo le tue preferenze</p>
                </div>

                <!-- Settings Cards -->
                <div class="space-y-6">
                    
                    <!-- Budget Mensile -->
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
                                💰
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Budget Mensile</h3>
                                <p class="text-sm text-slate-400">Imposta il tuo budget mensile per le spese</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <input type="number" id="budgetInput" 
                                   value="${this.settings.monthlyBudget}" 
                                   step="50" min="0"
                                   class="flex-1 bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white text-2xl font-bold focus:border-green-500 focus:outline-none">
                            <span class="text-2xl font-bold text-slate-400">${this.settings.currencySymbol}</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-3">💡 Il budget viene confrontato con le tue spese mensili</p>
                        
                        <!-- Preview -->
                        <div class="mt-4 p-4 bg-slate-700/30 rounded-xl">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-slate-400">Budget corrente:</span>
                                <span class="text-green-400 font-bold text-lg">${this.settings.monthlyBudget}${this.settings.currencySymbol}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Primo Giorno del Mese -->
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl">
                                📅
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Primo Giorno del Mese</h3>
                                <p class="text-sm text-slate-400">Utile se il mese inizia/finisce a metà (es. stipendio il 25)</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-300 mb-2">Giorno di inizio</label>
                                <select id="firstDayInput" 
                                        class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white font-bold focus:border-purple-500 focus:outline-none">
                                    ${Array.from({length: 28}, (_, i) => i + 1).map(day => `
                                        <option value="${day}" ${day === this.settings.firstDayOfMonth ? 'selected' : ''}>
                                            Giorno ${day}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-300 mb-2">Esempio periodo</label>
                                <div class="h-full flex items-center px-4 py-3 bg-slate-700/30 rounded-lg border border-slate-600">
                                    <span class="text-purple-400 font-semibold" id="monthRangePreview"></span>
                                </div>
                            </div>
                        </div>
                        <p class="text-xs text-slate-500 mt-3">💡 Esempio: se stipendio il 25, il "mese" va dal 25 al 24 del mese successivo</p>
                    </div>

                    <!-- Visualizzazione -->
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-2xl">
                                🎨
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Visualizzazione</h3>
                                <p class="text-sm text-slate-400">Personalizza l'aspetto dell'interfaccia</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <!-- Currency -->
                            <div>
                                <label class="block text-sm font-semibold text-slate-300 mb-2">Valuta</label>
                                <select id="currencyInput" 
                                        class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                                    <option value="EUR" ${this.settings.currency === 'EUR' ? 'selected' : ''}>€ Euro (EUR)</option>
                                    <option value="USD" ${this.settings.currency === 'USD' ? 'selected' : ''}>$ Dollaro (USD)</option>
                                    <option value="GBP" ${this.settings.currency === 'GBP' ? 'selected' : ''}>£ Sterlina (GBP)</option>
                                </select>
                            </div>

                            <!-- Date Format -->
                            <div>
                                <label class="block text-sm font-semibold text-slate-300 mb-2">Formato Data</label>
                                <select id="dateFormatInput" 
                                        class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                                    <option value="DD/MM/YYYY" ${this.settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>GG/MM/AAAA</option>
                                    <option value="MM/DD/YYYY" ${this.settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/GG/AAAA</option>
                                    <option value="YYYY-MM-DD" ${this.settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>AAAA-MM-GG</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Avanzate -->
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl">
                                🔔
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Avanzate</h3>
                                <p class="text-sm text-slate-400">Opzioni avanzate e gestione dati</p>
                            </div>
                        </div>

                        <!-- Notifiche -->
                        <div class="space-y-3 mb-6">
                            <label class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition cursor-pointer">
                                <span class="text-white font-semibold">⚠️ Notifiche Task e Budget</span>
                                <input type="checkbox" id="notifTasksInput" 
                                       ${this.settings.notifications.tasks ? 'checked' : ''}
                                       class="w-5 h-5 rounded border-2 border-slate-500 bg-slate-700/50 checked:bg-blue-500 checked:border-blue-500 cursor-pointer">
                            </label>
                            <p class="text-xs text-slate-500 px-3">Abilita account e torna in linea di login</p>
                        </div>

                        <!-- Account Info -->
                        <div class="p-4 bg-slate-700/30 rounded-xl border border-slate-600">
                            <p class="text-sm text-slate-400 mb-2">
                                <span class="font-semibold text-white">Email:</span> ${userEmail}
                            </p>
                            <p class="text-xs text-slate-500">Account gestito da Supabase</p>
                        </div>
                    </div>

                    <!-- Save Button -->
                    <div class="flex gap-4">
                        <button onclick="Settings.handleSaveSettings()" 
                                class="flex-1 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:scale-105 transition-all shadow-2xl font-bold text-lg">
                            💾 Salva Modifiche
                        </button>
                        <button onclick="Settings.resetToDefaults()" 
                                class="px-8 py-4 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition font-semibold">
                            🔄 Reset
                        </button>
                    </div>

                    <!-- Danger Zone -->
                    <div class="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-2xl shadow-2xl border-2 border-red-500/30 p-6">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-12 h-12 bg-red-500/20 border-2 border-red-500 rounded-xl flex items-center justify-center text-2xl">
                                ⚠️
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-red-400">Zona Pericolosa</h3>
                                <p class="text-sm text-red-300/70">Azioni irreversibili</p>
                            </div>
                        </div>

                        <button onclick="Settings.deleteAllData()" 
                                class="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold">
                                🗑️ Elimina Tutti i Dati
                        </button>
                        <p class="text-xs text-red-300/60 mt-2">Questa azione eliminerà TUTTE le spese, task e obiettivi in modo permanente!</p>
                    </div>
                </div>
            </div>
        `;

        this.updateMonthRangePreview();
        this.attachEventListeners();
    },

    attachEventListeners() {
        const firstDayInput = document.getElementById('firstDayInput');
        if (firstDayInput) {
            firstDayInput.addEventListener('change', () => {
                this.updateMonthRangePreview();
            });
        }
    },

    updateMonthRangePreview() {
        const firstDay = parseInt(document.getElementById('firstDayInput')?.value || 25);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate the date range
        let startDate, endDate;
        if (today.getDate() >= firstDay) {
            startDate = new Date(currentYear, currentMonth, firstDay);
            endDate = new Date(currentYear, currentMonth + 1, firstDay - 1);
        } else {
            startDate = new Date(currentYear, currentMonth - 1, firstDay);
            endDate = new Date(currentYear, currentMonth, firstDay - 1);
        }
        
        const formatDate = (date) => {
            const day = date.getDate();
            const month = date.toLocaleDateString('it-IT', { month: 'short' });
            return `${day} ${month}`;
        };
        
        const preview = document.getElementById('monthRangePreview');
        if (preview) {
            preview.textContent = `${formatDate(startDate)} → ${formatDate(endDate)}`;
        }
    },

    async handleSaveSettings() {
        try {
            // Collect values
            this.settings.monthlyBudget = parseInt(document.getElementById('budgetInput').value) || 700;
            this.settings.firstDayOfMonth = parseInt(document.getElementById('firstDayInput').value) || 25;
            this.settings.currency = document.getElementById('currencyInput').value;
            this.settings.dateFormat = document.getElementById('dateFormatInput').value;
            this.settings.notifications.tasks = document.getElementById('notifTasksInput').checked;
            
            // Update currency symbol
            const currencySymbols = { EUR: '€', USD: '$', GBP: '£' };
            this.settings.currencySymbol = currencySymbols[this.settings.currency] || '€';

            // Save
            const success = await this.saveSettings();
            
            if (success) {
                Helpers.showToast('✅ Impostazioni salvate!', 'success');
                
                // Invalidate caches to force Statistics reload
                DataCache.invalidate('expenses');
                
                // Refresh Statistics if visible
                if (window.Statistics && document.getElementById('statisticsContent')?.classList.contains('hidden') === false) {
                    await Statistics.render();
                }
            } else {
                Helpers.showToast('❌ Errore nel salvataggio', 'error');
            }
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('❌ Errore: ' + e.message, 'error');
        }
    },

    resetToDefaults() {
        if (!confirm('Ripristinare le impostazioni predefinite?')) return;
        
        this.settings = {
            monthlyBudget: 700,
            firstDayOfMonth: 25,
            currency: 'EUR',
            currencySymbol: '€',
            dateFormat: 'DD/MM/YYYY',
            notifications: { tasks: true, budget: true }
        };
        
        this.render();
        Helpers.showToast('🔄 Impostazioni ripristinate', 'info');
    },

    async deleteAllData() {
        if (!confirm('⚠️ SEI SICURO? Questa operazione eliminerà TUTTE le tue spese, task e obiettivi e non può essere annullata!')) {
            return;
        }

        if (!confirm('⚠️ ULTIMA CONFERMA: Eliminare davvero tutti i dati?')) {
            return;
        }

        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                Helpers.showToast('❌ Errore: utente non autenticato', 'error');
                return;
            }

            // Delete all data
            await Promise.all([
                window.supabaseClient.from('expenses').delete().eq('user_id', user.data.user.id),
                window.supabaseClient.from('tasks').delete().eq('user_id', user.data.user.id),
                window.supabaseClient.from('goals').delete().eq('user_id', user.data.user.id)
            ]);

            Helpers.showToast('✅ Tutti i dati sono stati eliminati', 'success');
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            console.error('Error deleting data:', e);
            Helpers.showToast('❌ Errore: ' + e.message, 'error');
        }
    }
};

// Export globale
window.Settings = Settings;
console.log('✅ Settings WOW module loaded');
