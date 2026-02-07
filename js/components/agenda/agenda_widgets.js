/**
 * Agenda Widgets - DASHBOARD COMPONENTS
 * AGGIORNATO: Priorità visiva alle Scadenze (Deadlines).
 */

const AgendaWidgets = {

    getDefinitions() {
        return [
            { id: 'agenda_kpi', name: 'Daily Pulse', description: 'Task di oggi in evidenza', size: { cols: 1, rows: 1 }, type: 'kpi', render: () => this.renderWidgetKPI() },
            { id: 'agenda_list', name: 'Lista Eventi', description: 'Prossime attività in lista', size: { cols: 3, rows: 1 }, type: 'list', render: () => this.renderWidgetList() },
            { id: 'agenda_add', name: 'Quick Action', description: 'Bottone creazione rapida', size: { cols: 1, rows: 1 }, type: 'generic', render: () => this.renderWidgetQuickAdd() },
            { id: 'agenda_mini_cal', name: 'Mini Calendar', description: 'Vista mese compatta', size: { cols: 1, rows: 1 }, type: 'calendar', render: () => this.renderWidgetMiniCalendar() },
            { id: 'agenda_timeline', name: 'Timeline Orizzontale', description: 'Vista orizzontale (3x1)', size: { cols: 3, rows: 1 }, type: 'list', render: () => this.renderWidgetTimeline() },
            { id: 'agenda_timeline_vert', name: 'Giornata Verticale', description: 'Timeline verticale (1x3)', size: { cols: 1, rows: 3 }, type: 'list', render: () => this.renderWidgetVerticalTimeline() },
            { id: 'agenda_daily_notes', name: 'Note del Giorno', description: 'Note rapide per oggi', size: { cols: 1, rows: 1 }, type: 'list', render: () => this.renderWidgetDailyNotes() }
        ];
    },

    renderWidgetKPI() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        
        // Helper: Include eventi multi-giorno attivi oggi
        const isActiveToday = (t) => {
            const startStr = t.date.split('T')[0];
            const endStr = (t.endDate || t.date).split('T')[0];
            return todayStr >= startStr && todayStr <= endStr;
        };

        const activeTasks = tasks.filter(t => !t.completed);
        
        // Calcolo conteggi corretti
        const todayCount = activeTasks.filter(t => isActiveToday(t)).length;
        const deadlineCount = activeTasks.filter(t => t.isDeadline && isActiveToday(t)).length;

        // Gradiente Dinamico: Rosso (Scadenze) -> Arancio (Carico Alto) -> Blu (Normal)
        const bgGradient = deadlineCount > 0 
            ? 'from-rose-600 to-red-700 shadow-rose-500/30' 
            : todayCount > 5 
                ? 'from-orange-500 to-amber-600 shadow-orange-500/30' 
                : 'from-blue-600 to-indigo-600 shadow-blue-500/30';

        // Icona Dinamica
        const icon = deadlineCount > 0 ? '🚩' : '🗓️';
        const labelText = deadlineCount > 0 ? `${deadlineCount} in Scadenza!` : 'In programma';

        return `
            <div class="h-full relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-[2rem] shadow-2xl p-6 text-white group cursor-pointer transition-all duration-500 hover:scale-[1.02]" onclick="window.showSection('agenda')">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                <div class="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                <div class="flex flex-col h-full justify-between relative z-10">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mix-blend-overlay">Oggi</span>
                            <span class="text-xs font-medium opacity-90">${todayDate.toLocaleDateString('it-IT', { weekday: 'long' })}</span>
                        </div>
                        <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm backdrop-blur-md shadow-inner border border-white/10">
                            ${icon}
                        </div>
                    </div>
                    <div>
                        <div class="flex items-baseline gap-1">
                            <p class="text-5xl font-black tracking-tighter leading-none drop-shadow-lg">${todayCount}</p>
                            <span class="text-lg opacity-60 font-bold">task</span>
                        </div>
                        <p class="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1 border-t border-white/20 pt-2 inline-block">
                            ${labelText}
                        </p>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetList() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrow = new Date(now); 
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        // 1. Filtra e Ordina i task attivi
        const activeTasks = tasks
            .filter(t => !t.completed)
            .sort((a,b) => new Date(a.date) - new Date(b.date));

        // 2. Raggruppa per priorità temporale
        const todayTasks = activeTasks.filter(t => new Date(t.date).toDateString() === todayStr);
        const tomorrowTasks = activeTasks.filter(t => new Date(t.date).toDateString() === tomorrowStr);
        
        // 3. Logica di visualizzazione:
        // Se c'è roba oggi o domani, mostra quelli. Altrimenti mostra i prossimi in arrivo.
        let displayGroups = [];
        
        if (todayTasks.length > 0 || tomorrowTasks.length > 0) {
            if (todayTasks.length > 0) displayGroups.push({ title: 'OGGI', color: 'text-indigo-400', list: todayTasks });
            if (tomorrowTasks.length > 0) displayGroups.push({ title: 'DOMANI', color: 'text-fuchsia-400', list: tomorrowTasks });
        } else {
            // Fallback: Prossimi task futuri
            const upcoming = activeTasks.filter(t => new Date(t.date) > now).slice(0, 3);
            if (upcoming.length > 0) {
                displayGroups.push({ title: 'IN ARRIVO', color: 'text-emerald-400', list: upcoming });
            }
        }

        // --- Helper Rendering Riga Task (Stile Premium) ---
        const renderTaskRow = (t) => {
            const isMulti = (t.duration || 0) >= 1440 || t.date.split('T')[0] !== (t.endDate || t.date).split('T')[0];
            const timeLabel = isMulti ? 'TUTTO IL GG' : Helpers.formatDate(t.date, 'time');
            
            // Definizione Colori
            let barColor = 'bg-indigo-500';
            let containerClass = 'bg-slate-800/30 border-white/5 hover:bg-slate-700/50';

            if (t.isDeadline) {
                barColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';
                containerClass = 'bg-rose-900/10 border-rose-500/20 hover:bg-rose-900/20'; 
            } else if (t.priority === 'high') {
                barColor = 'bg-rose-500';
            } else if (t.priority === 'medium') {
                barColor = 'bg-amber-500';
            }

            return `
            <div class="flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${containerClass} mb-2" onclick="Agenda.editTask('${t.id}')">
                <div class="w-1 h-8 rounded-full ${barColor} shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-[9px] font-black uppercase tracking-wider text-slate-500">
                             ${timeLabel}
                        </span>
                    </div>
                    <p class="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors flex items-center gap-1.5">
                        ${t.isDeadline ? '<span class="text-rose-400 text-[10px]">🚩</span>' : ''} 
                        ${t.title}
                    </p>
                </div>
            </div>`;
        };

        // --- Costruzione HTML Contenuto ---
        let contentHtml = '';
        
        if (displayGroups.length === 0) {
            contentHtml = `
                <div class="h-full flex flex-col items-center justify-center text-slate-500/50 min-h-[150px]">
                    <span class="text-3xl mb-3 opacity-60 grayscale">✨</span>
                    <span class="text-[10px] font-black uppercase tracking-widest">Tutto libero</span>
                </div>`;
        } else {
            contentHtml = `<div class="space-y-4 pb-2">
                ${displayGroups.map(group => `
                    <div>
                        <div class="sticky top-0 bg-slate-900/95 z-10 py-1 mb-1 backdrop-blur border-b border-white/5">
                            <span class="text-[9px] font-black uppercase tracking-widest pl-1 ${group.color}">${group.title}</span>
                        </div>
                        ${group.list.map(t => renderTaskRow(t)).join('')}
                    </div>
                `).join('')}
            </div>`;
        }

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                <div class="flex items-center justify-between mb-4 shrink-0">
                    <h3 class="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-widest">
                        <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        Focus List
                    </h3>
                    <button class="text-[9px] font-black uppercase bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 rounded transition-colors" onclick="Agenda.setView('list'); window.showSection('agenda')">Vedi tutti</button>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar relative pr-1">${contentHtml}</div>
            </div>`;
    },

    renderWidgetQuickAdd() {
        return `
            <div onclick="Agenda.showAddModal()" class="h-full relative group cursor-pointer overflow-hidden rounded-[2rem] border-2 border-dashed border-slate-700/50 hover:border-indigo-500/50 bg-slate-800/20 hover:bg-indigo-500/5 transition-all duration-300 flex flex-col items-center justify-center gap-3 active:scale-95">
                
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-blue-500/0 group-hover:from-indigo-500/10 group-hover:to-blue-500/5 transition-all duration-500 pointer-events-none"></div>

                <div class="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 group-hover:border-indigo-500 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 flex items-center justify-center shadow-xl transition-all duration-300 group-hover:shadow-indigo-500/40 group-hover:scale-110 relative z-10">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                </div>

                <div class="text-center relative z-10">
                    <span class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-indigo-300 transition-colors">Crea Nuovo</span>
                </div>
            </div>`;
    },

    renderWidgetList() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrow = new Date(now); 
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        // 1. Filtra i task attivi e ordinali
        const activeTasks = tasks
            .filter(t => !t.completed)
            .sort((a,b) => new Date(a.date) - new Date(b.date));

        // 2. Suddividi in gruppi temporali (Senza nascondere nulla)
        const todayTasks = activeTasks.filter(t => new Date(t.date).toDateString() === todayStr);
        const tomorrowTasks = activeTasks.filter(t => new Date(t.date).toDateString() === tomorrowStr);
        
        // "In Arrivo": Prendi tutto ciò che è dopo domani (limitato ai primi 5 per performance)
        const upcomingTasks = activeTasks
            .filter(t => new Date(t.date) > tomorrow)
            .slice(0, 5);
        
        // 3. Costruisci i gruppi da visualizzare
        let displayGroups = [];
        if (todayTasks.length > 0) displayGroups.push({ title: 'OGGI', color: 'text-indigo-400', list: todayTasks });
        if (tomorrowTasks.length > 0) displayGroups.push({ title: 'DOMANI', color: 'text-fuchsia-400', list: tomorrowTasks });
        if (upcomingTasks.length > 0) displayGroups.push({ title: 'IN ARRIVO', color: 'text-emerald-400', list: upcomingTasks });

        // --- Helper Rendering Riga Task ---
        const renderTaskRow = (t) => {
            const isMulti = (t.duration || 0) >= 1440 || t.date.split('T')[0] !== (t.endDate || t.date).split('T')[0];
            
            // CALCOLO GIORNI MANCANTI
            const d1 = new Date(); d1.setHours(0,0,0,0);
            const d2 = new Date(t.date); d2.setHours(0,0,0,0);
            const diffTime = d2 - d1;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Logica Etichetta Tempo
            let timeLabel = isMulti ? 'TUTTO IL GG' : Helpers.formatDate(t.date, 'time');
            
            // Se è un evento futuro (> 1 giorno di distanza), sovrascrivi l'ora con il countdown
            if (diffDays > 1) {
                timeLabel = `TRA ${diffDays} GIORNI`;
            } else if (diffDays === 1) {
                 // Per domani manteniamo l'orario, ma se preferisci puoi mettere 'DOMANI'
                 // timeLabel = 'DOMANI'; 
            }

            // Colori
            let barColor = 'bg-indigo-500';
            let containerClass = 'bg-slate-800/30 border-white/5 hover:bg-slate-700/50';

            if (t.isDeadline) {
                barColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse';
                containerClass = 'bg-rose-900/10 border-rose-500/20 hover:bg-rose-900/20'; 
            } else if (t.priority === 'high') {
                barColor = 'bg-rose-500';
            } else if (t.priority === 'medium') {
                barColor = 'bg-amber-500';
            }

            return `
            <div class="flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer group ${containerClass} mb-2" onclick="Agenda.editTask('${t.id}')">
                <div class="w-1 h-8 rounded-full ${barColor} shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                        <span class="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-950/30 px-1.5 py-0.5 rounded border border-white/5">
                             ${timeLabel}
                        </span>
                    </div>
                    <p class="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors flex items-center gap-1.5">
                        ${t.isDeadline ? '<span class="text-rose-400 text-[10px]">🚩</span>' : ''} 
                        ${t.title}
                    </p>
                </div>
            </div>`;
        };

        // --- Render Finale ---
        let contentHtml = '';
        if (displayGroups.length === 0) {
            contentHtml = `
                <div class="h-full flex flex-col items-center justify-center text-slate-500/50 min-h-[150px]">
                    <span class="text-3xl mb-3 opacity-60 grayscale">✨</span>
                    <span class="text-[10px] font-black uppercase tracking-widest">Tutto libero</span>
                </div>`;
        } else {
            contentHtml = `<div class="space-y-4 pb-2">
                ${displayGroups.map(group => `
                    <div>
                        <div class="sticky top-0 bg-slate-900/95 z-10 py-1 mb-1 backdrop-blur border-b border-white/5">
                            <span class="text-[9px] font-black uppercase tracking-widest pl-1 ${group.color}">${group.title}</span>
                        </div>
                        ${group.list.map(t => renderTaskRow(t)).join('')}
                    </div>
                `).join('')}
            </div>`;
        }

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl flex flex-col overflow-hidden">
                <div class="flex items-center justify-between mb-4 shrink-0">
                    <h3 class="font-bold text-white flex items-center gap-2 text-xs uppercase tracking-widest">
                        <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                        Lista eventi
                    </h3>
                    <button class="text-[9px] font-black uppercase bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2 py-1 rounded transition-colors" onclick="Agenda.setView('list'); window.showSection('agenda')">Vedi tutti</button>
                </div>
                <div class="flex-1 overflow-y-auto custom-scrollbar relative pr-1">${contentHtml}</div>
            </div>`;
    },

    renderWidgetTimeline() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        
        const isActiveToday = (t) => {
            const startStr = t.date.split('T')[0];
            const endStr = (t.endDate || t.date).split('T')[0];
            return todayStr >= startStr && todayStr <= endStr;
        };

        const activeTasks = tasks.filter(t => !t.completed && isActiveToday(t));
        
        // 1. SEPARAZIONE: Scadenze e Multigiorno
        const allDayTasks = activeTasks.filter(t => 
            t.isDeadline || 
            (t.duration || 0) >= 1440 || 
            t.date.split('T')[0] !== (t.endDate || t.date).split('T')[0]
        );
        const timeTasks = activeTasks.filter(t => !allDayTasks.includes(t));

        // Configurazione Griglia
        const startH = 6; 
        const endH = 23; 
        const totalHours = endH - startH;
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        const getLeftPct = (h, m) => ((h - startH + (m/60)) / totalHours) * 100;
        const getWidthPct = (durationMin) => (durationMin / (totalHours * 60)) * 100;
        const nowLeft = currentHour >= startH && currentHour <= endH ? getLeftPct(currentHour, currentMin) : -10;

        // Griglia Oraria
        let hoursHtml = '';
        for(let h=startH; h<=endH; h+=2) {
             hoursHtml += `<div class="absolute top-0 bottom-0 border-l border-white/5 text-[8px] font-bold text-slate-600 pl-1 pt-2" style="left: ${getLeftPct(h,0)}%">${h}:00</div>`;
        }

        // Task Orari
        let tasksHtml = timeTasks.map(t => {
            const d = new Date(t.date);
            const h = d.getHours();
            if(h < startH || h > endH) return '';
            
            const left = getLeftPct(h, d.getMinutes());
            const duration = t.duration || 60;
            const width = Math.max(getWidthPct(duration), 5);

            let style = t.priority === 'high' ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 hover:bg-rose-500/20' : 
                        t.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20' : 
                        'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/20';
            const icon = t.priority === 'high' ? '🔴' : '•';

            return `
                <div class="absolute top-10 bottom-2 rounded-lg ${style} border backdrop-blur-sm shadow-sm group cursor-pointer hover:z-20 hover:scale-[1.02] transition-all flex flex-col justify-center px-2 overflow-hidden" 
                     style="left: ${left}%; width: ${width}%; min-width: 60px;" onclick="Agenda.editTask('${t.id}')">
                    <div class="flex items-center gap-1 mb-0.5">
                        <span class="text-[8px] opacity-80">${icon}</span>
                        <span class="text-[8px] font-black uppercase opacity-70 truncate">${Helpers.formatDate(t.date, 'time')}</span>
                    </div>
                    <div class="text-[10px] font-bold truncate leading-tight text-white/90">${t.title}</div>
                </div>`;
        }).join('');

        // 2. Render HEADER (CORRETTO: Rimossa classe bg-transparent)
        const allDayHtml = allDayTasks.length > 0 ? `
            <div class="flex gap-2 px-4 py-2 bg-slate-900/50 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0 h-[45px] items-center">
                <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest shrink-0 mr-2 border-r border-white/10 pr-2 h-4 leading-4">Tutto il Giorno:</span>
                ${allDayTasks.map(t => {
                    const isDl = t.isDeadline;
                    // Stesso stile della verticale
                    const bgClass = isDl 
                        ? 'bg-rose-900/40 border-rose-700/50 text-rose-100 hover:bg-rose-900/60' 
                        : 'bg-indigo-900/40 border-indigo-700/50 text-indigo-100 hover:bg-indigo-900/60';
                    
                    const icon = isDl ? '🚩' : '🗓️';

                    return `
                    <div onclick="Agenda.editTask('${t.id}')" class="shrink-0 px-2 py-1 rounded border ${bgClass} cursor-pointer flex items-center gap-2 shadow-sm transition-transform active:scale-95 group min-w-[100px] max-w-[200px]">
                        <span class="text-xs shadow-black drop-shadow-md">${icon}</span> 
                        <span class="text-[9px] font-bold truncate group-hover:text-white transition-colors">${t.title}</span>
                    </div>
                `}).join('')}
            </div>` : '';

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
                <div class="h-8 flex items-center px-4 border-b border-white/5 justify-between shrink-0 bg-slate-900/80 z-30">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline Orizzontale</span>
                    <span class="text-[9px] font-bold text-slate-600">${todayDate.toLocaleDateString('it-IT', {weekday:'long', day:'numeric'})}</span>
                </div>
                
                ${allDayHtml}

                <div class="flex-1 relative w-full overflow-hidden bg-slate-900/20">
                    <div class="absolute inset-0 w-full h-full">${hoursHtml}</div>
                    ${nowLeft > 0 ? `<div class="absolute top-0 bottom-0 w-px bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)] z-10" style="left: ${nowLeft}%"><div class="w-2 h-2 rounded-full bg-rose-500 -ml-1 mt-0 shadow-lg border border-slate-900"></div></div>` : ''}
                    <div class="absolute inset-0 w-full h-full pointer-events-none"><div class="w-full h-full pointer-events-auto">${tasksHtml}</div></div>
                    ${activeTasks.length === 0 ? '<div class="absolute inset-0 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">Nessun impegno oggi</div>' : ''}
                </div>
            </div>`;
    },

    renderWidgetVerticalTimeline() {
        const tasks = window.Agenda ? Agenda.tasks : [];
        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        
        // Helper: Controlla se il task è attivo oggi
        const isActiveToday = (t) => {
            const startStr = t.date.split('T')[0];
            const endStr = (t.endDate || t.date).split('T')[0];
            return todayStr >= startStr && todayStr <= endStr;
        };

        const activeTasks = tasks.filter(t => !t.completed && isActiveToday(t));
        
        // SEPARAZIONE CRITICA:
        // 1. Scadenze (isDeadline = true) -> Vanno SEMPRE su
        // 2. Multigiorno/Tutto il giorno -> Vanno su
        // 3. Il resto -> Nella griglia oraria
        const allDayTasks = activeTasks.filter(t => 
            t.isDeadline || 
            (t.duration || 0) >= 1440 || 
            t.date.split('T')[0] !== (t.endDate || t.date).split('T')[0]
        );
        
        const timeTasks = activeTasks.filter(t => !allDayTasks.includes(t));

        // Configurazione Griglia
        const startH = 6; 
        const endH = 23; 
        const totalHours = endH - startH;
        const now = new Date();
        const currentHour = now.getHours();
        
        const getTopPct = (h, m) => ((h - startH + (m/60)) / totalHours) * 100;
        const getHeightPct = (durationMin) => Math.max((durationMin / (totalHours * 60)) * 100, 4); 
        
        const nowTop = currentHour >= startH && currentHour <= endH ? getTopPct(currentHour, now.getMinutes()) : -10; 

        // 1. Render Griglia Ore
        let hoursHtml = '';
        for(let h=startH; h<=endH; h++) {
             hoursHtml += `<div class="absolute left-0 right-0 border-t border-white/5 text-[9px] font-bold text-slate-600 pl-2 pt-0.5 flex items-start" style="top: ${getTopPct(h,0)}%"><span class="w-8 text-right pr-2 -mt-2">${h}:00</span></div>`;
        }

        // 2. Render HEADER (Eventi Multi-giorno e Scadenze)
        // Stile identico alla vista agenda: Rosso per scadenze, Blu per eventi
        const allDayHtml = allDayTasks.length > 0 ? `
            <div class="px-4 py-3 bg-slate-900/50 border-b border-white/5 space-y-2 z-20 relative shadow-md shrink-0 max-h-[120px] overflow-y-auto custom-scrollbar">
                ${allDayTasks.map(t => {
                    // Stile differenziato
                    const isDl = t.isDeadline;
                    const bgClass = isDl 
                        ? 'bg-rose-900/40 border-rose-700/50 text-rose-100 hover:bg-rose-900/60' // Stile Scadenza (Rosso)
                        : 'bg-indigo-900/40 border-indigo-700/50 text-indigo-100 hover:bg-indigo-900/60'; // Stile Evento (Blu)
                    
                    const icon = isDl ? '🚩' : '🗓️'; // Icona corretta (Bandiera vs Calendario)
                    const label = isDl ? 'SCADENZA' : 'TUTTO IL GIORNO';

                    return `
                    <div onclick="Agenda.editTask('${t.id}')" class="w-full px-3 py-2 rounded-lg border ${bgClass} cursor-pointer flex items-center gap-3 shadow-sm transition-all active:scale-[0.98] group">
                        <span class="text-sm shadow-black drop-shadow-md">${icon}</span> 
                        <div class="flex flex-col min-w-0">
                            <span class="text-[10px] font-bold leading-tight truncate group-hover:text-white transition-colors">${t.title}</span>
                            <span class="text-[8px] font-black uppercase opacity-60 tracking-wider">${label}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>` : '';

        // 3. Render TASK ORARI (Body)
        let tasksHtml = timeTasks.map(t => {
            const d = new Date(t.date);
            const h = d.getHours();
            if(h < startH || h > endH) return '';
            
            const top = getTopPct(h, d.getMinutes());
            const duration = t.duration || 60;
            const height = getHeightPct(duration);
            
            // Colori basati sulla priorità per i task orari
            let style = t.priority === 'high' ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 hover:bg-rose-500/20' : 
                        t.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:bg-amber-500/20' : 
                        'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 hover:bg-indigo-500/20';

            const icon = t.priority === 'high' ? '🔴' : '•';

            return `
                <div class="absolute left-12 right-2 rounded-lg ${style} border backdrop-blur-sm shadow-sm group cursor-pointer hover:z-20 hover:scale-[1.02] transition-all flex flex-col justify-center px-3 overflow-hidden" 
                     style="top: ${top}%; height: ${height}%;" onclick="Agenda.editTask('${t.id}')">
                    <div class="flex items-center gap-2 mb-0.5">
                         <span class="text-[8px] font-black uppercase opacity-70 tracking-widest">${Helpers.formatDate(t.date, 'time')}</span>
                         <span class="text-[8px] opacity-50">${icon}</span>
                    </div>
                    <div class="text-[10px] font-bold truncate leading-tight text-white/90">${t.title}</div>
                </div>`;
        }).join('');

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
                <div class="h-10 flex items-center px-4 border-b border-white/5 justify-between shrink-0 bg-slate-900/80 z-30">
                    <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</span>
                    <span class="text-[9px] font-bold text-slate-500">${todayDate.toLocaleDateString('it-IT', {weekday:'short', day:'numeric'})}</span>
                </div>
                
                ${allDayHtml}

                <div class="flex-1 relative w-full overflow-hidden custom-scrollbar overflow-y-auto bg-slate-900/20">
                    <div class="absolute inset-0 min-h-[500px]">
                        ${hoursHtml}
                        
                        ${nowTop > 0 ? `
                            <div class="absolute left-10 right-0 h-px bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] z-10 flex items-center pointer-events-none" style="top: ${nowTop}%">
                                <div class="w-1.5 h-1.5 rounded-full bg-rose-500 -ml-0.5 shadow-sm"></div>
                            </div>` : ''}
                        
                        ${tasksHtml}
                        
                        ${activeTasks.length === 0 ? '<div class="absolute inset-0 flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">Nessun impegno</div>' : ''}
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