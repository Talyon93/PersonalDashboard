/**
 * Dashboard Component - DRAG & DROP RIPRISTINATO + MULTI-COLUMN MOBILE
 * Griglia intelligente: 2 colonne su smartphone, 4 colonne su desktop.
 */
const Dashboard = {
    COLS: 4,
    TOTAL_SLOTS: 80, 
    
    config: {
        layout: {} // { slotIndex: widgetId }
    },
    
    isInitialized: false,
    isEditMode: false,
    isRendering: false,
    
    // Stato del Drag & Drop
    dragSrcSlot: null,       
    initialDragSlot: null,   
    lastPreviewSlot: null,
    originalLayout: null,    
    
    targetSlotForCustomizer: null,

    async init() {
        this.loadConfig();

        if (window.EventBus && !this._eventListenerAttached) {
            EventBus.on('dataChanged', () => {
                this.requestUpdate(); 
            });
            this._eventListenerAttached = true;
        }

        this.isInitialized = true;
        await this.render();
    },

    loadConfig() {
        const saved = localStorage.getItem('dashboard_config_v2');
        if (saved) {
            try { 
                this.config = JSON.parse(saved);
            } catch (e) { 
                this.setDefaultLayout();
            }
        } else {
            this.setDefaultLayout();
        }
    },

    setDefaultLayout() {
        this.config.layout = {
            0: 'agenda_kpi',
            2: 'agenda_list'
        };
        this.saveConfig();
    },

    saveConfig() {
        localStorage.setItem('dashboard_config_v2', JSON.stringify(this.config));
    },

    requestUpdate() {
        if (!this.isInitialized || this.isEditMode) return;
        this.renderActiveWidgets();
    },

    getAllAvailableWidgets() {
        if (!window.ModuleManager || typeof ModuleManager.getModules !== 'function') return [];
        return ModuleManager.getModules().flatMap(m => m.widgets || []);
    },

    getWidgetFootprint(startSlot, cols, rows) {
        const footprint = [];
        const startRow = Math.floor(startSlot / this.COLS);
        const startCol = startSlot % this.COLS;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const currentRow = startRow + r;
                const currentCol = startCol + c;
                if (currentCol < this.COLS) {
                    footprint.push(currentRow * this.COLS + currentCol);
                }
            }
        }
        return footprint;
    },

    getOccupiedSlots(layout) {
        const occupied = new Set();
        const allWidgets = this.getAllAvailableWidgets();
        Object.entries(layout).forEach(([slot, id]) => {
            const w = allWidgets.find(widget => widget.id === id);
            if (w) {
                const footprint = this.getWidgetFootprint(parseInt(slot), w.size?.cols || 1, w.size?.rows || 1);
                footprint.forEach(idx => occupied.add(idx));
            }
        });
        return occupied;
    },

    findFreeSlot(layout, cols, rows, excludeSlots = []) {
        const occupied = this.getOccupiedSlots(layout);
        for (let i = 0; i < 400; i++) {
            const footprint = this.getWidgetFootprint(i, cols, rows);
            const fitsWidth = (i % this.COLS) + cols <= this.COLS;
            if (!fitsWidth) continue;

            const isSpaceFree = footprint.every(idx => !occupied.has(idx) && !excludeSlots.includes(idx));
            if (isSpaceFree) return i;
        }
        return null;
    },

    // ============================================================
    //  RENDER LOGIC
    // ============================================================

    async render() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        container.innerHTML = '';

        const editBtnClass = this.isEditMode 
            ? "bg-indigo-600 text-white shadow-indigo-500/50 shadow-lg border-indigo-500 scale-105" 
            : "bg-slate-800/60 text-slate-300 hover:text-white border-slate-700/50";

        const wiggleStyle = `
            <style>
                @keyframes wiggle {
                    0% { transform: rotate(0deg); }
                    33% { transform: rotate(-0.15deg); }
                    66% { transform: rotate(0deg); }
                    100% { transform: rotate(0.15deg); }
                }
                .animate-wiggle {
                    animation: wiggle 0.4s ease-in-out infinite;
                    display: inline-block;
                }
                /* Nascondi scrollbar nell'header modale su mobile */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            </style>
        `;

        const headerHtml = `
            ${wiggleStyle}
            <div class="mb-6 md:mb-8 animate-fadeIn flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 class="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent italic">Overview</h2>
                    <p class="text-slate-400 mt-1 md:mt-2 font-medium flex items-center gap-2 text-xs md:text-base">
                        <span class="w-2 h-2 ${this.isEditMode ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500 animate-pulse'} rounded-full shrink-0"></span>
                        <span class="truncate">${this.isEditMode ? 'MODALITÀ DESIGN: TRASCINA OVUNQUE' : 'Dashboard Operativa'}</span>
                    </p>
                </div>
                <div class="flex flex-row md:flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
                    ${this.isEditMode ? `
                        <button onclick="Dashboard.openCustomizer()" class="flex-1 md:flex-none px-4 py-2.5 md:py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-bold uppercase tracking-widest border border-indigo-500/30 transition-all text-center">
                            + Aggiungi
                        </button>
                    ` : ''}
                    
                    <button onclick="Dashboard.toggleEditMode()" class="flex-1 md:flex-none justify-center px-5 py-2.5 rounded-xl border backdrop-blur-md text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${editBtnClass}">
                        <span>${this.isEditMode ? '💾 Salva' : '✏️ Modifica'}</span>
                    </button>
                </div>
            </div>
        `;

        // GRIGLIA: 2 colonne su smartphone (grid-cols-2), 4 colonne su desktop (lg:grid-cols-4)
        const gridClass = 'grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 pb-24 md:pb-40 transition-all duration-500 min-h-[500px] md:min-h-[800px] ';
        const gridStyle = this.isEditMode 
            ? 'bg-slate-900/40 p-3 md:p-8 rounded-[2rem] md:rounded-[3rem] ring-1 ring-white/5 shadow-2xl relative overflow-hidden' 
            : 'p-0'; 
        
        const gridHtml = `
            <div id="dashboard-grid" class="${gridClass} ${gridStyle}">
                ${this.isEditMode ? `<div class="absolute inset-0 pointer-events-none opacity-[0.03]" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 40px 40px;"></div>` : ''}
            </div>
        `;

        container.innerHTML = headerHtml + gridHtml;
        await this.renderActiveWidgets();
    },

    async renderActiveWidgets() {
        if (this.isRendering) return;
        this.isRendering = true;

        try {
            const grid = document.getElementById('dashboard-grid');
            if (!grid) return;
            
            grid.innerHTML = '';
            const allWidgets = this.getAllAvailableWidgets();
            const layoutEntries = Object.entries(this.config.layout);
            const maxIdxInLayout = layoutEntries.reduce((max, [slot]) => Math.max(max, parseInt(slot)), 0);
            
            // In Edit Mode mostra sempre un sacco di slot per poter trascinare
            const displaySlots = this.isEditMode 
                ? Math.max(this.TOTAL_SLOTS, Math.ceil((maxIdxInLayout + 4) / 4) * 4) 
                : maxIdxInLayout + 1;

            const occupiedSlots = new Set();

            for (let i = 0; i < displaySlots; i++) {
                if (occupiedSlots.has(i)) continue;

                const widgetId = this.config.layout[i];
                const widget = widgetId ? allWidgets.find(w => w.id === widgetId) : null;
                const slot = document.createElement('div');
                slot.id = `slot-${i}`;
                slot.dataset.slotIndex = i;
                
                if (widget) {
                    const wCols = widget.size?.cols || 1;
                    const wRows = widget.size?.rows || 1;
                    const footprint = this.getWidgetFootprint(i, wCols, wRows);
                    footprint.forEach(idx => { if(idx !== i) occupiedSlots.add(idx); });

                    // Tailwind Map: Se widget è 2+ colonne, su mobile prende 2 colonne (100%). Se 1 colonna, su mobile prende 1 colonna (50%).
                    const mobileSpan = wCols >= 2 ? 'col-span-2' : 'col-span-1';
                    const lgSpan = { 1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4' }[wCols] || 'lg:col-span-1';
                    const rowSpan = { 1: 'row-span-1', 2: 'row-span-2', 3: 'row-span-3', 4: 'row-span-4' }[wRows] || 'row-span-1';

                    slot.className = `${mobileSpan} ${lgSpan} ${rowSpan} min-h-[140px] md:min-h-[180px] relative rounded-[2rem] md:rounded-[2.5rem] transition-all duration-300 shadow-lg `;
                    
                    if (this.isEditMode) {
                        const wiggleClass = this.dragSrcSlot !== i ? 'animate-wiggle' : '';
                        slot.className += `cursor-grab active:cursor-grabbing ring-2 ring-white/5 group hover:ring-indigo-500/50 hover:shadow-2xl z-20 ${wiggleClass} `;
                        
                        // Drag & Drop abilitato OVUNQUE (Desktop e Mobile)
                        slot.setAttribute('draggable', 'true');
                        slot.ondragstart = (e) => this.handleDragStart(e, i);
                        slot.ondragover = (e) => this.handleDragOver(e, i);
                        slot.ondrop = (e) => this.handleDrop(e, i);
                        slot.ondragend = (e) => this.handleDragEnd(e);

                        if (this.dragSrcSlot === i) {
                            slot.classList.add('opacity-20', 'scale-95', 'grayscale', 'ring-indigo-500', 'ring-4', 'z-0');
                        }
                    }

                    try {
                        const contentHtml = (typeof widget.render === 'function') ? await widget.render() : widget.render;
                        
                        const controls = this.isEditMode ? `
                            <div class="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 rounded-[2rem] md:rounded-[2.5rem] pointer-events-none transition-opacity"></div>
                            <button onclick="Dashboard.removeWidget(${i}); event.stopPropagation();" class="absolute -top-3 -right-3 md:-top-2 md:-right-2 z-30 w-10 h-10 md:w-8 md:h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform border-4 border-[#0B1120] md:border-none font-bold text-lg md:text-base">✕</button>
                        ` : '';
                        slot.innerHTML = controls + contentHtml;
                    } catch (e) {
                        slot.innerHTML = `<div class="p-4 bg-slate-800 rounded-[2rem] md:rounded-[2.5rem] h-full flex items-center justify-center text-slate-500 text-xs text-center font-bold">Errore di Rendering</div>`;
                    }
                } else if (this.isEditMode) {
                    slot.className = `col-span-1 lg:col-span-1 row-span-1 min-h-[100px] md:min-h-[180px] border-2 border-dashed border-white/5 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center transition-all cursor-pointer group hover:bg-white/5 hover:border-white/20`;
                    slot.innerHTML = `<span class="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-widest group-hover:text-slate-500 opacity-40 md:opacity-30">Libero</span>`;
                    slot.onclick = () => this.openCustomizer(i);
                    slot.ondragover = (e) => this.handleDragOver(e, i);
                    slot.ondrop = (e) => this.handleDrop(e, i);
                } else {
                    slot.className = "col-span-1 lg:col-span-1 row-span-1 min-h-[140px] md:min-h-[180px] pointer-events-none opacity-0";
                }
                grid.appendChild(slot);
            }
        } finally {
            this.isRendering = false;
        }
    },

    // ============================================================
    //  SMART DRAG & DROP ENGINE 
    // ============================================================
    
    handleDragStart(e, slotIndex) { 
        this.initialDragSlot = slotIndex; 
        this.dragSrcSlot = slotIndex; 
        this.originalLayout = JSON.parse(JSON.stringify(this.config.layout));
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => this.renderActiveWidgets(), 0);
    },

    handleDragOver(e, targetSlot) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this.lastPreviewSlot === targetSlot) return;
        this.lastPreviewSlot = targetSlot;

        const initialSlot = this.initialDragSlot;
        if (initialSlot === null || initialSlot === targetSlot) return;

        const widgetId = this.originalLayout[initialSlot];
        const allWidgets = this.getAllAvailableWidgets();
        const widget = allWidgets.find(w => w.id === widgetId);
        const size = widget?.size || {cols: 1, rows: 1};

        if ((targetSlot % this.COLS) + size.cols > this.COLS) return;

        const footprint = this.getWidgetFootprint(targetSlot, size.cols, size.rows);
        const tempLayout = JSON.parse(JSON.stringify(this.originalLayout));
        delete tempLayout[initialSlot]; 

        const collidingWidgets = [];
        Object.entries(tempLayout).forEach(([slot, id]) => {
            const w = allWidgets.find(wid => wid.id === id);
            const wSize = w.size || {cols:1, rows:1};
            const wFootprint = this.getWidgetFootprint(parseInt(slot), wSize.cols, wSize.rows);
            if (wFootprint.some(idx => footprint.includes(idx))) {
                collidingWidgets.push({ slot: parseInt(slot), id: id, size: wSize });
            }
        });

        collidingWidgets.forEach(c => delete tempLayout[c.slot]);
        tempLayout[targetSlot] = widgetId;

        collidingWidgets.forEach(c => {
            const newSlot = this.findFreeSlot(tempLayout, c.size.cols, c.size.rows, footprint);
            if (newSlot !== null) tempLayout[newSlot] = c.id;
        });

        this.config.layout = tempLayout;
        this.dragSrcSlot = targetSlot; 
        this.renderActiveWidgets();
    },

    handleDragEnd(e) {
        this.dragSrcSlot = null;
        this.initialDragSlot = null;
        this.lastPreviewSlot = null;
        this.renderActiveWidgets();
    },

    handleDrop(e, targetSlot) {
        e.preventDefault();
        this.saveConfig();
        this.originalLayout = null;
        this.initialDragSlot = null;
        this.dragSrcSlot = null;
        this.renderActiveWidgets();
        if(window.Helpers) Helpers.showToast('Layout aggiornato ✨');
    },

    // ============================================================
    //  UI ACTIONS & CATALOGUE
    // ============================================================

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        this.render();
        if (!this.isEditMode) {
            this.saveConfig();
            if(window.Helpers) Helpers.showToast('Dashboard salvata ✨');
        }
    },

    removeWidget(slotIndex) {
        delete this.config.layout[slotIndex];
        this.saveConfig();
        this.renderActiveWidgets();
    },

    getWidgetVisualPreview(widget) {
        const type = widget.type || 'generic';
        
        const skeletonTemplates = {
            'list': `
                <div class="w-full space-y-2 p-3 md:p-4">
                    <div class="h-2 w-full bg-slate-700/50 rounded animate-pulse"></div>
                    <div class="h-2 w-3/4 bg-slate-700/50 rounded animate-pulse"></div>
                    <div class="h-2 w-5/6 bg-slate-700/50 rounded animate-pulse"></div>
                </div>`,
            'chart': `
                <div class="w-full h-full flex items-end justify-between p-3 md:p-4 gap-1">
                    <div class="w-1/4 bg-indigo-500/20 rounded-t h-1/2"></div>
                    <div class="w-1/4 bg-indigo-500/40 rounded-t h-3/4"></div>
                    <div class="w-1/4 bg-indigo-500/60 rounded-t h-2/3"></div>
                    <div class="w-1/4 bg-indigo-500 rounded-t h-full"></div>
                </div>`,
            'kpi': `
                <div class="w-full h-full flex flex-col items-center justify-center p-2">
                    <div class="h-1.5 w-8 bg-slate-700/50 rounded mb-2"></div>
                    <div class="h-6 md:h-8 w-16 bg-indigo-500/20 rounded-lg"></div>
                </div>`,
            'calendar': `
                <div class="grid grid-cols-7 gap-1 p-2 md:p-3 w-full">
                    ${Array(14).fill('<div class="aspect-square bg-slate-700/30 rounded-sm"></div>').join('')}
                </div>`,
            'generic': `
                <div class="flex items-center justify-center h-full opacity-20">
                    <svg class="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </div>`
        };

        return skeletonTemplates[type] || skeletonTemplates['generic'];
    },

    openCustomizer(specificSlot = null) {
        this.targetSlotForCustomizer = specificSlot;
        const activeModules = ModuleManager.getActiveModules().filter(m => m.widgets && m.widgets.length > 0);
        
        const modalHtml = `
            <div id="dashboardCustomizer" class="fixed inset-0 bg-slate-950/95 md:bg-slate-950/90 backdrop-blur-3xl md:backdrop-blur-2xl flex items-end md:items-center justify-center z-[200] p-0 md:p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-800 rounded-t-[2.5rem] md:rounded-[3.5rem] shadow-2xl max-w-5xl w-full flex flex-col h-[85vh] md:h-[85vh] overflow-hidden animate-slideUp">
                    
                    <div class="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 sticky top-0 backdrop-blur-md z-10 shrink-0">
                        <div>
                            <h3 class="text-3xl md:text-4xl font-black text-white italic tracking-tighter leading-none">Catalogo</h3>
                            <p class="text-[9px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1.5 md:mt-2">Seleziona Widget</p>
                        </div>
                        <button onclick="document.getElementById('dashboardCustomizer').remove()" class="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all hover:rotate-90 hover:bg-slate-700 shadow-inner">
                            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
                        <div class="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 md:p-6 flex flex-row md:flex-col gap-2 md:gap-3 overflow-x-auto md:overflow-y-auto shrink-0 no-scrollbar items-center md:items-stretch">
                            ${activeModules.map((mod, index) => `
                                <button onclick="Dashboard.switchTab('${mod.id}')" id="tab-btn-${mod.id}" class="whitespace-nowrap md:whitespace-normal md:w-full text-left px-4 py-3 md:px-5 md:py-5 rounded-2xl md:rounded-3xl flex items-center gap-3 md:gap-4 transition-all tab-button group shrink-0 ${index === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 bg-slate-800/20 md:bg-transparent'}">
                                    <span class="text-xl md:text-2xl group-hover:scale-110 transition-transform">${mod.icon || '📦'}</span>
                                    <span class="font-black text-xs md:text-sm uppercase tracking-wider md:truncate">${mod.name}</span>
                                </button>
                            `).join('')}
                        </div>

                        <div class="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-950/10">
                            ${activeModules.map((mod, index) => `
                                <div id="tab-content-${mod.id}" class="tab-content ${index === 0 ? '' : 'hidden'} animate-fadeIn">
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-10">
                                        ${mod.widgets.map(w => {
                                            const cols = w.size?.cols || 1;
                                            const rows = w.size?.rows || 1;
                                            return `
                                            <div onclick="Dashboard.addWidget('${w.id}')" class="group relative p-[3px] rounded-[2rem] md:rounded-[2.8rem] bg-gradient-to-br from-slate-800 to-slate-900 hover:from-indigo-600 hover:to-indigo-500 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
                                                <div class="bg-slate-900 rounded-[1.85rem] md:rounded-[2.65rem] p-5 md:p-6 h-full border border-white/5 group-hover:border-transparent transition-colors flex flex-col">
                                                    
                                                    <div class="mb-4 md:mb-6 h-24 md:h-32 bg-slate-950/60 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex items-center justify-center overflow-hidden relative shadow-inner shrink-0">
                                                        ${this.getWidgetVisualPreview(w)}
                                                    </div>

                                                    <div class="flex justify-between items-center mb-2 md:mb-3 gap-2">
                                                        <div class="min-w-0">
                                                            <div class="font-black text-white text-lg md:text-xl leading-tight group-hover:text-indigo-100 transition-colors truncate">${w.name}</div>
                                                        </div>
                                                        
                                                        <div class="p-1.5 md:p-2.5 bg-slate-800/80 border border-white/10 rounded-xl md:rounded-2xl flex flex-col items-center gap-1 group-hover:bg-white group-hover:border-transparent transition-all shadow-md group-hover:scale-105 shrink-0 min-w-[36px] md:min-w-[48px] backdrop-blur-sm">
                                                            <div class="grid gap-0.5 md:gap-1" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));">
                                                                ${Array(cols * rows).fill('<div class="w-1 h-1 md:w-1.5 md:h-1.5 bg-indigo-500 group-hover:bg-indigo-600 rounded-[1px] shadow-[0_0_2px_rgba(99,102,241,0.3)]"></div>').join('')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <p class="text-[10px] md:text-xs text-slate-500 mt-auto line-clamp-2 font-semibold leading-relaxed group-hover:text-slate-300 transition-colors">
                                                        ${w.description || 'Nessuna descrizione disponibile.'}
                                                    </p>
                                                </div>
                                            </div>
                                        `}).join('')}
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
            btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/20');
            btn.classList.add('bg-slate-800/20', 'md:bg-transparent', 'text-slate-500');
        });
        const activeTab = document.getElementById(`tab-btn-${moduleId}`);
        if(activeTab) {
            activeTab.classList.remove('bg-slate-800/20', 'md:bg-transparent', 'text-slate-500');
            activeTab.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/20');
            if (window.innerWidth < 768) {
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        document.getElementById(`tab-content-${moduleId}`)?.classList.remove('hidden');
    },

    addWidget(id) {
        const allWidgets = this.getAllAvailableWidgets();
        const widget = allWidgets.find(w => w.id === id);
        const size = widget?.size || {cols: 1, rows: 1};

        let targetSlot = this.targetSlotForCustomizer;
        if (targetSlot === null) {
            targetSlot = this.findFreeSlot(this.config.layout, size.cols, size.rows);
        }
        
        if (targetSlot !== null) {
            this.config.layout[targetSlot] = id;
            this.saveConfig();
            document.getElementById('dashboardCustomizer')?.remove();
            this.targetSlotForCustomizer = null;
            if (!this.isEditMode) this.isEditMode = true;
            this.render();
            if(window.Helpers) Helpers.showToast('Widget aggiunto! 🚀');
        } else {
            if(window.Helpers) Helpers.showToast('Spazio insufficiente per questo widget ⚠️');
        }
    }
};

if (window.ModuleManager) {
    ModuleManager.register({
        id: 'dashboard',
        name: 'Dashboard',
        icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2zM14 15a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z"></path></svg>`,
        category: 'main', order: 0, isCore: true, 
        init: async () => { await Dashboard.init(); },
        render: async () => { await Dashboard.render(); },
        widgets: window.GeneralWidgets ? window.GeneralWidgets.getDefinitions() : []
    });
}
window.Dashboard = Dashboard;