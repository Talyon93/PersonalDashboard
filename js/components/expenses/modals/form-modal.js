/**
 * Expense Form Modal - Aggiunta, Modifica, Note e Mappature
 * VERSION: COMPLETE - Includes Notes & Merchant Mappings Logic
 */
const ExpenseFormUI = {
    tempTags: [],

    // ============================================================
    //  SEZIONE 1: AGGIUNTA NUOVA SPESA
    // ============================================================
    showAdd(type = 'expense') {
        const isIncome = type === 'income';
        const title = isIncome ? 'Nuova Entrata' : 'Nuova Spesa';
        const categoriesList = isIncome ? Categories.incomeCategories : Categories.getAll();
        const btnColor = isIncome ? 'bg-emerald-500' : 'bg-blue-500';

        const modal = document.createElement('div');
        modal.id = 'expenseModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn';
        
        // HTML Del Modale Aggiunta
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all scale-100">
                <h3 class="text-2xl font-semibold mb-4 text-gray-800">${title}</h3>
                <form onsubmit="ExpenseFormUI.submitAdd(event, '${type}')">
                    
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Descrizione *</label>
                        <input type="text" id="expenseDescription" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required placeholder="Es. Spesa Conad">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-gray-700 mb-2 font-medium">Importo (€) *</label>
                            <input type="number" id="expenseAmount" step="0.01" min="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required placeholder="0.00">
                        </div>
                         <div>
                            <label class="block text-gray-700 mb-2 font-medium">Data *</label>
                            <input type="date" id="expenseDate" value="${new Date().toISOString().split('T')[0]}" class="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none" required>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Categoria</label>
                        <select id="expenseCategory" class="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white">
                            ${categoriesList.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="mb-6">
                        <label class="block text-gray-700 mb-2 font-medium">Note</label>
                        <textarea id="expenseNotes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Dettagli aggiuntivi (opzionale)..."></textarea>
                    </div>

                    <div class="flex gap-3">
                        <button type="button" onclick="ExpenseModals.close('expenseModal')" class="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium">Annulla</button>
                        <button type="submit" class="flex-1 ${btnColor} text-white px-4 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity font-medium">Salva</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    async submitAdd(event, type) {
        event.preventDefault();
        
        // Raccogli dati dal form
        const data = {
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            notes: document.getElementById('expenseNotes').value, // Prendi le note
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

        const category = Categories.getById(expense.category);
        this.tempTags = expense.tags ? [...expense.tags] : [];
        const dateValue = expense.date.split('T')[0];
        const notesValue = expense.notes || ''; // Gestione note vuote

        const modal = document.createElement('div');
        modal.id = 'expenseDetailModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn';
        
        // Chiudi cliccando fuori
        modal.onclick = (e) => { if (e.target === modal) this.closeDetail(); };

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all scale-100" onclick="event.stopPropagation()">
                
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-2xl text-3xl shadow-inner">
                            ${category ? category.icon : '📦'}
                        </div>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800 leading-tight">${Helpers.escapeHtml(expense.description)}</h3>
                            <p class="text-3xl font-black ${expense.type === 'income' ? 'text-emerald-500' : 'text-rose-500'} mt-1 tracking-tight">
                                ${Helpers.formatCurrency(expense.amount)}
                            </p>
                        </div>
                    </div>
                    <button onclick="ExpenseFormUI.closeDetail()" class="text-gray-400 hover:text-gray-600 text-2xl transition-colors">×</button>
                </div>

                <form onsubmit="ExpenseFormUI.submitUpdate(event, '${expenseId}')" class="space-y-5">
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Data</label>
                            <input type="date" id="editExpenseDate" value="${dateValue}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categoria</label>
                            <select id="editExpenseCategory" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                ${Categories.getAll().map(cat => `<option value="${cat.id}" ${expense.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descrizione</label>
                            <input type="text" id="editExpenseDescription" value="${Helpers.escapeHtml(expense.description)}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Importo</label>
                            <input type="number" id="editExpenseAmount" value="${expense.amount}" step="0.01" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Note</label>
                        <textarea id="editExpenseNotes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400" placeholder="Aggiungi dettagli...">${Helpers.escapeHtml(notesValue)}</textarea>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
                        <div id="tagsContainer" class="flex flex-wrap gap-2 mb-3 min-h-[28px]">${this.renderTags()}</div>
                        <div class="flex gap-2">
                            <input type="text" id="newTag" placeholder="Nuovo tag..." class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors" onkeypress="if(event.key === 'Enter') { event.preventDefault(); ExpenseFormUI.addTag(); }">
                            <button type="button" onclick="ExpenseFormUI.addTag()" class="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-bold transition-colors">Aggiungi</button>
                        </div>
                    </div>

                    <div class="mt-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3 transition-all hover:shadow-sm">
                        <div class="flex h-5 items-center mt-0.5">
                            <input type="checkbox" id="saveMappingAuth" class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer">
                        </div>
                        <div class="flex-1">
                            <label for="saveMappingAuth" class="font-bold text-sm text-indigo-900 cursor-pointer select-none block">
                                Memorizza regola per futuri import
                            </label>
                            <p class="text-xs text-indigo-700/80 mt-0.5 leading-relaxed">
                                Assegna automaticamente questa categoria e questi tag quando importerai di nuovo "<strong>${Helpers.escapeHtml(expense.description)}</strong>".
                            </p>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                        <button type="submit" class="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all font-bold text-sm shadow-blue-500/20">Salva Modifiche</button>
                        <button type="button" onclick="ExpenseFormUI.confirmDelete('${expenseId}')" class="px-4 py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors font-bold shadow-sm" title="Elimina Spesa">
                            🗑️
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    async submitUpdate(event, expenseId) {
        event.preventDefault();
        
        const description = document.getElementById('editExpenseDescription').value;
        const categoryId = document.getElementById('editExpenseCategory').value;
        const amount = parseFloat(document.getElementById('editExpenseAmount').value);
        const date = document.getElementById('editExpenseDate').value;
        const notes = document.getElementById('editExpenseNotes').value; // Recupera Note
        
        const updates = {
            description: description,
            amount: amount,
            date: date,
            category: categoryId,
            tags: this.tempTags,
            notes: notes // Salva Note nel DB
        };

        try {
            // 1. Aggiorna la spesa corrente nel DB
            await ExpenseCRUD.update(expenseId, updates);

            // 2. Controlla se bisogna salvare la mappatura per il futuro
            const saveRuleCheckbox = document.getElementById('saveMappingAuth');
            if (saveRuleCheckbox && saveRuleCheckbox.checked) {
                if (window.MerchantMappings) {
                    await MerchantMappings.set(
                        description, // Merchant Key
                        categoryId,  // Categoria ID
                        this.tempTags // Tags array
                    );
                    Helpers.showToast('Regola salvata per import futuri!', 'success');
                } else {
                    console.warn('MerchantMappings module not loaded');
                }
            }

            this.closeDetail();
            if(window.Expenses) await Expenses.render();
            Helpers.showToast('Aggiornamento completato', 'success');
        } catch (e) { 
            console.error(e);
            Helpers.showToast('Errore: ' + e.message, 'error'); 
        }
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

    // ============================================================
    //  SEZIONE 3: GESTIONE TAGS
    // ============================================================
    renderTags() {
        if (this.tempTags.length === 0) return '<span class="text-gray-400 text-xs italic py-1">Nessun tag</span>';
        return this.tempTags.map((tag, index) => `
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-2 border border-purple-200">
                ${Helpers.escapeHtml(tag)}
                <button type="button" onclick="ExpenseFormUI.removeTag(${index})" class="hover:text-purple-900 font-black">×</button>
            </span>
        `).join('');
    },
    addTag() {
        const val = document.getElementById('newTag').value.trim();
        if (val && !this.tempTags.includes(val)) {
            this.tempTags.push(val);
            document.getElementById('tagsContainer').innerHTML = this.renderTags();
            document.getElementById('newTag').value = '';
        }
    },
    removeTag(index) {
        this.tempTags.splice(index, 1);
        document.getElementById('tagsContainer').innerHTML = this.renderTags();
    },
    closeDetail() {
        ExpenseModals.close('expenseDetailModal');
        this.tempTags = [];
    },

    // ============================================================
    //  SEZIONE 4: GESTORE MAPPATURE (Lista e Cancellazione)
    // ============================================================
    async showMappingsManager() {
        // Carica i dati aggiornati
        const mappings = window.MerchantMappings ? await MerchantMappings.loadMappings() : {};
        const list = Object.entries(mappings);

        const modal = document.createElement('div');
        modal.id = 'mappingsModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4';
        
        const renderRow = (merchant, data) => {
            const cat = window.Categories ? Categories.getById(data.category) : null;
            const catName = cat ? `<span class="flex items-center gap-2">${cat.icon} ${cat.name}</span>` : '<span class="text-gray-400">?</span>';
            const tags = data.tags && data.tags.length ? data.tags.join(', ') : '<span class="text-gray-500 italic text-[10px]">No tags</span>';
            
            return `
            <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors group">
                <td class="py-3 px-4 text-slate-200 font-medium capitalize text-sm">${Helpers.escapeHtml(merchant)}</td>
                <td class="py-3 px-4 text-slate-300 text-sm">${catName}</td>
                <td class="py-3 px-4 text-xs text-indigo-300">${tags}</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="ExpenseFormUI.deleteMapping('${merchant.replace(/'/g, "\\'")}')" 
                            class="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Elimina Regola">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            </tr>`;
        };

        // Modale Dark Theme per coerenza con Dashboard
        modal.innerHTML = `
            <div class="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-2xl flex flex-col max-h-[85vh]">
                <div class="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 rounded-t-2xl">
                    <div>
                        <h3 class="text-2xl font-bold text-white tracking-tight">Regole di Importazione</h3>
                        <p class="text-slate-400 text-sm mt-1">Gestisci le associazioni automatiche Merchant -> Categoria</p>
                    </div>
                    <button onclick="ExpenseModals.close('mappingsModal')" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div class="overflow-y-auto custom-scrollbar p-0 flex-1 bg-slate-800/50">
                    ${list.length === 0 
                        ? `<div class="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                             <div class="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center text-3xl mb-2">📭</div>
                             <p class="font-medium">Nessuna regola salvata</p>
                             <p class="text-xs max-w-xs">Le regole verranno create automaticamente quando spunti "Memorizza regola" modificando una spesa.</p>
                           </div>` 
                        : `<table class="w-full text-left border-collapse">
                            <thead class="bg-slate-900/80 text-[10px] uppercase font-black tracking-widest text-slate-500 sticky top-0 backdrop-blur-md z-10 shadow-sm">
                                <tr>
                                    <th class="py-3 px-4">Merchant</th>
                                    <th class="py-3 px-4">Assegna Categoria</th>
                                    <th class="py-3 px-4">Tags</th>
                                    <th class="py-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody id="mappingsListBody">
                                ${list.map(([m, d]) => renderRow(m, d)).join('')}
                            </tbody>
                           </table>`
                    }
                </div>
                
                <div class="p-4 bg-slate-900/50 border-t border-slate-700 rounded-b-2xl">
                    <p class="text-[11px] text-slate-500 text-center flex items-center justify-center gap-2">
                        💡 <strong>Tip:</strong> Puoi salvare nuove regole direttamente dalla modifica di una spesa.
                    </p>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
    },

    async deleteMapping(merchant) {
        if(!confirm(`Eliminare la regola per "${merchant}"?`)) return;
        
        try {
            if (window.MerchantMappings) {
                await MerchantMappings.delete(merchant);
                // Ricarica il modale chiudendo e riaprendo (metodo veloce)
                ExpenseModals.close('mappingsModal');
                this.showMappingsManager();
                Helpers.showToast('Regola eliminata', 'success');
            }
        } catch(e) {
            Helpers.showToast('Errore durante l\'eliminazione', 'error');
        }
    }
};

window.ExpenseFormUI = ExpenseFormUI;