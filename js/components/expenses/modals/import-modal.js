/**
 * Expense Import UI - V5.0 ELEGANT DARK EDITION 🌑
 * Redesign completo con icone SVG, contrasto elevato e tema scuro nativo.
 */
const ExpenseImportUI = {
    // UI State
    state: {
        step: 'UPLOAD', // UPLOAD, MAPPING, PREVIEW, LOADING
        rawFile: null,
        parsedData: null,
        currentMapping: { 
            dateIndex: -1, 
            amountIndex: -1, 
            descIndex: -1, 
            categoryIndex: -1, 
            amountMode: 'standard',
            outflowIndex: -1, 
            inflowIndex: -1 
        },
        configName: '',
        allExpenses: [],      
        selectedIds: new Set() 
    },

    // --- INIT ---
    show() {
        this.state = {
            step: 'UPLOAD',
            rawFile: null,
            parsedData: null,
            currentMapping: { dateIndex: -1, amountIndex: -1, descIndex: -1, categoryIndex: -1, amountMode: 'standard', outflowIndex: -1, inflowIndex: -1 },
            configName: '',
            allExpenses: [],
            selectedIds: new Set()
        };
        this.render();
    },

    // --- RENDER MAIN ---
    render() {
        const existing = document.getElementById('importModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'importModal';
        // Backdrop scuro e sfocato
        modal.className = 'modal fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn';
        
        let content = '';
        try {
            switch(this.state.step) {
                case 'UPLOAD': content = this.renderUploadStep(); break;
                case 'MAPPING': content = this.renderMappingStep(); break;
                case 'PREVIEW': content = this.renderPreviewStep(); break;
                case 'LOADING': content = this.renderLoadingStep(); break;
                default: content = this.renderUploadStep();
            }
        } catch (e) {
            console.error(e);
            content = this.renderError(e.message);
        }

        modal.innerHTML = `
            <div class="bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all scale-100">
                <div class="flex justify-between items-center px-8 py-5 border-b border-slate-700/50 bg-slate-800/50">
                    <h3 class="text-xl font-bold text-white flex items-center gap-3">
                        ${this.getTitleIcon()}
                        <span class="tracking-tight">${this.getTitleText()}</span>
                    </h3>
                    <button onclick="ExpenseModals.close('importModal')" class="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-700">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div class="overflow-y-auto flex-1 p-8 custom-scrollbar bg-slate-900/30">
                    ${content}
                </div>
            </div>
        `;

        document.getElementById('modalsContainer').appendChild(modal);
        if (this.state.step === 'UPLOAD') this.initDragAndDrop();
    },

    getTitleText() {
        switch(this.state.step) {
            case 'MAPPING': return 'Configura Colonne';
            case 'PREVIEW': return 'Seleziona Transazioni';
            case 'LOADING': return 'Elaborazione in corso...';
            default: return 'Importa Transazioni';
        }
    },

    getTitleIcon() {
        // Icone SVG per l'header
        if (this.state.step === 'UPLOAD') return `<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`;
        if (this.state.step === 'MAPPING') return `<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>`;
        if (this.state.step === 'PREVIEW') return `<svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`;
        return '';
    },

    renderError(msg) {
        return `<div class="flex flex-col items-center justify-center h-full text-rose-400">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <p class="text-lg font-medium">${msg}</p>
            <button onclick="ExpenseImportUI.show()" class="mt-6 px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition">Ricomincia</button>
        </div>`;
    },

    // --- STEP 1: UPLOAD (Redesign) ---
    renderUploadStep() {
        return `
            <div class="flex flex-col h-full justify-center max-w-3xl mx-auto py-10">
                
                <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-10 flex items-start gap-5">
                    <div class="p-3 bg-indigo-500/20 rounded-xl text-indigo-300">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-white mb-1">Sistema Intelligente</h4>
                        <p class="text-slate-400 text-sm leading-relaxed">
                            Carica il file della tua banca (CSV o Excel). Il sistema riconosce automaticamente i formati già configurati in precedenza.
                        </p>
                    </div>
                </div>

                <div id="dropzoneArea" class="relative group flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-slate-600 rounded-3xl cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all duration-300">
                    
                    <div class="mb-6 p-6 bg-slate-800 rounded-full shadow-2xl group-hover:scale-110 group-hover:text-blue-400 transition-all duration-300 border border-slate-700">
                        <svg class="w-12 h-12 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    
                    <p class="text-white font-bold text-2xl mb-2 tracking-tight">Clicca o trascina qui il file</p>
                    <p class="text-slate-500 font-medium text-sm">Supporta .CSV, .XLS, .XLSX</p>
                    
                    <input type="file" id="importFile" accept=".csv,.xlsx,.xls" class="hidden" onchange="ExpenseImportUI.handleFile(this.files[0])">
                    
                    <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
                </div>
            </div>
        `;
    },

    // --- STEP 2: MAPPING (Redesign) ---
    renderMappingStep() {
        if (!this.state.parsedData) return this.renderError("Nessun dato caricato.");
        
        const headers = this.state.parsedData.headers;
        const nonEmptyRows = this.state.parsedData.rows.filter(row => row.some(cell => cell && String(cell).trim().length > 0));
        const sampleRows = nonEmptyRows.slice(0, 5); // Mostra meno righe ma più pulite

        let tableHtml = `<div class="overflow-x-auto border border-slate-700 rounded-xl mb-8 shadow-2xl"><table class="w-full text-sm text-left border-collapse">`;
        
        // Header con Select
        tableHtml += `<thead class="bg-slate-900 text-slate-400"><tr>`;
        headers.forEach((h, idx) => {
            const isSelected = Object.values(this.state.currentMapping).includes(idx);
            const borderClass = isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-600';
            const bgClass = isSelected ? 'bg-indigo-900/30 text-indigo-300' : 'bg-slate-800 text-slate-300';
            
            tableHtml += `
                <th class="p-4 min-w-[200px] border-r border-slate-700 last:border-0 align-top bg-slate-800/50">
                    <div class="mb-3 font-bold truncate text-[11px] uppercase tracking-widest text-slate-500" title="${h}">${h}</div>
                    <select onchange="ExpenseImportUI.updateMapping(${idx}, this.value)" 
                            class="w-full p-2.5 text-xs rounded-lg cursor-pointer outline-none transition-all ${borderClass} ${bgClass} border hover:border-indigo-400 focus:border-indigo-500">
                        <option value="" class="bg-slate-800 text-slate-400">-- Ignora --</option>
                        <option value="date" ${this.state.currentMapping.dateIndex == idx ? 'selected' : ''} class="bg-slate-800 text-white">📅 Data</option>
                        
                        <optgroup label="Importi" class="bg-slate-800 text-slate-500">
                            <option value="amount" ${this.state.currentMapping.amountIndex == idx && this.state.currentMapping.amountMode !== 'inverted' ? 'selected' : ''} class="bg-slate-800 text-white">💰 Importo (+/-)</option>
                            <option value="amount_inverted" ${this.state.currentMapping.amountIndex == idx && this.state.currentMapping.amountMode === 'inverted' ? 'selected' : ''} class="bg-slate-800 text-white">💳 Spese Positive (+)</option>
                            <option value="outflow" ${this.state.currentMapping.outflowIndex == idx ? 'selected' : ''} class="bg-slate-800 text-white">📉 Solo Uscite</option>
                            <option value="inflow" ${this.state.currentMapping.inflowIndex == idx ? 'selected' : ''} class="bg-slate-800 text-white">📈 Solo Entrate</option>
                        </optgroup>

                        <option value="description" ${this.state.currentMapping.descIndex == idx ? 'selected' : ''} class="bg-slate-800 text-white">📝 Descrizione</option>
                        <option value="category" ${this.state.currentMapping.categoryIndex == idx ? 'selected' : ''} class="bg-slate-800 text-white">🏷️ Categoria (Opz.)</option>
                    </select>
                </th>`;
        });
        tableHtml += `</tr></thead>`;

        // Body Anteprima
        tableHtml += `<tbody class="divide-y divide-slate-700 bg-slate-800/30">`;
        sampleRows.forEach(row => {
            tableHtml += `<tr class="hover:bg-slate-700/30 transition-colors">`;
            headers.forEach((_, idx) => {
                const isDate = this.state.currentMapping.dateIndex == idx;
                const isAmount = this.state.currentMapping.amountIndex == idx || this.state.currentMapping.outflowIndex == idx || this.state.currentMapping.inflowIndex == idx;
                
                let cellClass = "text-slate-400";
                if(isDate) cellClass = "text-blue-300 font-medium bg-blue-500/5";
                if(isAmount) cellClass = "text-emerald-300 font-mono font-medium bg-emerald-500/5";

                tableHtml += `<td class="p-3 text-xs border-r border-slate-700/50 truncate max-w-[200px] ${cellClass}">
                    ${row[idx] || '<span class="text-slate-600">-</span>'}
                </td>`;
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table></div>`;

        return `
            <div class="pb-4">
                <div class="bg-amber-500/10 border border-amber-500/20 p-5 mb-8 rounded-xl flex gap-4 items-center">
                    <div class="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <div>
                        <h4 class="text-sm font-bold text-amber-400">Nuovo formato rilevato</h4>
                        <p class="text-xs text-amber-200/70 mt-0.5">
                            Associa le colonne usando i menu qui sotto. Salveremo questa configurazione per il futuro.
                        </p>
                    </div>
                </div>

                ${tableHtml}
                
                <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8 shadow-lg">
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome Banca / Piattaforma</label>
                    <input type="text" id="configNameInput" 
                           class="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-white placeholder-slate-600 transition-all" 
                           placeholder="Es. Intesa Sanpaolo, PayPal, Fineco..." 
                           value="${this.state.configName}">
                </div>

                <div class="flex justify-end gap-4 pt-6 border-t border-slate-700/50">
                    <button onclick="ExpenseImportUI.show()" class="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition font-bold text-sm">
                        Indietro
                    </button>
                    <button onclick="ExpenseImportUI.confirmMapping()" class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all font-bold text-sm flex items-center gap-2 transform active:scale-95">
                        <span>Salva e Continua</span> 
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </button>
                </div>
            </div>
        `;
    },

    // --- STEP 3: PREVIEW (Redesign) ---
    renderPreviewStep() {
        // Logica di calcolo (invariata)
        if (this.state.allExpenses.length === 0) {
            try {
                    this.state.allExpenses = ExpenseImport.applyMapping(
                    this.state.parsedData.rows, 
                    this.state.currentMapping, 
                    this.state.configName 
                );
                this.state.selectedIds = new Set(this.state.allExpenses.map(e => e.id));
            } catch(e) { console.error(e); return this.renderError(e.message); }
        }

        const total = this.state.allExpenses.length;
        const selectedCount = this.state.selectedIds.size;
        const isAllSelected = total > 0 && selectedCount === total;
        const previewRows = this.state.allExpenses.slice(0, 100);

        return `
            <div class="h-full flex flex-col">
                <div class="flex flex-wrap items-center justify-between mb-6 bg-slate-800 border border-slate-700 p-4 rounded-2xl shadow-lg gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/20">
                            ${selectedCount}
                        </div>
                        <div>
                            <h4 class="font-bold text-white">Transazioni Pronte</h4>
                            <p class="text-xs text-slate-400">Su un totale di ${total} righe trovate.</p>
                        </div>
                    </div>
                    
                    <label class="flex items-center gap-3 cursor-pointer bg-slate-700/50 hover:bg-slate-700 px-5 py-2.5 rounded-xl transition select-none border border-slate-600/50">
                        <input type="checkbox" onchange="ExpenseImportUI.toggleAll(this.checked)" 
                            class="w-5 h-5 text-indigo-600 rounded bg-slate-900 border-slate-600 focus:ring-indigo-500 cursor-pointer"
                            ${isAllSelected ? 'checked' : ''}>
                        <span class="text-sm font-bold text-slate-200">Seleziona Tutte</span>
                    </label>
                </div>

                <div class="overflow-y-auto border border-slate-700 rounded-2xl bg-slate-800/30 shadow-inner flex-1 mb-8 custom-scrollbar relative">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-900 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-700 sticky top-0 z-10 backdrop-blur-md bg-opacity-90">
                            <tr>
                                <th class="p-4 w-12 text-center">#</th>
                                <th class="p-4 text-left w-32">Data</th>
                                <th class="p-4 text-left">Descrizione</th>
                                <th class="p-4 text-left w-48">Categoria</th>
                                <th class="p-4 text-right w-36">Importo</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700/50">
                            ${previewRows.map(e => {
                                const isChecked = this.state.selectedIds.has(e.id);
                                return `
                                <tr class="hover:bg-slate-700/40 transition-colors cursor-pointer group ${isChecked ? '' : 'opacity-40 grayscale'}" 
                                    onclick="ExpenseImportUI.toggleRow(${e.id})">
                                    <td class="p-4 text-center" onclick="event.stopPropagation()">
                                        <input type="checkbox" onchange="ExpenseImportUI.toggleRow(${e.id})" 
                                            class="w-4 h-4 text-indigo-500 rounded bg-slate-800 border-slate-600 focus:ring-indigo-500 cursor-pointer"
                                            ${isChecked ? 'checked' : ''}>
                                    </td>
                                    <td class="p-4 text-slate-400 font-mono text-xs whitespace-nowrap">${e.date}</td>
                                    <td class="p-4 font-medium text-slate-200 truncate max-w-xs group-hover:whitespace-normal" title="${e.description}">
                                        ${e.description}
                                    </td>
                                    <td class="p-4">
                                        <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-slate-700 text-slate-300 border border-slate-600 whitespace-nowrap">
                                            ${e.category}
                                        </span>
                                    </td>
                                    <td class="p-4 text-right font-mono font-bold whitespace-nowrap ${e.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}">
                                        ${e.type === 'income' ? '+' : ''} ${e.amount.toFixed(2)} €
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                    ${total > 100 ? `<div class="p-4 text-center text-xs font-medium text-slate-500 bg-slate-900 border-t border-slate-700">... mostrate le prime 100 di ${total} righe ...</div>` : ''}
                </div>

                <div class="flex justify-end gap-4 pt-4 mt-auto border-t border-slate-700/50">
                    <button onclick="ExpenseImportUI.show()" class="px-6 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition font-bold text-sm">
                        Annulla
                    </button>
                    
                    <button onclick="ExpenseImportUI.finalizeImport()" 
                        class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/20 font-bold text-sm shadow-md flex items-center gap-2 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        ${selectedCount === 0 ? 'disabled' : ''}>
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg> 
                        <span>Importa ${selectedCount} Transazioni</span>
                    </button>
                </div>
            </div>
        `;
    },

    renderLoadingStep() {
        return `
            <div class="flex flex-col items-center justify-center h-96">
                <div class="relative w-20 h-20 mb-8">
                    <div class="absolute top-0 left-0 w-full h-full border-4 border-slate-700 rounded-full"></div>
                    <div class="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <h3 class="text-2xl font-bold text-white mb-2">Salvataggio in corso...</h3>
                <p class="text-slate-400">Stiamo scrivendo le transazioni nel database.</p>
            </div>
        `;
    },

    // --- LOGIC: DRAG & DROP (Invariata) ---
    initDragAndDrop() {
        const dropzone = document.getElementById('dropzoneArea');
        const input = document.getElementById('importFile');
        if(!dropzone) return;

        dropzone.onclick = () => input.click();
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); }, false);
        });

        dropzone.addEventListener('dragover', () => dropzone.classList.add('border-blue-500', 'bg-slate-800'));
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('border-blue-500', 'bg-slate-800'));
        dropzone.addEventListener('drop', (e) => {
            dropzone.classList.remove('border-blue-500', 'bg-slate-800');
            if (e.dataTransfer.files.length) this.handleFile(e.dataTransfer.files[0]);
        });
    },

    async handleFile(file) {
        if (!file) return;
        this.state.rawFile = file;
        this.state.step = 'LOADING';
        this.render();

        try {
            const data = await ExpenseImport.parseRawFile(file);
            this.state.parsedData = data;
            const savedConfig = await ExpenseImport.findConfig(data.signature);

            if (savedConfig) {
                console.log("✅ Configurazione trovata:", savedConfig.bank_name);
                this.state.currentMapping = savedConfig.mapping_json;
                this.state.configName = savedConfig.bank_name;
                this.state.step = 'PREVIEW';
            } else {
                console.log("⚠️ Nuova configurazione richiesta");
                this.state.step = 'MAPPING';
            }
            this.render();
        } catch (e) {
            console.error(e);
            alert("Errore lettura file: " + e.message);
            this.state.step = 'UPLOAD';
            this.render();
        }
    },

    // --- LOGIC: MAPPING UPDATE (Invariata) ---
    updateMapping(colIndex, value) {
        colIndex = parseInt(colIndex);
        Object.keys(this.state.currentMapping).forEach(key => {
            if (['dateIndex', 'amountIndex', 'descIndex', 'categoryIndex', 'outflowIndex', 'inflowIndex'].includes(key)) {
                if (this.state.currentMapping[key] === colIndex) this.state.currentMapping[key] = -1;
            }
        });
        if (this.state.currentMapping.amountIndex === colIndex) this.state.currentMapping.amountMode = 'standard';

        if (value) {
            if (value === 'date') this.state.currentMapping.dateIndex = colIndex;
            else if (value === 'description') this.state.currentMapping.descIndex = colIndex;
            else if (value === 'category') this.state.currentMapping.categoryIndex = colIndex;
            else if (value === 'amount') { this.state.currentMapping.amountIndex = colIndex; this.state.currentMapping.amountMode = 'standard'; }
            else if (value === 'amount_inverted') { this.state.currentMapping.amountIndex = colIndex; this.state.currentMapping.amountMode = 'inverted'; }
            else if (value === 'outflow') this.state.currentMapping.outflowIndex = colIndex;
            else if (value === 'inflow') this.state.currentMapping.inflowIndex = colIndex;
        }
        this.render();
    },

    async confirmMapping() {
        const { dateIndex, amountIndex, outflowIndex, inflowIndex } = this.state.currentMapping;
        const configName = document.getElementById('configNameInput').value;
        const hasAmount = amountIndex > -1 || (outflowIndex > -1 || inflowIndex > -1);
        
        if (dateIndex === -1 || !hasAmount) { alert("⚠️ Errore: Seleziona almeno DATA e IMPORTO."); return; }
        if (!configName) { alert("⚠️ Errore: Dai un nome alla configurazione."); return; }

        this.state.configName = configName;
        try {
            await ExpenseImport.saveConfig(configName, this.state.parsedData.signature, this.state.currentMapping);
        } catch(e) { console.warn("Impossibile salvare config remota", e); }

        this.state.step = 'PREVIEW';
        this.render();
    },

    // --- LOGIC: SELECTION (Invariata) ---
    toggleAll(isChecked) {
        if (isChecked) this.state.allExpenses.forEach(e => this.state.selectedIds.add(e.id));
        else this.state.selectedIds.clear();
        this.render();
    },

    toggleRow(id) {
        if (this.state.selectedIds.has(id)) this.state.selectedIds.delete(id);
        else this.state.selectedIds.add(id);
        this.render();
    },

    // --- LOGIC: FINALIZE (Invariata) ---
    async finalizeImport() {
        this.state.step = 'LOADING';
        this.render();
        try {
            const finalExpenses = this.state.allExpenses.filter(e => this.state.selectedIds.has(e.id));
            if (finalExpenses.length === 0) { alert("Nessuna transazione selezionata."); this.state.step = 'PREVIEW'; this.render(); return; }

            const result = await ExpenseCRUD.bulkCreate(finalExpenses);
            ExpenseModals.close('importModal');
            if (window.Expenses) await Expenses.render();
            if (window.Statistics) window.Statistics.isInitialized = false; 
            Helpers.showToast(`✅ Import completato: ${result.addedCount} inseriti, ${result.skippedCount} doppi.`, 'success');
        } catch (e) {
            console.error(e);
            alert("Errore import: " + e.message);
            this.state.step = 'PREVIEW';
            this.render();
        }
    }
};

window.ExpenseImportUI = ExpenseImportUI;