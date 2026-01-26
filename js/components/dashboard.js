/**
 * Dashboard Component - STABLE EDITION 🛡️
 * Include: Anti-Duplicazione, Debounce rendering e Pulizia LocalStorage.
 */
const Dashboard = {
    defaultWidgets: ['agenda_kpi', 'agenda_list'],
    
    config: {
        activeWidgets: [] 
    },
    
    isInitialized: false,
    isEditMode: false,
    isRendering: false,     // Lock per evitare render sovrapposti
    renderTimeout: null,    // Timer per il debounce
    dragSrcIndex: null,

    async init() {
        this.loadConfig();

        if (window.EventBus && !this._eventListenerAttached) {
            EventBus.on('dataChanged', () => {
                // Usa il debounce invece di chiamare direttamente
                this.requestUpdate(); 
            });
            this._eventListenerAttached = true;
        }

        this.isInitialized = true;
        await this.render();
    },

    loadConfig() {
        const saved = localStorage.getItem('dashboard_config');
        if (saved) {
            try { 
                this.config = JSON.parse(saved);
                
                // === FIX: PULIZIA DUPLICATI ===
                // Rimuove widget doppi causati da bug precedenti (mantiene gli spazi vuoti multipli)
                const seen = new Set();
                this.config.activeWidgets = this.config.activeWidgets.filter(id => {
                    if (id === 'dashboard_spacer') return true; // Consenti spazi multipli
                    if (seen.has(id)) return false; // Rimuovi duplicati reali
                    seen.add(id);
                    return true;
                });
                
                // Salva subito la versione pulita
                this.saveConfig();

            } catch (e) { 
                console.error('Config error, resetting', e);
                this.config.activeWidgets = [...this.defaultWidgets];
            }
        } else {
            this.config.activeWidgets = [...this.defaultWidgets];
        }
    },

    saveConfig() {
        localStorage.setItem('dashboard_config', JSON.stringify(this.config));
    },

    // Funzione intelligente per gestire aggiornamenti rapidi
    requestUpdate() {
        const content = document.getElementById('dashboardContent');
        if (!content || content.classList.contains('hidden') || this.isEditMode) return;

        // Cancella il render precedente se ce n'è uno in coda
        if (this.renderTimeout) clearTimeout(this.renderTimeout);

        // Aspetta 100ms prima di renderizzare. Se arrivano altri dati, resetta il timer.
        this.renderTimeout = setTimeout(async () => {
            await this.renderActiveWidgets();
        }, 100);
    },

    getAllAvailableWidgets() {
        if (!window.ModuleManager || typeof ModuleManager.getModules !== 'function') return [];
        return ModuleManager.getModules().flatMap(m => m.widgets || []);
    },

    // ============================================================
    //  RENDER LOGIC
    // ============================================================

    async render() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        // Reset completo
        container.innerHTML = '';

        const editBtnClass = this.isEditMode 
            ? "bg-indigo-600 text-white shadow-indigo-500/50 shadow-lg border-indigo-500" 
            : "bg-slate-800/60 text-slate-300 hover:text-white border-slate-700/50";

        const headerHtml = `
            <div class="mb-8 animate-fadeIn flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent italic">Overview</h2>
                    <p class="text-slate-400 mt-2 font-medium flex items-center gap-2">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        ${this.isEditMode ? 'MODALITÀ MODIFICA ATTIVA' : 'Grid Operativa Personalizzata'}
                    </p>
                </div>
                <div class="flex items-center gap-3">
                    ${this.isEditMode ? `
                        <button onclick="Dashboard.openCustomizer()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-600 transition-all animate-fadeIn hover:scale-105 shadow-lg">
                            + Aggiungi Widget
                        </button>
                    ` : ''}
                    
                    <button onclick="Dashboard.toggleEditMode()" class="px-5 py-2.5 rounded-xl border backdrop-blur-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${editBtnClass}">
                        <span>${this.isEditMode ? '💾 Salva' : '✏️ Modifica'}</span>
                    </button>
                </div>
            </div>
        `;

        const gridHtml = `
            <div id="dashboard-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-20 transition-all"></div>
        `;

        container.innerHTML = headerHtml + gridHtml;
        await this.renderActiveWidgets();
    },

    async renderActiveWidgets() {
        if (this.isRendering) return; // Evita sovrapposizioni
        this.isRendering = true;

        const grid = document.getElementById('dashboard-grid');
        if (!grid) {
            this.isRendering = false;
            return;
        }
        
        // Pulizia profonda
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }
        
        const allWidgets = this.getAllAvailableWidgets();
        const activeIds = this.config.activeWidgets;

        // Mapping sicuro
        const widgetsToRender = activeIds
            .map(id => allWidgets.find(w => w.id === id))
            .filter(w => w !== undefined);

        if (widgetsToRender.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-600">
                <p class="font-bold">Nessun widget attivo.</p>
                <button onclick="Dashboard.toggleEditMode(); Dashboard.openCustomizer()" class="text-indigo-400 underline mt-2 cursor-pointer">Aggiungi Widget</button>
            </div>`;
            this.isRendering = false;
            return;
        }

        for (let index = 0; index < widgetsToRender.length; index++) {
            const widget = widgetsToRender[index];
            const colSpan = widget.size?.cols ? `lg:col-span-${widget.size.cols}` : 'lg:col-span-1';
            const rowSpan = widget.size?.rows ? `row-span-${widget.size.rows}` : 'row-span-1';
            
            const wrapper = document.createElement('div');
            let classes = `${colSpan} ${rowSpan} min-h-[160px] relative transition-all duration-300 rounded-[2.5rem] `;
            
            if (this.isEditMode) {
                classes += `cursor-move border-2 border-dashed border-indigo-500/50 hover:bg-indigo-500/10 hover:border-indigo-400 z-10 animate-pulse-slow `;
                wrapper.setAttribute('draggable', 'true');
                wrapper.ondragstart = (e) => this.handleDragStart(e, index);
                wrapper.ondragover = (e) => this.handleDragOver(e);
                wrapper.ondragenter = (e) => this.handleDragEnter(e);
                wrapper.ondragleave = (e) => this.handleDragLeave(e);
                wrapper.ondrop = (e) => this.handleDrop(e, index);
            } else {
                classes += `animate-fadeIn`;
            }

            wrapper.className = classes;
            
            // Render Widget
            try {
                const contentHtml = await widget.render();
                
                const overlayHtml = this.isEditMode ? `
                    <div class="absolute inset-0 z-20 rounded-[2.5rem]"></div>
                    <button onclick="Dashboard.removeWidget(${index})" class="absolute -top-3 -right-3 z-30 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg font-bold transition-transform hover:scale-110">✕</button>
                ` : '';

                wrapper.innerHTML = overlayHtml + contentHtml;
                grid.appendChild(wrapper);
            } catch (err) {
                console.error(`Errore render widget ${widget.id}:`, err);
            }
        }
        
        this.isRendering = false;
    },

    // ============================================================
    //  DRAG & DROP LOGIC
    // ============================================================
    
    handleDragStart(e, index) { 
        this.dragSrcIndex = index; 
        e.dataTransfer.effectAllowed = 'move'; 
        e.target.style.opacity = '0.4'; 
    },
    handleDragOver(e) { 
        if (e.preventDefault) e.preventDefault(); 
        e.dataTransfer.dropEffect = 'move'; 
        return false; 
    },
    handleDragEnter(e) { e.target.closest('[draggable]').classList.add('bg-indigo-500/20'); },
    handleDragLeave(e) { e.target.closest('[draggable]').classList.remove('bg-indigo-500/20'); },
    
    async handleDrop(e, targetIndex) {
        e.stopPropagation(); e.preventDefault();
        document.querySelectorAll('[draggable]').forEach(i => { i.style.opacity = '1'; i.classList.remove('bg-indigo-500/20'); });
        
        const sourceIndex = this.dragSrcIndex;
        if (sourceIndex !== targetIndex) {
            const list = [...this.config.activeWidgets];
            const [moved] = list.splice(sourceIndex, 1);
            list.splice(targetIndex, 0, moved);
            
            this.config.activeWidgets = list;
            this.saveConfig();
            await this.renderActiveWidgets();
        }
    },

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        this.render(); 
    },

    removeWidget(index) {
        this.config.activeWidgets.splice(index, 1);
        this.saveConfig();
        this.renderActiveWidgets();
    },

    // ============================================================
    //  CUSTOMIZER
    // ============================================================
    
    openCustomizer() {
        const activeModules = ModuleManager.getActiveModules().filter(m => m.widgets && m.widgets.length > 0);
        if (activeModules.length === 0) { alert("Nessun widget disponibile."); return; }

        const modalHtml = `
            <div id="dashboardCustomizer" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl max-w-4xl w-full flex flex-col h-[70vh] overflow-hidden animate-slideUp">
                    <div class="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                        <div><h3 class="text-2xl font-black text-white">Aggiungi Widget</h3><p class="text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Clicca per aggiungere</p></div>
                        <button onclick="document.getElementById('dashboardCustomizer').remove()" class="text-slate-500 hover:text-white transition-colors text-2xl">✕</button>
                    </div>
                    <div class="flex flex-1 overflow-hidden">
                        <div class="w-1/3 border-r border-slate-800 bg-slate-900/50 overflow-y-auto p-4 space-y-2">
                            ${activeModules.map((mod, index) => `
                                <button onclick="Dashboard.switchTab('${mod.id}')" id="tab-btn-${mod.id}" class="w-full text-left px-5 py-4 rounded-xl flex items-center gap-3 transition-all group tab-button ${index === 0 ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                                    <span class="text-xl opacity-80">${mod.icon || '📦'}</span>
                                    <div><span class="font-bold block text-sm">${mod.name}</span><span class="text-[10px] opacity-60 uppercase font-black tracking-widest">${mod.widgets.length} Widget</span></div>
                                </button>
                            `).join('')}
                        </div>
                        <div class="w-2/3 p-8 overflow-y-auto bg-slate-900 relative">
                            ${activeModules.map((mod, index) => `
                                <div id="tab-content-${mod.id}" class="tab-content ${index === 0 ? '' : 'hidden'} animate-fadeIn">
                                    <h4 class="text-xl font-bold text-white mb-6 flex items-center gap-2"><span class="opacity-50">${mod.icon}</span> ${mod.name}</h4>
                                    <div class="grid grid-cols-1 gap-4">
                                        ${mod.widgets.map(w => `
                                            <div onclick="Dashboard.addWidget('${w.id}')" class="group relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer bg-slate-800/40 border-slate-700 hover:border-indigo-500 hover:bg-slate-800 hover:scale-[1.01] hover:shadow-xl">
                                                <div class="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 text-xl shadow-inner shrink-0 group-hover:border-indigo-500/30 transition-colors">＋</div>
                                                <div><div class="font-bold text-white text-lg">${w.name}</div><div class="text-xs text-slate-400 mt-1 leading-relaxed">${w.description || ''}</div><div class="mt-3 flex items-center gap-2"><span class="text-[9px] font-black uppercase text-slate-300 bg-slate-700 px-2 py-1 rounded border border-slate-600">Size: ${w.size?.cols || 1}x${w.size?.rows || 1}</span></div></div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    switchTab(moduleId) {
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg');
            btn.classList.add('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
        });
        const activeBtn = document.getElementById(`tab-btn-${moduleId}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-slate-400', 'hover:bg-slate-800');
            activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg');
        }
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        const activeContent = document.getElementById(`tab-content-${moduleId}`);
        if (activeContent) activeContent.classList.remove('hidden');
    },

    addWidget(id) {
        this.config.activeWidgets.push(id);
        this.saveConfig();
        this.renderActiveWidgets();
        
        const modal = document.getElementById('dashboardCustomizer');
        if (modal) modal.remove();
        
        if (!this.isEditMode) this.toggleEditMode();
        Helpers.showToast('Widget Aggiunto 🚀');
    },

    getInternalWidgets() {
        return [{
            id: 'dashboard_spacer',
            name: 'Spazio Vuoto',
            description: 'Separatore invisibile 1x1 per layout.',
            size: { cols: 1, rows: 1 },
            render: () => `<div class="w-full h-full border-2 border-dashed border-slate-800/50 rounded-[2.5rem] opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center group"><span class="text-[10px] text-slate-600 font-bold uppercase tracking-widest group-hover:text-slate-400">Spazio</span></div>`
        }];
    }
};

if (window.ModuleManager) {
    ModuleManager.register({
        id: 'dashboard',
        name: 'Dashboard',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>',
        category: 'main', 
        order: 0, 
        isCore: true, 
        init: async () => { await Dashboard.init(); },
        render: async () => { await Dashboard.render(); },
        widgets: Dashboard.getInternalWidgets() 
    });
}
window.Dashboard = Dashboard;