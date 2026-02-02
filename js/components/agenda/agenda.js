/**
 * Agenda Component - CORE CONTROLLER
 * Gestisce: Stato, CRUD, Modali, Orchestrazione.
 * Le Viste sono delegate ad 'agenda_views.js'.
 * I Widget sono in 'agenda_widgets.js'.
 * AGGIORNAMENTO: Supporto Importazione Google Calendar con Modale di Avanzamento
 */

const Agenda = {
    currentDate: new Date(),
    currentView: 'month',
    showCompleted: false,
    
    // Dati separati
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
            // Caricamento parallelo di Eventi e Note
            const [tasks, notes] = await Promise.all([
                window.CachedCRUD ? CachedCRUD.getTasks() : [],
                window.CachedCRUD ? CachedCRUD.getNotes() : []
            ]);
            
            this.tasks = tasks;
            this.notes = notes;
            
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
                
                <!-- Hidden Input per Import Google -->
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
        // Passiamo sia tasks che notes alle viste
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

    // --- NUOVO: GESTIONE IMPORTAZIONE GOOGLE CON MODALE ---
    async handleGoogleImport(input) {
        if (!input.files || input.files.length === 0) return;
        
        const file = input.files[0];
        if (!window.GoogleImporter) {
            alert("Modulo di importazione non caricato.");
            return;
        }

        try {
            const tasks = await GoogleImporter.parseFile(file);
            
            if (tasks.length === 0) {
                alert("Nessun evento valido trovato nel file.");
                input.value = ''; // Reset input
                return;
            }

            const confirmMsg = `Trovati ${tasks.length} eventi. Vuoi importarli nella tua agenda?`;
            if (confirm(confirmMsg)) {
                
                // Show Modal
                if (window.AgendaViews && AgendaViews.renderImportModal) {
                    document.body.insertAdjacentHTML('beforeend', AgendaViews.renderImportModal());
                }

                const progressBar = document.getElementById('import-progress-bar');
                const statusText = document.getElementById('import-status-text');
                const countText = document.getElementById('import-count-text');
                
                let importedCount = 0;
                const total = tasks.length;

                // Process
                for (let i = 0; i < total; i++) {
                    const task = tasks[i];
                    
                    // Update UI
                    if (progressBar) progressBar.style.width = `${((i + 1) / total) * 100}%`;
                    if (statusText) statusText.textContent = `Salvataggio in corso...`;
                    if (countText) countText.textContent = `${i + 1} / ${total}`;
                    
                    // Force UI update (small delay)
                    if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));

                    const exists = this.tasks.some(t => t.title === task.title && t.date === task.date);
                    if (!exists) {
                        await window.CachedCRUD.createTask(task);
                        importedCount++;
                    }
                }
                
                // Remove Modal
                const modal = document.getElementById('import-modal');
                if (modal) modal.remove();

                await this.loadData();
                this.updateView();
                Helpers.showToast(`${importedCount} Eventi importati con successo!`);
            }
        } catch (err) {
            console.error(err);
            alert("Errore durante la lettura del file. Assicurati che sia un file .ics valido.");
            const modal = document.getElementById('import-modal');
            if (modal) modal.remove();
        }
        
        input.value = ''; // Reset input per permettere nuovi caricamenti
    },

    // ============================================================
    //  MODALS (EVENTO vs NOTA)
    // ============================================================

    showDayModal(dateStr) {
        this.currentDate = new Date(dateStr);
        this.setView('day');
    },

    // item = task object or note object
    // type = 'event' | 'note' (optional override)
    showAddModal(item = null, type = 'event') {
        const isEdit = !!item;
        
        // Determina il tipo se stiamo modificando
        let currentType = type;
        if (isEdit) {
            // Se ha "duration" o "title" è un evento, altrimenti (solo content/date) è una nota
            currentType = (item.title !== undefined) ? 'event' : 'note';
        }

        const dateVal = isEdit ? item.date.split('T')[0] : this._iso(this.currentDate);
        const timeVal = (isEdit && currentType === 'event') ? item.date.split('T')[1].slice(0,5) : '09:00';

        const modalHTML = `
            <div id="taskModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
                    
                    <!-- Header & Tabs -->
                    <div class="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-5 border-b border-slate-700/50">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-black text-white">${isEdit ? 'Modifica' : 'Nuovo Inserimento'}</h3>
                            <button onclick="document.getElementById('taskModal').remove()" class="text-white opacity-60 hover:opacity-100 bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all">✕</button>
                        </div>
                        
                        <!-- TABS -->
                        <div class="flex p-1 bg-slate-950/50 rounded-xl border border-slate-700/50">
                            <button onclick="Agenda.switchModalTab('event')" id="tab-btn-event" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentType === 'event' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
                                📅 Evento
                            </button>
                            <button onclick="Agenda.switchModalTab('note')" id="tab-btn-note" class="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentType === 'note' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}">
                                📝 Nota
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-8 overflow-y-auto custom-scrollbar">
                        
                        <!-- FORM EVENTO -->
                        <form id="form-event" class="${currentType === 'event' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleEventSubmit(event, ${isEdit && currentType === 'event' ? `'${item.id}'` : 'null'})">
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Titolo</label>
                                <input type="text" id="evtTitle" placeholder="Titolo evento" value="${currentType === 'event' && isEdit ? item.title : ''}" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-indigo-500 outline-none font-bold text-lg">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                    <input type="date" id="evtDate" value="${dateVal}" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ora</label>
                                    <input type="time" id="evtTime" value="${timeVal}" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500">
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Luogo 📍</label>
                                    <input type="text" id="evtLocation" value="${currentType === 'event' && isEdit ? (item.location || '') : ''}" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Durata</label>
                                    <select id="evtDuration" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-indigo-500 appearance-none">
                                        <option value="30" ${currentType === 'event' && isEdit && item.duration == 30 ? 'selected' : ''}>30 min</option>
                                        <option value="60" ${(!isEdit || (currentType === 'event' && item.duration == 60)) ? 'selected' : ''}>1 Ora</option>
                                        <option value="90" ${currentType === 'event' && isEdit && item.duration == 90 ? 'selected' : ''}>1.5 Ore</option>
                                        <option value="120" ${currentType === 'event' && isEdit && item.duration == 120 ? 'selected' : ''}>2 Ore</option>
                                    </select>
                                </div>
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrizione (Opzionale)</label>
                                <textarea id="evtDesc" rows="2" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-indigo-500 outline-none resize-none font-medium">${currentType === 'event' && isEdit ? (item.description || '') : ''}</textarea>
                            </div>

                            <div class="grid grid-cols-3 gap-3">
                                ${['high', 'medium', 'low'].map(p => `
                                    <label class="cursor-pointer group">
                                        <input type="radio" name="priority" value="${p}" ${currentType === 'event' && isEdit && item.priority === p ? 'checked' : p === 'medium' ? 'checked' : ''} class="peer sr-only">
                                        <div class="py-3 border-2 border-slate-700 rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-slate-500 peer-checked:border-indigo-500 peer-checked:bg-indigo-600/10 peer-checked:text-indigo-400 transition-all group-hover:border-slate-600">
                                            ${p === 'high' ? 'Alta 🔥' : p === 'medium' ? 'Media ⚡' : 'Bassa ☕'}
                                        </div>
                                    </label>
                                `).join('')}
                            </div>

                            <button type="submit" class="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.02] shadow-lg mt-4">
                                Salva Evento
                            </button>
                        </form>

                        <!-- FORM NOTA -->
                        <form id="form-note" class="${currentType === 'note' ? '' : 'hidden'} space-y-5" onsubmit="Agenda.handleNoteSubmit(event, ${isEdit && currentType === 'note' ? `'${item.id}'` : 'null'})">
                            <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-200 text-xs mb-4">
                                💡 Le note sono legate solo al giorno, senza orario specifico.
                            </div>
                            
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data</label>
                                <input type="date" id="noteDate" value="${dateVal}" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-3 text-white outline-none focus:border-amber-500 transition-colors">
                            </div>

                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contenuto Nota</label>
                                <textarea id="noteContent" rows="8" placeholder="Scrivi qui..." required class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none resize-none font-medium text-lg leading-relaxed">${currentType === 'note' && isEdit ? item.content : ''}</textarea>
                            </div>

                            <button type="submit" class="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.02] shadow-lg mt-4">
                                Salva Nota
                            </button>
                        </form>

                        ${isEdit ? `
                        <div class="mt-6 pt-6 border-t border-slate-800 text-center">
                            <button onclick="Agenda.deleteItem('${item.id}', '${currentType}')" class="text-xs font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest">
                                Elimina ${currentType === 'event' ? 'Evento' : 'Nota'}
                            </button>
                        </div>` : ''}

                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // Quando clicco su una cella oraria (Giorno/Settimana)
    showAddModalWithDate(dateStr, timeStr = '09:00') {
        // Apro modale "nuovo" (item=null) forzando tipo "event"
        this.showAddModal(null, 'event');
        // Pre-fill
        setTimeout(() => {
            if(document.getElementById('evtDate')) document.getElementById('evtDate').value = dateStr;
            if(document.getElementById('evtTime')) document.getElementById('evtTime').value = timeStr;
            if(document.getElementById('noteDate')) document.getElementById('noteDate').value = dateStr;
        }, 50);
    },

    switchModalTab(type) {
        document.getElementById('form-event').classList.toggle('hidden', type !== 'event');
        document.getElementById('form-note').classList.toggle('hidden', type !== 'note');
        
        const btnEvent = document.getElementById('tab-btn-event');
        const btnNote = document.getElementById('tab-btn-note');
        
        if (type === 'event') {
            btnEvent.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-indigo-600 text-white shadow-lg';
            btnNote.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-white';
        } else {
            btnEvent.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all text-slate-400 hover:text-white';
            btnNote.className = 'flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-amber-500 text-black shadow-lg';
        }
    },

    // --- LOGICA SOVRAPPOSIZIONE EVENTI ---

    /**
     * Controlla se il nuovo evento (data + durata) si sovrappone a task esistenti.
     * @param {Object} newEvent - Oggetto con date (ISO) e duration (minuti).
     * @param {string|null} excludeId - ID da escludere (in caso di modifica).
     * @returns {Array} Lista di eventi in conflitto.
     */
    checkOverlap(newEvent, excludeId = null) {
        const newStart = new Date(newEvent.date);
        const newEnd = new Date(newStart.getTime() + (parseInt(newEvent.duration) || 60) * 60000);

        return this.tasks.filter(t => {
            // Ignora se stesso o se è completato (opzionale: qui controlliamo tutto)
            if (excludeId && t.id === excludeId) return false;
            if (t.completed) return false; 

            const tStart = new Date(t.date);
            const tDuration = t.duration || 60;
            const tEnd = new Date(tStart.getTime() + tDuration * 60000);

            // Logica: (StartA < EndB) e (EndA > StartB)
            return newStart < tEnd && newEnd > tStart;
        });
    },

    // --- SUBMIT HANDLERS ---

    async handleEventSubmit(e, id) {
        e.preventDefault();
        
        const data = {
            title: document.getElementById('evtTitle').value,
            date: `${document.getElementById('evtDate').value}T${document.getElementById('evtTime').value}:00`,
            location: document.getElementById('evtLocation').value,
            duration: parseInt(document.getElementById('evtDuration').value) || 60,
            description: document.getElementById('evtDesc').value,
            priority: document.querySelector('input[name="priority"]:checked').value,
            completed: false
        };

        // CHECK SOVRAPPOSIZIONE
        const conflicts = this.checkOverlap(data, id);
        if (conflicts.length > 0) {
            const list = conflicts.map(c => `- ${c.title} (${Helpers.formatDate(c.date, 'time')})`).join('\n');
            const msg = `⚠️ Attenzione: Sovrapposizione rilevata con:\n${list}\n\nVuoi salvare comunque?`;
            
            if (!confirm(msg)) {
                return; // Interrompe il salvataggio se l'utente annulla
            }
        }
        
        if(id) await window.CachedCRUD.updateTask(id, data);
        else await window.CachedCRUD.createTask(data);
        
        this._afterSubmit();
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
        if (type === 'event') await window.CachedCRUD.deleteTask(id);
        else await window.CachedCRUD.deleteNote(id);
        this._afterSubmit();
    },

    async _afterSubmit() {
        document.getElementById('taskModal').remove();
        await this.loadData();
        this.updateView();
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
    
    // Wrapper per click su card esistente (Evento)
    editTask(id) { 
        const t = this.tasks.find(x => x.id === id); 
        if(t) this.showAddModal(t, 'event'); 
    },
    
    // Wrapper per click su nota esistente
    editNote(id) {
        const n = this.notes.find(x => x.id === id);
        if(n) this.showAddModal(n, 'note');
    },

    // Toggle checkbox per eventi rapidi
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
        name: 'Agenda Pro',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>',
        order: 1,
        category: 'main',
        isCore: true,
        init: () => Agenda.init(),
        render: () => Agenda.render(),
        widgets: window.AgendaWidgets ? AgendaWidgets.getDefinitions() : []
    });
}