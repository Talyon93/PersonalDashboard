/**
 * Agenda Component - CORE CONTROLLER
 * Gestisce: Stato, CRUD, Modali, Orchestrazione.
 * AGGIORNAMENTO: Tab dedicata per SCADENZE e gestione form semplificata.
 */

const Agenda = {
    currentDate: new Date(),
    currentView: 'month',
    showCompleted: false,
    
    tasks: [], 
    notes: [],
    
    isInitialized: false,

    config: {
        startHour: 6,
        endHour: 23,
        showCompleted: false
    },

    async init() {
        await this.loadData();
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
                <div class="mb-8 animate-fadeIn">
                    <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                        <div>
                            <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-400 bg-clip-text text-transparent italic">Agenda Pro</h2>
                            <p class="text-slate-400 mt-2 font-medium flex items-center gap-2 text-lg">
                                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Pianificazione & Note
                            </p>
                        </div>
                        <div id="agenda-top-controls" class="flex flex-wrap gap-3"></div>
                    </div>
                </div>
                <div id="agenda-period-selector" class="flex justify-center mb-8"></div>
                <div id="agenda-main-container" class="animate-slideUp min-h-[600px] relative"></div>
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

        const main = document.getElementById('agenda-main-container');
        if (main && window.AgendaViews) {
            let html = '';
            switch (this.currentView) {
                case 'day': html = AgendaViews.renderDay(this.tasks, this.notes, this.currentDate, this.config); break;
                case 'week': html = AgendaViews.renderWeek(this.tasks, this.notes, this.currentDate, this.config); break;
                case 'month': html = AgendaViews.renderMonth(this.tasks, this.notes, this.currentDate, this.config); break;
                case 'year': html = AgendaViews.renderYear(this.tasks, this.notes, this.currentDate); break;
                case 'list': html = AgendaViews.renderList(this.tasks, this.notes, this.currentDate, this.config); break;
                default: html = AgendaViews.renderMonth(this.tasks, this.notes, this.currentDate, this.config);
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
        const controls = document.getElementById('agenda-top-controls');
        if (!controls) return;
        
        const views = [
            { id: 'day', label: 'Giorno' },
            { id: 'week', label: 'Settimana' },
            { id: 'month', label: 'Mese' },
            { id: 'year', label: 'Anno' },
            { id: 'list', label: 'Lista' }
        ];

        controls.innerHTML = `
            <div class="bg-slate-800/40 backdrop-blur-xl p-1 rounded-2xl border border-slate-700/50 flex shadow-xl mr-2">
                ${views.map(v => `
                    <button onclick="Agenda.setView('${v.id}')" 
                            class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all 
                            ${this.currentView === v.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
                        ${v.label}
                    </button>
                `).join('')}
            </div>
            
            <div class="flex gap-2">
                <button onclick="document.getElementById('gcal-import-input').click()" 
                        class="px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded-2xl transition-all text-sm font-bold flex items-center gap-2"
                        title="Importa file .ics da Google Calendar">
                    <span>📥</span> <span class="hidden sm:inline">Importa</span>
                </button>
                <button onclick="Agenda.showAddModal()" class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl rounded-2xl transition-all hover:scale-105 active:scale-95 text-sm font-bold">➕ Nuovo</button>
            </div>
        `;
    },

    _renderPeriodSelector() {
        const selector = document.getElementById('agenda-period-selector');
        if (!selector) return;

        selector.innerHTML = `
            <div class="inline-flex items-center gap-4 bg-slate-800/50 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-2xl">
                <button onclick="Agenda.changePeriod(-1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">←</button>
                <h3 class="text-xl font-bold text-white px-6 min-w-[220px] text-center capitalize tracking-tight select-none">${this.getPeriodLabel()}</h3>
                <button onclick="Agenda.changePeriod(1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">→</button>
                <div class="w-px h-6 bg-slate-700/50 mx-1"></div>
                <button onclick="Agenda.goToToday()" title="Vai a Oggi" class="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                    <span class="text-[10px] font-black uppercase">Oggi</span>
                </button>
            </div>
        `;
    },


    // Aggiungi queste funzioni dentro l'oggetto Agenda:

    toggleMultiDayUI() {
        const isMulti = document.getElementById('evtIsMultiDay').checked;
        const containerTime = document.getElementById('container-time-config');
        const containerEndDate = document.getElementById('container-end-date');
        const containerRecur = document.getElementById('container-recurrence'); // <--- NUOVO
        
        if (isMulti) {
            containerTime.style.display = 'none';        // Nascondi Orario
            containerEndDate.classList.remove('hidden'); // Mostra Data Fine
            containerRecur.classList.add('hidden');      // Nascondi Ripetizione
            
            document.getElementById('evtRecurrence').value = 'none';
        } else {
            containerTime.style.display = 'grid';        // Mostra Orario
            containerEndDate.classList.add('hidden');    // Nascondi Data Fine
            containerRecur.classList.remove('hidden');   // Mostra Ripetizione
            
            // Resetta la data fine uguale a inizio per evitare incongruenze
            const startDate = document.getElementById('evtDate').value;
            if(startDate) document.getElementById('evtEndDate').value = startDate;
        }
    },

    async handleEventSubmit(e, id) {
        e.preventDefault();
        
        // 1. Riferimenti DOM
        const startDateInput = document.getElementById('evtDate');
        const endDateInput = document.getElementById('evtEndDate'); // Questo ha il valore "13/02" errato
        const multiSwitch = document.getElementById('evtIsMultiDay');
        const startTimeInput = document.getElementById('evtTime');
        
        // 2. Valori
        const startDateStr = startDateInput.value; // "2026-02-14"
        const isMultiDay = multiSwitch ? multiSwitch.checked : false;
        
        // --- IL FIX CHE RISOLVE IL TUO SCREENSHOT ---
        // Se il toggle è SPENTO, ignoriamo totalmente il campo endDateInput (che dice 13/02).
        // Forziamo la data di fine ad essere uguale all'inizio (14/02).
        let endDateStr;
        
        if (isMultiDay) {
            endDateStr = endDateInput.value;
        } else {
            endDateStr = startDateStr; // <--- FORZATURA BRUTALE: Ora Fine = 14/02
        }
        // --------------------------------------------

        const durationInput = document.getElementById('evtDuration').value;
        const startTimeStr = startTimeInput.value;

        // 3. Calcolo Date ISO per il Database
        let duration = 60;
        let fullStartDate, fullEndDate;

        if (isMultiDay) {
            // Multigiorno standardizzato alle 09:00
            fullStartDate = `${startDateStr}T09:00:00`;
            fullEndDate = `${endDateStr}T09:00:00`;
            duration = 1440;
        } else {
            // Singolo Giorno
            if (durationInput === 'all') duration = 1440; 
            else duration = parseInt(durationInput);

            fullStartDate = `${startDateStr}T${startTimeStr}:00`;
            // Anche la data fine DEVE partire dallo stesso giorno dell'inizio
            fullEndDate = `${startDateStr}T${startTimeStr}:00`; 
        }

        // 4. Payload
        const baseData = {
            title: document.getElementById('evtTitle').value,
            date: fullStartDate,     // Sarà 14/02
            endDate: fullEndDate,    // Sarà 14/02 (NON PIÙ 13/02)
            location: document.getElementById('evtLocation').value,
            duration: duration,
            description: document.getElementById('evtDesc').value,
            priority: document.querySelector('input[name="priority"]:checked').value,
            isDeadline: false,
            completed: false
        };

        const recurrence = document.getElementById('evtRecurrence').value;

        // 5. Invio al Server
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
                Helpers.showToast(`${importedCount} Eventi importati!`);
            }
        } catch (err) { console.error(err); alert("Errore lettura file."); }
        input.value = '';
    },

    // ============================================================
    //  MODALS (EVENTO vs SCADENZA vs NOTA)
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
        
        // Se è edit usa la data fine reale, altrimenti allinea alla data inizio
        let endDateVal = dateVal;
        if (isEdit && item.endDate) {
            endDateVal = item.endDate.split('T')[0];
        }

        const timeVal = (isEdit && rawDate.includes('T')) ? rawDate.split('T')[1].slice(0,5) : '09:00';

        // Logica Multigiorno
        const isMultiDay = (dateVal !== endDateVal) || (isEdit && (item.duration || 0) >= 1440);
        const hideIfMulti = isMultiDay ? 'hidden' : '';
        const showIfMulti = isMultiDay ? '' : 'hidden';

        const modalHTML = `
            <div id="taskModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700/50 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    
                    <div class="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                        <h3 class="text-xl font-black text-white tracking-tight">
                            ${isEdit ? 'Modifica' : 'Nuovo Inserimento'}
                        </h3>
                        <button onclick="document.getElementById('taskModal').remove()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">✕</button>
                    </div>

                    <div class="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        
                        <div class="flex p-1 bg-slate-950/50 rounded-xl border border-slate-700/50">
                            <button onclick="${isEdit ? '' : "Agenda.switchModalTab('event')"}" ${isEdit ? 'disabled' : ''} id="tab-btn-event" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentType === 'event' ? 'bg-indigo-600 text-white shadow-lg' : isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}">🗓️ Evento</button>
                            <button onclick="${isEdit ? '' : "Agenda.switchModalTab('deadline')"}" ${isEdit ? 'disabled' : ''} id="tab-btn-deadline" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentType === 'deadline' ? 'bg-rose-600 text-white shadow-lg' : isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}">🎯 Scadenza</button>
                            <button onclick="${isEdit ? '' : "Agenda.switchModalTab('note')"}" ${isEdit ? 'disabled' : ''} id="tab-btn-note" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentType === 'note' ? 'bg-amber-500 text-black shadow-lg' : isEdit ? 'text-slate-600 opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'}">✨ Nota</button>
                        </div>

                        <form id="form-event" class="${currentType === 'event' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleEventSubmit(event, ${isEdit ? `'${item.id}'` : 'null'})">
                            
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo Evento</label>
                                <input type="text" id="evtTitle" required value="${isEdit && currentType === 'event' ? item.title : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600" placeholder="Es. Riunione Marketing">
                            </div>

                            <div class="bg-slate-800/30 p-3 rounded-xl border border-white/5 flex items-center justify-between group cursor-pointer" onclick="document.getElementById('evtIsMultiDay').click()">
                                <span class="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                    <span class="text-lg">📅</span> Evento Multigiorno
                                </span>
                                <div class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="evtIsMultiDay" class="sr-only peer" ${isMultiDay ? 'checked' : ''} onchange="Agenda.toggleMultiDay()">
                                    <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inizio</label>
                                    <input type="date" id="evtDate" required value="${dateVal}" 
                                           onchange="if(!document.getElementById('evtIsMultiDay').checked) document.getElementById('evtEndDate').value = this.value"
                                           class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                                
                                <div id="divEndDate" class="space-y-1 ${showIfMulti}">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fine</label>
                                    <input type="date" id="evtEndDate" value="${endDateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none">
                                </div>

                                <div id="divTime" class="space-y-1 ${hideIfMulti}">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ora</label>
                                    <input type="time" id="evtTime" value="${timeVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div id="divDuration" class="space-y-1 ${hideIfMulti}">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Durata</label>
                                    <select id="evtDuration" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:border-indigo-500 outline-none appearance-none">
                                        <option value="15" ${isEdit && item.duration == 15 ? 'selected' : ''}>15 min</option>
                                        <option value="30" ${isEdit && item.duration == 30 ? 'selected' : ''}>30 min</option>
                                        <option value="45" ${isEdit && item.duration == 45 ? 'selected' : ''}>45 min</option>
                                        <option value="60" ${(!isEdit || item.duration == 60) ? 'selected' : ''}>1 ora</option>
                                        <option value="90" ${isEdit && item.duration == 90 ? 'selected' : ''}>1.5 ore</option>
                                        <option value="120" ${isEdit && item.duration == 120 ? 'selected' : ''}>2 ore</option>
                                    </select>
                                </div>
                                <div class="space-y-1 col-span-2">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ripetizione</label>
                                    <select id="evtRecurrence" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:border-indigo-500 outline-none appearance-none">
                                        <option value="none" ${isEdit && item.recurrence === 'none' ? 'selected' : ''}>Singolo (Nessuna ripetizione)</option>
                                        <option value="daily" ${isEdit && item.recurrence === 'daily' ? 'selected' : ''}>Ogni Giorno</option>
                                        <option value="weekly" ${isEdit && item.recurrence === 'weekly' ? 'selected' : ''}>Ogni Settimana</option>
                                        <option value="monthly" ${isEdit && item.recurrence === 'monthly' ? 'selected' : ''}>Ogni Mese</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo 📍</label>
                                <input type="text" id="evtLocation" value="${isEdit && currentType === 'event' ? (item.location || '') : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-indigo-500 placeholder-slate-600">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dettagli 📄</label>
                                <textarea id="evtDesc" rows="3" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-300 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-600">${isEdit && currentType === 'event' ? (item.description || '') : ''}</textarea>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Priorità</label>
                                <div class="grid grid-cols-3 gap-3">
                                    ${['high', 'medium', 'low'].map(p => `
                                        <label class="cursor-pointer group">
                                            <input type="radio" name="priority" value="${p}" ${currentType === 'event' && isEdit && item.priority === p ? 'checked' : p === 'medium' ? 'checked' : ''} class="peer sr-only">
                                            <div class="py-3 border-2 border-slate-700 rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-slate-500 peer-checked:border-slate-500 peer-checked:bg-slate-800 peer-checked:text-white transition-all group-hover:border-slate-600 flex flex-col items-center gap-1">
                                                <span class="text-sm">${p === 'high' ? '🔴' : p === 'medium' ? '🟠' : '🔵'}</span>
                                                <span class="opacity-80">${p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Bassa'}</span>
                                            </div>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98] mt-4">
                                ${isEdit ? 'Salva Evento' : 'Crea Evento'}
                            </button>
                        </form>

                        <form id="form-deadline" class="${currentType === 'deadline' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleDeadlineSubmit(event, ${isEdit ? `'${item.id}'` : 'null'})">
                             <div class="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-200 text-xs mb-4 flex items-center gap-3">
                                <span class="text-lg">⏳</span> 
                                <span>Le scadenze indicano un limite temporale improrogabile.</span>
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo Scadenza</label>
                                <input type="text" id="dlTitle" required value="${isEdit && currentType === 'deadline' ? item.title : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-rose-500 transition-colors placeholder-slate-600">
                            </div>
                             <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giorno Scadenza</label>
                                    <input type="date" id="dlDate" required value="${dateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:border-rose-500 focus:outline-none">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo (Opzionale)</label>
                                    <input type="text" id="dlLocation" value="${isEdit && currentType === 'deadline' ? (item.location || '') : ''}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-rose-500 placeholder-slate-600">
                                </div>
                            </div>
                            <button type="submit" class="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-rose-900/50 transition-all active:scale-[0.98]">
                                ${isEdit ? 'Salva Scadenza' : 'Crea Scadenza'}
                            </button>
                        </form>

                         <form id="form-note" class="${currentType === 'note' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleNoteSubmit(event, ${isEdit && currentType === 'note' ? `'${item.id}'` : 'null'})">
                            <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs mb-4 flex items-center gap-3">
                                <span class="text-lg">💡</span> 
                                <span>Appunti rapidi legati al giorno.</span>
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input type="date" id="noteDate" required value="${dateVal}" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:border-amber-500 focus:outline-none">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contenuto</label>
                                <textarea id="noteContent" required rows="6" class="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500 placeholder-slate-600 font-medium">${isEdit && currentType === 'note' ? (item.content || '') : ''}</textarea>
                            </div>
                            <button type="submit" class="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-900/50 transition-all active:scale-[0.98]">
                                ${isEdit ? 'Salva Nota' : 'Crea Nota'}
                            </button>
                        </form>

                        ${isEdit ? `
                        <div class="pt-4 border-t border-white/10 text-center">
                            <button type="button" onclick="Agenda.deleteItem('${item.id}', '${currentType}')" class="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 transition-colors">
                                Elimina Elemento
                            </button>
                        </div>` : ''}

                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
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

    switchModalTab(type) {
        document.getElementById('form-event').classList.toggle('hidden', type !== 'event');
        document.getElementById('form-deadline').classList.toggle('hidden', type !== 'deadline');
        document.getElementById('form-note').classList.toggle('hidden', type !== 'note');
        
        const btnEvent = document.getElementById('tab-btn-event');
        const btnDeadline = document.getElementById('tab-btn-deadline');
        const btnNote = document.getElementById('tab-btn-note');
        
        // Reset base style
        const baseStyle = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-white';
        btnEvent.className = baseStyle;
        btnDeadline.className = baseStyle;
        btnNote.className = baseStyle;

        // Active style
        if (type === 'event') btnEvent.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-indigo-600 text-white shadow-lg';
        if (type === 'deadline') btnDeadline.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-rose-600 text-white shadow-lg';
        if (type === 'note') btnNote.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-amber-500 text-black shadow-lg';
    },

    // --- LOGICA SOVRAPPOSIZIONE EVENTI ---
    checkOverlap(newEvent, excludeId = null) {
        if (newEvent.isDeadline) return []; // Le scadenze non confliggono
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
    
    // Handler per EVENTI (Standard)
    async handleEventSubmit(e, id) {
        e.preventDefault();
        
        const startDateStr = document.getElementById('evtDate').value;
        const startTimeStr = document.getElementById('evtTime').value;
        const endDateStr = document.getElementById('evtEndDate').value || startDateStr;
        const recurrence = document.getElementById('evtRecurrence').value;
        const durationInput = document.getElementById('evtDuration').value;

        let duration = 60;
        if (durationInput === 'all') duration = 1440; 
        else duration = parseInt(durationInput);

        const fullStartDate = `${startDateStr}T${startTimeStr}:00`;

        const baseData = {
            title: document.getElementById('evtTitle').value,
            date: fullStartDate,
            endDate: `${endDateStr}T${startTimeStr}:00`,
            location: document.getElementById('evtLocation').value,
            duration: duration,
            description: document.getElementById('evtDesc').value,
            priority: document.querySelector('input[name="priority"]:checked').value,
            isDeadline: false,
            completed: false
        };

        if (!id && recurrence !== 'none') {
            await this._handleRecurrence(baseData, startDateStr, endDateStr, startTimeStr, recurrence);
        } else {
            if(id) await window.CachedCRUD.updateTask(id, baseData);
            else await window.CachedCRUD.createTask(baseData);
        }
        
        this._afterSubmit();
    },

    // Handler per SCADENZE (Nuovo)
    async handleDeadlineSubmit(e, id) {
        e.preventDefault();
        
        const dateStr = document.getElementById('dlDate').value;
        // Le scadenze le fissiamo arbitrariamente alle 09:00 per averle in alto ma non "All day"
        const fullDate = `${dateStr}T09:00:00`; 

        const data = {
            title: document.getElementById('dlTitle').value,
            date: fullDate,
            endDate: fullDate, // Singolo giorno
            location: document.getElementById('dlLocation').value,
            duration: 60, // Fittizio
            description: 'Scadenza',
            priority: 'high', // Default alta
            isDeadline: true, // Flag chiave
            completed: false
        };

        if(id) await window.CachedCRUD.updateTask(id, data);
        else await window.CachedCRUD.createTask(data);
        
        this._afterSubmit();
    },

    // Logica Ricorrenza separata
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

        Helpers.showToast('Salvataggio completato');
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
        if (this.currentView === 'day') return this.currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
        if (this.currentView === 'week') {
            const d = new Date(this.currentDate);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const start = new Date(d.setDate(diff));
            const end = new Date(start); end.setDate(end.getDate() + 6);
            return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('it-IT', { month: 'long' })}`;
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