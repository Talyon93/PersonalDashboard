/**
 * Expenses Main Module - Entry Point e Coordinatore con Supabase
 * VERSION: FIXED DATE LOGIC
 */

const Expenses = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    expenses: [], // Cache locale

    /**
     * Inizializza il modulo Expenses
     */
    async init() {
        try {
            // Initialize all submodules
            if (window.Categories) await Categories.init();
            if (window.MerchantMappings) await MerchantMappings.init();
            
            // Load expenses from Supabase
            await this.loadExpenses();

            // Render initial view
            await this.render();
        } catch (e) {
            console.error('Error initializing Expenses:', e);
            Helpers.showToast('Errore nell\'inizializzazione', 'error');
        }
    },

    /**
     * Carica le spese da Supabase
     */
    async loadExpenses() {
        try {
            this.expenses = await ExpenseCRUD.getAll();
        } catch (e) {
            console.error('Error loading expenses:', e);
            this.expenses = [];
        }
    },

    /**
     * Renderizza la vista principale
     */
    /**
     * Renderizza la vista principale - VERSIONE PREMIUM STYLE
     */


    /**
     * Renderizza la vista principale - VERSIONE PREMIUM STYLE
     */
    async render() {
        // Reload expenses before rendering
        await this.loadExpenses();
        
        const container = document.getElementById('expensesContent');
        if (!container) return;

        const expenses = this.getMonthExpenses();
        const stats = ExpenseStats.calculate(expenses);
        
        const monthLabel = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 1));

        container.innerHTML = `
            <div class="mb-8">
                <div class="flex flex-col xl:flex-row justify-between items-center mb-8 gap-6">
                    <h2 class="text-4xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
                        💰 Gestione Spese
                    </h2>
                    
                    <div class="flex flex-wrap gap-2 justify-center">
                        <button onclick="Expenses.showCategoriesModal()" class="px-4 py-2 bg-slate-800/50 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700/50 rounded-lg transition text-sm font-semibold backdrop-blur-md">
                            📂 Categorie
                        </button>
                        <button onclick="Expenses.showMappingsModal()" class="px-4 py-2 bg-slate-800/50 text-purple-400 border border-purple-500/20 hover:bg-purple-500/10 rounded-lg transition text-sm font-semibold backdrop-blur-md">
                            🎯 Mappature (${MerchantMappings.count()})
                        </button>
                        <button onclick="ExpenseModals.showImport()" class="px-4 py-2 bg-slate-800/50 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 rounded-lg transition text-sm font-semibold backdrop-blur-md">
                            📥 Importa CSV
                        </button>
                        <button onclick="ExpenseModals.showAdd('income')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 rounded-lg transition text-sm font-bold">
                            💰 Entrata
                        </button>
                        <button onclick="ExpenseModals.showAdd('expense')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 rounded-lg transition text-sm font-bold">
                            ➕ Spesa
                        </button>
                    </div>
                </div>

                <div class="relative flex items-center justify-between gap-6 mb-10 bg-slate-800/40 backdrop-blur-md p-2 pr-3 rounded-2xl border border-slate-700/50 shadow-xl max-w-xl mx-auto">
                    
                    <button onclick="Expenses.changeMonth(-1)" 
                            class="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-slate-500 border border-transparent transition-all duration-300 active:scale-95 group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 group-hover:-translate-x-1 transition-transform">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <h3 class="text-2xl font-black text-white flex-1 text-center capitalize tracking-tight select-none">
                        ${monthLabel}
                    </h3>

                    <div class="flex items-center gap-2">
                        <button onclick="Expenses.changeMonth(1)" 
                                class="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-slate-500 border border-transparent transition-all duration-300 active:scale-95 group">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 group-hover:translate-x-1 transition-transform">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        <div class="w-px h-8 bg-slate-700 mx-1"></div>

                        <button onclick="Expenses.resetMonth()" 
                                title="Torna a Oggi"
                                class="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 hover:border-indigo-500 transition-all duration-300 active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </button>

                        <button onclick="Expenses.confirmResetMonth()" 
                                title="Reset Mese (Elimina tutto)"
                                class="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 hover:border-red-500 transition-all duration-300 active:scale-95 group">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 group-hover:rotate-12 transition-transform">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div class="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-transform">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <p class="text-sm opacity-90 mb-1 font-medium">💸 Totale Spese</p>
                    <p class="text-3xl font-bold tracking-tight">${Helpers.formatCurrency(stats.total)}</p>
                </div>
                <div class="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-transform">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <p class="text-sm opacity-90 mb-1 font-medium">💰 Totale Entrate</p>
                    <p class="text-3xl font-bold tracking-tight">${Helpers.formatCurrency(stats.income)}</p>
                </div>
                <div class="relative overflow-hidden bg-gradient-to-br ${stats.balance >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600'} text-white rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-transform">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <p class="text-sm opacity-90 mb-1 font-medium">📊 Bilancio</p>
                    <p class="text-3xl font-bold tracking-tight">${stats.balance >= 0 ? '+' : ''}${Helpers.formatCurrency(stats.balance)}</p>
                </div>
                <div class="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-transform">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <p class="text-sm opacity-90 mb-1 font-medium">🔢 Transazioni</p>
                    <p class="text-3xl font-bold tracking-tight">${stats.count + stats.incomeCount}</p>
                </div>
                <div class="relative overflow-hidden bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-2xl shadow-lg p-5 hover:scale-[1.02] transition-transform">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                    <p class="text-sm opacity-90 mb-1 font-medium">💎 Investimenti</p>
                    <p class="text-3xl font-bold tracking-tight">${Helpers.formatCurrency(stats.excludedTotal)}</p>
                </div>
            </div>

            <div class="bg-slate-800/40 backdrop-blur-md rounded-2xl shadow-lg border border-slate-700/50 p-5 mb-6">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span class="text-blue-400">🔍</span> Filtra per Categoria
                </h3>
                <div class="flex flex-wrap gap-2">
                    <button onclick="ExpenseFilters.clearCategory(); Expenses.render();" 
                            class="px-4 py-2 rounded-xl transition font-medium text-sm ${!ExpenseFilters.hasCategory() ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}">
                        🔄 Tutte
                    </button>
                    ${ExpenseRenderer.renderCategoryFilters()}
                </div>
            </div>

            <div class="bg-slate-800/40 backdrop-blur-md rounded-2xl shadow-lg border border-slate-700/50 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-white flex items-center gap-2">
                        <span class="text-purple-400">📝</span> Tutte le Spese
                    </h3>
                    <button onclick="Expenses.exportMonth()" class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-blue-400 hover:text-white hover:bg-blue-500/20 transition font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Esporta CSV
                    </button>
                </div>
                <div class="space-y-2">
                    ${ExpenseRenderer.renderList(ExpenseFilters.hasCategory() ? ExpenseFilters.apply(expenses) : expenses)}
                </div>
            </div>
        `;
    },

    /**
     * Ottiene le spese del mese corrente
     */
    getMonthExpenses() {
        // FIX: Creazione oggetto Date e uso startDate/endDate
        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(referenceDate);

        return this.expenses.filter(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            const expDate = new Date(dateStr + 'T12:00:00');
            return expDate >= startDate && expDate <= endDate;
        });
    },

    /**
     * Cambia mese
     */
    async changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        await this.render();
    },

    /**
     * Reset al mese corrente
     */
    async resetMonth() {
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
        await this.render();
    },

    /**
     * Conferma reset mese (elimina tutte le spese)
     */
    confirmResetMonth() {
        const monthExpenses = this.getMonthExpenses();

        if (monthExpenses.length === 0) {
            Helpers.showToast('Nessuna spesa da cancellare in questo mese', 'warning');
            return;
        }

        const total = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        // FIX: Passaggio oggetto Date
        const monthName = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 1));

        const modal = document.createElement('div');
        modal.id = 'confirmResetModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 class="text-2xl font-semibold mb-4 text-red-600">⚠️ Conferma Reset Mese</h3>
                <p class="text-gray-700 mb-4">
                    Sei sicuro di voler eliminare <strong>TUTTE le ${monthExpenses.length} spese</strong> del mese di<br>
                    <strong class="text-lg">${monthName}</strong>?
                </p>
                <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p class="text-sm text-red-800 font-semibold">
                        ⚠️ Questa operazione è <strong>irreversibile</strong>!
                    </p>
                </div>
                <div class="mb-4 p-3 bg-gray-50 rounded">
                    <p class="text-sm text-gray-700 font-medium">Verranno eliminate:</p>
                    <ul class="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• ${monthExpenses.length} transazioni</li>
                        <li>• Totale: ${total.toFixed(2)} €</li>
                    </ul>
                </div>
                <div class="flex gap-2">
                    <button onclick="Expenses.deleteMonthExpenses()" class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium">
                        Sì, Elimina Tutto
                    </button>
                    <button onclick="Expenses.closeResetModal()" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium">
                        Annulla
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * Elimina tutte le spese del mese
     */
    async deleteMonthExpenses() {
        try {
            // FIX: Calcolo range corretto per eliminazione
            const count = await ExpenseCRUD.deleteMonth(this.currentYear, this.currentMonth);
            this.closeResetModal();
            Helpers.showToast(`${count} spese eliminate!`, 'success');
            await this.render();
        } catch (e) {
            Helpers.showToast('Errore nell\'eliminazione: ' + e.message, 'error');
        }
    },

    /**
     * Chiude modal reset
     */
    closeResetModal() {
        const modal = document.getElementById('confirmResetModal');
        if (modal) modal.remove();
    },

    /**
     * Esporta mese in CSV
     */
    exportMonth() {
        const expenses = this.getMonthExpenses();
        if (expenses.length === 0) {
            Helpers.showToast('Nessuna spesa da esportare', 'warning');
            return;
        }

        let csv = 'Data,Descrizione,Importo,Categoria\n';
        expenses.forEach(expense => {
            const category = Categories.getById(expense.category);
            csv += `${expense.date},"${expense.description}",${expense.amount},${category ? category.name : 'Altro'}\n`;
        });

        // FIX: Passaggio oggetto Date
        const monthName = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 1));
        Helpers.downloadFile(csv, `spese-${monthName}.csv`, 'text/csv');
        Helpers.showToast('CSV esportato!', 'success');
    },

    /**
     * Mostra modal categorie
     */
    showCategoriesModal() {
        const modal = document.createElement('div');
        modal.id = 'categoriesModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeCategoriesModal();
            }
        };

        const categories = Categories.getAll();

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">📂 Gestione Categorie</h3>
                        <p class="text-sm text-gray-600 mt-1">Personalizza le tue categorie di spesa</p>
                    </div>
                    <button onclick="Expenses.closeCategoriesModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <div class="space-y-3 mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Categorie Esistenti:</h4>
                    ${categories.map(cat => `
                        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <div class="flex items-center gap-3">
                                <span class="text-3xl">${cat.icon}</span>
                                <div>
                                    <p class="font-semibold text-gray-800">${Helpers.escapeHtml(cat.name)}</p>
                                    <p class="text-xs text-gray-500">ID: ${cat.id}</p>
                                </div>
                            </div>
                            ${!Categories.isDefault(cat.id) ? `
                                <button onclick="Expenses.deleteCategory('${cat.id}')" 
                                        class="text-red-500 hover:text-red-700 p-2">
                                    🗑️ Elimina
                                </button>
                            ` : '<span class="text-xs text-gray-400">Categoria predefinita</span>'}
                        </div>
                    `).join('')}
                </div>

                <div class="border-t pt-6">
                    <h4 class="font-semibold text-gray-700 mb-3">➕ Nuova Categoria:</h4>
                    <form onsubmit="Expenses.addCategory(event)" class="space-y-4">
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Icona</label>
                                <input type="text" id="newCategoryIcon" placeholder="🎨" maxlength="2"
                                       class="w-full text-center text-3xl border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nome Categoria</label>
                                <input type="text" id="newCategoryName" placeholder="Es: Viaggi, Hobby..."
                                       class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button type="submit" class="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition font-medium">
                                ➕ Aggiungi Categoria
                            </button>
                            <button type="button" onclick="Expenses.closeCategoriesModal()"
                                    class="px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium">
                                Chiudi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
    },

    /**
     * Aggiunge una categoria
     */
    async addCategory(event) {
        event.preventDefault();

        const icon = document.getElementById('newCategoryIcon').value.trim();
        const name = document.getElementById('newCategoryName').value.trim();

        try {
            await Categories.add(icon, name);
            this.closeCategoriesModal();
            await this.render();
            Helpers.showToast(`✅ Categoria "${name}" aggiunta!`, 'success');
        } catch (e) {
            Helpers.showToast(e.message, 'warning');
        }
    },

    /**
     * Elimina una categoria
     */
    async deleteCategory(categoryId) {
        try {
            const usedCount = await Categories.delete(categoryId);

            if (usedCount > 0) {
                Helpers.showToast(`Categoria eliminata (${usedCount} spese spostate in Altro)`, 'success');
            } else {
                Helpers.showToast('Categoria eliminata', 'success');
            }

            this.closeCategoriesModal();
            this.showCategoriesModal();
            await this.render();
        } catch (e) {
            Helpers.showToast(e.message, 'warning');
        }
    },

    /**
     * Chiude modal categorie
     */
    closeCategoriesModal() {
        const modal = document.getElementById('categoriesModal');
        if (modal) modal.remove();
    },

    /**
     * Mostra modal mappature
     */
    showMappingsModal() {
        const modal = document.createElement('div');
        modal.id = 'mappingsModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeMappingsModal();
            }
        };

        const mappings = MerchantMappings.getAll();
        const mappingsCount = Object.keys(mappings).length;

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">🎯 Mappature Merchant</h3>
                        <p class="text-sm text-gray-600 mt-1">Configura le regole di categorizzazione automatica</p>
                    </div>
                    <button onclick="Expenses.closeMappingsModal()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                ${mappingsCount === 0 ? `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">🎯</div>
                        <p class="text-gray-600 mb-2">Nessuna mappatura configurata</p>
                        <p class="text-sm text-gray-500">Apri una spesa e clicca su "Salva Regola"</p>
                    </div>
                ` : `
                    <div class="space-y-3">
                        ${Object.entries(mappings).map(([merchant, mapping]) => {
                            const category = Categories.getById(mapping.category);
                            return `
                                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
                                    <div class="flex items-center gap-3 flex-1">
                                        <span class="text-2xl">${category ? category.icon : '📦'}</span>
                                        <div>
                                            <p class="font-semibold text-gray-800">"${Helpers.escapeHtml(merchant)}"</p>
                                            <p class="text-sm text-gray-600">→ ${category ? category.name : mapping.category}</p>
                                        </div>
                                    </div>
                                    <button onclick="Expenses.deleteMerchantMapping('${merchant.replace(/'/g, "\\'")}')" 
                                            class="text-red-500 hover:text-red-700 p-2">
                                        🗑️
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}

                <div class="mt-6 pt-6 border-t">
                    <button onclick="Expenses.closeMappingsModal()" 
                            class="w-full px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium">
                        Chiudi
                    </button>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
    },

    /**
     * Elimina mappatura merchant
     */
    async deleteMerchantMapping(merchant) {
        try {
            await MerchantMappings.delete(merchant);
            this.closeMappingsModal();
            this.showMappingsModal();
            Helpers.showToast('Mappatura eliminata', 'success');
        } catch (e) {
            Helpers.showToast('Errore nell\'eliminazione: ' + e.message, 'error');
        }
    },

    /**
     * Chiude modal mappature
     */
    closeMappingsModal() {
        const modal = document.getElementById('mappingsModal');
        if (modal) modal.remove();
    }
};

// Export globale
window.Expenses = Expenses;
console.log('✅ Expenses module loaded');