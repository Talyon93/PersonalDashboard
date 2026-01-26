/**
 * Agenda Component - MODULAR WIDGETS EDITION (6 WIDGETS)
 * Gestione completa calendario + 6 Widget per Dashboard.
 */

const Agenda = {
    currentDate: new Date(),
    currentView: 'calendar',
    showCompleted: false,
    tasks: [],
    isInitialized: false,

    async init() {
        await this.loadTasks();
    },

    async loadTasks() {
        try {
            this.tasks = window.CachedCRUD ? await CachedCRUD.getTasks() : [];
        } catch (e) {
            console.error('Error loading tasks:', e);
            this.tasks = [];
        }
    },

    // ============================================================
    //  MAIN VIEW RENDERING (Full Page)
    // ============================================================

    async render() {
        const container = document.getElementById('agendaContent');
        if (!container) return;

        // SCAFFOLDING STATICO
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
        // A. PULSANTI
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

        // B. SELETTORE DATA
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

        // C. RENDER CONTENUTO
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

    // ============================================================
    //  WIDGET EXPORT LOGIC
    // ============================================================

    getWidgets() {
        return [
            // Widget 1: KPI (1x1)
            {
                id: 'agenda_kpi',
                name: 'KPI Attività',
                description: 'Contatore task odierni',
                size: { cols: 1, rows: 1 }, 
                render: () => this.renderWidgetKPI()
            },
            // Widget 2: Lista (3x1)
            {
                id: 'agenda_list',
                name: 'Lista Priorità',
                description: 'Lista prossime attività',
                size: { cols: 3, rows: 1 }, 
                render: () => this.renderWidgetList()
            },
            // Widget 3: Next Focus (2x1)
            {
                id: 'agenda_next',
                name: 'Focus Next Task',
                description: 'Il prossimo impegno imminente',
                size: { cols: 2, rows: 1 },
                render: () => this.renderWidgetNextTask()
            },
            // Widget 4: Weekly Load (1x1)
            {
                id: 'agenda_week',
                name: 'Carico Settimanale',
                description: 'Grafico impegni 7 giorni',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetWeeklyLoad()
            },
            // Widget 5: Quick Add (1x1)
            {
                id: 'agenda_add',
                name: 'Aggiunta Rapida',
                description: 'Bottone creazione task',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetQuickAdd()
            },
            // Widget 6: PRIORITÀ AVANZATE (Nuovo)
            {
                id: 'agenda_priorities',
                name: 'Priorità Avanzate',
                description: 'Oggi, Domani, In Arrivo',
                size: { cols: 3, rows: 2 }, // Widget grande a tutta riga
                render: () => this.renderWidgetPriorities()
            }
        ];
    },

    // --- RENDERERS DEI WIDGET ---

    renderWidgetKPI() {
        const todayStr = new Date().toDateString();
        const activeTasks = this.tasks.filter(t => !t.completed);
        const todayCount = activeTasks.filter(t => new Date(t.date).toDateString() === todayStr).length;

        return `
            <div class="h-full relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-2xl p-7 text-white group cursor-pointer transition-all hover:scale-[1.02]" onclick="window.showSection('agenda')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-white/20 transition-all"></div>
                <div class="flex flex-col h-full justify-between relative z-10">
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Oggi</span>
                        <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-lg backdrop-blur-md">📅</div>
                    </div>
                    <div>
                        <p class="text-5xl font-black tracking-tighter leading-none">${todayCount}</p>
                        <p class="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-2">Task Pianificati</p>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetList() {
        const now = new Date();
        const activeTasks = this.tasks.filter(t => !t.completed).sort((a,b) => new Date(a.date) - new Date(b.date));
        const previewTasks = activeTasks.slice(0, 3);
        const isEmpty = previewTasks.length === 0;

        let contentHtml = isEmpty ? 
            `<div class="h-full flex flex-col items-center justify-center text-slate-500 opacity-60"><span class="text-2xl mb-2">☕</span><span class="text-xs font-bold uppercase tracking-widest">Tutto fatto</span></div>` :
            `<div class="space-y-3">
                ${previewTasks.map(t => {
                    const isToday = new Date(t.date).toDateString() === now.toDateString();
                    return `
                    <div class="flex items-center gap-4 p-3.5 bg-slate-700/30 rounded-2xl border border-white/5 hover:bg-slate-700/50 transition-colors cursor-pointer group" onclick="Agenda.editTask('${t.id}')">
                        <div class="w-2.5 h-2.5 rounded-full ${isToday ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-bold text-slate-200 group-hover:text-white truncate">${t.title}</p>
                            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wide">${Helpers.formatDate(t.date, 'short')}</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 shadow-xl flex flex-col">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="font-bold text-white flex items-center gap-3">
                        <span class="w-9 h-9 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center text-sm shadow-inner">📋</span>
                        Priorità
                    </h3>
                    <span class="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-wider">${activeTasks.length} OPEN</span>
                </div>
                <div class="flex-1 overflow-hidden">${contentHtml}</div>
            </div>`;
    },

    renderWidgetNextTask() {
        const activeTasks = this.tasks.filter(t => !t.completed).sort((a,b) => new Date(a.date) - new Date(b.date));
        const nextTask = activeTasks[0];

        if (!nextTask) {
            return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 shadow-xl flex items-center justify-center text-center">
                <div>
                    <div class="text-4xl mb-2">🎉</div>
                    <p class="text-slate-400 font-bold text-sm">Nessun task in arrivo</p>
                </div>
            </div>`;
        }

        const isToday = new Date(nextTask.date).toDateString() === new Date().toDateString();
        const pColor = nextTask.priority === 'high' ? 'text-rose-400' : 'text-indigo-400';

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 shadow-xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all cursor-pointer" onclick="Agenda.editTask('${nextTask.id}')">
                <div class="flex justify-between items-start">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">Next Up</span>
                    <span class="text-2xl animate-pulse">🔥</span>
                </div>
                <div>
                    <h3 class="text-2xl font-black text-white leading-tight mb-2 line-clamp-2">${nextTask.title}</h3>
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-bold ${pColor} uppercase tracking-widest">${isToday ? 'OGGI' : Helpers.formatDate(nextTask.date, 'short')}</span>
                        <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
                        <span class="text-xs font-bold text-slate-400">${Helpers.formatDate(nextTask.date, 'time')}</span>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetWeeklyLoad() {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            const dStr = d.toDateString();
            const count = this.tasks.filter(t => !t.completed && new Date(t.date).toDateString() === dStr).length;
            days.push({ day: d.toLocaleDateString('it-IT', { weekday: 'narrow' }), count: count });
        }
        
        const max = Math.max(...days.map(d => d.count), 1);

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col justify-between">
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Carico 7gg</p>
                <div class="flex items-end justify-between h-full gap-1.5 pt-2">
                    ${days.map(d => {
                        const h = Math.max((d.count / max) * 100, 10);
                        const color = d.count > 0 ? 'bg-indigo-500' : 'bg-slate-700';
                        return `
                            <div class="flex flex-col items-center gap-1.5 w-full h-full justify-end group">
                                <div class="w-full rounded-md ${color} transition-all duration-500 group-hover:bg-indigo-400 relative" style="height: ${h}%">
                                    ${d.count > 0 ? `<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white bg-slate-900 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">${d.count}</div>` : ''}
                                </div>
                                <span class="text-[8px] font-bold text-slate-500 uppercase">${d.day}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`;
    },

    renderWidgetQuickAdd() {
        return `
            <div onclick="Agenda.showAddModal()" class="h-full bg-slate-800/30 hover:bg-indigo-600/20 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed border-slate-700 hover:border-indigo-500 transition-all cursor-pointer flex flex-col items-center justify-center group text-slate-500 hover:text-indigo-400 gap-3">
                <div class="w-12 h-12 rounded-full bg-slate-800 border border-slate-600 group-hover:border-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shadow-xl">
                    <span class="text-2xl font-bold mb-1">＋</span>
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest">Aggiungi Task</span>
            </div>`;
    },

    // NUOVO WIDGET: PRIORITÀ AVANZATE (Oggi, Domani, In Arrivo)
    renderWidgetPriorities() {
        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        const todayTasks = this.tasks.filter(t => !t.completed && new Date(t.date).toDateString() === todayStr);
        const tomorrowTasks = this.tasks.filter(t => !t.completed && new Date(t.date).toDateString() === tomorrowStr);
        const upcomingTasks = this.tasks
            .filter(t => !t.completed && new Date(t.date) > tomorrow)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        const count = todayTasks.length + tomorrowTasks.length;

        if (count === 0 && upcomingTasks.length === 0) {
            return `
                <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-xl flex flex-col items-center justify-center text-center">
                    <div class="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center text-4xl mb-4">☕</div>
                    <h3 class="text-xl font-bold text-white">Nessun impegno in vista</h3>
                    <p class="text-slate-400 text-sm mt-1">Goditi il tuo tempo libero!</p>
                    <button onclick="Agenda.showAddModal()" class="mt-4 text-indigo-400 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">+ Aggiungi Task</button>
                </div>`;
        }

        let html = '';
        if (todayTasks.length > 0) {
            html += `<div class="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4 pl-2 opacity-80 sticky top-0 bg-slate-900/90 z-10 backdrop-blur-sm py-2">Oggi</div>`;
            html += todayTasks.map(t => this._renderTaskRow(t)).join('');
        }
        if (tomorrowTasks.length > 0) {
            html += `<div class="text-[10px] font-black uppercase text-purple-400 tracking-widest mt-6 mb-4 pl-2 opacity-80 sticky top-0 bg-slate-900/90 z-10 backdrop-blur-sm py-2">Domani</div>`;
            html += tomorrowTasks.map(t => this._renderTaskRow(t)).join('');
        }
        if (upcomingTasks.length > 0) {
            html += `<div class="text-[10px] font-black uppercase text-amber-400 tracking-widest mt-6 mb-4 pl-2 opacity-80 sticky top-0 bg-slate-900/90 z-10 backdrop-blur-sm py-2">In Arrivo</div>`;
            html += upcomingTasks.map(t => {
                const taskDate = new Date(t.date);
                const diffDays = Math.ceil((taskDate - now) / (1000 * 60 * 60 * 24));
                const label = diffDays === 2 ? "Dopodomani" : `Tra ${diffDays}gg`;
                return this._renderTaskRow(t, label);
            }).join('');
        }

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-xl flex flex-col group hover:border-slate-600 transition-all relative overflow-hidden">
                <div class="flex items-center justify-between mb-6 shrink-0 relative z-20">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span class="text-2xl">📅</span>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-white tracking-tight">Priorità</h3>
                            <p class="text-xs text-slate-400 font-medium">Panoramica scadenze</p>
                        </div>
                    </div>
                    <span class="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
                        ${todayTasks.length} Oggi, ${tomorrowTasks.length} Domani
                    </span>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10 space-y-2">
                    ${html}
                </div>
            </div>`;
    },

    _renderTaskRow(t, customDateLabel = null) {
        const isOverdue = !t.completed && new Date(t.date) < new Date();
        const descriptionHtml = t.description 
            ? `<p class="text-xs text-slate-400 mt-1.5 line-clamp-1 italic truncate">${Helpers.escapeHtml(t.description)}</p>` 
            : '';
        const timeLabel = customDateLabel || Helpers.formatDate(t.date, 'time');

        return `
            <div class="flex items-start gap-4 p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl hover:bg-slate-700/60 transition-all cursor-pointer group/row relative overflow-hidden mb-2" onclick="Agenda.editTask('${t.id}')">
                <button onclick="event.stopPropagation(); Agenda.toggleTask('${t.id}')" 
                        title="Completa"
                        class="mt-0.5 w-5 h-5 rounded-full border-2 border-slate-500 group-hover/row:border-indigo-400 flex items-center justify-center transition-colors shrink-0">
                    <div class="w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity"></div>
                </button>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-3">
                        <p class="font-bold text-slate-200 group-hover/row:text-white transition-colors truncate text-sm">${Helpers.escapeHtml(t.title)}</p>
                        <span class="text-[9px] font-black text-slate-500 uppercase bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-700/50 whitespace-nowrap">${timeLabel}</span>
                    </div>
                    ${descriptionHtml}
                </div>
                ${isOverdue ? `<div class="absolute top-0 right-0 w-1 h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>` : ''}
            </div>`;
    },

    // ============================================================
    //  MODALS & ACTIONS
    // ============================================================

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
        // Aggiorna anche la dashboard se visibile (via EventBus)
        if(window.EventBus) EventBus.emit('dataChanged');
        Helpers.showToast('Task aggiornato! ✅');
    },

    async deleteTask(id, fromModal) {
        if(!confirm('Eliminare attività?')) return;
        await window.CachedCRUD.deleteTask(id);
        await this.loadTasks();
        if(fromModal && document.getElementById('dayModal')) document.getElementById('dayModal').remove();
        await this.updateView();
        if(window.EventBus) EventBus.emit('dataChanged');
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
        if(window.EventBus) EventBus.emit('dataChanged');
        Helpers.showToast(taskId ? 'Modificato' : 'Creato');
    },

    editTask(id) { const t = this.tasks.find(x => x.id === id); if(t) this.showAddModal(t); }
};

// ==========================================
// REGISTRAZIONE MODULARE
// ==========================================
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
        // ESPORTAZIONE WIDGET PER DASHBOARD
        widgets: Agenda.getWidgets()
    });
}