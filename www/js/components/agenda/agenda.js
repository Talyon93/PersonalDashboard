/**
 * Agenda Component - CORE CONTROLLER (MOBILE STICKY HEADER & BOTTOM SHEET 📱)
 * Gestisce: Stato, CRUD, Modali Split (Desktop/Mobile), Orchestrazione.
 */

const Agenda = {
    currentDate: new Date(),
    currentView: 'month',
    showCompleted: false,
    
    tasks: [],
    notes: [],
    externalEvents: [],

    isInitialized: false,

    config: {
        startHour: 6,
        endHour: 23,
        showCompleted: false
    },

    // Helper per capire se siamo su smartphone
    isMobile() {
        return window.innerWidth < 768;
    },

    async init() {
        await this.loadData();
        
        // Ascolta il ridimensionamento della finestra per switchare tra UI Mobile e Desktop in tempo reale
        window.addEventListener('resize', () => {
            clearTimeout(this._resizeTimer);
            this._resizeTimer = setTimeout(() => {
                if (window.currentSection === 'agenda') this.updateView();
            }, 250);
        });
    },

    async loadData() {
        try {
            const [tasks, notes] = await Promise.all([
                window.CachedCRUD ? CachedCRUD.getTasks() : [],
                window.CachedCRUD ? CachedCRUD.getNotes() : []
            ]);
            
            this.tasks = (tasks || []).map(t => ({
                ...t,
                endDate: t.end_date || t.endDate || t.date,
                isDeadline: t.is_deadline || t.isDeadline || false 
            }));           this.notes = notes;
            
            if (window.EventBus) EventBus.emit('agendaDataLoaded', { tasks: this.tasks, notes: this.notes });
        } catch (e) {
            console.error('Error loading agenda data:', e);
        }
    },

    async render() {
        const container = document.getElementById('agendaContent');
        if (!container) return;

        if (!this.isInitialized || container.querySelector('h2') === null) {
           container.innerHTML = `
    <div class="hidden md:flex flex-row items-center justify-between mb-8 animate-fadeIn gap-4">
        <div class="shrink-0">
            <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-400 bg-clip-text text-transparent italic">Agenda Pro</h2>
            <p class="text-slate-400 mt-1 font-medium flex items-center gap-2 text-sm">
                <span class="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> Pianificazione & Note
            </p>
        </div>
        <div id="agenda-period-selector" class="flex-1 flex justify-center"></div>
        <div id="agenda-top-controls" class="flex items-center gap-4"></div>
    </div>

    <div class="md:hidden sticky top-[64px] z-[45] bg-[#0B1120] -mx-4 px-4 pt-4 pb-3 border-b border-slate-800/50 shadow-2xl flex flex-col gap-4">
        <div id="agenda-views-mobile"></div>
        <div id="agenda-actions-mobile" class="flex gap-3"></div>
        <div id="agenda-period-selector-mobile"></div>
    </div>
    
    <div id="agenda-main-container" class="animate-slideUp min-h-[400px] relative flex flex-col mt-4 md:mt-0"></div>
    <input type="file" id="gcal-import-input" accept=".ics" class="hidden" onchange="Agenda.handleGoogleImport(this)">
`;
            this.isInitialized = true;
        }

        await this.updateView();
    },

    async updateView() {
        this.config.showCompleted = this.showCompleted;
        this._renderControls();
        this._renderPeriodSelector();
        await this._loadExternalEvents();

        const main = document.getElementById('agenda-main-container');
        if (main && window.AgendaViews) {
            let html = '';
            const ext = this.externalEvents;
            switch (this.currentView) {
                case 'day':   html = AgendaViews.renderDay(this.tasks, this.notes, this.currentDate, this.config, ext); break;
                case 'week':  html = AgendaViews.renderWeek(this.tasks, this.notes, this.currentDate, this.config, ext); break;
                case 'month': html = AgendaViews.renderMonth(this.tasks, this.notes, this.currentDate, this.config, ext); break;
                case 'year':  html = AgendaViews.renderYear(this.tasks, this.notes, this.currentDate); break;
                case 'list':  html = AgendaViews.renderList(this.tasks, this.notes, this.currentDate, this.config, ext); break;
                default:      html = AgendaViews.renderMonth(this.tasks, this.notes, this.currentDate, this.config, ext);
            }
            main.innerHTML = html;
            
            if (this.currentView === 'day' || this.currentView === 'week') {
                setTimeout(() => {
                    const nowEl = document.getElementById('time-now-marker');
                    if(nowEl) nowEl.scrollIntoView({block: "center", behavior: "smooth"});
                }, 100);
            }
        }
    },

    _renderControls() {
    const views = [
        { id: 'day', label: 'Giorno' },
        { id: 'week', label: 'Settimana' },
        { id: 'month', label: 'Mese' },
        { id: 'year', label: 'Anno' },
        { id: 'list', label: 'Lista' }
    ];

    const viewsHTML = `
        <div class="bg-slate-900/50 border border-slate-800 p-1 rounded-2xl flex overflow-x-auto no-scrollbar">
            ${views.map(v => `
                <button onclick="Agenda.setView('${v.id}')" 
                        class="flex-1 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0
                        ${this.currentView === v.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}">
                    ${v.label}
                </button>
            `).join('')}
        </div>
    `;

    const actionsHTML = `
        <div class="relative">
            <button onclick="Agenda.toggleDisplaySettings()"
                    class="p-3 bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
                    title="Impostazioni vista agenda">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </button>
            <div id="agenda-display-settings" class="hidden absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50"></div>
        </div>
        <button onclick="document.getElementById('gcal-import-input').click()"
                class="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-800 text-white rounded-2xl transition-all text-xs font-bold flex items-center justify-center gap-2">
            <span class="text-lg">📥</span> Importa
        </button>
        <button onclick="Agenda.showAddModal()" class="flex-[1.5] px-4 py-3 bg-indigo-600 text-white shadow-lg rounded-2xl transition-all text-xs font-bold flex items-center justify-center gap-2">
            <span class="text-xl">＋</span> Nuovo
        </button>
    `;

    // Render Desktop
    const desktopControls = document.getElementById('agenda-top-controls');
    if (desktopControls) desktopControls.innerHTML = viewsHTML + actionsHTML;

    // Render Mobile
    const mobViews = document.getElementById('agenda-views-mobile');
    const mobActions = document.getElementById('agenda-actions-mobile');
    if (mobViews) mobViews.innerHTML = viewsHTML;
    if (mobActions) mobActions.innerHTML = actionsHTML;
},

    _renderPeriodSelector() {
    const html = `
        <div class="flex items-center justify-between bg-slate-900/50 p-2 rounded-2xl border border-slate-800/50 shadow-inner">
            <button onclick="Agenda.changePeriod(-1)" class="w-10 h-10 flex items-center justify-center text-slate-400">←</button>
            <h3 class="text-base font-bold text-white capitalize tracking-tight">${this.getPeriodLabel()}</h3>
            <div class="flex items-center gap-2">
                <button onclick="Agenda.changePeriod(1)" class="w-10 h-10 flex items-center justify-center text-slate-400">→</button>
                <div class="w-px h-6 bg-slate-800"></div>
                <button onclick="Agenda.goToToday()" class="px-4 py-2 rounded-xl bg-slate-800 text-indigo-400 text-[10px] font-black uppercase">Oggi</button>
            </div>
        </div>
    `;

    const selector = document.getElementById('agenda-period-selector');
    const selectorMob = document.getElementById('agenda-period-selector-mobile');
    if (selector) selector.innerHTML = html;
    if (selectorMob) selectorMob.innerHTML = html;
},

    toggleMultiDayUI() {
        const isMulti = document.getElementById('evtIsMultiDay').checked;
        const divTime = document.getElementById('divTime');
        const divDuration = document.getElementById('divDuration');
        const divEndDate = document.getElementById('divEndDate');
        const evtRecurrence = document.getElementById('evtRecurrence');
        const containerRecur = evtRecurrence ? evtRecurrence.closest('div') : null; 
        
        if (isMulti) {
            if (divTime) divTime.classList.add('hidden');
            if (divDuration) divDuration.classList.add('hidden');
            if (divEndDate) divEndDate.classList.remove('hidden');
            if (containerRecur) containerRecur.classList.add('hidden');
            if (evtRecurrence) evtRecurrence.value = 'none';
        } else {
            if (divTime) divTime.classList.remove('hidden');
            if (divDuration) divDuration.classList.remove('hidden');
            if (divEndDate) divEndDate.classList.add('hidden');
            if (containerRecur) containerRecur.classList.remove('hidden');
            const startDate = document.getElementById('evtDate').value;
            if (startDate) document.getElementById('evtEndDate').value = startDate;
        }
    },

    async handleEventSubmit(e, id) {
        e.preventDefault();
        
        const startDateInput = document.getElementById('evtDate');
        const endDateInput = document.getElementById('evtEndDate');
        const multiSwitch = document.getElementById('evtIsMultiDay');
        const startTimeInput = document.getElementById('evtTime');
        
        const startDateStr = startDateInput.value; 
        const isMultiDay = multiSwitch ? multiSwitch.checked : false;
        
        let endDateStr;
        if (isMultiDay) {
            endDateStr = endDateInput.value;
        } else {
            endDateStr = startDateStr; 
        }

        const durationInput = document.getElementById('evtDuration').value;
        const startTimeStr = startTimeInput.value;

        let duration = 60;
        let fullStartDate, fullEndDate;

        if (isMultiDay) {
            fullStartDate = `${startDateStr}T09:00:00`;
            fullEndDate = `${endDateStr}T09:00:00`;
            duration = 1440;
        } else {
            if (durationInput === 'all') duration = 1440; 
            else duration = parseInt(durationInput);

            fullStartDate = `${startDateStr}T${startTimeStr}:00`;
            fullEndDate = `${startDateStr}T${startTimeStr}:00`; 
        }

        const baseData = {
            title: document.getElementById('evtTitle').value,
            date: fullStartDate,
            endDate: fullEndDate,
            location: document.getElementById('evtLocation').value,
            duration: duration,
            description: document.getElementById('evtDesc').value,
            priority: document.querySelector('input[name="priority"]:checked').value,
            isDeadline: false,
            completed: false
        };

        const recurrence = document.getElementById('evtRecurrence').value;

        if (!id && recurrence !== 'none') {
            await this._handleRecurrence(baseData, startDateStr, endDateStr, isMultiDay ? '09:00' : startTimeStr, recurrence);
        } else {
            if(id) await window.CachedCRUD.updateTask(id, baseData);
            else await window.CachedCRUD.createTask(baseData);
        }
        
        this._afterSubmit();
    },

    async handleGoogleImport(input) {
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        if (!window.GoogleImporter) { alert("Modulo di importazione non caricato."); return; }

        try {
            const tasks = await GoogleImporter.parseFile(file);
            if (tasks.length === 0) { alert("Nessun evento valido."); input.value = ''; return; }
            if (confirm(`Trovati ${tasks.length} eventi. Importare?`)) {
                if (window.AgendaViews && AgendaViews.renderImportModal) {
                    document.body.insertAdjacentHTML('beforeend', AgendaViews.renderImportModal());
                }
                let importedCount = 0;
                for (let i = 0; i < tasks.length; i++) {
                    const task = tasks[i];
                    const exists = this.tasks.some(t => t.title === task.title && t.date === task.date);
                    if (!exists) { await window.CachedCRUD.createTask(task); importedCount++; }
                }
                const modal = document.getElementById('import-modal');
                if (modal) modal.remove();
                await this.loadData();
                this.updateView();
                if(window.Helpers) Helpers.showToast(`${importedCount} Eventi importati!`);
            }
        } catch (err) { console.error(err); alert("Errore lettura file."); }
        input.value = '';
    },

    // ============================================================
    //  MODALS (EVENTO vs SCADENZA vs NOTA) - SPLIT ARCHITECTURE
    // ============================================================

    showDayModal(dateStr) {
        this.currentDate = new Date(dateStr);
        this.setView('day');
    },

    showAddModal(item = null, type = 'event') {
        const isEdit = item && item.id;
        
        let currentType = type;
        if (isEdit) {
            if (item.title !== undefined) currentType = item.isDeadline ? 'deadline' : 'event';
            else currentType = 'note';
        }

        const rawDate = (item && item.date) ? item.date : new Date().toISOString();
        const dateVal = rawDate.split('T')[0];
        
        let endDateVal = dateVal;
        if (isEdit && item.endDate) {
            endDateVal = item.endDate.split('T')[0];
        }

        const timeVal = (isEdit && rawDate.includes('T')) ? rawDate.split('T')[1].slice(0,5) : '09:00';

        const isMultiDay = (dateVal !== endDateVal) || (isEdit && (item.duration || 0) >= 1440);
        const hideIfMulti = isMultiDay ? 'hidden' : '';
        const showIfMulti = isMultiDay ? '' : 'hidden';

        const vars = { isEdit, currentType, item, dateVal, endDateVal, timeVal, isMultiDay, hideIfMulti, showIfMulti };
        const modalHTML = this.isMobile() ? this._getMobileModalHTML(vars) : this._getDesktopModalHTML(vars);

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // ------------------------------------------------------------
    // TEMPLATE MOBILE: BOTTOM SHEET COMPATTO (CON ANIMAZIONE NATIVA 🚀)
    // ------------------------------------------------------------
    _getMobileModalHTML(v) {
        // Script magico per chiudere il modale con animazione fluida verso il basso
        const closeScript = "const m = document.getElementById('taskModal'); if(m){ const s = m.querySelector('.animate-sheetSlideUp'); if(s) s.style.animation = 'sheetSlideDown 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'; m.style.animation = 'sheetFadeOut 0.3s ease-out forwards'; setTimeout(() => m.remove(), 280); }";
        
        return `
            <style>
                @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes sheetSlideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
                @keyframes sheetFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sheetFadeOut { from { opacity: 1; } to { opacity: 0; } }
                .animate-sheetSlideUp { animation: sheetSlideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; will-change: transform; }
                .animate-sheetFadeIn { animation: sheetFadeIn 0.3s ease-out forwards; }
            </style>

            <div id="taskModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-[110] animate-sheetFadeIn" onclick="${closeScript}">
                
                <div onclick="event.stopPropagation()" class="bg-slate-900 border-t border-slate-700/50 w-full rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] animate-sheetSlideUp pb-4">
                    
                    <div class="w-full flex justify-center pt-3 pb-1 bg-slate-900 cursor-pointer" onclick="${closeScript}">
                        <div class="w-12 h-1.5 bg-slate-700 rounded-full"></div>
                    </div>

                    <div class="px-5 py-2 border-b border-white/5 flex justify-between items-center bg-slate-900 sticky top-0 z-10 shrink-0">
                        <h3 class="text-lg font-black text-white tracking-tight">
                            ${v.isEdit ? 'Modifica' : 'Nuovo Inserimento'}
                        </h3>
                        <button type="button" onclick="${closeScript}" class="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
                    </div>

                    <div class="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
                        
                        <div class="flex p-1 bg-slate-950/50 rounded-xl border border-slate-700/50">
                            <button onclick="${v.isEdit ? '' : "Agenda.switchModalTab('event')"}" ${v.isEdit ? 'disabled' : ''} id="tab-btn-event" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${v.currentType === 'event' ? 'bg-indigo-600 text-white shadow-md' : v.isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-500'}">🗓️ Evento</button>
                            <button onclick="${v.isEdit ? '' : "Agenda.switchModalTab('deadline')"}" ${v.isEdit ? 'disabled' : ''} id="tab-btn-deadline" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${v.currentType === 'deadline' ? 'bg-rose-600 text-white shadow-md' : v.isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-500'}">🎯 Scad.</button>
                            <button onclick="${v.isEdit ? '' : "Agenda.switchModalTab('note')"}" ${v.isEdit ? 'disabled' : ''} id="tab-btn-note" class="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${v.currentType === 'note' ? 'bg-amber-500 text-black shadow-md' : v.isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-500'}">✨ Nota</button>
                        </div>

                        <form id="form-event" class="${v.currentType === 'event' ? '' : 'hidden'} space-y-3" onsubmit="Agenda.handleEventSubmit(event, ${v.isEdit ? `'${v.item.id}'` : 'null'})">
                            <div class="space-y-1">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo Evento</label>
                                <input type="text" id="evtTitle" required value="${v.isEdit && v.currentType === 'event' ? v.item.title : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-indigo-500 placeholder-slate-600" placeholder="Es. Riunione">
                            </div>

                            <div class="bg-slate-800/30 p-2.5 rounded-xl border border-white/5 flex items-center justify-between group cursor-pointer" onclick="document.getElementById('evtIsMultiDay').click()">
                                <span class="text-[11px] font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                                    <span class="text-sm">📅</span> Multigiorno
                                </span>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="evtIsMultiDay" class="sr-only peer" ${v.isMultiDay ? 'checked' : ''} onchange="Agenda.toggleMultiDayUI()">
                                    <div class="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                                <div class="space-y-1">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inizio</label>
                                    <input type="date" id="evtDate" required value="${v.dateVal}" onchange="if(!document.getElementById('evtIsMultiDay').checked) document.getElementById('evtEndDate').value = this.value" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                                <div id="divEndDate" class="space-y-1 ${v.showIfMulti}">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fine</label>
                                    <input type="date" id="evtEndDate" value="${v.endDateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                                <div id="divTime" class="space-y-1 ${v.hideIfMulti}">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ora</label>
                                    <input type="time" id="evtTime" value="${v.timeVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-2">
                                <div id="divDuration" class="space-y-1 ${v.hideIfMulti}">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Durata</label>
                                    <select id="evtDuration" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-bold focus:border-indigo-500 outline-none">
                                        <option value="15" ${v.isEdit && v.item.duration == 15 ? 'selected' : ''}>15 min</option>
                                        <option value="30" ${v.isEdit && v.item.duration == 30 ? 'selected' : ''}>30 min</option>
                                        <option value="45" ${v.isEdit && v.item.duration == 45 ? 'selected' : ''}>45 min</option>
                                        <option value="60" ${(!v.isEdit || v.item.duration == 60) ? 'selected' : ''}>1 ora</option>
                                        <option value="90" ${v.isEdit && v.item.duration == 90 ? 'selected' : ''}>1.5 ore</option>
                                        <option value="120" ${v.isEdit && v.item.duration == 120 ? 'selected' : ''}>2 ore</option>
                                    </select>
                                </div>
                                <div class="space-y-1 col-span-2 md:col-span-1">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ripetizione</label>
                                    <select id="evtRecurrence" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-bold focus:border-indigo-500 outline-none">
                                        <option value="none" ${v.isEdit && v.item.recurrence === 'none' ? 'selected' : ''}>Nessuna</option>
                                        <option value="daily" ${v.isEdit && v.item.recurrence === 'daily' ? 'selected' : ''}>Ogni Giorno</option>
                                        <option value="weekly" ${v.isEdit && v.item.recurrence === 'weekly' ? 'selected' : ''}>Ogni Sett.</option>
                                        <option value="monthly" ${v.isEdit && v.item.recurrence === 'monthly' ? 'selected' : ''}>Ogni Mese</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo 📍</label>
                                <input type="text" id="evtLocation" value="${v.isEdit && v.currentType === 'event' ? (v.item.location || '') : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-indigo-500">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dettagli</label>
                                <textarea id="evtDesc" rows="2" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-indigo-500">${v.isEdit && v.currentType === 'event' ? (v.item.description || '') : ''}</textarea>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priorità</label>
                                <div class="grid grid-cols-3 gap-2">
                                    ${['high', 'medium', 'low'].map(p => `
                                        <label class="cursor-pointer group">
                                            <input type="radio" name="priority" value="${p}" ${v.currentType === 'event' && v.isEdit && v.item.priority === p ? 'checked' : p === 'medium' ? 'checked' : ''} class="peer sr-only">
                                            <div class="py-1.5 border border-slate-700 rounded-lg text-center text-[8px] font-black uppercase tracking-widest text-slate-500 peer-checked:border-slate-400 peer-checked:bg-slate-800 peer-checked:text-white flex flex-col items-center gap-0.5">
                                                <span class="text-xs">${p === 'high' ? '🔴' : p === 'medium' ? '🟠' : '🔵'}</span>
                                                <span class="opacity-80">${p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Bassa'}</span>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <button type="submit" class="w-full py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 mt-2 text-xs">
                                ${v.isEdit ? 'Salva' : 'Crea'}
                            </button>
                        </form>

                        <form id="form-deadline" class="${v.currentType === 'deadline' ? '' : 'hidden'} space-y-3" onsubmit="Agenda.handleDeadlineSubmit(event, ${v.isEdit ? `'${v.item.id}'` : 'null'})">
                            <div class="space-y-1 mt-2">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo Scadenza</label>
                                <input type="text" id="dlTitle" required value="${v.isEdit && v.currentType === 'deadline' ? v.item.title : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-rose-500">
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="space-y-1">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giorno</label>
                                    <input type="date" id="dlDate" required value="${v.dateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-bold focus:border-rose-500">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo</label>
                                    <input type="text" id="dlLocation" value="${v.isEdit && v.currentType === 'deadline' ? (v.item.location || '') : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-2 py-2 text-white text-[11px] font-medium focus:border-rose-500">
                                </div>
                            </div>
                            <button type="submit" class="w-full py-3 bg-rose-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 mt-4 text-xs">
                                ${v.isEdit ? 'Salva Scadenza' : 'Crea Scadenza'}
                            </button>
                        </form>

                        <form id="form-note" class="${v.currentType === 'note' ? '' : 'hidden'} space-y-3" onsubmit="Agenda.handleNoteSubmit(event, ${v.isEdit && v.currentType === 'note' ? `'${v.item.id}'` : 'null'})">
                            <div class="space-y-1 mt-2">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input type="date" id="noteDate" required value="${v.dateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-[11px] font-bold focus:border-amber-500">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contenuto</label>
                                <textarea id="noteContent" required rows="4" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500">${v.isEdit && v.currentType === 'note' ? (v.item.content || '') : ''}</textarea>
                            </div>
                            <button type="submit" class="w-full py-3 bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 mt-4 text-xs">
                                ${v.isEdit ? 'Salva Nota' : 'Crea Nota'}
                            </button>
                        </form>

                        ${v.isEdit ? `
                        <div class="pt-2 border-t border-white/5 text-center pb-2">
                            <button type="button" onclick="Agenda.deleteItem('${v.item.id}', '${v.currentType}')" class="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 p-2">
                                Elimina Elemento
                            </button>
                        </div>` : ''}

                    </div>
                </div>
            </div>`;
    },

    // ------------------------------------------------------------
    // TEMPLATE DESKTOP: MODALE SPAZIOSO E CENTRATO
    // ------------------------------------------------------------
    _getDesktopModalHTML(v) {
        return `
            <div id="taskModal" class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700/50 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
                    
                    <div class="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 sticky top-0 z-10 shrink-0">
                        <h3 class="text-2xl font-black text-white tracking-tight">
                            ${v.isEdit ? 'Modifica Elemento' : 'Nuovo Inserimento'}
                        </h3>
                        <button onclick="document.getElementById('taskModal').remove()" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
                    </div>

                    <div class="p-8 overflow-y-auto custom-scrollbar space-y-6">
                        
                        <div class="flex p-1.5 bg-slate-950/50 rounded-xl border border-slate-700/50">
                            <button onclick="${v.isEdit ? '' : "Agenda.switchModalTab('event')"}" ${v.isEdit ? 'disabled' : ''} id="tab-btn-event" class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${v.currentType === 'event' ? 'bg-indigo-600 text-white shadow-lg' : v.isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}">🗓️ Evento</button>
                            <button onclick="${v.isEdit ? '' : "Agenda.switchModalTab('deadline')"}" ${v.isEdit ? 'disabled' : ''} id="tab-btn-deadline" class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${v.currentType === 'deadline' ? 'bg-rose-600 text-white shadow-lg' : v.isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}">🎯 Scadenza</button>
                            <button onclick="${v.isEdit ? '' : "Agenda.switchModalTab('note')"}" ${v.isEdit ? 'disabled' : ''} id="tab-btn-note" class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${v.currentType === 'note' ? 'bg-amber-500 text-black shadow-lg' : v.isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}">✨ Nota</button>
                        </div>

                        <form id="form-event" class="${v.currentType === 'event' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleEventSubmit(event, ${v.isEdit ? `'${v.item.id}'` : 'null'})">
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo Evento</label>
                                <input type="text" id="evtTitle" required value="${v.isEdit && v.currentType === 'event' ? v.item.title : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600" placeholder="Es. Riunione">
                            </div>

                            <div class="bg-slate-800/30 p-4 rounded-xl border border-white/5 flex items-center justify-between group cursor-pointer" onclick="document.getElementById('evtIsMultiDay').click()">
                                <span class="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                    <span class="text-xl">📅</span> Evento Multigiorno
                                </span>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="evtIsMultiDay" class="sr-only peer" ${v.isMultiDay ? 'checked' : ''} onchange="Agenda.toggleMultiDayUI()">
                                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inizio</label>
                                    <input type="date" id="evtDate" required value="${v.dateVal}" onchange="if(!document.getElementById('evtIsMultiDay').checked) document.getElementById('evtEndDate').value = this.value" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                                <div id="divEndDate" class="space-y-1 ${v.showIfMulti}">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fine</label>
                                    <input type="date" id="evtEndDate" value="${v.endDateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                                <div id="divTime" class="space-y-1 ${v.hideIfMulti}">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ora</label>
                                    <input type="time" id="evtTime" value="${v.timeVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div id="divDuration" class="space-y-1 ${v.hideIfMulti}">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Durata</label>
                                    <select id="evtDuration" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-indigo-500 outline-none">
                                        <option value="15" ${v.isEdit && v.item.duration == 15 ? 'selected' : ''}>15 min</option>
                                        <option value="30" ${v.isEdit && v.item.duration == 30 ? 'selected' : ''}>30 min</option>
                                        <option value="45" ${v.isEdit && v.item.duration == 45 ? 'selected' : ''}>45 min</option>
                                        <option value="60" ${(!v.isEdit || v.item.duration == 60) ? 'selected' : ''}>1 ora</option>
                                        <option value="90" ${v.isEdit && v.item.duration == 90 ? 'selected' : ''}>1.5 ore</option>
                                        <option value="120" ${v.isEdit && v.item.duration == 120 ? 'selected' : ''}>2 ore</option>
                                    </select>
                                </div>
                                <div class="space-y-1 col-span-2 md:col-span-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ripetizione</label>
                                    <select id="evtRecurrence" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-indigo-500 outline-none">
                                        <option value="none" ${v.isEdit && v.item.recurrence === 'none' ? 'selected' : ''}>Singolo</option>
                                        <option value="daily" ${v.isEdit && v.item.recurrence === 'daily' ? 'selected' : ''}>Ogni Giorno</option>
                                        <option value="weekly" ${v.isEdit && v.item.recurrence === 'weekly' ? 'selected' : ''}>Ogni Settimana</option>
                                        <option value="monthly" ${v.isEdit && v.item.recurrence === 'monthly' ? 'selected' : ''}>Ogni Mese</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo 📍</label>
                                <input type="text" id="evtLocation" value="${v.isEdit && v.currentType === 'event' ? (v.item.location || '') : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-indigo-500">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dettagli</label>
                                <textarea id="evtDesc" rows="3" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500">${v.isEdit && v.currentType === 'event' ? (v.item.description || '') : ''}</textarea>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priorità</label>
                                <div class="grid grid-cols-3 gap-3">
                                    ${['high', 'medium', 'low'].map(p => `
                                        <label class="cursor-pointer group">
                                            <input type="radio" name="priority" value="${p}" ${v.currentType === 'event' && v.isEdit && v.item.priority === p ? 'checked' : p === 'medium' ? 'checked' : ''} class="peer sr-only">
                                            <div class="py-3 border-2 border-slate-700 rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-slate-500 peer-checked:border-slate-500 peer-checked:bg-slate-800 peer-checked:text-white transition-all group-hover:border-slate-600 flex flex-col items-center gap-1">
                                                <span class="text-sm">${p === 'high' ? '🔴' : p === 'medium' ? '🟠' : '🔵'}</span>
                                                <span class="opacity-80">${p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Bassa'}</span>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 mt-2">
                                ${v.isEdit ? 'Salva Evento' : 'Crea Evento'}
                            </button>
                        </form>

                        <form id="form-deadline" class="${v.currentType === 'deadline' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleDeadlineSubmit(event, ${v.isEdit ? `'${v.item.id}'` : 'null'})">
                            <div class="space-y-1 mt-2">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo Scadenza</label>
                                <input type="text" id="dlTitle" required value="${v.isEdit && v.currentType === 'deadline' ? v.item.title : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-rose-500">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giorno</label>
                                    <input type="date" id="dlDate" required value="${v.dateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-rose-500">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo</label>
                                    <input type="text" id="dlLocation" value="${v.isEdit && v.currentType === 'deadline' ? (v.item.location || '') : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm font-medium focus:border-rose-500">
                                </div>
                            </div>
                            <button type="submit" class="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 mt-4">
                                ${v.isEdit ? 'Salva Scadenza' : 'Crea Scadenza'}
                            </button>
                        </form>

                        <form id="form-note" class="${v.currentType === 'note' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleNoteSubmit(event, ${v.isEdit && v.currentType === 'note' ? `'${v.item.id}'` : 'null'})">
                            <div class="space-y-1 mt-2">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input type="date" id="noteDate" required value="${v.dateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-3 text-white text-sm font-bold focus:border-amber-500">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contenuto</label>
                                <textarea id="noteContent" required rows="6" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500">${v.isEdit && v.currentType === 'note' ? (v.item.content || '') : ''}</textarea>
                            </div>
                            <button type="submit" class="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 mt-4">
                                ${v.isEdit ? 'Salva Nota' : 'Crea Nota'}
                            </button>
                        </form>

                        ${v.isEdit ? `
                        <div class="pt-4 border-t border-white/5 text-center pb-2">
                            <button type="button" onclick="Agenda.deleteItem('${v.item.id}', '${v.currentType}')" class="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors">
                                Elimina Elemento
                            </button>
                        </div>` : ''}

                    </div>
                </div>
            </div>`;
    },

    showAddModalWithDate(dateStr, timeStr = '09:00') {
        this.showAddModal(null, 'event');
        setTimeout(() => {
            if(document.getElementById('evtDate')) document.getElementById('evtDate').value = dateStr;
            if(document.getElementById('evtEndDate')) document.getElementById('evtEndDate').value = dateStr;
            if(document.getElementById('evtTime')) document.getElementById('evtTime').value = timeStr;
            if(document.getElementById('dlDate')) document.getElementById('dlDate').value = dateStr;
            if(document.getElementById('noteDate')) document.getElementById('noteDate').value = dateStr;
        }, 50);
    },

    // ------------------------------------------------------------
    // HELPER TABS DINAMICO
    // ------------------------------------------------------------
    switchModalTab(type) {
        document.getElementById('form-event').classList.toggle('hidden', type !== 'event');
        document.getElementById('form-deadline').classList.toggle('hidden', type !== 'deadline');
        document.getElementById('form-note').classList.toggle('hidden', type !== 'note');
        
        const btnEvent = document.getElementById('tab-btn-event');
        const btnDeadline = document.getElementById('tab-btn-deadline');
        const btnNote = document.getElementById('tab-btn-note');
        
        // Rimuove tutti i colori attivi dai bottoni
        [btnEvent, btnDeadline, btnNote].forEach(btn => {
            btn.classList.remove('bg-indigo-600', 'bg-rose-600', 'bg-amber-500', 'text-white', 'text-black', 'shadow-md', 'shadow-lg');
            btn.classList.add('text-slate-500');
            if(!this.isMobile()) btn.classList.add('text-slate-400');
        });

        // Applica i colori attivi
        if (type === 'event') {
            btnEvent.classList.remove('text-slate-500', 'text-slate-400');
            btnEvent.classList.add('bg-indigo-600', 'text-white', this.isMobile() ? 'shadow-md' : 'shadow-lg');
        } else if (type === 'deadline') {
            btnDeadline.classList.remove('text-slate-500', 'text-slate-400');
            btnDeadline.classList.add('bg-rose-600', 'text-white', this.isMobile() ? 'shadow-md' : 'shadow-lg');
        } else if (type === 'note') {
            btnNote.classList.remove('text-slate-500', 'text-slate-400');
            btnNote.classList.add('bg-amber-500', 'text-black', this.isMobile() ? 'shadow-md' : 'shadow-lg');
        }
    },

    // --- LOGICA SOVRAPPOSIZIONE EVENTI ---
    checkOverlap(newEvent, excludeId = null) {
        if (newEvent.isDeadline) return []; 
        const newStart = new Date(newEvent.date);
        const duration = parseInt(newEvent.duration) || 60;
        const newEnd = new Date(newStart.getTime() + duration * 60000);

        return this.tasks.filter(t => {
            if (excludeId && t.id === excludeId) return false;
            if (t.completed || t.isDeadline) return false; 
            const tStart = new Date(t.date);
            const tDuration = t.duration || 60;
            const tEnd = new Date(tStart.getTime() + tDuration * 60000);
            return newStart < tEnd && newEnd > tStart;
        });
    },

    // --- SUBMIT HANDLERS ---
    
    async handleDeadlineSubmit(e, id) {
        e.preventDefault();
        
        const dateStr = document.getElementById('dlDate').value;
        const fullDate = `${dateStr}T09:00:00`; 

        const data = {
            title: document.getElementById('dlTitle').value,
            date: fullDate,
            endDate: fullDate, 
            location: document.getElementById('dlLocation').value,
            duration: 60, 
            description: 'Scadenza',
            priority: 'high', 
            isDeadline: true, 
            completed: false
        };

        if(id) await window.CachedCRUD.updateTask(id, data);
        else await window.CachedCRUD.createTask(data);
        
        this._afterSubmit();
    },

    async _handleRecurrence(baseData, startStr, endStr, timeStr, recurrence) {
        const eventsToCreate = [];
        const limitDate = new Date(startStr);
        limitDate.setFullYear(limitDate.getFullYear() + 1);

        let currentDate = new Date(startStr);
        let loopCount = 0;
        const maxLoops = 100; 

        while (currentDate <= limitDate && loopCount < maxLoops) {
            const isoDate = this._iso(currentDate);
            const taskDate = `${isoDate}T${timeStr}:00`;
            const dayDiff = (new Date(endStr) - new Date(startStr));
            const taskEndDateObj = new Date(currentDate.getTime() + dayDiff);
            const taskEndDate = `${this._iso(taskEndDateObj)}T${timeStr}:00`;

            eventsToCreate.push({
                ...baseData,
                date: taskDate,
                endDate: taskEndDate
            });

            if (recurrence === 'daily') currentDate.setDate(currentDate.getDate() + 1);
            if (recurrence === 'weekly') currentDate.setDate(currentDate.getDate() + 7);
            if (recurrence === 'monthly') currentDate.setMonth(currentDate.getMonth() + 1);
            loopCount++;
        }

        if (confirm(`Verranno creati ${eventsToCreate.length} eventi ricorrenti. Procedere?`)) {
            for (const evt of eventsToCreate) {
                await window.CachedCRUD.createTask(evt);
            }
        }
    },

    async handleNoteSubmit(e, id) {
        e.preventDefault();
        const data = {
            date: document.getElementById('noteDate').value,
            content: document.getElementById('noteContent').value
        };

        if(id) await window.CachedCRUD.updateNote(id, data.content); 
        else await window.CachedCRUD.createNote(data);

        this._afterSubmit();
    },

    async deleteItem(id, type) {
        if(!confirm('Eliminare definitivamente?')) return;
        if (type === 'note') await window.CachedCRUD.deleteNote(id);
        else await window.CachedCRUD.deleteTask(id);
        this._afterSubmit();
    },

    async _afterSubmit() {
        const modal = document.getElementById('taskModal');
        if (modal) modal.remove();
        
        await this.loadData(); 
        
        this.updateView();

        if (window.EventBus) {
            EventBus.emit('dataChanged'); 
            EventBus.emit('agendaDataLoaded', { tasks: this.tasks, notes: this.notes });
        }
        
        if (window.ModuleManager && ModuleManager.renderWidgets) {
            ModuleManager.renderWidgets();
        }

        if(window.Helpers) Helpers.showToast('Salvataggio completato');
    },

    // --- EXTERNAL EVENTS ---
    async _loadExternalEvents() {
        if (!window.AgendaBridge || AgendaBridge.getRegisteredModules().length === 0) {
            this.externalEvents = [];
            return;
        }
        const d = this.currentDate;
        const iso = (dt) => dt.toISOString().split('T')[0];
        let from, to;
        if (this.currentView === 'day') {
            from = to = iso(d);
        } else if (this.currentView === 'week') {
            const dow = d.getDay();
            const start = new Date(d); start.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
            const end = new Date(start); end.setDate(start.getDate() + 6);
            from = iso(start); to = iso(end);
        } else if (this.currentView === 'year') {
            this.externalEvents = []; return;
        } else {
            from = iso(new Date(d.getFullYear(), d.getMonth(), 1));
            to   = iso(new Date(d.getFullYear(), d.getMonth() + 1, 0));
        }
        this.externalEvents = await AgendaBridge.getEvents(from, to);
    },

    // --- DISPLAY SETTINGS PANEL ---
    toggleDisplaySettings() {
        const panel = document.getElementById('agenda-display-settings');
        if (!panel) return;
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) this._renderDisplaySettings(panel);
    },

    _renderDisplaySettings(panel) {
        if (!window.AgendaBridge) { panel.innerHTML = '<p class="text-slate-500 text-sm p-4">Nessun modulo registrato.</p>'; return; }
        const modules = AgendaBridge.getRegisteredModules()
            .filter(m => !window.ModuleManager || ModuleManager.isActive(m.id));
        if (modules.length === 0) { panel.innerHTML = '<p class="text-slate-500 text-sm p-4">Nessun modulo attivo.</p>'; return; }

        panel.innerHTML = `
            <div class="p-4 border-b border-slate-700">
                <p class="text-xs font-black uppercase tracking-widest text-slate-400">Mostra nell'agenda</p>
            </div>
            <div class="p-3 space-y-1">
                ${modules.map(mod => {
                    const on = AgendaBridge.isVisible(mod.id);
                    return `
                    <label class="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                        <span class="flex items-center gap-2 text-sm font-semibold text-slate-300">
                            <span>${mod.icon}</span> ${mod.label}
                        </span>
                        <div onclick="Agenda._saveDisplaySetting('${mod.id}', ${!on})"
                             class="relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-indigo-500' : 'bg-slate-600'}">
                            <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}"></div>
                        </div>
                    </label>`
                }).join('')}
            </div>
        `;
    },

    _saveDisplaySetting(moduleId, visible) {
        if (window.AgendaBridge) AgendaBridge.saveSetting(moduleId, visible);
        this.updateView();
    },

    // --- NAVIGATION ---
    setView(v) { this.currentView = v; this.updateView(); },
    changePeriod(dir) {
        if (this.currentView === 'week') this.currentDate.setDate(this.currentDate.getDate() + (dir * 7));
        else if (this.currentView === 'day') this.currentDate.setDate(this.currentDate.getDate() + dir);
        else if (this.currentView === 'year') this.currentDate.setFullYear(this.currentDate.getFullYear() + dir);
        else this.currentDate.setMonth(this.currentDate.getMonth() + dir);
        this.updateView();
    },
    goToToday() { this.currentDate = new Date(); this.updateView(); },
    getPeriodLabel() {
        if (this.currentView === 'year') return this.currentDate.getFullYear();
        if (this.currentView === 'day') return this.currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'short' });
        if (this.currentView === 'week') {
            const d = new Date(this.currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const start = new Date(d.setDate(diff));
            const end = new Date(start); end.setDate(end.getDate() + 6);
            return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('it-IT', { month: 'short' })}`;
        }
        return this.currentDate.toLocaleDateString('it-IT', { year: 'numeric', month: 'long' });
    },
    _iso(date) { return date.toISOString().split('T')[0]; },
    editTask(id) { const t = this.tasks.find(x => x.id === id); if(t) this.showAddModal(t, 'event'); },
    editNote(id) { const n = this.notes.find(x => x.id === id); if(n) this.showAddModal(n, 'note'); },
    async toggleTask(id) {
        await window.CachedCRUD.toggleTaskCompleted(id);
        await this.loadData();
        this.updateView();
    }
};

window.Agenda = Agenda;

if (window.ModuleManager) {
    ModuleManager.register({
        id: 'agenda',
        name: 'Agenda',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        order: 1,
        category: 'main',
        isCore: true,
        init: () => Agenda.init(),
        render: () => Agenda.render(),
        widgets: window.AgendaWidgets ? AgendaWidgets.getDefinitions() : []
    });
}