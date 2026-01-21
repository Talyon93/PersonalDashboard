/**
 * Agenda Component - FINAL PILL EDITION
 * Sincronizzato con il design "Finanze"
 */

const Agenda = {
    currentDate: new Date(),
    currentView: 'calendar',
    showCompleted: false,
    tasks: [],
    isInitialized: false,

    async init() {
        await this.loadTasks();
        await this.render();
    },

    async loadTasks() {
        try {
            this.tasks = window.CachedCRUD ? await CachedCRUD.getTasks() : [];
        } catch (e) {
            console.error('Error loading tasks:', e);
            this.tasks = [];
        }
    },

    async render() {
        const container = document.getElementById('agendaContent');
        if (!container) return;

        // 1. SCAFFOLDING STATICO (Titolo e testata)
        if (!this.isInitialized || container.querySelector('h2') === null) {
            container.innerHTML = `
                <div class="mb-10 animate-fadeIn">
                    <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                        <div>
                            <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-400 bg-clip-text text-transparent italic">Agenda</h2>
                            <p class="text-slate-400 mt-2 font-medium flex items-center gap-2 text-lg">
                                <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Organizzazione e scadenze.
                            </p>
                        </div>
                        
                        <div id="agenda-top-controls" class="flex flex-wrap gap-3"></div>
                    </div>
                </div>

                <div id="agenda-period-selector" class="flex justify-center mb-10"></div>

                <div id="agenda-main-container" class="animate-slideUp min-h-[600px]"></div>
            `;
            this.isInitialized = true;
        }

        await this.updateView();
    },

    async updateView() {
        // A. AGGIORNA PULSANTI IN ALTO (Calendario/Lista/Finiti)
        const controls = document.getElementById('agenda-top-controls');
        if (controls) {
            controls.innerHTML = `
                <div class="bg-slate-800/40 backdrop-blur-xl p-1 rounded-2xl border border-slate-700/50 flex shadow-xl">
                    <button onclick="Agenda.setView('calendar')" class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${this.currentView === 'calendar' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">📅 Calendario</button>
                    <button onclick="Agenda.setView('list')" class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${this.currentView === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">📋 Lista</button>
                </div>
                <button onclick="Agenda.toggleCompleted()" class="px-5 py-2.5 bg-slate-800/40 text-slate-300 border border-slate-700/50 hover:text-white rounded-2xl transition-all text-xs font-black uppercase tracking-widest backdrop-blur-md ${this.showCompleted ? 'ring-2 ring-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-900/20' : ''}">
                    ${this.showCompleted ? '✅ Nascondi Finiti' : '👁️ Mostra Finiti'}
                </button>
                <button onclick="Agenda.showAddModal()" class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl rounded-2xl transition-all hover:scale-105 active:scale-95 text-sm font-bold">➕ Nuovo Task</button>
            `;
        }

        // B. AGGIORNA SELETTORE DATA (Stile Finanze/Analytics)
        const selector = document.getElementById('agenda-period-selector');
        if (selector) {
            const monthLabel = this.currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
            selector.innerHTML = `
                <div class="inline-flex items-center gap-4 bg-slate-800/50 backdrop-blur-md p-2 rounded-2xl border border-slate-700/50 shadow-2xl">
                    <button onclick="Agenda.changeMonth(-1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    
                    <h3 class="text-xl font-bold text-white px-4 min-w-[200px] text-center capitalize tracking-tight select-none">${monthLabel}</h3>
                    
                    <button onclick="Agenda.changeMonth(1)" class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                    
                    <div class="w-px h-6 bg-slate-700/50 mx-1"></div>
                    
                    <button onclick="Agenda.goToToday()" title="Vai a Oggi" class="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </button>
                </div>
            `;
        }

        // C. RENDER CONTENUTO PRINCIPALE
        const main = document.getElementById('agenda-main-container');
        if (main) {
            main.innerHTML = (this.currentView === 'calendar') ? this.renderCalendar() : this.renderList();
        }
    },

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let html = `
            <div class="bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-xl">
                <div class="grid grid-cols-7 gap-4 mb-6">
                    ${['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(d => `
                        <div class="text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">${d}</div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-7 gap-4">
        `;

        for (let i = 0; i < firstDay; i++) html += '<div class="min-h-[140px]"></div>';

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            
            const dayTasks = this.tasks.filter(t => t.date.startsWith(dateStr));
            const activeTasks = dayTasks.filter(t => !t.completed);
            const completedCount = dayTasks.filter(t => t.completed).length;

            html += `
                <div onclick="Agenda.showDayModal('${dateStr}')" 
                     class="group min-h-[140px] p-4 rounded-3xl border-2 transition-all cursor-pointer flex flex-col relative overflow-hidden
                            ${isToday ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' : 'bg-slate-900/40 border-slate-700/50 hover:border-indigo-500/30 hover:bg-slate-800/40'}">
                    
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-xl font-black ${isToday ? 'text-blue-400' : 'text-slate-300'}">${day}</span>
                        <div class="flex gap-1.5">
                            ${activeTasks.length > 0 ? `<div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>` : ''}
                            ${completedCount > 0 ? `<div class="w-2.5 h-2.5 rounded-full bg-emerald-500/40"></div>` : ''}
                        </div>
                    </div>

                    <div class="flex-1 space-y-1.5 overflow-hidden">
                        ${activeTasks.slice(0, 3).map(t => {
                            const pColor = t.priority === 'high' ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' : 
                                         t.priority === 'medium' ? 'bg-amber-500/20 border-amber-500/30 text-amber-300' : 
                                         'bg-slate-800 border-slate-700 text-slate-400';
                            return `
                                <div class="text-[10px] font-bold truncate px-2 py-1 rounded-lg border ${pColor}">
                                    ${Helpers.formatDate(t.date, 'time')} ${Helpers.escapeHtml(t.title)}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>`;
        }
        return html + '</div></div>';
    },

    renderList() {
        let filtered = this.showCompleted ? this.tasks : this.tasks.filter(t => !t.completed);
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (filtered.length === 0) return `<div class="bg-slate-800/30 rounded-[2.5rem] p-20 text-center border border-slate-700/40"><p class="text-xl font-bold text-slate-500 opacity-40 italic">Nessuna attività in programma 🌙</p></div>`;

        const grouped = {};
        filtered.forEach(t => {
            const d = t.date.split('T')[0];
            if (!grouped[d]) grouped[d] = [];
            grouped[d].push(t);
        });

        let html = '<div class="space-y-12 relative before:absolute before:left-[43px] before:top-0 before:bottom-0 before:w-px before:bg-slate-700/50">';
        Object.entries(grouped).forEach(([dateStr, tasks]) => {
            const dateObj = new Date(dateStr + 'T12:00:00');
            html += `
                <div class="relative pl-24 animate-fadeIn">
                    <div class="absolute left-0 top-0">
                        <div class="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shadow-xl">
                            <span class="text-[10px] text-slate-500 font-black uppercase">${dateObj.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                            <span class="text-3xl text-white font-black my-0.5">${dateObj.getDate()}</span>
                            <span class="text-[10px] text-slate-500 uppercase font-black">${dateObj.toLocaleDateString('it-IT', { month: 'short' })}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        ${tasks.map(t => this.renderTaskCard(t)).join('')}
                    </div>
                </div>`;
        });
        return html + '</div>';
    },

    renderTaskCard(t, fromModal = false) {
        const isOverdue = !t.completed && new Date(t.date) < new Date();
        const pColor = t.priority === 'high' ? 'border-rose-500/30 bg-rose-500/5' : 
                      t.priority === 'medium' ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-700/50 bg-slate-900/40';

        return `
            <div class="group relative ${pColor} backdrop-blur-md rounded-[1.8rem] border-2 p-5 transition-all hover:bg-slate-800/60 hover:border-blue-500/40 cursor-pointer overflow-hidden shadow-sm"
                 onclick="Agenda.editTask('${t.id}')">
                <div class="flex items-center gap-5">
                    <button onclick="event.stopPropagation(); Agenda.toggleTask('${t.id}', ${fromModal})" 
                            class="w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                            ${t.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-slate-600 group-hover:border-blue-500'}">
                        ${t.completed ? '✓' : ''}
                    </button>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-bold text-white truncate ${t.completed ? 'line-through opacity-50' : ''}">${Helpers.escapeHtml(t.title)}</h4>
                        <div class="flex items-center gap-3 mt-1">
                            <span class="text-xs font-black text-slate-500 uppercase tracking-widest">${Helpers.formatDate(t.date, 'time')}</span>
                            ${isOverdue ? '<span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-black uppercase border border-rose-500/30">Scaduto</span>' : ''}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); Agenda.deleteTask('${t.id}', ${fromModal})" class="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-400 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>`;
    },

    // --- AZIONI MODALI ---
    showDayModal(dateStr) {
        const dayTasks = this.tasks.filter(t => t.date.startsWith(dateStr));
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        
        const modalHTML = `
            <div id="dayModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-slideUp">
                    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 flex items-center justify-between">
                        <div>
                            <h3 class="text-3xl font-black text-white capitalize">${Helpers.formatDate(date, 'full')}</h3>
                            <p class="text-blue-100/70 text-sm font-bold uppercase tracking-widest mt-1">${dayTasks.length} attività in programma</p>
                        </div>
                        <button onclick="document.getElementById('dayModal').remove()" class="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white">✕</button>
                    </div>
                    <div class="p-8 overflow-y-auto flex-1 space-y-4">
                        ${dayTasks.length === 0 ? `<div class="text-center py-10 opacity-40"><p class="text-slate-400 font-bold italic text-lg">Nessun impegno</p></div>` 
                        : dayTasks.map(t => this.renderTaskCard(t, true)).join('')}
                        <button onclick="Agenda.showAddModalWithDate('${dateStr}'); document.getElementById('dayModal').remove();" class="w-full mt-4 px-6 py-4 bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 hover:border-blue-500/50 text-slate-400 hover:text-blue-400 rounded-[1.5rem] transition-all font-black uppercase text-xs tracking-widest">+ Aggiungi Attività</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    showAddModal(task = null) {
        const isEdit = !!task;
        const modalHTML = `
            <div id="taskModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
                    <div class="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-5 flex items-center justify-between">
                        <h3 class="text-2xl font-black text-white">${isEdit ? '✏️ Modifica Task' : '➕ Nuovo Task'}</h3>
                        <button onclick="document.getElementById('taskModal').remove()" class="text-white opacity-60 hover:opacity-100">✕</button>
                    </div>
                    <form onsubmit="Agenda.handleSubmit(event, ${isEdit ? `'${task.id}'` : 'null'})" class="p-8 space-y-5">
                        <input type="text" id="taskTitle" placeholder="Cosa devi fare?" required value="${isEdit ? task.title : ''}" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none font-bold text-lg">
                        <textarea id="taskDescription" placeholder="Dettagli (opzionale)" rows="3" class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none resize-none font-medium">${isEdit ? (task.description || '') : ''}</textarea>
                        <div class="grid grid-cols-2 gap-4">
                            <input type="date" id="taskDate" required value="${isEdit ? task.date.split('T')[0] : ''}" class="bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white outline-none">
                            <input type="time" id="taskTime" required value="${isEdit ? task.date.split('T')[1].slice(0,5) : '09:00'}" class="bg-slate-800 border-2 border-slate-700 rounded-2xl px-5 py-4 text-white outline-none">
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                            ${['high', 'medium', 'low'].map(p => `<label class="cursor-pointer"><input type="radio" name="priority" value="${p}" ${isEdit && task.priority === p ? 'checked' : p === 'medium' && !isEdit ? 'checked' : ''} class="peer sr-only"><div class="py-3 border-2 border-slate-700 rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-slate-500 peer-checked:border-indigo-500 peer-checked:bg-indigo-600/10 peer-checked:text-indigo-400 transition-all">${p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : 'Bassa'}</div></label>`).join('')}
                        </div>
                        <div class="flex gap-3 pt-4">
                            <button type="submit" class="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:scale-105 transition-all shadow-lg">Salva Task</button>
                            <button type="button" onclick="document.getElementById('taskModal').remove()" class="px-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-bold">Annulla</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // --- AZIONI ---
    setView(v) { this.currentView = v; this.updateView(); },
    toggleCompleted() { this.showCompleted = !this.showCompleted; this.updateView(); },
    async changeMonth(d) { this.currentDate.setMonth(this.currentDate.getMonth() + d); await this.updateView(); },
    async goToToday() { this.currentDate = new Date(); await this.updateView(); },
    showAddModalWithDate(d) { this.showAddModal(); setTimeout(() => document.getElementById('taskDate').value = d, 50); },
    
    async toggleTask(id, fromModal) {
        await window.CachedCRUD.toggleTaskCompleted(id);
        await this.loadTasks();
        if(fromModal && document.getElementById('dayModal')) { 
            document.getElementById('dayModal').remove(); 
            const t = this.tasks.find(x => x.id === id); 
            if(t) this.showDayModal(t.date.split('T')[0]); 
        }
        await this.updateView();
        Helpers.showToast('Task aggiornato! ✅');
    },

    async deleteTask(id, fromModal) {
        if(!confirm('Eliminare attività?')) return;
        await window.CachedCRUD.deleteTask(id);
        await this.loadTasks();
        if(fromModal && document.getElementById('dayModal')) document.getElementById('dayModal').remove();
        await this.updateView();
        Helpers.showToast('Task rimosso');
    },

    async handleSubmit(e, taskId) {
        e.preventDefault();
        const data = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            date: `${document.getElementById('taskDate').value}T${document.getElementById('taskTime').value}:00`,
            priority: document.querySelector('input[name="priority"]:checked').value,
            completed: false
        };
        taskId ? await window.CachedCRUD.updateTask(taskId, data) : await window.CachedCRUD.createTask(data);
        document.getElementById('taskModal').remove();
        await this.loadTasks();
        await this.updateView();
        Helpers.showToast(taskId ? 'Modificato' : 'Creato');
    },

    editTask(id) { const t = this.tasks.find(x => x.id === id); if(t) this.showAddModal(t); }
};

window.Agenda = Agenda;