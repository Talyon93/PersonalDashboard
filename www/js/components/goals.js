/**
 * Goals WOW - Gestione Obiettivi Ultra-Moderna
 * Features: Design spettacolare, animazioni smooth, progress tracking, 4 Widget Dashboard
 */

const Goals = {
    goals: [],
    currentView: 'all', // all, active, completed
    
    async init() {
        await this.loadData();
        await this.render();
    },

    async loadData() {
        try {
            this.goals = await CachedCRUD.getGoals();
            console.log(`✅ Loaded ${this.goals.length} goals`);
        } catch (e) {
            console.error('Error loading goals:', e);
            this.goals = [];
        }
    },

    // ============================================================
    //  MAIN RENDER LOGIC (Pagina Intera)
    // ============================================================

    async render(skipLoad = false) {
        if (!skipLoad) await this.loadData();
        const container = document.getElementById('goalsContent');
        if (!container) return;
        
        // Calcolo Statistiche
        const activeGoals = this.goals.filter(g => !g.completed);
        const completedGoals = this.goals.filter(g => g.completed);
        const totalSubtasks = this.goals.reduce((sum, g) => sum + (g.subtasks?.length || 0), 0);
        const completedSubtasks = this.goals.reduce((sum, g) => 
            sum + (g.subtasks?.filter(st => st.completed).length || 0), 0);
        const overallProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

        // Filtro visualizzazione
        let filteredGoals = this.goals;
        if (this.currentView === 'active') filteredGoals = activeGoals;
        else if (this.currentView === 'completed') filteredGoals = completedGoals;

        const groupedGoals = this.groupByQuarter(filteredGoals);

        container.innerHTML = `
            <div class="mb-10 animate-fadeIn">
                <div class="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-10">
                    <div>
                        <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-400 to-slate-400 bg-clip-text text-transparent italic">Obiettivi</h2>
                        <p class="text-slate-400 mt-2 font-medium flex items-center gap-2 text-lg">
                            <span class="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span> Visione e traguardi a lungo termine.
                        </p>
                    </div>
                    
                    <div class="flex flex-wrap gap-3">
                        <div class="bg-slate-800/40 backdrop-blur-xl p-1 rounded-2xl border border-slate-700/50 flex shadow-xl">
                            ${['all', 'active', 'completed'].map(v => `
                                <button onclick="Goals.setView('${v}')" 
                                        class="px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${this.currentView === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
                                    ${v === 'all' ? 'Tutti' : v === 'active' ? 'Attivi' : 'Finiti'}
                                </button>
                            `).join('')}
                        </div>
                        <button onclick="Goals.showAddModal()" class="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-700 text-white shadow-xl rounded-2xl transition-all hover:scale-105 active:scale-95 text-sm font-bold">✨ Nuovo Obiettivo</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    ${this.renderKpiCard('Progresso', overallProgress, 'from-purple-500 to-pink-600', `${completedSubtasks}/${totalSubtasks} Task`, '%')}
                    ${this.renderKpiCard('Attivi', activeGoals.length, 'from-blue-500 to-indigo-600', 'In esecuzione', '')}
                    ${this.renderKpiCard('Completati', completedGoals.length, 'from-emerald-500 to-teal-600', 'Traguardi raggiunti', '')}
                    ${this.renderKpiCard('Totali', this.goals.length, 'from-slate-700 to-slate-800', 'Obiettivi definiti', '')}
                </div>

                ${filteredGoals.length === 0 ? this.renderEmptyState() : `
                    <div class="space-y-12">
                        ${Object.entries(groupedGoals).map(([quarter, goals]) => 
                            this.renderQuarterSection(quarter, goals)
                        ).join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderKpiCard(title, value, grad, sub, unit = '') {
        return `
            <div class="relative overflow-hidden bg-gradient-to-br ${grad} rounded-2xl shadow-xl p-6 text-white transform hover:scale-[1.02] transition-all">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                <p class="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">${title}</p>
                <p class="text-4xl font-black mb-1">${value}${unit}</p>
                <p class="text-[10px] font-bold opacity-70 uppercase tracking-tighter">${sub}</p>
            </div>`;
    },

    renderEmptyState() {
        const messages = {
            all: { icon: '🎯', title: 'Nessun obiettivo', subtitle: 'Inizia a pianificare i tuoi traguardi!' },
            active: { icon: '🔥', title: 'Nessun obiettivo attivo', subtitle: 'Tutti gli obiettivi sono stati completati!' },
            completed: { icon: '✅', title: 'Nessun obiettivo completato', subtitle: 'Completa i tuoi primi obiettivi!' }
        };
        const msg = messages[this.currentView];

        return `
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-16 text-center">
                <div class="text-8xl mb-6">${msg.icon}</div>
                <h3 class="text-3xl font-bold text-white mb-3">${msg.title}</h3>
                <p class="text-slate-400 text-lg mb-8">${msg.subtitle}</p>
                ${this.currentView === 'all' ? `
                    <button onclick="Goals.showAddModal()" class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:scale-105 transition-all shadow-2xl font-bold text-lg">✨ Crea il tuo primo obiettivo</button>
                ` : ''}
            </div>`;
    },

    groupByQuarter(goals) {
        const grouped = {};
        goals.forEach(goal => {
            const date = new Date(goal.targetDate);
            const year = date.getFullYear();
            const quarter = Helpers.getQuarter(date);
            const key = `${year}-Q${quarter}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(goal);
        });
        const sorted = {};
        Object.keys(grouped).sort().reverse().forEach(key => sorted[key] = grouped[key]);
        return sorted;
    },

    renderQuarterSection(quarterKey, goals) {
        const [year, quarter] = quarterKey.split('-');
        return `
            <div class="space-y-8">
                <div class="flex items-center gap-4">
                    <h3 class="text-2xl font-black text-white tracking-tight capitalize">📅 ${quarter} ${year}</h3>
                    <div class="h-px flex-1 bg-slate-700/50"></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 gap-4">
                    ${goals.map(goal => this.renderGoalCard(goal)).join('')}
                </div>
            </div>`;
    },

    renderGoalCard(goal) {
        const completed = goal.subtasks.filter(st => st.completed).length;
        const total = goal.subtasks.length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isCompleted = goal.completed || percentage === 100;
        
        // Priority color based on date
        const daysUntil = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        let priorityColor = 'blue';
        if (daysUntil < 0) priorityColor = 'red';
        else if (daysUntil < 30) priorityColor = 'yellow';
        else if (daysUntil < 60) priorityColor = 'orange';

        return `
            <div class="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 ${isCompleted ? 'border-green-500' : `border-${priorityColor}-500/50`} hover:border-${isCompleted ? 'green' : priorityColor}-400 transition-all overflow-hidden flex flex-col">
                <div class="absolute inset-0 bg-gradient-to-r ${isCompleted ? 'from-green-500/10 to-emerald-500/10' : `from-${priorityColor}-500/5 to-${priorityColor}-600/5`} opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div class="relative p-6 flex-1">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h4 class="text-xl font-bold ${isCompleted ? 'text-green-400' : 'text-white'} flex items-center gap-2">
                                ${isCompleted ? '✅ ' : ''}${Helpers.escapeHtml(goal.title)}
                            </h4>
                            ${goal.description ? `<p class="text-slate-400 text-sm line-clamp-2 mt-1">${Helpers.escapeHtml(goal.description)}</p>` : ''}
                        </div>
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="Goals.showEditModal('${goal.id}')" class="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400">✏️</button>
                            <button onclick="Goals.handleDeleteGoal('${goal.id}')" class="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400">🗑️</button>
                        </div>
                    </div>

                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold text-slate-400">Progresso</span>
                            <span class="text-2xl font-black ${percentage === 100 ? 'text-green-400' : 'text-slate-300'}">${percentage}%</span>
                        </div>
                        <div class="relative h-4 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                            <div class="absolute inset-0 bg-gradient-to-r ${percentage === 100 ? 'from-green-500 to-emerald-600' : 'from-purple-500 to-pink-600'} transition-all duration-1000" style="width: ${percentage}%"></div>
                        </div>
                         <div class="flex items-center justify-between mt-2">
                            <span class="text-xs text-slate-500">${completed}/${total} subtask</span>
                            ${daysUntil >= 0 ? 
                                `<span class="text-xs px-2 py-1 rounded-full ${daysUntil < 30 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}">⏰ ${daysUntil} giorni</span>` : 
                                `<span class="text-xs px-2 py-1 rounded-full bg-red-500/30 text-red-400 font-semibold animate-pulse">⚠️ Scaduto</span>`
                            }
                        </div>
                    </div>

                     <div class="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                        ${goal.subtasks.length === 0 ? `<p class="text-sm text-slate-500 italic py-2 text-center">Nessun subtask</p>` 
                        : goal.subtasks.map((subtask, index) => `
                            <div class="flex items-center gap-3 p-3 rounded-xl ${subtask.completed ? 'bg-green-500/10' : 'bg-slate-700/30'} hover:bg-slate-700/50 transition-all cursor-pointer" onclick="Goals.handleToggleSubtask('${goal.id}', ${index})">
                                <div class="w-5 h-5 rounded-full border-2 ${subtask.completed ? 'border-green-400 bg-green-500' : 'border-slate-500'} flex items-center justify-center">
                                    ${subtask.completed ? '<span class="text-[10px] text-white">✓</span>' : ''}
                                </div>
                                <span class="flex-1 text-sm ${subtask.completed ? 'line-through text-slate-500' : 'text-slate-300'}">${Helpers.escapeHtml(subtask.title)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
    },

    // ============================================================
    //  WIDGET EXPORT LOGIC (Dashboard Integration)
    // ============================================================

    getWidgets() {
        return [
            {
                id: 'goals_kpi',
                name: 'KPI Obiettivi',
                description: 'Stato obiettivi attivi',
                size: { cols: 1, rows: 1 }, 
                render: () => this.renderWidgetKPI()
            },
            {
                id: 'goals_list',
                name: 'Focus Obiettivi',
                description: 'Lista principali obiettivi',
                size: { cols: 2, rows: 1 }, 
                render: () => this.renderWidgetList()
            },
            {
                id: 'goals_progress',
                name: 'Progresso Totale',
                description: 'Barra progresso globale',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetProgress()
            },
            // WIDGET PROSSIMA SCADENZA
            {
                id: 'goals_deadline',
                name: 'Prossima Scadenza',
                description: 'Dettagli obiettivo più vicino',
                size: { cols: 2, rows: 1 },
                render: () => this.renderWidgetNextDeadline()
            }
        ];
    },

    renderWidgetKPI() {
        const activeGoals = this.goals.filter(g => !g.completed);
        const nextDeadline = activeGoals.sort((a,b) => new Date(a.targetDate) - new Date(b.targetDate))[0];
        const daysLeft = nextDeadline ? Math.ceil((new Date(nextDeadline.targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

        return `
            <div class="h-full relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-700 rounded-[2.5rem] shadow-2xl p-7 text-white group cursor-pointer transition-all hover:scale-[1.02]" onclick="window.showSection('goals')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-white/20 transition-all"></div>
                <div class="flex flex-col h-full justify-between relative z-10">
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Focus</span>
                        <div class="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-lg backdrop-blur-md">🎯</div>
                    </div>
                    <div>
                        <p class="text-5xl font-black tracking-tighter leading-none">${activeGoals.length}</p>
                        <p class="text-[9px] font-bold opacity-60 uppercase tracking-widest mt-2">
                            ${nextDeadline ? `Prossimo: ${daysLeft}gg` : 'Nessun target'}
                        </p>
                    </div>
                </div>
            </div>`;
    },

    renderWidgetList() {
        const activeGoals = this.goals.filter(g => !g.completed).slice(0, 2);
        if (activeGoals.length === 0) return this._renderEmptyWidget('Pianifica nuovi obiettivi');

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col">
                <div class="flex items-center gap-3 mb-4">
                     <span class="w-8 h-8 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center text-sm">🎯</span>
                     <h3 class="font-bold text-white text-sm uppercase tracking-wide">Traguardi</h3>
                </div>
                <div class="flex-1 space-y-3 overflow-hidden">
                    ${activeGoals.map(g => {
                        const total = g.subtasks?.length || 0;
                        const completed = g.subtasks?.filter(s => s.completed).length || 0;
                        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return `
                        <div class="p-3 bg-slate-700/30 rounded-xl border border-white/5 hover:bg-slate-700/50 transition-colors cursor-pointer" onclick="window.showSection('goals')">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-slate-200 text-xs truncate max-w-[70%]">${g.title}</span>
                                <span class="text-[10px] font-black text-purple-400">${percent}%</span>
                            </div>
                            <div class="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500" style="width: ${percent}%"></div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    renderWidgetProgress() {
         const total = this.goals.reduce((sum, g) => sum + (g.subtasks?.length || 0), 0);
         const completed = this.goals.reduce((sum, g) => sum + (g.subtasks?.filter(st => st.completed).length || 0), 0);
         const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

         return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 border border-slate-700/40 shadow-xl flex flex-col items-center justify-center group">
                <div class="relative w-24 h-24">
                     <svg class="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="36" stroke="currentColor" stroke-width="8" fill="transparent" class="text-slate-700" />
                        <circle cx="48" cy="48" r="36" stroke="currentColor" stroke-width="8" fill="transparent" 
                                class="text-pink-500 transition-all duration-1000 ease-out" 
                                stroke-dasharray="${2 * Math.PI * 36}" 
                                stroke-dashoffset="${2 * Math.PI * 36 * (1 - progress / 100)}" />
                     </svg>
                     <div class="absolute inset-0 flex items-center justify-center flex-col">
                        <span class="text-2xl font-black text-white">${progress}%</span>
                     </div>
                </div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Progresso Globale</p>
            </div>`;
    },

    renderWidgetNextDeadline() {
        const activeGoals = this.goals.filter(g => !g.completed).sort((a,b) => new Date(a.targetDate) - new Date(b.targetDate));
        const goal = activeGoals[0];

        if (!goal) return this._renderEmptyWidget('Nessuna scadenza imminente');

        const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        const total = goal.subtasks?.length || 0;
        const done = goal.subtasks?.filter(s => s.completed).length || 0;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        // Logica Colori Urgenza
        let bgGradient = "from-slate-800/60 to-slate-900/60";
        let borderColor = "border-slate-700/50";
        let dateColor = "text-slate-400";
        let icon = "⏳";
        
        if (daysLeft < 3) {
            bgGradient = "from-red-900/40 to-slate-900/80";
            borderColor = "border-red-500/50";
            dateColor = "text-red-400 animate-pulse font-black";
            icon = "🚨";
        } else if (daysLeft < 7) {
            bgGradient = "from-orange-900/30 to-slate-900/70";
            borderColor = "border-orange-500/40";
            dateColor = "text-orange-400";
            icon = "⚠️";
        } else if (daysLeft < 30) {
             bgGradient = "from-yellow-900/20 to-slate-900/70";
             dateColor = "text-yellow-400";
        }

        return `
            <div class="h-full bg-gradient-to-br ${bgGradient} backdrop-blur-md rounded-[2.5rem] p-7 border ${borderColor} shadow-xl flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all" onclick="Goals.showEditModal('${goal.id}')">
                
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2.5">
                        <span class="text-2xl">${icon}</span>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Scadenza Vicina</p>
                            <h4 class="text-xl font-bold text-white leading-tight line-clamp-1">${goal.title}</h4>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="block text-3xl font-black ${dateColor}">${daysLeft}</span>
                        <span class="text-[9px] font-bold text-slate-500 uppercase">Giorni</span>
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <span>Avanzamento</span>
                        <span>${done}/${total} step</span>
                    </div>
                    <div class="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000" style="width: ${percent}%"></div>
                    </div>
                    <div class="flex items-center gap-2 pt-1">
                        <span class="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-300 border border-slate-700">📅 ${Helpers.formatDate(goal.targetDate, 'short')}</span>
                        ${percent > 80 ? '<span class="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30">Quasi fatto!</span>' : ''}
                    </div>
                </div>
            </div>`;
    },

    _renderEmptyWidget(msg) {
        return `<div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] border border-slate-700/40 flex items-center justify-center text-slate-500"><p class="text-xs font-bold uppercase tracking-widest">${msg}</p></div>`;
    },

    // ============================================================
    //  MODALS & CRUD OPERATIONS
    // ============================================================

    showAddModal() {
        const modalHTML = `
            <div id="goalModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 animate-slideUp my-8">
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h3 class="text-2xl font-bold text-white">✨ Nuovo Obiettivo</h3>
                        <button onclick="Goals.closeModal()" class="text-white/80 hover:text-white transition">✕</button>
                    </div>
                    <form onsubmit="Goals.handleAddGoal(event)" class="p-6 space-y-6">
                        <div><label class="block text-sm font-semibold text-slate-300 mb-2">Titolo</label><input type="text" id="goalTitle" required class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"></div>
                        <div><label class="block text-sm font-semibold text-slate-300 mb-2">Descrizione</label><textarea id="goalDescription" rows="3" class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"></textarea></div>
                        <div><label class="block text-sm font-semibold text-slate-300 mb-2">Scadenza</label><input type="date" id="goalTargetDate" required class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"></div>
                        <div>
                            <div class="flex items-center justify-between mb-3"><label class="text-sm font-semibold text-slate-300">Subtask</label><button type="button" onclick="Goals.addSubtaskField()" class="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-bold">➕ Aggiungi</button></div>
                            <div id="subtasksList" class="space-y-2 max-h-64 overflow-y-auto pr-2"></div>
                        </div>
                        <div class="flex gap-3 pt-4"><button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-bold">Salva</button><button type="button" onclick="Goals.closeModal()" class="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg font-bold">Annulla</button></div>
                    </form>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const now = new Date();
        document.getElementById('goalTargetDate').value = new Date(now.getFullYear(), Helpers.getQuarter(now) * 3, 0).toISOString().split('T')[0];
        this.addSubtaskField();
    },

    addSubtaskField() {
        const id = Date.now() + Math.random();
        const html = `
            <div class="flex gap-2 animate-slideUp" id="subtask-${id}">
                <input type="text" class="flex-1 bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none subtask-input" placeholder="Step intermedio...">
                <button type="button" onclick="document.getElementById('subtask-${id}').remove()" class="px-3 bg-red-500/20 text-red-400 rounded-lg">🗑️</button>
            </div>`;
        document.getElementById('subtasksList').insertAdjacentHTML('beforeend', html);
    },

    async handleAddGoal(e) {
        e.preventDefault();
        const subtasks = Array.from(document.querySelectorAll('.subtask-input')).map(i => i.value.trim()).filter(v => v).map(title => ({ title, completed: false }));
        const data = {
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            targetDate: document.getElementById('goalTargetDate').value,
            subtasks: subtasks,
            completed: false
        };
        await CachedCRUD.createGoal(data);
        this.closeModal();
        await this.loadData();
        this.render();
        if (window.Dashboard) Dashboard.refreshWidgetsData();
        Helpers.showToast('Obiettivo creato 🚀');
    },

    showEditModal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;
        const modalHTML = `
            <div id="goalModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 animate-slideUp my-8">
                    <div class="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h3 class="text-2xl font-bold text-white">✏️ Modifica</h3>
                        <button onclick="Goals.closeModal()" class="text-white/80 hover:text-white">✕</button>
                    </div>
                    <form onsubmit="Goals.handleEditGoal(event, '${goal.id}')" class="p-6 space-y-6">
                        <div><label class="block text-sm font-semibold text-slate-300 mb-2">Titolo</label><input type="text" id="goalTitle" required value="${Helpers.escapeHtml(goal.title)}" class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"></div>
                        <div><label class="block text-sm font-semibold text-slate-300 mb-2">Descrizione</label><textarea id="goalDescription" rows="3" class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none resize-none">${Helpers.escapeHtml(goal.description || '')}</textarea></div>
                        <div><label class="block text-sm font-semibold text-slate-300 mb-2">Scadenza</label><input type="date" id="goalTargetDate" required value="${goal.targetDate}" class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"></div>
                        <div>
                            <div class="flex items-center justify-between mb-3"><label class="text-sm font-semibold text-slate-300">Subtask</label><button type="button" onclick="Goals.addSubtaskField()" class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-bold">➕ Aggiungi</button></div>
                            <div id="subtasksList" class="space-y-2 max-h-64 overflow-y-auto pr-2">
                                ${goal.subtasks.map(st => `
                                    <div class="flex gap-2 items-center">
                                        <input type="checkbox" ${st.completed ? 'checked' : ''} class="w-5 h-5 subtask-completed accent-green-500">
                                        <input type="text" value="${Helpers.escapeHtml(st.title)}" class="flex-1 bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-2 text-white subtask-input">
                                        <button type="button" onclick="this.parentElement.remove()" class="px-3 bg-red-500/20 text-red-400 rounded-lg">🗑️</button>
                                    </div>`).join('')}
                            </div>
                        </div>
                        <div class="flex gap-3 pt-4"><button type="submit" class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg font-bold">Salva</button><button type="button" onclick="Goals.closeModal()" class="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg font-bold">Annulla</button></div>
                    </form>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    async handleEditGoal(e, id) {
        e.preventDefault();
        const subtasks = Array.from(document.querySelectorAll('#subtasksList > div')).map(el => ({
            title: el.querySelector('.subtask-input').value.trim(),
            completed: el.querySelector('.subtask-completed').checked
        })).filter(s => s.title);
        
        const data = {
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            targetDate: document.getElementById('goalTargetDate').value,
            subtasks: subtasks
        };
        await CachedCRUD.updateGoal(id, data);
        this.closeModal();
        await this.loadData();
        this.render();
        if (window.Dashboard) Dashboard.refreshWidgetsData();
        Helpers.showToast('Modifiche salvate ✅');
    },

    closeModal() { document.getElementById('goalModal')?.remove(); },

    async handleToggleSubtask(goalId, idx) {
        await CachedCRUD.toggleGoalSubtask(goalId, idx);
        await this.loadData();
        this.render();
        if (window.Dashboard) Dashboard.refreshWidgetsData();
    },

    async handleDeleteGoal(id) {
        if (confirm('Eliminare definitivamente?')) {
            await CachedCRUD.deleteGoal(id);
            await this.loadData();
            this.render();
            if (window.Dashboard) Dashboard.refreshWidgetsData();
            Helpers.showToast('Eliminato 🗑️');
        }
    },
    
    setView(v) { this.currentView = v; this.render(); }
};

window.Goals = Goals;

// ==========================================
// REGISTRAZIONE MODULARE
// ==========================================
if (window.ModuleManager) {
    ModuleManager.register({
        id: 'goals',
        dbKey: 'goals_enabled',
        name: 'Obiettivi',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>',
        category: 'growth',
        order: 20,
        init: () => Goals.init(),
        render: () => Goals.render(),
        // ESPORTAZIONE WIDGET DASHBOARD
        widgets: Goals.getWidgets()
    });
}