/**
 * Expenses Main Module - MODULAR PARENT & WIDGETS
 * Gestisce le spese, REGISTRA il modulo "Finanza" e i WIDGETS per la Dashboard.
 */

const Expenses = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    isInitialized: false,

    async init() {
        if (window.Categories) await Categories.init();
        if (window.MerchantMappings) await MerchantMappings.init();
        if (window.Statistics) await Statistics.init();
        
        await this.render();
    },

    async render() {
        const container = document.getElementById('expensesContent');
        if (!container) return;

        if (!this.isInitialized || container.querySelector('h2') === null) {
            this.renderStructure(container);
            this.isInitialized = true;
        }
        await this.updateView();
    },

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
                    <div class="flex flex-wrap gap-3">
                        <button onclick="Expenses.showCategoriesModal()" class="px-5 py-2.5 bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:text-white rounded-2xl transition-all text-xs font-black uppercase tracking-widest backdrop-blur-md">📂 Categorie</button>
                        <button onclick="ExpenseModals.showImport()" class="px-5 py-2.5 bg-slate-800/40 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 rounded-2xl transition-all text-xs font-black uppercase tracking-widest backdrop-blur-md">📥 Importa</button>
                        <button onclick="ExpenseModals.showAdd('income')" class="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl rounded-2xl transition-all hover:scale-105 active:scale-95 text-sm font-bold">💰 Entrata</button>
                        <button onclick="ExpenseModals.showAdd('expense')" class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-xl rounded-2xl transition-all hover:scale-105 active:scale-95 text-sm font-bold">➕ Spesa</button>
                    </div>
                </div>
            </div>

            <div class="flex justify-center mb-10">
                <div class="inline-flex items-center gap-4 bg-slate-800/50 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-xl">
                    <button onclick="Expenses.changeMonth(-1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg></button>
                    <h3 id="month-label" class="text-xl font-bold text-white px-4 min-w-[180px] text-center select-none tracking-tight">-- --- --</h3>
                    <button onclick="Expenses.changeMonth(1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg></button>
                    <div class="w-px h-6 bg-slate-700/50 mx-1"></div>
                    <button onclick="Expenses.resetMonth()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></button>
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
    async deleteMonthExpenses() { try { await ExpenseCRUD.deleteMonth(this.currentYear, this.currentMonth + 1); if (window.DataCache) window.DataCache.invalidate('expenses'); Helpers.showToast('Mese ripulito', 'success'); await this.render(); } catch (e) { Helpers.showToast('Errore: ' + e.message, 'error'); } },
    exportMonth() { /* ... codice export ... */ },
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
                size: { cols: 1, rows: 2 }, // ESTESO IN VERTICALE
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

    async renderWidgetBalance() {
        const expenses = await window.CachedCRUD.getExpenses();
        const now = new Date();
        const currentMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        
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
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Bilancio</span>
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

    async renderWidgetRecent() {
        // WIDGET VERTICALE (1x2)
        const expenses = await window.CachedCRUD.getExpenses();
        // Prendiamo più elementi (es. 6) perché il widget è più alto
        const recent = expenses
            .filter(e => e.type !== 'income')
            .sort((a,b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);

        if(recent.length === 0) return `<div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-slate-500 font-bold uppercase text-xs">Nessuna spesa</div>`;

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col cursor-pointer" onclick="window.showSection('expenses')">
                <div class="flex items-center gap-3 mb-4">
                     <span class="w-8 h-8 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center text-sm">💸</span>
                     <h3 class="font-bold text-white text-sm uppercase tracking-wide">Ultime Uscite</h3>
                </div>
                <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    ${recent.map(e => {
                        const cat = window.Categories?.getById(e.category);
                        return `
                        <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-white/5 hover:bg-slate-700/50 transition-colors">
                            <div class="flex items-center gap-3 min-w-0">
                                <span class="text-lg">${cat?.icon || '📦'}</span>
                                <div class="min-w-0">
                                    <p class="text-xs font-bold text-slate-200 truncate leading-tight">${e.description}</p>
                                    <p class="text-[8px] text-slate-500 font-bold uppercase">${Helpers.formatDate(e.date, 'short')}</p>
                                </div>
                            </div>
                            <span class="font-black text-rose-400 text-xs whitespace-nowrap">-${Helpers.formatCurrency(Math.abs(e.amount))}</span>
                        </div>`;
                    }).join('')}
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
                .filter(e => e.type !== 'income' && e.date.startsWith(dStr))
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
        
        // --- RECUPERO BUDGET ALLINEATO CON STATISTICS.JS ---
        let budgetTarget = 700; // Fallback di default come in Statistics.js
        try {
            if (window.SettingsManager) {
                // Usa SettingsManager come fa statistics.js
                budgetTarget = parseFloat(window.SettingsManager.get('monthlyBudget')) || 700;
            } else if (window.CachedCRUD && window.CachedCRUD.getSettings) {
                // Fallback su CachedCRUD se SettingsManager non c'è ancora
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
        subItems: [ { label: 'Report & Analytics', section: 'statistics' } ],
        init: async () => {
            await Expenses.init();
            if (window.Statistics && window.Statistics.loadData) await window.Statistics.loadData();
        },
        render: async (container) => {
            if (window.currentSection === 'statistics') {
                if (window.Statistics) await window.Statistics.render();
            } else {
                await Expenses.render();
            }
        },
        widgets: Expenses.getWidgets()
    });
}