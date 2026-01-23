/**
 * Expense Modals Module - UX Improved + Drag & Drop Working
 * Gestione Importazione con Dropzone Reale e Stato Dinamico
 */

const ExpenseModals = {
    tempTags: [],

    // ==========================================
    // 📤 IMPORTAZIONE (UX + DRAG & DROP)
    // ==========================================

    showImport() {
        const modal = document.createElement('div');
        modal.id = 'importModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl transform transition-all scale-100">
                <div class="flex items-center gap-3 mb-6">
                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                        📤
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800">Importa Spese</h3>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">1. Seleziona Banca</label>
                    <div class="relative">
                        <select id="bankSelect" class="w-full appearance-none bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 pr-8 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer font-medium">
                            <option value="intesa">Intesa San Paolo</option>
                            <option value="revolut">Revolut</option>
                            <option value="ing">ING / Conto Arancio</option>
                        </select>
                        <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                            ▼
                        </div>
                    </div>
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">2. Carica File (CSV o Excel)</label>
                    
                    <div id="dropzoneContainer">
                        <label id="dropzoneArea" class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all group">
                            <div class="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                                <div class="mb-2 text-3xl text-gray-400 group-hover:text-blue-500 transition-colors">📄</div>
                                <p class="mb-1 text-sm text-gray-500 group-hover:text-blue-600"><span class="font-semibold">Clicca per caricare</span> o trascina qui</p>
                                <p class="text-xs text-gray-400">CSV, XLSX, XLS</p>
                            </div>
                            <input type="file" id="importFile" accept=".csv,.xlsx,.xls" class="hidden" onchange="ExpenseModals.handleFileSelect(this)">
                        </label>
                    </div>

                    <div id="filePreviewContainer" class="hidden">
                        <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div class="flex items-center gap-3 overflow-hidden">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📄</div>
                                <div class="min-w-0">
                                    <p id="selectedFileName" class="text-sm font-bold text-gray-800 truncate">nome_file.csv</p>
                                    <p class="text-xs text-blue-600">Pronto per l'importazione</p>
                                </div>
                            </div>
                            <button onclick="ExpenseModals.resetImportUI()" class="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Rimuovi file">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="importProgress" class="hidden mb-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div class="flex justify-between mb-2">
                        <span id="progressText" class="text-sm font-semibold text-blue-700">Inizializzazione...</span>
                        <span class="text-xs text-blue-400 animate-pulse">Elaborazione in corso</span>
                    </div>
                    <div class="w-full bg-blue-200 rounded-full h-2.5">
                        <div id="progressBar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out" style="width: 0%"></div>
                    </div>
                </div>

                <div id="importButtons" class="flex gap-3 pt-2">
                    <button id="btnStartImport" onclick="ExpenseModals.handleImport()" disabled class="flex-1 bg-gray-300 text-gray-500 px-6 py-3 rounded-xl cursor-not-allowed font-bold transition-all duration-200">
                        Avvia Importazione
                    </button>
                    <button onclick="ExpenseModals.close('importModal')" class="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition font-semibold">
                        Annulla
                    </button>
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
        
        // --- INIZIALIZZA DRAG & DROP EVENTS ---
        this.initDragAndDrop();
    },

    /**
     * Attiva la logica di trascinamento reale
     */
    initDragAndDrop() {
        const dropzone = document.getElementById('dropzoneArea');
        const input = document.getElementById('importFile');

        if (!dropzone) return;

        // Previene il comportamento default del browser (aprire il file)
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        // Effetto visivo quando trascini sopra (Highlight)
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.add('border-blue-500', 'bg-blue-50');
                dropzone.classList.remove('border-gray-300', 'bg-gray-50');
            }, false);
        });

        // Rimuovi effetto quando esci
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => {
                dropzone.classList.remove('border-blue-500', 'bg-blue-50');
                dropzone.classList.add('border-gray-300', 'bg-gray-50');
            }, false);
        });

        // Gestione RILASCIO (Drop)
        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;

            if (files && files.length > 0) {
                // Assegna i file all'input nascosto
                input.files = files;
                // Avvia la logica di selezione manuale
                this.handleFileSelect(input);
            }
        }, false);
    },

    /**
     * Gestisce la selezione del file: Nasconde Dropzone, Mostra Preview, Abilita Tasto
     */
    handleFileSelect(input) {
        const file = input.files[0];
        const dropzone = document.getElementById('dropzoneContainer');
        const preview = document.getElementById('filePreviewContainer');
        const nameLabel = document.getElementById('selectedFileName');
        const btn = document.getElementById('btnStartImport');

        if (file) {
            // 1. Aggiorna UI File
            dropzone.classList.add('hidden');
            preview.classList.remove('hidden');
            nameLabel.textContent = file.name;

            // 2. Abilita Bottone (Stile Blu)
            btn.disabled = false;
            btn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            btn.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-lg', 'hover:from-blue-600', 'hover:to-blue-700');
        }
    },

    /**
     * Resetta l'UI se l'utente clicca sulla X
     */
    resetImportUI() {
        const input = document.getElementById('importFile');
        const dropzone = document.getElementById('dropzoneContainer');
        const preview = document.getElementById('filePreviewContainer');
        const btn = document.getElementById('btnStartImport');

        // Reset Input
        input.value = '';

        // UI Reset
        dropzone.classList.remove('hidden');
        preview.classList.add('hidden');

        // Disabilita Bottone (Stile Grigio)
        btn.disabled = true;
        btn.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
        btn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-blue-600', 'text-white', 'shadow-lg', 'hover:from-blue-600', 'hover:to-blue-700');
    },

    /**
     * Logica Importazione
     */
    async handleImport() {
        const fileInput = document.getElementById('importFile');
        const bankType = document.getElementById('bankSelect').value;
        const btn = document.getElementById('btnStartImport');

        if (!fileInput.files[0]) return; 

        try {
            // Disabilita UI durante il caricamento
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-wait');
            
            this.updateImportProgress(5, '📂 Lettura file in corso...');
            await new Promise(r => setTimeout(r, 400));

            this.updateImportProgress(30, '🔍 Analisi transazioni...');
            const expenses = await ExpenseImport.processFile(fileInput.files[0], bankType);

            if (expenses.length === 0) {
                Helpers.showToast('❌ Nessuna spesa valida trovata.', 'error');
                this.updateImportProgress(0, 'Errore: Nessun dato trovato');
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-wait');
                return;
            }

            this.updateImportProgress(60, `💾 Salvataggio ${expenses.length} operazioni...`);
            await new Promise(r => setTimeout(r, 400));

            const result = await ExpenseCRUD.bulkCreate(expenses);

            this.updateImportProgress(100, '✅ Completato!');
            await new Promise(r => setTimeout(r, 800));

            this.close('importModal');
            await Expenses.render(); 
            if (typeof Dashboard !== 'undefined') await Dashboard.render(); 

            let message = `✅ ${result.addedCount} importate!`;
            if (result.skippedCount > 0) message += ` (${result.skippedCount} duplicati saltati)`;
            Helpers.showToast(message, 'success');

        } catch (e) {
            console.error('Errore import:', e);
            this.updateImportProgress(0, '❌ Errore critico');
            Helpers.showToast('Errore import: ' + e.message, 'error');
            // Riabilita UI in caso di errore
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-wait');
        }
    },

    updateImportProgress(percent, text) {
        const container = document.getElementById('importProgress');
        const bar = document.getElementById('progressBar');
        const label = document.getElementById('progressText');

        if (container && bar && label) {
            container.classList.remove('hidden');
            bar.style.width = `${percent}%`;
            label.textContent = text;
            
            if (percent >= 100) {
                bar.classList.remove('bg-blue-600');
                bar.classList.add('bg-green-500');
            } else {
                bar.classList.add('bg-blue-600');
                bar.classList.remove('bg-green-500');
            }
        }
    },

    // ==========================================
    // 📂 GESTIONE CATEGORIE (FIXED & PREMIUM)
    // ==========================================
    
    async showCategories() {
        const modal = document.createElement('div');
        modal.id = 'categoriesModal';
        // Background ultra-dark con sfocatura come da screenshot
        modal.className = 'modal fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn p-4';
        
        modal.innerHTML = `
            <div class="bg-[#1a222f] border border-slate-700/50 rounded-[2rem] shadow-2xl p-8 w-full max-w-xl transform transition-all border-slate-800">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">📂</span>
                        <div>
                            <h3 class="text-2xl font-black text-white tracking-tight">Categorie</h3>
                            <p class="text-slate-400 text-sm font-medium">Personalizza i tuoi flussi di spesa</p>
                        </div>
                    </div>
                    <button onclick="ExpenseModals.close('categoriesModal')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-white transition-all">✕</button>
                </div>
                
                <div class="bg-[#111827]/50 p-6 rounded-2xl border border-slate-700/30 mb-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Nuova Categoria</p>
                    <div class="flex gap-3">
                        <div class="relative group">
                            <input type="text" id="newCatIcon" value="🍕" class="w-14 h-14 bg-[#1a222f] border border-slate-700 rounded-xl text-center text-2xl focus:outline-none focus:border-indigo-500 transition-all cursor-pointer">
                        </div>
                        <input type="text" id="newCatName" placeholder="Nome categoria..." class="flex-1 bg-[#1a222f] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all">
                        <button onclick="ExpenseModals.handleAddCategory()" class="bg-[#5c56f0] hover:bg-[#4a44d1] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">Aggiungi</button>
                    </div>
                </div>

                <div class="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar" id="categoriesListContainer">
                    ${this.renderCategoryList()}
                </div>

                <div class="mt-8 pt-6 border-t border-slate-800">
                    <button onclick="ExpenseModals.close('categoriesModal')" class="w-full py-4 bg-[#242f3f] text-slate-200 rounded-2xl hover:bg-slate-700 transition font-black uppercase tracking-widest text-xs">
                        Chiudi Gestione
                    </button>
                </div>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    renderCategoryList() {
        // Ora getAll() restituisce correttamente tutto
        const allCategories = Categories.getAll();

        return allCategories.map(cat => `
            <div class="group flex items-center justify-between p-4 bg-[#1f2937]/50 rounded-2xl border border-slate-700/20 hover:border-slate-600/40 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-[#111827] rounded-xl flex items-center justify-center text-xl shadow-inner">
                        ${cat.icon}
                    </div>
                    <div>
                        <span class="block font-bold text-slate-100">${cat.name}</span>
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">${cat.id}</span>
                    </div>
                </div>
                ${!Categories.isDefault(cat.id) ? `
                    <button onclick="ExpenseModals.handleDeleteCategory('${cat.id}')" class="p-2 text-slate-500 hover:text-red-400 transition-all">
                        🗑️
                    </button>
                ` : '<span class="text-[8px] font-black text-slate-700 px-2 tracking-tighter">SISTEMA</span>'}
            </div>
        `).join('');
    },

    async handleAddCategory() {
        const icon = document.getElementById('newCatIcon').value.trim() || '📦';
        const name = document.getElementById('newCatName').value.trim();

        if (!name) return Helpers.showToast('Inserisci un nome!', 'error');

        try {
            // Salvataggio su Supabase tramite il modulo Categories
            await Categories.add(icon, name);
            
            // Reset input
            document.getElementById('newCatName').value = '';
            
            // Re-render della lista interna al modale
            document.getElementById('categoriesListContainer').innerHTML = this.renderCategoryList();
            
            Helpers.showToast('Categoria creata con successo!', 'success');
            
            // Aggiorna l'interfaccia principale se necessario
            if (window.Expenses) window.Expenses.render();
        } catch (e) {
            Helpers.showToast(e.message, 'error');
        }
    },

    async handleDeleteCategory(id) {
        if (!confirm('Vuoi davvero eliminare questa categoria personalizzata?')) return;
        try {
            await Categories.delete(id);
            document.getElementById('categoriesListContainer').innerHTML = this.renderCategoryList();
            if (window.Expenses) window.Expenses.render();
            Helpers.showToast('Categoria rimossa', 'success');
        } catch (e) {
            Helpers.showToast(e.message, 'error');
        }
    },

    // ==========================================
    // ➕ AGGIUNTA MANUALE & ALTRE MODALI
    // ==========================================
    
    showAdd(type = 'expense') {
        const isIncome = type === 'income';
        const title = isIncome ? 'Nuova Entrata' : 'Nuova Spesa';
        const categoriesList = isIncome ? Categories.incomeCategories : Categories.getAll();
        const buttonColor = isIncome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-500 hover:bg-blue-600';

        const modal = document.createElement('div');
        modal.id = 'expenseModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md transform transition-all scale-100">
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
                        <button type="submit" class="flex-1 ${buttonColor} text-white px-4 py-2 rounded-lg transition font-medium">Salva</button>
                        <button type="button" onclick="ExpenseModals.close('expenseModal')" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-medium">Annulla</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

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
            Helpers.showToast(type === 'income' ? 'Entrata registrata!' : 'Spesa registrata!', 'success');
        } catch (e) {
            Helpers.showToast('Errore: ' + e.message, 'error');
        }
    },

    async showDetail(expenseId) {
        const expense = await ExpenseCRUD.read(expenseId);
        if (!expense) return;

        const category = Categories.getById(expense.category);
        this.tempTags = expense.tags ? [...expense.tags] : [];
        let dateValue = expense.date.includes('T') ? expense.date.split('T')[0] : expense.date;

        const modal = document.createElement('div');
        modal.id = 'expenseDetailModal';
        modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn';
        modal.onclick = (e) => { if (e.target === modal) this.closeDetail(); };

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl transform transition-all scale-100" onclick="event.stopPropagation()">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center gap-3">
                        <div class="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full text-3xl">
                            ${category ? category.icon : '📦'}
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-800">${Helpers.escapeHtml(expense.description)}</h3>
                            <p class="text-3xl font-bold ${expense.type === 'income' ? 'text-emerald-600' : 'text-red-600'} mt-1">
                                ${Helpers.formatCurrency(expense.amount)}
                            </p>
                        </div>
                    </div>
                    <button onclick="ExpenseModals.closeDetail()" class="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>

                <form onsubmit="ExpenseModals.handleUpdate(event, '${expenseId}')" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Data</label>
                            <input type="date" id="editExpenseDate" value="${dateValue}" class="w-full border rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
                            <select id="editExpenseCategory" class="w-full border rounded-lg px-3 py-2">
                                ${Categories.getAll().map(cat => `<option value="${cat.id}" ${expense.category === cat.id ? 'selected' : ''}>${cat.icon} ${cat.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Descrizione</label>
                            <input type="text" id="editExpenseDescription" value="${Helpers.escapeHtml(expense.description)}" class="w-full border rounded-lg px-3 py-2">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Importo</label>
                            <input type="number" id="editExpenseAmount" value="${expense.amount}" step="0.01" class="w-full border rounded-lg px-3 py-2">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                        <div id="tagsContainer" class="flex flex-wrap gap-2 mb-2">${this.renderTags()}</div>
                        <div class="flex gap-2">
                            <input type="text" id="newTag" placeholder="Nuovo tag..." class="flex-1 border rounded-lg px-3 py-2 text-sm" onkeypress="if(event.key === 'Enter') { event.preventDefault(); ExpenseModals.addTag(); }">
                            <button type="button" onclick="ExpenseModals.addTag()" class="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm">Aggiungi</button>
                        </div>
                    </div>

                    <div class="flex gap-2 pt-4 border-t mt-4">
                        <button type="submit" class="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition font-medium shadow-md">Salva Modifiche</button>
                        <button type="button" onclick="ExpenseModals.confirmDelete('${expenseId}')" class="px-4 py-3 bg-red-100 text-red-600 border border-red-200 rounded-lg hover:bg-red-200 transition font-semibold">🗑️</button>
                    </div>
                </form>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    async handleUpdate(event, expenseId) {
        event.preventDefault();
        const updates = {
            description: document.getElementById('editExpenseDescription').value,
            amount: parseFloat(document.getElementById('editExpenseAmount').value),
            date: document.getElementById('editExpenseDate').value,
            category: document.getElementById('editExpenseCategory').value,
            tags: this.tempTags
        };
        try {
            await ExpenseCRUD.update(expenseId, updates);
            this.closeDetail();
            await Expenses.render();
            if (typeof Dashboard !== 'undefined') await Dashboard.render();
            Helpers.showToast('Aggiornamento completato', 'success');
        } catch (e) {
            Helpers.showToast('Errore: ' + e.message, 'error');
        }
    },

    renderTags() {
        if (this.tempTags.length === 0) return '<span class="text-gray-400 text-xs italic">Nessun tag</span>';
        return this.tempTags.map((tag, index) => `
            <span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold flex items-center gap-2">
                ${Helpers.escapeHtml(tag)}
                <button type="button" onclick="ExpenseModals.removeTag(${index})" class="text-purple-900 font-bold">×</button>
            </span>
        `).join('');
    },

    addTag() {
        const input = document.getElementById('newTag');
        const tag = input.value.trim();
        if (tag && !this.tempTags.includes(tag)) {
            this.tempTags.push(tag);
            document.getElementById('tagsContainer').innerHTML = this.renderTags();
            input.value = '';
        }
    },

    removeTag(index) {
        this.tempTags.splice(index, 1);
        document.getElementById('tagsContainer').innerHTML = this.renderTags();
    },

    async confirmDelete(id) {
        if (confirm('Sei sicuro di voler eliminare questa spesa?')) {
            try {
                await ExpenseCRUD.delete(id);
                await Expenses.render();
                if (typeof Dashboard !== 'undefined') await Dashboard.render();
                Helpers.showToast('🗑️ Spesa eliminata', 'success');
                this.closeDetail();
            } catch (e) {
                Helpers.showToast('Errore: ' + e.message, 'error');
            }
        }
    },

    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    },

    closeDetail() {
        this.close('expenseDetailModal');
        this.tempTags = [];
    }
};

window.ExpenseModals = ExpenseModals;
window.Expenses_showCategoriesModal = () => ExpenseModals.showCategories();
console.log('✅ ExpenseModals Module Loaded (UX Enhanced + DragDrop)');