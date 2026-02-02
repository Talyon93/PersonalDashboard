/**
 * Agenda Widgets - DASHBOARD COMPONENTS
 * Contiene esclusivamente la logica per i widget della dashboard.
 * Dipende da 'agenda.js' per i dati e le azioni.
 */

const AgendaWidgets = {

    // Definizioni per ModuleManager
    getDefinitions() {
        return [
            // --- CLASSICI AGGIORNATI ---
            { 
                id: 'agenda_kpi', 
                name: 'Daily Pulse', 
                description: 'Task di oggi in evidenza', 
                size: { cols: 1, rows: 1 }, 
                type: 'kpi', // Tipo KPI per anteprima numerica
                render: () => this.renderWidgetKPI() 
            },
            { 
                id: 'agenda_list', 
                name: 'Lista Focus', 
                description: 'Prossime attività in lista', 
                size: { cols: 3, rows: 1 }, 
                type: 'list', // Tipo LIST per anteprima a righe
                render: () => this.renderWidgetList() 
            },
            { 
                id: 'agenda_next', 
                name: 'Next Up', 
                description: 'Il prossimo impegno imminente', 
                size: { cols: 2, rows: 1 }, 
                type: 'kpi', // Trattato come KPI per l'impatto visivo del singolo task
                render: () => this.renderWidgetNextTask() 
            },
            { 
                id: 'agenda_week', 
                name: 'Carico 7gg', 
                description: 'Grafico a barre settimanale', 
                size: { cols: 1, rows: 1 }, 
                type: 'chart', // Tipo CHART per anteprima a barre
                render: () => this.renderWidgetWeeklyLoad() 
            },
            { 
                id: 'agenda_add', 
                name: 'Quick Action', 
                description: 'Bottone creazione rapida', 
                size: { cols: 1, rows: 1 }, 
                type: 'generic', 
                render: () => this.renderWidgetQuickAdd() 
            },
            { 
                id: 'agenda_priorities', 
                name: 'Radar Scadenze', 
                description: 'Timeline Oggi/Domani/Futuro', 
                size: { cols: 3, rows: 2 }, 
                type: 'list', 
                render: () => this.renderWidgetPriorities() 
            },
            
            // --- NUOVI WIDGET ---
            { 
                id: 'agenda_progress', 
                name: 'Daily Progress', 
                description: 'Percentuale completamento oggi', 
                size: { cols: 1, rows: 1 }, 
                type: 'chart', // Essendo un grafico circolare, chart è la categoria corretta
                render: () => this.renderWidgetDailyProgress() 
            },
            { 
                id: 'agenda_mini_cal', 
                name: 'Mini Calendar', 
                description: 'Vista mese compatta', 
                size: { cols: 1, rows: 1 }, 
                type: 'calendar', // Tipo CALENDAR per anteprima a griglia
                render: () => this.renderWidgetMiniCalendar() 
            },
            { 
                id: 'agenda_stats', 
                name: 'Priority Stats', 
                description: 'Distribuzione carico lavoro', 
                size: { cols: 2, rows: 1 }, 
                type: 'chart', 
                render: () => this.renderWidgetPriorityStats() 
            },

            // --- TIMELINE ---
            { 
                id: 'agenda_timeline', 
                name: 'Timeline Orizzontale', 
                description: 'Vista orizzontale (3x1)', 
                size: { cols: 3, rows: 1 }, 
                type: 'list', 
                render: () => this.renderWidgetTimeline() 
            },
            { 
                id: 'agenda_timeline_vert', 
                name: 'Giornata Verticale', 
                description: 'Timeline verticale (1x3)', 
                size: { cols: 1, rows: 3 }, 
                type: 'list', 
                render: () => this.renderWidgetVerticalTimeline() 
            },

            // --- NOTE DEL GIORNO ---
            { 
                id: 'agenda_daily_notes', 
                name: 'Note del Giorno', 
                description: 'Note rapide per oggi', 
                size: { cols: 1, rows: 1 }, 
                type: 'list', 
                render: () => this.renderWidgetDailyNotes() 
            }
        ];
    },

    // ... (restanti renderizzatori rimangono invariati)

    renderWidgetKPI() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayStr = new Date().toDateString();
        const activeTasks = tasks.filter(t => !t.completed);
        const todayCount = activeTasks.filter(t => new Date(t.date).toDateString() === todayStr).length;

        const bgGradient = todayCount > 5 ? 'from-rose-600 to-orange-600' : 'from-blue-600 to-violet-600';

        return `
            <div class="h-full relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-[2rem] shadow-2xl p-6 text-white group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-blue-500/30" onclick="window.showSection('agenda')">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                <div class="flex flex-col h-full justify-between relative z-10">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mix-blend-overlay">Oggi</span>
                            <span class="text-xs font-medium opacity-90">${new Date().toLocaleDateString('it-IT', { weekday: 'long' })}</span>
                        </div>
                        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm backdrop-blur-md shadow-inner border border-white/10">📅</div>
                    </div>
                    <div>
                        <div class="flex items-baseline gap-1">
                            <p class="text-5xl font-black tracking-tighter leading-none drop-shadow-lg">${todayCount}</p>
                            <span class="text-lg opacity-60 font-bold">task</span>
                        </div>
                        <p class="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1 border-t border-white/20 pt-2 inline-block">In programma</p>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetList() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const now = new Date();
        const activeTasks = tasks.filter(t => !t.completed).sort((a,b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
        
        const contentHtml = activeTasks.length === 0 ? 
            `<div class="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <span class="text-3xl mb-2 grayscale">🏖️</span>
                <span class="text-[10px] font-black uppercase tracking-widest">Nessun task</span>
             </div>` :
            `<div class="space-y-2.5">
                ${activeTasks.map((t, i) => {
                    const isToday = new Date(t.date).toDateString() === now.toDateString();
                    const priorityColor = t.priority === 'high' ? 'bg-rose-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500';
                    return `
                    <div class="flex items-center gap-3 p-3 bg-slate-800/40 hover:bg-slate-700/60 rounded-xl border border-white/5 transition-all cursor-pointer group" onclick="Agenda.editTask('${t.id}')">
                        <div class="w-1.5 h-full self-stretch rounded-full ${priorityColor} opacity-80 group-hover:opacity-100 shadow-[0_0_8px_rgba(0,0,0,0.3)]"></div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center mb-0.5">
                                <span class="text-[9px] font-black uppercase tracking-wider ${isToday ? 'text-indigo-300' : 'text-slate-500'}">
                                    ${isToday ? 'OGGI' : Helpers.formatDate(t.date, 'short')}
                                </span>
                                <span class="text-[9px] font-bold text-slate-500 bg-slate-900/50 px-1.5 rounded">${Helpers.formatDate(t.date, 'time')}</span>
                            </div>
                            <p class="text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">${t.title}</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;

        return `
            <div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                        <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Focus List
                    </h3>
                    <button class="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 px-2 py-1 rounded transition-colors" onclick="Agenda.setView('list'); window.showSection('agenda')">Vedi tutti</button>
                </div>
                <div class="flex-1 overflow-hidden relative">${contentHtml}</div>
            </div>`;
    },

    renderWidgetNextTask() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const nextTask = tasks.filter(t => !t.completed).sort((a,b) => new Date(a.date) - new Date(b.date))[0];

        if (!nextTask) return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2rem] p-6 border border-slate-700/40 shadow-xl flex items-center justify-center text-center">
                <div class="opacity-50"><div class="text-3xl mb-2">✨</div><p class="text-slate-400 font-bold text-xs uppercase tracking-widest">Libero</p></div>
            </div>`;

        const isHighPriority = nextTask.priority === 'high';
        const cardStyle = isHighPriority 
            ? 'bg-gradient-to-br from-rose-900/80 to-slate-900 border-rose-500/30' 
            : 'bg-gradient-to-br from-indigo-900/80 to-slate-900 border-indigo-500/30';

        const timeDiff = Math.round((new Date(nextTask.date) - new Date()) / (1000 * 60));
        const timeLabel = timeDiff < 0 ? 'In corso / Scaduto' : timeDiff < 60 ? `Tra ${timeDiff} min` : Helpers.formatDate(nextTask.date, 'time');

        return `
            <div class="h-full ${cardStyle} backdrop-blur-xl rounded-[2rem] p-6 border shadow-xl flex flex-col justify-between group cursor-pointer relative overflow-hidden transition-all hover:border-opacity-50" onclick="Agenda.editTask('${nextTask.id}')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div class="flex justify-between items-start relative z-10">
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 bg-black/20 px-2 py-1 rounded border border-white/10">Next Up</span>
                    ${isHighPriority ? '<span class="text-lg animate-bounce">🔥</span>' : '<span class="text-lg">⚡</span>'}
                </div>
                <div class="relative z-10">
                    <h3 class="text-xl font-black text-white leading-tight mb-2 line-clamp-2 drop-shadow-md">${nextTask.title}</h3>
                    <div class="flex items-center gap-2 text-xs font-bold text-white/80">
                        <span class="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">${timeLabel}</span>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetWeeklyLoad() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const days = []; const today = new Date();
        for (let i = 0; i < 7; i++) { 
            const d = new Date(today); d.setDate(today.getDate() + i); 
            const count = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === d.toDateString()).length; 
            days.push({ day: d.toLocaleDateString('it-IT', { weekday: 'narrow' }), count: count, fullDate: d }); 
        }
        const max = Math.max(...days.map(d => d.count), 1);
        
        return `
            <div class="h-full bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-5 border border-white/5 shadow-xl flex flex-col justify-between">
                <p class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Carico Settimanale</p>
                <div class="flex items-end justify-between h-full gap-1 pt-2">
                    ${days.map(d => {
                        const h = Math.max((d.count / max) * 100, 10);
                        const isToday = d.fullDate.toDateString() === today.toDateString();
                        const barColor = isToday ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : d.count > 0 ? 'bg-slate-600 group-hover:bg-indigo-400' : 'bg-slate-800';
                        return `
                        <div class="flex flex-col items-center gap-1.5 w-full h-full justify-end group cursor-pointer" title="${d.count} tasks">
                            <div class="w-full rounded-md ${barColor} transition-all duration-300 relative" style="height: ${h}%">
                                ${d.count > 0 ? `<div class="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold">${d.count}</div>` : ''}
                            </div>
                            <span class="text-[8px] font-black ${isToday ? 'text-blue-400' : 'text-slate-600'} uppercase">${d.day}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    renderWidgetQuickAdd() {
        return `
            <div onclick="Agenda.showAddModal()" class="h-full bg-slate-800/20 hover:bg-indigo-600/10 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col items-center justify-center group gap-2 text-slate-500 hover:text-indigo-400 active:scale-95">
                <div class="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all shadow-lg group-hover:shadow-indigo-500/30">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span class="text-[9px] font-black uppercase tracking-[0.2em]">Crea Task</span>
            </div>`;
    },

    renderWidgetPriorities() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();
        
        const todayTasks = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === todayStr);
        const tomorrowTasks = tasks.filter(t => !t.completed && new Date(t.date).toDateString() === tomorrowStr);
        const upcomingTasks = tasks.filter(t => !t.completed && new Date(t.date) > tomorrow).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);

        const total = todayTasks.length + tomorrowTasks.length + upcomingTasks.length;

        const renderRow = (t, label, color) => `
            <div class="flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-lg border border-transparent hover:border-white/5 hover:bg-slate-700/40 transition-all cursor-pointer group" onclick="Agenda.editTask('${t.id}')">
                <div class="w-1 h-8 rounded-full ${color}"></div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between">
                        <span class="text-xs font-bold text-slate-200 truncate">${t.title}</span>
                        <span class="text-[9px] font-black uppercase text-slate-500">${Helpers.formatDate(t.date, 'time')}</span>
                    </div>
                    <span class="text-[9px] text-slate-500 uppercase font-medium tracking-wide group-hover:text-${color.replace('bg-', 'text-')} transition-colors">${label}</span>
                </div>
            </div>`;

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl flex flex-col overflow-hidden relative">
                <div class="flex items-center justify-between mb-4 z-10">
                    <h3 class="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><span class="text-lg">📡</span> Radar</h3>
                    <span class="text-[10px] font-bold bg-white/5 text-slate-300 px-2 py-1 rounded border border-white/5">${total} Attivi</span>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 z-10">
                    ${total === 0 ? '<div class="h-full flex items-center justify-center text-slate-600 text-xs uppercase tracking-widest font-bold">Nessun impegno rilevato</div>' : ''}
                    
                    ${todayTasks.length > 0 ? `<div class="sticky top-0 bg-slate-900/90 z-20 py-1 mb-1 backdrop-blur"><span class="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-1">Oggi</span></div>` : ''}
                    ${todayTasks.map(t => renderRow(t, 'Scade Oggi', 'bg-indigo-500')).join('')}

                    ${tomorrowTasks.length > 0 ? `<div class="sticky top-0 bg-slate-900/90 z-20 py-1 mb-1 mt-3 backdrop-blur"><span class="text-[9px] font-black text-fuchsia-400 uppercase tracking-widest pl-1">Domani</span></div>` : ''}
                    ${tomorrowTasks.map(t => renderRow(t, 'Domani', 'bg-fuchsia-500')).join('')}

                    ${upcomingTasks.length > 0 ? `<div class="sticky top-0 bg-slate-900/90 z-20 py-1 mb-1 mt-3 backdrop-blur"><span class="text-[9px] font-black text-amber-400 uppercase tracking-widest pl-1">In Arrivo</span></div>` : ''}
                    ${upcomingTasks.map(t => renderRow(t, 'Futuro', 'bg-amber-500')).join('')}
                </div>
            </div>`;
    },

    renderWidgetDailyProgress() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayStr = new Date().toDateString();
        const todayTasks = tasks.filter(t => new Date(t.date).toDateString() === todayStr);
        const completed = todayTasks.filter(t => t.completed).length;
        const total = todayTasks.length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        const radius = 30;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;
        const strokeColor = percent === 100 ? 'text-emerald-400' : 'text-cyan-400';

        return `
            <div class="h-full bg-slate-800/40 backdrop-blur-md rounded-[2rem] p-5 border border-slate-700/40 shadow-xl flex flex-col items-center justify-center relative group">
                <h4 class="absolute top-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Daily Goal</h4>
                <div class="relative w-24 h-24 flex items-center justify-center mt-2">
                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="50%" cy="50%" r="${radius}" stroke="currentColor" stroke-width="6" fill="transparent" class="text-slate-700/50" />
                        <circle cx="50%" cy="50%" r="${radius}" stroke="currentColor" stroke-width="6" fill="transparent" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" class="${strokeColor} transition-all duration-1000 ease-out" stroke-linecap="round" />
                    </svg>
                    <div class="absolute flex flex-col items-center">
                        <span class="text-xl font-black text-white">${percent}%</span>
                        <span class="text-[8px] font-bold text-slate-400 uppercase">${completed}/${total}</span>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetMiniCalendar() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

        let daysHtml = '';
        for(let i=0; i<startOffset; i++) daysHtml += `<div class="w-full aspect-square"></div>`;
        for(let d=1; d<=daysInMonth; d++) {
            const isToday = d === now.getDate();
            const style = isToday ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/10';
            daysHtml += `<div class="w-full aspect-square flex items-center justify-center text-[8px] font-bold rounded-full cursor-pointer transition-all ${style}">${d}</div>`;
        }

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-md rounded-[2rem] p-4 border border-slate-700/40 shadow-xl flex flex-col">
                <div class="text-center mb-2 border-b border-white/5 pb-1">
                    <span class="text-[10px] font-black uppercase tracking-widest text-white">${now.toLocaleDateString('it-IT',{month:'long'})}</span>
                </div>
                <div class="grid grid-cols-7 gap-1 place-items-center h-full content-center">
                    ${['L','M','M','G','V','S','D'].map(d=>`<div class="text-[7px] font-black text-slate-600">${d}</div>`).join('')}
                    ${daysHtml}
                </div>
            </div>`;
    },

    renderWidgetPriorityStats() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const active = tasks.filter(t => !t.completed);
        const high = active.filter(t => t.priority === 'high').length;
        const medium = active.filter(t => t.priority === 'medium').length;
        const low = active.filter(t => t.priority === 'low').length;
        const total = active.length || 1;

        const bar = (count, color, label) => `
            <div class="flex items-center gap-3 mb-2">
                <span class="text-[9px] font-bold text-slate-400 w-8 uppercase">${label}</span>
                <div class="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full ${color} rounded-full" style="width: ${(count/total)*100}%"></div>
                </div>
                <span class="text-[9px] font-bold text-white w-4 text-right">${count}</span>
            </div>
        `;

        return `
            <div class="h-full bg-slate-800/40 backdrop-blur-md rounded-[2rem] p-6 border border-slate-700/40 shadow-xl flex flex-col justify-center">
                <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    Carico per Priorità
                </h4>
                <div>
                    ${bar(high, 'bg-rose-500', 'Alta')}
                    ${bar(medium, 'bg-amber-500', 'Media')}
                    ${bar(low, 'bg-blue-500', 'Bassa')}
                </div>
            </div>`;
    },

    renderWidgetTimeline() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayStr = new Date().toISOString().split('T')[0];
        const dayTasks = tasks.filter(t => t.date.startsWith(todayStr) && !t.completed);
        const now = new Date();
        const currentHour = now.getHours();
        
        const startH = 6; const endH = 23; const totalHours = endH - startH;
        const getLeft = (h, m) => ((h - startH + (m/60)) / totalHours) * 100;
        const nowLeft = currentHour >= startH && currentHour <= endH ? getLeft(currentHour, now.getMinutes()) : -10;

        let hoursHtml = '';
        for(let h=startH; h<=endH; h+=2) {
             hoursHtml += `<div class="absolute top-0 bottom-0 border-l border-white/5 text-[8px] font-bold text-slate-600 pl-1 pt-1" style="left: ${getLeft(h,0)}%">${h}:00</div>`;
        }

        let tasksHtml = dayTasks.map(t => {
            const d = new Date(t.date);
            const h = d.getHours();
            if(h < startH || h > endH) return '';
            const left = getLeft(h, d.getMinutes());
            const color = t.priority === 'high' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : t.priority === 'medium' ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600';
            return `
                <div class="absolute top-6 bottom-4 rounded-lg ${color} shadow-lg border border-white/10 group cursor-pointer hover:z-20 hover:scale-105 transition-all flex flex-col justify-center px-2 overflow-hidden" 
                     style="left: ${left}%; width: 12%; min-width: 80px;" onclick="Agenda.editTask('${t.id}')">
                    <div class="text-[8px] font-black uppercase text-white/70 truncate">${Helpers.formatDate(t.date, 'time')}</div>
                    <div class="text-[10px] font-bold text-white truncate leading-tight">${t.title}</div>
                </div>`;
        }).join('');

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
                <div class="h-8 flex items-center px-6 border-b border-white/5 justify-between shrink-0 bg-slate-900/40">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline Orizzontale</span>
                    <span class="text-[9px] font-bold text-slate-600">${new Date().toLocaleDateString('it-IT', {weekday:'long', day:'numeric'})}</span>
                </div>
                <div class="flex-1 relative w-full overflow-hidden">
                    <div class="absolute inset-0 w-full h-full">${hoursHtml}</div>
                    ${nowLeft > 0 ? `<div class="absolute top-0 bottom-0 w-px bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)] z-10" style="left: ${nowLeft}%"><div class="w-2 h-2 rounded-full bg-rose-500 -ml-1 mt-1 shadow-lg"></div></div>` : ''}
                    <div class="absolute inset-0 w-full h-full">${tasksHtml}</div>
                    ${dayTasks.length === 0 ? '<div class="absolute inset-0 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">Nessun impegno oggi</div>' : ''}
                </div>
            </div>`;
    },

    renderWidgetVerticalTimeline() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayStr = new Date().toISOString().split('T')[0];
        const dayTasks = tasks.filter(t => t.date.startsWith(todayStr) && !t.completed);
        const now = new Date();
        const currentHour = now.getHours();
        
        const startH = 6; const endH = 23; const totalHours = endH - startH;
        const getTop = (h, m) => ((h - startH + (m/60)) / totalHours) * 100;
        const nowTop = currentHour >= startH && currentHour <= endH ? getTop(currentHour, now.getMinutes()) : -10; 

        let hoursHtml = '';
        for(let h=startH; h<=endH; h++) {
             hoursHtml += `<div class="absolute left-0 right-0 border-t border-white/5 text-[9px] font-bold text-slate-500 pl-2 pt-0.5 flex items-start" style="top: ${getTop(h,0)}%"><span class="w-8 text-right pr-2 -mt-2">${h}:00</span></div>`;
        }

        let tasksHtml = dayTasks.map(t => {
            const d = new Date(t.date);
            const h = d.getHours();
            if(h < startH || h > endH) return '';
            const top = getTop(h, d.getMinutes());
            const height = (40 / (totalHours * 60)) * 100; 
            const style = t.priority === 'high' ? 'bg-rose-500/90 border-rose-400' : t.priority === 'medium' ? 'bg-amber-500/90 border-amber-400' : 'bg-indigo-600/90 border-indigo-400';
            return `
                <div class="absolute left-12 right-2 rounded-lg ${style} border shadow-lg group cursor-pointer hover:z-20 hover:scale-[1.02] transition-all flex flex-col justify-center px-3 overflow-hidden" 
                     style="top: ${top}%; height: max(40px, ${height}%);" onclick="Agenda.editTask('${t.id}')">
                    <div class="flex items-center justify-between">
                         <span class="text-[10px] font-bold text-white truncate leading-tight">${t.title}</span>
                         <span class="text-[8px] font-black uppercase text-white/70">${Helpers.formatDate(t.date, 'time')}</span>
                    </div>
                </div>`;
        }).join('');

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
                <div class="h-10 flex items-center px-4 border-b border-white/5 justify-between shrink-0 bg-slate-900/40 z-20">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</span>
                    <span class="text-[9px] font-bold text-slate-500">${new Date().toLocaleDateString('it-IT', {weekday:'short', day:'numeric'})}</span>
                </div>
                <div class="flex-1 relative w-full overflow-hidden custom-scrollbar overflow-y-auto">
                    <div class="absolute inset-0 min-h-[400px]">
                        ${hoursHtml}
                        ${nowTop > 0 ? `<div class="absolute left-8 right-0 h-px bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] z-10 flex items-center" style="top: ${nowTop}%"><div class="w-1.5 h-1.5 rounded-full bg-rose-500 -ml-0.5 shadow-sm"></div><span class="text-[8px] font-bold text-rose-500 bg-slate-900/80 px-1 ml-1 rounded">ADESSO</span></div>` : ''}
                        ${tasksHtml}
                        ${dayTasks.length === 0 ? '<div class="absolute inset-0 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">Nessun impegno</div>' : ''}
                    </div>
                </div>
            </div>`;
    },

    renderWidgetDailyNotes() {
        const notes = window.Agenda ? Agenda.notes : [];
        const todayStr = new Date().toISOString().split('T')[0];
        const todayNotes = notes.filter(n => n.date === todayStr);

        return `
            <div class="h-full bg-amber-500/10 backdrop-blur-md rounded-[2rem] p-5 border border-amber-500/30 shadow-xl flex flex-col relative group overflow-hidden transition-all hover:border-amber-500/50">
                <div class="flex justify-between items-start mb-3 z-10">
                    <h4 class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                        <span>📝</span> Note Oggi
                    </h4>
                    <button onclick="Agenda.showAddModal({date:'${todayStr}'}, 'note')" class="w-6 h-6 rounded-full bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center shadow-lg transition-all text-sm font-bold active:scale-95" title="Nuova nota">＋</button>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar space-y-2 z-10 pr-1">
                    ${todayNotes.length === 0 
                        ? `<div class="h-full flex flex-col items-center justify-center text-amber-500/40 text-[9px] font-bold uppercase tracking-wide cursor-pointer hover:text-amber-500/60 transition-colors" onclick="Agenda.showAddModal({date:'${todayStr}'}, 'note')">
                             <span>Nessun appunto</span>
                             <span class="text-xs mt-1">Clicca per aggiungere</span>
                           </div>` 
                        : todayNotes.map(n => `
                            <div onclick="Agenda.editNote('${n.id}')" class="bg-amber-500/20 text-amber-100 p-2.5 rounded-xl text-xs cursor-pointer hover:bg-amber-500/30 transition-colors border border-amber-500/10 hover:border-amber-500/30 group/note relative">
                                <div class="line-clamp-3 whitespace-pre-line leading-relaxed">${Helpers.escapeHtml(n.content)}</div>
                            </div>
                        `).join('')}
                </div>
                
                <div class="absolute -bottom-6 -right-6 text-9xl opacity-[0.03] pointer-events-none text-amber-500 rotate-12">✍️</div>
            </div>`;
    }
};

window.AgendaWidgets = AgendaWidgets;