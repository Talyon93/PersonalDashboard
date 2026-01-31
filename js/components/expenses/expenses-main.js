/**
 * Expenses Main Module - MODULAR PARENT & WIDGETS
 * Gestisce le spese, REGISTRA il modulo "Finanza", i WIDGETS e la CONFIGURAZIONE interna.
 */

const Expenses = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    isInitialized: false,

    async init() {
        if (window.Categories) await Categories.init();
        if (window.MerchantMappings) await MerchantMappings.init();
        if (window.Statistics) await Statistics.init();
        
        // === FIX: CALCOLO MESE CONTABILE AUTOMATICO ===
        try {
            let startDay = 1;
            // Recupera il giorno di inizio ciclo dai settings salvati
            if (window.CachedCRUD && window.CachedCRUD.getSettings) {
                const s = await window.CachedCRUD.getSettings();
                if (s && s.first_day_of_month) startDay = parseInt(s.first_day_of_month);
            }

            const now = new Date();
            // Logica: Se oggi è il 27 Gennaio e il ciclo inizia il 27, 
            // fiscalmente siamo già a Febbraio.
            if (startDay > 1 && now.getDate() >= startDay) {
                this.currentMonth = now.getMonth() + 1;
                
                // Gestione cambio anno (es. Dicembre -> Gennaio)
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
            }
        } catch (e) {
            console.warn('Errore calcolo mese fiscale automatico:', e);
        }
        // ==============================================

        await this.render();
    },

    // --- LOGICA DI RENDER PRINCIPALE CON ROUTING ---
    async render() {
        const container = document.getElementById('expensesContent');
        if (!container) return;

        // ROUTER INTERNO: Decide cosa mostrare in base alla sezione attiva
        if (window.currentSection === 'expenses-settings') {
            await this.renderSettings(container);
        } else {
            // Render Dashboard Spese (Standard)
            // Se c'è ancora il contenuto dei settings o è vuoto, ricostruiamo la struttura
            if (!this.isInitialized || container.querySelector('#expenses-kpi-row') === null) {
                this.renderStructure(container);
                this.isInitialized = true;
            }
            await this.updateView();
        }
    },

    // --- NUOVA SEZIONE: RENDER CONFIGURAZIONE MODULO ---
    async renderSettings(container) {
        // 1. Fetch DIRETTA da Supabase (Bypassa Cache per sicurezza nel form di edit)
        let settings = { monthly_budget: 700, first_day_of_month: 25 };
        
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (user.data.user) {
                const { data, error } = await window.supabaseClient
                    .from('user_settings')
                    .select('monthly_budget, first_day_of_month')
                    .eq('user_id', user.data.user.id)
                    .single();
                
                if (data) {
                    settings = { ...settings, ...data };
                }
            }
        } catch (e) { 
            console.warn('Errore recupero settings diretti', e); 
            // Fallback
            if (window.CachedCRUD && window.CachedCRUD.getSettings) {
                const s = await window.CachedCRUD.getSettings();
                if (s) settings = { ...settings, ...s };
            }
        }

        container.innerHTML = `
            <div class="p-6 animate-fadeIn max-w-4xl mx-auto pb-32">
                <div class="mb-8 flex items-center gap-4">
                    <div class="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <div>
                        <h2 class="text-3xl font-black text-white">Configurazione Finanze</h2>
                        <p class="text-slate-400">Personalizza budget e cicli contabili</p>
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl shadow-lg">💰</div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Budget Mensile</h3>
                                <p class="text-sm text-slate-400">Il tuo obiettivo di spesa mensile</p>
                            </div>
                        </div>
                        <div class="flex gap-4 items-center">
                            <input type="number" id="exp_setting_budget" value="${settings.monthly_budget}" 
                                class="flex-1 bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white font-bold text-2xl focus:border-emerald-500 focus:outline-none transition-colors" placeholder="0.00">
                            <span class="text-2xl font-bold text-slate-500">€</span>
                        </div>
                    </div>

                    <div class="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 shadow-xl">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">📅</div>
                            <div>
                                <h3 class="text-xl font-bold text-white">Ciclo Contabile</h3>
                                <p class="text-sm text-slate-400">Giorno in cui si rinnova il mese (es. stipendio)</p>
                            </div>
                        </div>
                        <select id="exp_setting_day" class="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white font-bold text-lg focus:border-purple-500 focus:outline-none transition-colors appearance-none cursor-pointer">
                            ${Array.from({length: 28}, (_, i) => i + 1).map(day => `
                                <option value="${day}" ${day == settings.first_day_of_month ? 'selected' : ''}>Giorno ${day}</option>
                            `).join('')}
                        </select>
                        <div class="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <p class="text-xs text-purple-300">💡 <strong>Nota:</strong> Se imposti il giorno 27, le statistiche di "Gennaio" calcoleranno le spese dal 27 Gennaio al 26 Febbraio.</p>
                        </div>
                    </div>

                    <div class="fixed bottom-8 right-8 z-50">
                        <button onclick="Expenses.saveModuleSettings()" 
                            class="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-2xl shadow-2xl transform active:scale-95 transition-all flex items-center gap-2 border border-white/10">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                            Salva e Ricarica
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // --- NUOVA LOGICA: SALVATAGGIO CON RELOAD FORZATO ---
    async saveModuleSettings() {
        const budget = parseFloat(document.getElementById('exp_setting_budget').value) || 0;
        const day = parseInt(document.getElementById('exp_setting_day').value) || 1;
        
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) throw new Error("Utente non loggato");

            // 1. Aggiorna DB
            const { error } = await window.supabaseClient
                .from('user_settings')
                .update({ 
                    monthly_budget: budget,
                    first_day_of_month: day,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.data.user.id);

            if (error) throw error;

            // 2. Feedback Visivo
            Helpers.showToast('✅ Configurazioni salvate! Ricarico...', 'success');
            
            // 3. PULIZIA CACHE DI SICUREZZA (Prima del reload, per sicurezza)
            if (window.DataCache) {
                if (typeof window.DataCache.clearAll === 'function') {
                     window.DataCache.clearAll();
                } else {
                     localStorage.clear(); // Metodo brutale ma efficace
                }
            }

            // 4. FORZA RELOAD DOPO 1 SECONDO
            // Questo assicura che al riavvio l'app scarichi tutto nuovo dal DB
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (e) {
            console.error(e);
            Helpers.showToast('❌ Errore durante il salvataggio', 'error');
        }
    },

    // --- STRUTTURA DASHBOARD CLASSICA ---

    renderStructure(container) {
        container.innerHTML = `
            <div class="mb-10 animate-fadeIn">
                <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    
                    <div>
                        <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-300 via-teal-200 to-slate-400 bg-clip-text text-transparent">Finanze</h2>
                        <p class="text-slate-400 mt-2 font-medium flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Gestione flussi di cassa.
                        </p>
                    </div>

                    <div class="flex flex-wrap items-center gap-3">
                        
                        <button onclick="Expenses.showCategoriesModal()" 
                                class="group flex items-center gap-2 px-4 py-2.5 bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-500 hover:text-slate-200 rounded-xl transition-all backdrop-blur-md">
                            <svg class="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                            </svg>
                            <span class="text-[11px] font-bold uppercase tracking-wider">Categorie</span>
                        </button>
                        
                        <button onclick="ExpenseFormUI.showMappingsManager()" 
                                class="group flex items-center gap-2 px-4 py-2.5 bg-slate-800/40 text-purple-400/80 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/40 hover:text-purple-300 rounded-xl transition-all backdrop-blur-md">
                            <svg class="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                            </svg>
                            <span class="text-[11px] font-bold uppercase tracking-wider">Mappature</span>
                        </button>
                        
                        <div class="w-px h-6 bg-slate-700/30 mx-1 hidden sm:block"></div>

                        <button onclick="ExpenseModals.showImport()" 
                                class="group relative flex items-center gap-2 px-6 py-2.5 
                                bg-blue-600/20 text-blue-100 border border-blue-400/50 
                                hover:bg-blue-600/30 hover:border-blue-400 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:-translate-y-0.5
                                rounded-xl transition-all duration-300 backdrop-blur-xl shadow-lg shadow-blue-900/10">
                            
                            <svg class="w-5 h-5 text-blue-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                            </svg>
                            <span class="text-xs font-black uppercase tracking-widest">Importa</span>
                           
                        </button>

                        <div class="w-px h-6 bg-slate-700/30 mx-1 hidden sm:block"></div>

                        <button onclick="ExpenseModals.showAdd('income')" 
                                class="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/20 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0">
                            <svg class="w-4 h-4 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                            </svg>
                            <span class="text-xs font-black uppercase tracking-wider">Entrata</span>
                        </button>

                        <button onclick="ExpenseModals.showAdd('expense')" 
                                class="group flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-900/20 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0">
                            <svg class="w-4 h-4 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                            </svg>
                            <span class="text-xs font-black uppercase tracking-wider">Spesa</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex justify-center mb-10">
                <div class="inline-flex items-center gap-4 bg-slate-800/50 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-xl">
                    <button onclick="Expenses.changeMonth(-1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg></button>
                    <h3 id="month-label" class="text-xl font-bold text-white px-4 min-w-[180px] text-center select-none tracking-tight">-- --- --</h3>
                    <button onclick="Expenses.changeMonth(1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></button>
                    
                    <div class="w-px h-6 bg-slate-700/50 mx-1"></div>
                    
                    <button onclick="Expenses.resetMonth()" title="Torna a Oggi" class="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </button>

                    <button onclick="Expenses.confirmResetMonth()" title="Cancella tutto il mese" class="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white transition-all border border-rose-500/20">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>

            <div id="expenses-kpi-row" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10"></div>

            <div class="bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-700/40">
                <div class="flex flex-col gap-8 mb-10">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-500"></span> Operazioni</h3>
                        <button onclick="Expenses.exportMonth()" class="text-xs font-black uppercase text-blue-400 hover:bg-blue-400/10 px-4 py-2 rounded-full border border-blue-400/20 transition-all">Esporta CSV</button>
                    </div>
                    <div id="category-filters-container" class="flex flex-wrap gap-2 pb-6 border-b border-slate-700/50"></div>
                </div>
                <div id="expenses-list-container" class="space-y-4"></div>
            </div>
        `;
    },

    async updateView() {
        try {
            const allExpenses = await window.CachedCRUD.getExpenses();
            const { startDate, endDate } = Helpers.getCustomMonthRange(new Date(this.currentYear, this.currentMonth, 15));
            const start = new Date(startDate); start.setHours(0,0,0,0);
            const end = new Date(endDate); end.setHours(23,59,59,999);

            const monthExpenses = allExpenses.filter(e => {
                if (!e.date) return false;
                const d = new Date(e.date.split('T')[0] + 'T12:00:00');
                return d >= start && d <= end;
            });

            const labelEl = document.getElementById('month-label');
            if(labelEl) labelEl.textContent = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 15));
            
            const filtered = ExpenseFilters.hasCategory() ? ExpenseFilters.apply(monthExpenses) : monthExpenses;
            const stats = ExpenseStats.calculate(monthExpenses);

            const kpiRow = document.getElementById('expenses-kpi-row');
            if(kpiRow) kpiRow.innerHTML = `
                ${this.renderKpiCard('Spese', stats.total, 'from-rose-500 to-pink-600', `${stats.count} transazioni`)}
                ${this.renderKpiCard('Entrate', stats.income, 'from-emerald-500 to-teal-600', `${stats.incomeCount} transazioni`)}
                ${this.renderKpiCard('Bilancio', stats.balance, stats.balance >= 0 ? 'from-emerald-600 to-green-700' : 'from-rose-600 to-red-700', stats.balance >= 0 ? 'Positivo' : 'Negativo')}
                ${this.renderKpiCard('Totali', monthExpenses.length, 'from-violet-500 to-purple-600', 'Operazioni totali')}
                ${this.renderKpiCard('Extra', stats.excludedTotal, 'from-cyan-500 to-blue-600', 'Investimenti/Altro')}
            `;

            const filtersContainer = document.getElementById('category-filters-container');
            if(filtersContainer) filtersContainer.innerHTML = `
                <button onclick="ExpenseFilters.clearCategory(); Expenses.render();" 
                        class="px-5 py-2.5 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest ${!ExpenseFilters.hasCategory() ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-700/40 text-slate-400 border border-slate-700 hover:text-white'}">Tutte</button>
                ${ExpenseRenderer.renderCategoryFilters()}
            `;

            const listContainer = document.getElementById('expenses-list-container');
            if(listContainer) listContainer.innerHTML = ExpenseRenderer.renderList(filtered);
        } catch (e) { console.error(e); }
    },

    renderKpiCard(title, value, gradient, subtext) {
        return `<div class="relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl shadow-xl p-6 text-white transform hover:scale-[1.02] transition-all duration-300"><div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div><div class="relative"><p class="text-xs font-black uppercase tracking-widest opacity-80 mb-2">${title}</p><p class="text-3xl font-bold mb-1">${Helpers.formatCurrency(Math.abs(value))}</p><p class="text-[10px] font-medium opacity-70 uppercase tracking-tighter">${subtext}</p></div></div>`;
    },

    async changeMonth(delta) { this.currentMonth += delta; if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; } else if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; } await this.render(); },
    async resetMonth() { const now = new Date(); this.currentMonth = now.getMonth(); this.currentYear = now.getFullYear(); await this.render(); },
    confirmResetMonth() { if (confirm(`⚠️ Eliminare tutte le spese del mese corrente?`)) this.deleteMonthExpenses(); },


async deleteMonthExpenses() { 
    try {
        // 1. Recupera l'utente corrente
        const user = await window.supabaseClient.auth.getUser();
        if (!user.data.user) throw new Error("Utente non autenticato");

        // 2. Calcola il range esatto (Mese Fiscale) visualizzato
        const refDate = new Date(this.currentYear, this.currentMonth, 15);
        const { startDate, endDate } = Helpers.getCustomMonthRange(refDate);

        // === FIX CRITICO PER DATABASE ===
        // Convertiamo esplicitamente in stringa ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
        // Questo risolve l'errore "invalid input syntax for type date"
        const startISO = new Date(startDate).toISOString();
        const endISO = new Date(endDate).toISOString();

        // 3. Formattazione per il messaggio utente (GG/MM/AAAA)
        const formatIT = (d) => new Date(d).toLocaleDateString('it-IT');
        
        // 4. Chiedi conferma
        const message = `⚠️ ATTENZIONE ⚠️\n\nStai per eliminare tutte le spese del periodo:\nDal ${formatIT(startDate)} al ${formatIT(endDate)}.\n\nQuesta azione è irreversibile. Procedere?`;
        
        if (!confirm(message)) return;

        // 5. Esegui la cancellazione usando le stringhe ISO
        const { error } = await window.supabaseClient
            .from('expenses')
            .delete()
            .eq('user_id', user.data.user.id)
            .gte('date', startISO)  // Ora passiamo la stringa corretta
            .lte('date', endISO);   // Ora passiamo la stringa corretta

        if (error) throw error;

        // 6. Pulizia e Aggiornamento
        if (window.DataCache) window.DataCache.invalidate('expenses');
        Helpers.showToast('🗑️ Periodo ripulito con successo', 'success');
        
        // Ricarica la vista
        await this.render();

    } catch (e) {
        console.error('Errore cancellazione mese:', e);
        Helpers.showToast('Errore: ' + e.message, 'error');
    }
},


async exportMonth() {
    try {
        // 1. Recupera tutte le spese dalla cache
        const expenses = await window.CachedCRUD.getExpenses();

        // 2. Calcola il range di date
        const refDate = new Date(this.currentYear, this.currentMonth, 15);
        const { startDate, endDate } = Helpers.getCustomMonthRange(refDate);

        // === FIX TIMEZONE & ORARI ===
        // Creiamo oggetti Date sicuri
        const startObj = new Date(startDate);
        startObj.setHours(0, 0, 0, 0); // Inizio del primo giorno (es. 25 Gen 00:00)

        const endObj = new Date(endDate);
        endObj.setHours(23, 59, 59, 999); // Fine dell'ultimo giorno (es. 24 Feb 23:59)

        // 3. Filtra usando i timestamp (numeri) per precisione assoluta
        const monthExpenses = expenses.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return d >= startObj && d <= endObj;
        });

        if (monthExpenses.length === 0) {
            Helpers.showToast('Nessun dato da esportare per questo periodo', 'warning');
            return;
        }

        // 4. Ordina per data (dalla più recente)
        monthExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 5. Costruisci il CSV
        const csvRows = [];
        // Header
        csvRows.push(['Data', 'Descrizione', 'Categoria', 'Tags', 'Importo', 'Tipo'].join(','));

        monthExpenses.forEach(row => {
            const cat = window.Categories?.getById(row.category)?.name || 'Altro';
            const safeDesc = `"${(row.description || '').replace(/"/g, '""')}"`;
            const safeTags = `"${(row.tags || []).join('; ')}"`;
            const safeCat = `"${cat}"`;
            const amount = row.amount; 
            const type = row.type === 'income' ? 'Entrata' : 'Uscita';
            
            // Formattiamo la data nel CSV come YYYY-MM-DD per compatibilità Excel
            const dateStr = new Date(row.date).toISOString().split('T')[0];

            csvRows.push([dateStr, safeDesc, safeCat, safeTags, amount, type].join(','));
        });

        // 6. Crea il file e scaricalo
        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Nome file pulito: "Report_25_gen_-_24_feb.csv"
        const fileNameLabel = Helpers.formatCustomMonthName(refDate)
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_\-]/g, ''); // Rimuove caratteri strani
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Report_${fileNameLabel}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Helpers.showToast('✅ Export CSV completato!', 'success');

    } catch (e) {
        console.error('Export Error:', e);
        Helpers.showToast('Errore durante l\'export', 'error');
    }
},
    showCategoriesModal() { if (typeof Expenses_showCategoriesModal === 'function') Expenses_showCategoriesModal(); },

    // ============================================================
    //  WIDGET EXPORT LOGIC
    // ============================================================

    getWidgets() {
        return [
            {
                id: 'expenses_balance',
                name: 'Bilancio Mese',
                description: 'Entrate vs Uscite',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetBalance()
            },
            { 
                id: 'expenses_recent', 
                name: 'Ultime Spese', 
                description: 'Lista verticale', 
                size: { cols: 1, rows: 2 }, 
                render: () => this.renderWidgetRecent()
            },
            {
                id: 'expenses_trend',
                name: 'Trend 7gg',
                description: 'Grafico settimanale',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetTrend()
            },
            {
                id: 'expenses_budget',
                name: 'Stato Budget',
                description: 'Speso vs Opzioni',
                size: { cols: 2, rows: 1 },
                render: () => this.renderWidgetBudget()
            }
        ];
    },

    async renderWidgetRecent() {
        const expenses = await window.CachedCRUD.getExpenses();
        
        // FILTRO: Solo normali (No Extra), ordina per data, ultimi 6
        const recent = expenses
            .filter(e => !e.is_excluded) // <--- QUESTO RIMUOVE GLI INVESTIMENTI
            .sort((a,b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);

        if (recent.length === 0) return `<div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 flex items-center justify-center text-slate-500 font-bold">Nessuna attività</div>`;

        const listHtml = recent.map(e => {
            const cat = window.Categories?.getById(e.category) || { icon: '📦', name: 'Altro' };
            const isIncome = e.type === 'income';
            return `
                <div class="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer" onclick="ExpenseModals.showDetail('${e.id}')">
                    <div class="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-xl shadow-inner">${cat.icon}</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-white truncate">${e.description}</p>
                        <p class="text-[10px] text-slate-400 font-medium">${new Date(e.date).toLocaleDateString('it-IT', {day:'2-digit', month:'short'})}</p>
                    </div>
                    <span class="font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-200'}">${isIncome?'+':'-'}${Helpers.formatCurrency(Math.abs(e.amount))}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col cursor-pointer hover:scale-[1.01] transition-all" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-center mb-4 px-2">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ultime Attività</span>
                    <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                    ${listHtml}
                </div>
            </div>`;
    },

    async renderWidgetBalance() {
        const expenses = await window.CachedCRUD.getExpenses();
        
        // 1. Calcola il range temporale fiscale corrente (es. 25 Gen - 24 Feb)
        const now = new Date();
        const { startDate, endDate } = Helpers.getCustomMonthRange(now);

        // 2. Normalizza gli orari per includere tutto il giorno
        const startObj = new Date(startDate); startObj.setHours(0, 0, 0, 0);
        const endObj = new Date(endDate); endObj.setHours(23, 59, 59, 999);

        // 3. Filtra le spese che rientrano in questo range preciso
        const currentMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
            return d >= startObj && d <= endObj && !e.is_excluded; 
        });
        
        // 4. Calcoli (uguali a prima, ma sui dati filtrati correttamente)
        const income = currentMonthExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const outcome = currentMonthExpenses.filter(e => e.type !== 'income').reduce((s, e) => s + Math.abs(e.amount), 0);
        const balance = income - outcome;
        
        const isPositive = balance >= 0;
        const bgGradient = isPositive ? 'from-emerald-600 to-green-700' : 'from-rose-600 to-pink-700';

        return `
            <div class="h-full relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-[2.5rem] shadow-2xl p-7 text-white group cursor-pointer transition-all hover:scale-[1.02]" onclick="window.showSection('expenses')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-white/20 transition-all"></div>
                <div class="flex flex-col h-full justify-between relative z-10">
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Bilancio Periodo</span>
                        <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-lg backdrop-blur-md">💰</div>
                    </div>
                    <div>
                        <p class="text-3xl font-black tracking-tighter leading-none truncate">${Helpers.formatCurrency(balance)}</p>
                        <div class="flex justify-between items-end mt-2 opacity-80">
                            <span class="text-[9px] font-bold uppercase tracking-widest">In: ${Helpers.formatCurrency(income)}</span>
                            <span class="text-[9px] font-bold uppercase tracking-widest">Out: ${Helpers.formatCurrency(outcome)}</span>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async renderWidgetBudget() {
        const expenses = await window.CachedCRUD.getExpenses();
        
        // 1. Calcola il range temporale fiscale corrente
        const now = new Date();
        const { startDate, endDate } = Helpers.getCustomMonthRange(now);

        // 2. Normalizza orari
        const startObj = new Date(startDate); startObj.setHours(0, 0, 0, 0);
        const endObj = new Date(endDate); endObj.setHours(23, 59, 59, 999);

        // 3. Filtra solo le SPESE (no income) nel range fiscale
        const monthExpenses = expenses.filter(e => {
            if (!e.date) return false;
            const d = new Date(e.date);
            return d >= startObj && d <= endObj && e.type !== 'income' && !e.is_excluded;
        });

        const totalSpent = monthExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        
        // --- RECUPERO BUDGET DA SETTINGS ---
        let budgetTarget = 700;
        try {
            if (window.CachedCRUD && window.CachedCRUD.getSettings) {
                const settings = await window.CachedCRUD.getSettings();
                if (settings && settings.monthly_budget) {
                    budgetTarget = parseFloat(settings.monthly_budget);
                }
            }
        } catch(e) { console.warn("Budget fetch error", e); }
        // ----------------------------------------------------

        const percent = Math.min(Math.round((totalSpent / budgetTarget) * 100), 100);
        const isOverBudget = totalSpent > budgetTarget;
        
        let color = 'bg-emerald-500';
        if (percent > 75) color = 'bg-orange-500';
        if (percent > 90) color = 'bg-rose-600';

        const remaining = budgetTarget - totalSpent;

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 shadow-xl flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">🎯</span>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Budget Periodo</p>
                            <h4 class="text-xl font-bold text-white leading-tight">
                                ${Helpers.formatCurrency(totalSpent)} <span class="text-slate-500 text-sm">/ ${Helpers.formatCurrency(budgetTarget)}</span>
                            </h4>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="block text-2xl font-black ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                            ${remaining >= 0 ? '+' : ''}${Math.round(remaining)}€
                        </span>
                        <span class="text-[9px] font-bold text-slate-500 uppercase">${remaining >= 0 ? 'Rimanenti' : 'Sforamento'}</span>
                    </div>
                </div>

                <div class="space-y-2 mt-4">
                    <div class="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                        <div class="h-full ${color} transition-all duration-1000 shadow-[0_0_10px_currentColor]" style="width: ${percent}%"></div>
                        ${isOverBudget ? `<div class="absolute inset-0 bg-rose-500/20 animate-pulse"></div>` : ''}
                    </div>
                    <div class="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>${Helpers.formatDate(startObj, 'short')}</span>
                        <span>${percent}%</span>
                        <span>${Helpers.formatDate(endObj, 'short')}</span>
                    </div>
                </div>
            </div>`;
    },

   async renderWidgetTrend() {
        const expenses = await window.CachedCRUD.getExpenses();
        const days = [];
        const today = new Date();
        
        // Calcola i dati degli ultimi 7 giorni
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const dayExpenses = expenses
                .filter(e => !e.is_excluded && e.type !== 'income' && e.date.startsWith(dStr))
                .reduce((sum, e) => sum + Math.abs(e.amount), 0);
            
            days.push({ day: d.toLocaleDateString('it-IT', { weekday: 'narrow' }), val: dayExpenses });
        }

        // CALCOLO TOTALE 7 GIORNI
        const total7Days = days.reduce((acc, curr) => acc + curr.val, 0);

        const max = Math.max(...days.map(d => d.val), 10);

        return `
             <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-all" onclick="window.showSection('statistics')">
                
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-0.5">Ultimi 7gg</p>
                        <p class="text-2xl font-black text-white tracking-tight">${Helpers.formatCurrency(total7Days)}</p>
                    </div>
                    <div class="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center text-lg">📉</div>
                </div>

                <div class="flex items-end justify-between h-full gap-1.5 pt-2">
                    ${days.map(d => {
                        // Altezza relativa (minimo 10% per estetica)
                        const h = Math.max((d.val / max) * 100, 10);
                        const color = d.val > 0 ? 'bg-rose-500' : 'bg-slate-700';
                        return `
                            <div class="flex flex-col items-center gap-1.5 w-full h-full justify-end group/bar">
                                <div class="w-full rounded-md ${color} transition-all duration-500 group-hover/bar:bg-rose-400 relative" style="height: ${h}%">
                                    ${d.val > 0 ? `<div class="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity z-10 whitespace-nowrap">${Math.round(d.val)}€</div>` : ''}
                                </div>
                                <span class="text-[8px] font-bold text-slate-500 uppercase">${d.day}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`;
    },

    async renderWidgetBudget() {
        const expenses = await window.CachedCRUD.getExpenses();
        const now = new Date();
        // Filtra spese mese corrente (solo spese, no entrate)
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && e.type !== 'income';
        });

        const totalSpent = monthExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        
        // --- RECUPERO BUDGET DA SETTINGS ---
        let budgetTarget = 700;
        try {
            if (window.CachedCRUD && window.CachedCRUD.getSettings) {
                // Notare l'uso di 'true' per forzare refresh se supportato dal metodo
                const settings = await window.CachedCRUD.getSettings();
                if (settings && settings.monthly_budget) {
                    budgetTarget = parseFloat(settings.monthly_budget);
                }
            }
        } catch(e) { console.warn("Budget fetch error", e); }
        // ----------------------------------------------------

        const percent = Math.min(Math.round((totalSpent / budgetTarget) * 100), 100);
        const isOverBudget = totalSpent > budgetTarget;
        
        let color = 'bg-emerald-500';
        if (percent > 75) color = 'bg-orange-500';
        if (percent > 90) color = 'bg-rose-600';

        const remaining = budgetTarget - totalSpent;

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 shadow-xl flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">🎯</span>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Budget Mensile</p>
                            <h4 class="text-xl font-bold text-white leading-tight">
                                ${Helpers.formatCurrency(totalSpent)} <span class="text-slate-500 text-sm">/ ${Helpers.formatCurrency(budgetTarget)}</span>
                            </h4>
                        </div>
                    </div>
                    <div class="text-right">
                         <span class="block text-2xl font-black ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                            ${remaining >= 0 ? '+' : ''}${Math.round(remaining)}€
                         </span>
                         <span class="text-[9px] font-bold text-slate-500 uppercase">${remaining >= 0 ? 'Rimanenti' : 'Sforamento'}</span>
                    </div>
                </div>

                <div class="space-y-2 mt-4">
                    <div class="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                        <div class="h-full ${color} transition-all duration-1000 shadow-[0_0_10px_currentColor]" style="width: ${percent}%"></div>
                        ${isOverBudget ? `<div class="absolute inset-0 bg-rose-500/20 animate-pulse"></div>` : ''}
                    </div>
                    <div class="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>`;
    }
};

window.Expenses = Expenses;

// ==========================================
// REGISTRAZIONE MODULARE
// ==========================================
if (window.ModuleManager) {
    ModuleManager.register({
        id: 'expenses',
        dbKey: 'expenses_enabled',
        name: 'Spese & Budget',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>', 
        category: 'finance',
        order: 10,
        // SOTTO MENU: QUI AGGIUNGIAMO "CONFIGURAZIONE"
        subItems: [ 
            { label: 'Report & Analytics', section: 'statistics' },
            { label: 'Configurazione', section: 'expenses-settings' } 
        ],
        init: async () => {
            await Expenses.init();
            if (window.Statistics && window.Statistics.loadData) await window.Statistics.loadData();
        },
        render: async (container) => {
            // ROUTING GLOBALE PER IL MODULO
            if (window.currentSection === 'statistics') {
                if (window.Statistics) await window.Statistics.render();
            } else if (window.currentSection === 'expenses-settings') {
                // Render Settings Pagina
                await Expenses.renderSettings(container);
            } else {
                // Render Dashboard Pagina
                await Expenses.render();
            }
        },
        widgets: Expenses.getWidgets()
    });
}