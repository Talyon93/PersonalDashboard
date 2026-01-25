/**
 * Expenses Main Module - MODULAR PARENT
 * Gestisce le spese e REGISTRA il modulo "Finanza" con il sotto-menu Analytics.
 */

const Expenses = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    isInitialized: false,

    async init() {
        if (window.Categories) await Categories.init();
        if (window.MerchantMappings) await MerchantMappings.init();
        // Inizializza anche il figlio (Analytics)
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

            document.getElementById('month-label').textContent = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 15));
            const filtered = ExpenseFilters.hasCategory() ? ExpenseFilters.apply(monthExpenses) : monthExpenses;
            const stats = ExpenseStats.calculate(monthExpenses);

            const kpiRow = document.getElementById('expenses-kpi-row');
            if(kpiRow) kpiRow.innerHTML = `
                ${this.renderKpiCard('Spese', stats.total, 'from-rose-500 to-pink-600', `${stats.count} transazioni`)}
                ${this.renderKpiCard('Entrate', stats.income, 'from-emerald-500 to-teal-600', `${stats.incomeCount} transazioni`)}
                ${this.renderKpiCard('Bilancio', stats.balance, stats.balance >= 0 ? 'from-orange-500 to-red-600' : 'from-orange-600 to-red-700', stats.balance >= 0 ? 'Positivo' : 'Negativo')}
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
    showCategoriesModal() { if (typeof Expenses_showCategoriesModal === 'function') Expenses_showCategoriesModal(); }
};

window.Expenses = Expenses;

// ==========================================
// REGISTRAZIONE MODULARE
// ==========================================
if (window.ModuleManager) {
    ModuleManager.register({
        id: 'expenses',
        dbKey: 'expenses_enabled', // La chiave DB reale
        name: 'Spese & Budget',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>', 
        category: 'finance',
        order: 10,
        
        // SOTTO MENU: Collega "Analytics" a questo modulo
        subItems: [
            { label: 'Report & Analytics', section: 'statistics' }
        ],

        // Init: carica sé stesso E il componente Statistics
        init: async () => {
            await Expenses.init();
            // Statistics non ha bisogno di init separato se lo chiamiamo dentro Expenses.init()
            // ma per sicurezza lo carichiamo
            if (window.Statistics && window.Statistics.loadData) {
                await window.Statistics.loadData();
            }
        },

        // Render: Decide cosa mostrare in base alla sezione richiesta
        // Se mi chiedono 'expenses', mostro Expenses.render()
        // Se mi chiedono 'statistics', mostro Statistics.render()
        render: async (container) => {
            // Nota: container è il <div> principale passato dal navigation.js
            
            // Trucco: Navigation.js imposta window.currentSection
            if (window.currentSection === 'statistics') {
                if (window.Statistics) await window.Statistics.render();
            } else {
                await Expenses.render();
            }
        }
    });
}