/**
 * Expense Modals Module - Gestione Modali con Supabase
 */

const ExpenseModals = {
    tempTags: [],

    /**
     * Mostra modal aggiungi spesa/entrata
     */
    showAdd(type = 'expense') {
        const isIncome = type === 'income';
        const title = isIncome ? 'Nuova Entrata' : 'Nuova Spesa';
        const categoriesList = isIncome ? Categories.incomeCategories : Categories.getAll();
        const buttonColor = isIncome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600';

        const modal = document.createElement('div');
        modal.id = 'expenseModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 class="text-2xl font-semibold mb-4">${title}</h3>
                <form onsubmit="ExpenseModals.handleAdd(event, '${type}')">
                    <input type="hidden" id="expenseType" value="${type}">
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Descrizione *</label>
                        <input type="text" id="expenseDescription" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Importo (€) *</label>
                        <input type="number" id="expenseAmount" step="0.01" min="0" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Data *</label>
                        <input type="date" id="expenseDate" value="${new Date().toISOString().split('T')[0]}" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 mb-2 font-medium">Categoria</label>
                        <select id="expenseCategory" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            ${categoriesList.map(cat => `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button type="submit" class="flex-1 ${buttonColor} text-white px-4 py-2 rounded-lg transition font-medium">
                            Salva
                        </button>
                        <button type="button" onclick="ExpenseModals.close('expenseModal')" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium">
                            Annulla
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
    },

    /**
     * Gestisce il salvataggio di una nuova spesa
     */
    async handleAdd(event, type) {
        event.preventDefault();

        const expenseData = {
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            category: document.getElementById('expenseCategory').value,
            type: type
        };

        try {
            await ExpenseCRUD.create(expenseData);
            this.close('expenseModal');
            await Expenses.render();
            if (typeof Dashboard !== 'undefined') await Dashboard.render();

            const message = type === 'income' ? 'Entrata registrata!' : 'Spesa registrata!';
            Helpers.showToast(message, 'success');
        } catch (e) {
            Helpers.showToast('Errore nel salvataggio: ' + e.message, 'error');
        }
    },

    /**
     * Mostra modal dettaglio spesa
     */
    async showDetail(expenseId) {
        const expense = await ExpenseCRUD.read(expenseId);

        if (!expense) {
            console.error('Expense not found with ID:', expenseId);
            Helpers.showToast('Errore: spesa non trovata', 'error');
            return;
        }

        const category = Categories.getById(expense.category);
        this.tempTags = expense.tags ? [...expense.tags] : [];

        let dateValue = expense.date.split(' ')[0].split('T')[0];

        const modal = document.createElement('div');
        modal.id = 'expenseDetailModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeDetail();
            }
        };

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full text-3xl">
                            ${category ? category.icon : '📦'}
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">${Helpers.escapeHtml(expense.description)}</h3>
                            <p class="text-3xl font-bold text-red-600 mt-1">${Helpers.formatCurrency(expense.amount)}</p>
                        </div>
                    </div>
                    <button onclick="ExpenseModals.closeDetail()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onsubmit="ExpenseModals.handleUpdate(event, '${expenseId}')" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">📅 Data</label>
                            <input type="date" id="editExpenseDate" value="${dateValue}" 
                                   class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">📂 Categoria</label>
                            <select id="editExpenseCategory" class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                ${Categories.getAll().map(cat => `
                                    <option value="${cat.id}" ${expense.category === cat.id ? 'selected' : ''}>
                                        ${cat.icon} ${cat.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">✏️ Descrizione</label>
                            <input type="text" id="editExpenseDescription" value="${Helpers.escapeHtml(expense.description)}"
                                   class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">💰 Importo (€)</label>
                            <input type="number" id="editExpenseAmount" value="${expense.amount}" step="0.01" min="0"
                                   class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">🏷️ Tags</label>
                        <div id="tagsContainer" class="flex flex-wrap gap-2 mb-2">
                            ${this.renderTags()}
                        </div>
                        <div class="flex gap-2">
                            <input type="text" id="newTag" placeholder="Nuovo tag..." 
                                   class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                   onkeypress="if(event.key === 'Enter') { event.preventDefault(); ExpenseModals.addTag(); }">
                            <button type="button" onclick="ExpenseModals.addTag()" 
                                    class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm">
                                Aggiungi
                            </button>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">📝 Note</label>
                        <textarea id="editExpenseNotes" rows="3" 
                                  class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">${expense.notes || ''}</textarea>
                    </div>

                    <div class="flex gap-2 pt-4">
                        <button type="submit" class="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition font-medium">
                            💾 Salva Modifiche
                        </button>
                        <button type="button" onclick="ExpenseModals.saveMerchantMapping('${Helpers.escapeHtml(expense.merchant || expense.description)}', document.getElementById('editExpenseCategory').value)"
                                class="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm">
                            🎯 Salva Regola
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
    },

    /**
     * Gestisce l'aggiornamento di una spesa
     */
    async handleUpdate(event, expenseId) {
        event.preventDefault();

        const updates = {
            description: document.getElementById('editExpenseDescription').value,
            amount: parseFloat(document.getElementById('editExpenseAmount').value),
            date: document.getElementById('editExpenseDate').value,
            category: document.getElementById('editExpenseCategory').value,
            notes: document.getElementById('editExpenseNotes').value,
            tags: this.tempTags
        };

        try {
            await ExpenseCRUD.update(expenseId, updates);
            this.closeDetail();
            await Expenses.render();
            if (typeof Dashboard !== 'undefined') await Dashboard.render();
            Helpers.showToast('Spesa aggiornata!', 'success');
        } catch (e) {
            Helpers.showToast('Errore nell\'aggiornamento: ' + e.message, 'error');
        }
    },

    /**
     * Renderizza i tag
     */
    renderTags() {
        if (this.tempTags.length === 0) {
            return '<span class="text-gray-500 text-sm">Nessun tag</span>';
        }

        return this.tempTags.map((tag, index) => `
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                ${Helpers.escapeHtml(tag)}
                <button type="button" onclick="ExpenseModals.removeTag(${index})" class="text-purple-900 hover:text-purple-600">×</button>
            </span>
        `).join('');
    },

    /**
     * Aggiunge un tag
     */
    addTag() {
        const input = document.getElementById('newTag');
        const tag = input.value.trim();

        if (tag && !this.tempTags.includes(tag)) {
            this.tempTags.push(tag);
            document.getElementById('tagsContainer').innerHTML = this.renderTags();
            input.value = '';
        }
    },

    /**
     * Rimuove un tag
     */
    removeTag(index) {
        this.tempTags.splice(index, 1);
        document.getElementById('tagsContainer').innerHTML = this.renderTags();
    },

    /**
     * Salva mappatura merchant
     */
    async saveMerchantMapping(merchant, categoryId) {
        try {
            await MerchantMappings.set(merchant.toLowerCase().trim(), categoryId);
            const category = Categories.getById(categoryId);
            Helpers.showToast(`✅ Regola salvata! "${merchant}" → ${category ? category.name : categoryId}`, 'success');
        } catch (e) {
            Helpers.showToast('Errore nel salvataggio della regola: ' + e.message, 'error');
        }
    },

    /**
     * Mostra modal import
     */
    showImport() {
        const modal = document.createElement('div');
        modal.id = 'importModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <h3 class="text-2xl font-semibold mb-4">📤 Importa Spese da File</h3>
                
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2 font-medium">Seleziona Banca</label>
                    <select id="bankSelect" class="w-full border rounded-lg px-3 py-2 mb-4">
                        <option value="intesa">Intesa San Paolo</option>
                        <option value="revolut">Revolut</option>
                        <option value="custom">Formato Personalizzato</option>
                    </select>
                </div>

                <div class="mb-4 p-4 bg-blue-50 rounded-lg text-sm">
                    <p class="font-medium mb-2">📝 Formato atteso:</p>
                    <p class="text-gray-700 mb-1"><strong>Intesa:</strong> Data, Descrizione, Importo (CSV)</p>
                    <p class="text-gray-700 mb-1"><strong>Revolut:</strong> Date, Description, Amount (CSV o Excel)</p>
                    <p class="text-gray-700"><strong>Custom:</strong> Qualsiasi formato CSV/Excel (mappa manualmente)</p>
                </div>

                <div class="mb-4">
                    <label class="block text-gray-700 mb-2 font-medium">File CSV o Excel</label>
                    <input type="file" id="importFile" accept=".csv,.xlsx,.xls" class="w-full border rounded-lg px-3 py-2">
                    <p class="text-xs text-gray-500 mt-1">Formati supportati: CSV, XLSX, XLS</p>
                </div>

                <div class="flex gap-2">
                    <button onclick="ExpenseModals.handleImport()" class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-medium">
                        Importa
                    </button>
                    <button onclick="ExpenseModals.close('importModal')" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium">
                        Annulla
                    </button>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
    },

    /**
     * Gestisce l'import
     */
    async handleImport() {
        const fileInput = document.getElementById('importFile');
        const bankType = document.getElementById('bankSelect').value;

        if (!fileInput.files[0]) {
            Helpers.showToast('Seleziona un file', 'warning');
            return;
        }

        try {
            Helpers.showToast('Importazione in corso...', 'info');
            
            const expenses = await ExpenseImport.processFile(fileInput.files[0], bankType);

            if (expenses.length === 0) {
                Helpers.showToast('Nessuna spesa trovata nel file', 'warning');
                return;
            }

            const result = await ExpenseCRUD.bulkCreate(expenses);

            this.close('importModal');
            await Expenses.render();
            if (typeof Dashboard !== 'undefined') await Dashboard.render();

            let message = `${result.addedCount} spese importate!`;
            if (result.skippedCount > 0) {
                message += ` (${result.skippedCount} duplicati saltati)`;
            }
            Helpers.showToast(message, 'success');
        } catch (e) {
            console.error('Errore import:', e);
            Helpers.showToast('Errore nel parsing del file. Verifica il formato.', 'error');
        }
    },

    /**
     * Conferma eliminazione spesa
     */
    confirmDelete(id) {
        Helpers.confirm('Eliminare questa spesa?', async () => {
            try {
                await ExpenseCRUD.delete(id);
                await Expenses.render();
                if (typeof Dashboard !== 'undefined') await Dashboard.render();
                Helpers.showToast('Spesa eliminata', 'success');
            } catch (e) {
                Helpers.showToast('Errore nell\'eliminazione: ' + e.message, 'error');
            }
        });
    },

    /**
     * Chiude un modal
     */
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    },

    /**
     * Chiude il modal dettaglio
     */
    closeDetail() {
        this.close('expenseDetailModal');
        this.tempTags = [];
    }
};

// Export globale
window.ExpenseModals = ExpenseModals;
console.log('✅ ExpenseModals module loaded');
