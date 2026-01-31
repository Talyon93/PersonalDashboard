/**
 * Expense Form Modal - PREMIUM BOOLEAN EDITION
 * Features:
 * 1. Premium Dark Glass UI
 * 2. Gestione Tag Cloud (Storico)
 * 3. Toggle Investimento/Extra come flag booleano (is_excluded) separato dai tag
 */

const ExpenseFormUI = {
    tempTags: [],
    availableTags: [],
    tempIsExcluded: false, // Flag locale per lo stato Investimento

    // ============================================================
    //  HELPER: RECUPERO DATI E GESTIONE TAG
    // ============================================================
    
    // 1. Carica tutti i tag unici dallo storico
    async loadAllTags() {
        try {
            const expenses = window.CachedCRUD ? await window.CachedCRUD.getExpenses() : [];
            const tagsSet = new Set();
            expenses.forEach(e => {
                if (Array.isArray(e.tags)) e.tags.forEach(t => tagsSet.add(t));
            });
            this.availableTags = Array.from(tagsSet).sort();
        } catch (e) {
            this.availableTags = [];
        }
    },

    // 2. Renderizza i pulsanti dei Tag
    renderTagCloud() {
        const displayTags = Array.from(new Set([...this.availableTags, ...this.tempTags])).sort();

        if (displayTags.length === 0) {
            return `<div class="w-full py-4 text-center border-2 border-dashed border-slate-700/50 rounded-xl bg-slate-800/20 text-slate-500 text-xs font-medium">
                Nessun tag recente trovato
            </div>`;
        }

        return displayTags.map(tag => {
            const isActive = this.tempTags.includes(tag);
            // Stile Premium: Viola acceso se attivo, Slate trasparente se inattivo
            const btnClass = isActive 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-[0_0_10px_rgba(124,58,237,0.4)] scale-105' 
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white hover:bg-slate-700';

            return `
            <button type="button" onclick="ExpenseFormUI.toggleTag('${tag}')" 
                class="${btnClass} px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 flex items-center gap-1.5 active:scale-95 group">
                ${tag}
                ${isActive ? '<span class="text-[9px] opacity-70">✕</span>' : ''}
            </button>`;
        }).join('');
    },

    // 3. Logica Toggle Tag (Aggiungi/Rimuovi array)
    toggleTag(tag) {
        if (this.tempTags.includes(tag)) {
            this.tempTags = this.tempTags.filter(t => t !== tag);
        } else {
            this.tempTags.push(tag);
        }
        document.getElementById('tagsCloudContainer').innerHTML = this.renderTagCloud();
    },

    // 4. Aggiunta Manuale Tag
    addNewTagManual() {
        const input = document.getElementById('newTagInput');
        const val = input.value.trim();
        if (val) {
            if (!this.tempTags.includes(val)) {
                this.tempTags.push(val);
                // Aggiungilo visivamente alla cache locale
                if (!this.availableTags.includes(val)) this.availableTags.push(val);
            }
            input.value = '';
            document.getElementById('tagsCloudContainer').innerHTML = this.renderTagCloud();
        }
    },

    // ============================================================
    //  HELPER: GESTIONE TOGGLE INVESTIMENTO (BOOLEANO)
    // ============================================================
    
    toggleInvestmentStatus() {
        this.tempIsExcluded = !this.tempIsExcluded;
        this.updateInvestmentUI();
    },

    updateInvestmentUI() {
        // Aggiorna la classe del container e l'icona in base a tempIsExcluded
        const container = document.getElementById('investmentToggleContainer');
        const icon = document.getElementById('investIcon');
        const dot = document.getElementById('investCheckDot'); // O investCheckDotEdit

        // Sincronizza checkbox nascosta (se esiste, per compatibilità form)
        const checkbox = document.getElementById('expenseIsInvestment') || document.getElementById('editExpenseIsInvestment');
        if (checkbox) checkbox.checked = this.tempIsExcluded;

        if (this.tempIsExcluded) {
            // STATO: ATTIVO (Investimento)
            if(container) {
                container.className = "relative group cursor-pointer mb-6 p-4 rounded-2xl border transition-all duration-300 from-purple-900/40 to-indigo-900/40 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-gradient-to-br";
            }
            if(icon) {
                icon.classList.remove('grayscale');
                icon.classList.add('grayscale-0', 'scale-110');
            }
            if(dot) dot.style.opacity = '1';
        } else {
            // STATO: INATTIVO (Spesa Normale)
            if(container) {
                container.className = "relative group cursor-pointer mb-6 p-4 rounded-2xl border transition-all duration-300 bg-slate-800/40 border-slate-700 hover:border-slate-600";
            }
            if(icon) {
                icon.classList.add('grayscale');
                icon.classList.remove('grayscale-0', 'scale-110');
            }
            if(dot) dot.style.opacity = '0';
        }
    },

    // ============================================================
    //  SEZIONE 1: AGGIUNTA NUOVA SPESA
    // ============================================================
    async showAdd(type = 'expense') {
        await this.loadAllTags();
        this.tempTags = [];
        this.tempIsExcluded = false; // Reset stato iniziale

        const isIncome = type === 'income';
        const title = isIncome ? 'Nuova Entrata' : 'Nuova Spesa';
        const accentColor = isIncome ? 'emerald' : 'indigo';
        const categoriesList = isIncome ? Categories.incomeCategories : Categories.getAll();
        
        // HTML per il Toggle Investimento (Solo se Spesa)
        // Nota: onClick chiama toggleInvestmentStatus che aggiorna solo il booleano
        const investmentToggleHTML = !isIncome ? `
            <div id="investmentToggleContainer" onclick="ExpenseFormUI.toggleInvestmentStatus()" 
                 class="relative group cursor-pointer mb-6 p-4 rounded-2xl border border-slate-700 bg-slate-800/40 transition-all duration-300 hover:border-slate-600">
                
                <input type="checkbox" id="expenseIsInvestment" class="hidden"> <div class="flex items-center gap-4">
                    <div id="investIcon" class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg grayscale transition-all duration-300">
                        🚀
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">Investimento / Extra</h4>
                        <p class="text-[11px] text-slate-400 mt-0.5 leading-snug">
                            Esclude questa spesa dal budget mensile.<br>Verrà spostata nel box "Extra".
                        </p>
                    </div>
                    <div class="w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-purple-400 flex items-center justify-center transition-colors">
                        <div id="investCheckDot" class="w-3 h-3 rounded-full bg-purple-400 transition-opacity" style="opacity: 0"></div>
                    </div>
                </div>
            </div>
        ` : '';

        const modal = document.createElement('div');
        modal.id = 'expenseModal';
        modal.className = 'modal fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn';
        
        modal.innerHTML = `
            <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onclick="ExpenseModals.close('expenseModal')"></div>
            
            <div class="relative w-full max-w-lg bg-[#0f172a] rounded-[2rem] shadow-2xl border border-slate-800/60 overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                
                <div class="relative px-8 pt-8 pb-6 border-b border-slate-800/50 bg-slate-900/50">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-${accentColor}-500 via-purple-500 to-${accentColor}-500 opacity-80"></div>
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-3xl font-black text-white tracking-tight">${title}</h2>
                            <p class="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Compila i dettagli</p>
                        </div>
                        <div class="w-12 h-12 rounded-2xl bg-${accentColor}-500/10 flex items-center justify-center text-2xl shadow-inner border border-white/5">
                            ${isIncome ? '💰' : '💸'}
                        </div>
                    </div>
                </div>

                <div class="p-8 overflow-y-auto custom-scrollbar space-y-6">
                    <form onsubmit="ExpenseFormUI.submitAdd(event, '${type}')">
                        
                        <div class="group">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrizione</label>
                            <input type="text" id="expenseDescription" required placeholder="Es. Cena Sushi..." 
                                class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:bg-slate-800 focus:border-${accentColor}-500 outline-none transition-all text-sm font-medium">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-5">
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Importo</label>
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
                                    <input type="number" id="expenseAmount" step="0.01" min="0" required placeholder="0.00"
                                        class="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-8 pr-4 py-3.5 text-white text-lg font-bold placeholder-slate-600 focus:bg-slate-800 focus:border-${accentColor}-500 outline-none transition-all">
                                </div>
                            </div>
                             <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data</label>
                                <input type="date" id="expenseDate" value="${new Date().toISOString().split('T')[0]}" required
                                    class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-300 focus:text-white focus:bg-slate-800 focus:border-${accentColor}-500 outline-none transition-all text-sm font-medium">
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Categoria</label>
                            <div class="relative">
                                <select id="expenseCategory" class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3.5 text-white appearance-none focus:bg-slate-800 focus:border-${accentColor}-500 outline-none transition-all cursor-pointer text-sm font-medium">
                                    ${categoriesList.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
                                </select>
                                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                            </div>
                        </div>

                        <div class="h-px bg-slate-800/50 my-2"></div>

                        ${investmentToggleHTML}

                        <div>
                            <div class="flex justify-between items-end mb-3 ml-1">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags</label>
                                <span class="text-[10px] text-${accentColor}-400/80 font-medium">Seleziona o aggiungi</span>
                            </div>
                            
                            <div id="tagsCloudContainer" class="flex flex-wrap gap-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 min-h-[70px] mb-3 transition-all hover:border-slate-700">
                                ${this.renderTagCloud()}
                            </div>
                            
                            <div class="flex gap-2">
                                <input type="text" id="newTagInput" placeholder="Nuovo tag..." 
                                    class="flex-1 bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-purple-500 outline-none transition-all"
                                    onkeypress="if(event.key === 'Enter'){event.preventDefault(); ExpenseFormUI.addNewTagManual();}">
                                <button type="button" onclick="ExpenseFormUI.addNewTagManual()" 
                                    class="px-4 bg-slate-800 text-purple-400 border border-slate-700 rounded-xl hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all font-bold text-xl leading-none pb-1 shadow-lg">
                                    +
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Note</label>
                            <textarea id="expenseNotes" rows="2" placeholder="Dettagli aggiuntivi..." 
                                class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:bg-slate-800 focus:border-${accentColor}-500 outline-none transition-all resize-none"></textarea>
                        </div>

                        <div class="flex gap-4 pt-4 mt-4 border-t border-slate-800">
                            <button type="button" onclick="ExpenseModals.close('expenseModal')" 
                                class="flex-1 px-6 py-4 rounded-xl text-slate-400 font-bold text-sm hover:bg-slate-800 hover:text-white transition-all">
                                Annulla
                            </button>
                            <button type="submit" 
                                class="flex-[2] px-6 py-4 rounded-xl bg-gradient-to-r from-${accentColor}-600 to-${accentColor}-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(var(--color-${accentColor}-500),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-${accentColor}-500),0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <span>Salva Operazione</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    async submitAdd(event, type) {
        event.preventDefault();
        
        const data = {
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            notes: document.getElementById('expenseNotes').value,
            tags: this.tempTags,         // Array di stringhe
            is_excluded: this.tempIsExcluded, // BOOLEANO VERO E PROPRIO
            type: type
        };

        try {
            await ExpenseCRUD.create(data);
            ExpenseModals.close('expenseModal');
            if(window.Expenses) await Expenses.render();
            Helpers.showToast(type === 'income' ? 'Entrata registrata!' : 'Spesa registrata!', 'success');
        } catch (e) { Helpers.showToast(e.message, 'error'); }
    },

    // ============================================================
    //  SEZIONE 2: DETTAGLI E MODIFICA
    // ============================================================
    async showDetail(expenseId) {
        const expense = await ExpenseCRUD.read(expenseId);
        if (!expense) return;

        await this.loadAllTags();
        this.tempTags = expense.tags ? [...expense.tags] : [];
        // Carica lo stato booleano salvato nel DB
        this.tempIsExcluded = expense.is_excluded === true;

        const category = Categories.getById(expense.category);
        
        const investmentToggleHTML = expense.type !== 'income' ? `
            <div id="investmentToggleContainer" onclick="ExpenseFormUI.toggleInvestmentStatus()" 
                 class="${this.tempIsExcluded ? 'from-purple-900/40 to-indigo-900/40 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] bg-gradient-to-br' : 'bg-slate-800/40 border-slate-700'} relative group cursor-pointer mb-6 p-4 rounded-2xl border transition-all duration-300 hover:border-slate-600">
                
                <input type="checkbox" id="editExpenseIsInvestment" class="hidden" ${this.tempIsExcluded ? 'checked' : ''}>
                
                <div class="flex items-center gap-4">
                    <div id="investIcon" class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg transition-all duration-300 ${this.tempIsExcluded ? 'grayscale-0 scale-110' : 'grayscale'}">
                        🚀
                    </div>
                    <div class="flex-1">
                        <h4 class="text-sm font-bold text-white">Investimento / Extra</h4>
                    </div>
                    <div class="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center transition-colors">
                        <div id="investCheckDot" class="w-2.5 h-2.5 rounded-full bg-purple-400 transition-opacity" style="opacity: ${this.tempIsExcluded ? '1' : '0'}"></div>
                    </div>
                </div>
            </div>
        ` : '';

        const modal = document.createElement('div');
        modal.id = 'expenseDetailModal';
        modal.className = 'modal fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn';
        
        modal.innerHTML = `
            <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onclick="ExpenseFormUI.closeDetail()"></div>

            <div class="relative w-full max-w-lg bg-[#0f172a] rounded-[2rem] shadow-2xl border border-slate-800/60 overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                
                <div class="relative px-8 pt-8 pb-2 flex justify-between items-start">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 flex items-center justify-center bg-slate-800/50 rounded-2xl text-4xl shadow-inner border border-white/5">
                            ${category ? category.icon : '📦'}
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-white leading-tight">${Helpers.escapeHtml(expense.description)}</h3>
                            <p class="text-3xl font-black ${expense.type === 'income' ? 'text-emerald-400' : 'text-rose-500'} mt-1 tracking-tight drop-shadow-lg">
                                ${Helpers.formatCurrency(expense.amount)}
                            </p>
                        </div>
                    </div>
                    <button onclick="ExpenseFormUI.closeDetail()" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all">&times;</button>
                </div>

                <div class="p-8 overflow-y-auto custom-scrollbar space-y-5">
                    <form onsubmit="ExpenseFormUI.submitUpdate(event, '${expenseId}')">
                        
                        <div class="grid grid-cols-2 gap-5 mb-5">
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Data</label>
                                <input type="date" id="editExpenseDate" value="${expense.date.split('T')[0]}" 
                                    class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-3 text-slate-300 focus:text-white focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all text-sm font-medium">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Categoria</label>
                                <select id="editExpenseCategory" class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-3 text-white focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all text-sm font-medium">
                                    ${Categories.getAll().map(cat => `<option value="${cat.id}" ${expense.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-5 mb-5">
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Descrizione</label>
                                <input type="text" id="editExpenseDescription" value="${Helpers.escapeHtml(expense.description)}" 
                                    class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-3 text-white focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all text-sm">
                            </div>
                            <div>
                                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Importo</label>
                                <input type="number" id="editExpenseAmount" value="${expense.amount}" step="0.01" 
                                    class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-3 text-white focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all text-sm font-bold">
                            </div>
                        </div>

                        ${investmentToggleHTML}

                        <div class="mb-5">
                            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Note</label>
                            <textarea id="editExpenseNotes" rows="2" placeholder="Note..." 
                                class="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all resize-none">${Helpers.escapeHtml(expense.notes || '')}</textarea>
                        </div>

                        <div class="mb-6">
                            <div class="flex justify-between items-end mb-2 ml-1">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags</label>
                            </div>
                            <div id="tagsCloudContainer" class="flex flex-wrap gap-2 p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 min-h-[60px] mb-3">
                                ${this.renderTagCloud()}
                            </div>
                            <div class="flex gap-2">
                                <input type="text" id="newTagInput" placeholder="Nuovo tag..." 
                                    class="flex-1 bg-slate-800/30 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:border-purple-500 outline-none"
                                    onkeypress="if(event.key === 'Enter'){event.preventDefault(); ExpenseFormUI.addNewTagManual();}">
                                <button type="button" onclick="ExpenseFormUI.addNewTagManual()" class="px-3 bg-slate-800 text-purple-400 border border-slate-700 rounded-xl hover:bg-purple-600 hover:text-white transition-all font-bold">+</button>
                            </div>
                        </div>

                        <div class="p-4 bg-indigo-900/10 border border-indigo-500/20 rounded-2xl flex items-start gap-4 mb-6">
                            <div class="flex h-5 items-center mt-0.5">
                                <input type="checkbox" id="saveMappingAuth" class="w-5 h-5 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 focus:ring-offset-slate-900">
                            </div>
                            <div class="flex-1">
                                <label for="saveMappingAuth" class="font-bold text-sm text-indigo-300 cursor-pointer select-none block">
                                    Memorizza regola Import
                                </label>
                                <p class="text-[11px] text-indigo-400/60 mt-0.5 leading-relaxed">
                                    Salva categoria, tag e stato per futuri import di "<strong>${Helpers.escapeHtml(expense.description)}</strong>".
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-4 pt-4 border-t border-slate-800">
                            <button type="submit" class="flex-[2] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98]">
                                Salva Modifiche
                            </button>
                            <button type="button" onclick="ExpenseFormUI.confirmDelete('${expenseId}')" 
                                class="flex-1 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center">
                                🗑️
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    async submitUpdate(event, expenseId) {
        event.preventDefault();
        
        const updates = {
            description: document.getElementById('editExpenseDescription').value,
            amount: parseFloat(document.getElementById('editExpenseAmount').value),
            date: document.getElementById('editExpenseDate').value,
            category: document.getElementById('editExpenseCategory').value,
            notes: document.getElementById('editExpenseNotes').value,
            tags: this.tempTags,
            is_excluded: this.tempIsExcluded // Salva il booleano aggiornato
        };

        try {
            await ExpenseCRUD.update(expenseId, updates);

            const saveRuleCheckbox = document.getElementById('saveMappingAuth');
            if (saveRuleCheckbox && saveRuleCheckbox.checked) {
                if (window.MerchantMappings) {
                    // Nota: MerchantMappings dovrebbe essere aggiornato per accettare is_excluded
                    // Per ora passiamo i dati standard
                    await MerchantMappings.set(updates.description, updates.category, updates.tags);
                }
            }

            this.closeDetail();
            if(window.Expenses) await Expenses.render();
            Helpers.showToast('Aggiornamento completato', 'success');
        } catch (e) { Helpers.showToast('Errore: ' + e.message, 'error'); }
    },

    async confirmDelete(id) {
        if (confirm('Sei sicuro di voler eliminare questa spesa?')) {
            try {
                await ExpenseCRUD.delete(id);
                if(window.Expenses) await Expenses.render();
                Helpers.showToast('🗑️ Spesa eliminata', 'success');
                this.closeDetail();
            } catch (e) { Helpers.showToast('Errore: ' + e.message, 'error'); }
        }
    },

    closeDetail() {
        ExpenseModals.close('expenseDetailModal');
        this.tempTags = [];
        this.tempIsExcluded = false;
    },

    // ============================================================
    //  SEZIONE 3: MAPPATURE (STANDARD)
    // ============================================================
    async showMappingsManager() {
        const mappings = window.MerchantMappings ? await MerchantMappings.loadMappings() : {};
        const list = Object.entries(mappings);
        const modal = document.createElement('div');
        modal.id = 'mappingsModal';
        modal.className = 'modal fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4';
        
        const renderRow = (merchant, data) => {
            const cat = window.Categories ? Categories.getById(data.category) : null;
            const catName = cat ? `<span class="flex items-center gap-2">${cat.icon} ${cat.name}</span>` : '<span class="text-gray-400">?</span>';
            const tags = data.tags && data.tags.length ? data.tags.join(', ') : '<span class="text-gray-500 italic text-[10px]">No tags</span>';
            return `<tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors group"><td class="py-4 px-4 text-slate-300 font-medium capitalize text-sm">${Helpers.escapeHtml(merchant)}</td><td class="py-4 px-4 text-slate-400 text-sm">${catName}</td><td class="py-4 px-4 text-xs text-indigo-400">${tags}</td><td class="py-4 px-4 text-right"><button onclick="ExpenseFormUI.deleteMapping('${merchant.replace(/'/g, "\\'")}')" class="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all" title="Elimina"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></td></tr>`;
        };

        modal.innerHTML = `
            <div class="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div><h3 class="text-xl font-bold text-white">Regole Importazione</h3><p class="text-slate-500 text-xs mt-1">Gestisci le associazioni automatiche</p></div>
                    <button onclick="ExpenseModals.close('mappingsModal')" class="text-slate-500 hover:text-white transition-colors">&times;</button>
                </div>
                <div class="overflow-y-auto custom-scrollbar flex-1 bg-slate-900/20">
                    ${list.length === 0 ? `<div class="p-12 text-center text-slate-600"><p>Nessuna regola salvata</p></div>` : `<table class="w-full text-left border-collapse"><thead class="bg-slate-900 text-[10px] uppercase font-bold text-slate-500 sticky top-0"><tr><th class="py-3 px-4">Merchant</th><th class="py-3 px-4">Categoria</th><th class="py-3 px-4">Tags</th><th class="py-3 px-4"></th></tr></thead><tbody>${list.map(([m, d]) => renderRow(m, d)).join('')}</tbody></table>`}
                </div>
            </div>`;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    async deleteMapping(merchant) {
        if(!confirm(`Eliminare la regola per "${merchant}"?`)) return;
        try { if (window.MerchantMappings) { await MerchantMappings.delete(merchant); ExpenseModals.close('mappingsModal'); this.showMappingsManager(); Helpers.showToast('Regola eliminata', 'success'); } } catch(e) { Helpers.showToast('Errore', 'error'); }
    }
};

window.ExpenseFormUI = ExpenseFormUI;