/**
 * Dashboard Component - ULTRA PREMIUM RESTORED
 * Grafica originale completa + Aggiornamento Real-Time dei Moduli.
 */
const Dashboard = {
    isInitialized: false,
    updateInProgress: false,

    async init() {
        if (this._listenersReady) return;
        
        // Se i dati cambiano (es. attivi un modulo), ridisegna tutto
        EventBus.on('dataChanged', () => {
            if (!document.getElementById('dashboardContent').classList.contains('hidden')) {
                this.render(); 
            }
        });
        
        this._listenersReady = true;
        await this.render();
    },

    // Funzione Helper: Recupera lo stato PIÙ AGGIORNATO (Memoria o Cache)
    getCurrentStates() {
        if (window.ModulesHub && ModulesHub.states) {
            return ModulesHub.states;
        }
        const cached = localStorage.getItem('myfinance_module_states');
        if (cached) return JSON.parse(cached);
        
        return { expenses_enabled: false, goals_enabled: false };
    },

    async render() {
        const container = document.getElementById('dashboardContent');
        if (!container) return;

        // 1. Ridisegna la struttura (Layout a colonne dinamico)
        this.renderStructure(container);
        this.isInitialized = true;

        // 2. Aggiorna i valori numerici
        await this.updateValues();
    },

    renderStructure(container) {
        const { expenses_enabled, goals_enabled } = this.getCurrentStates();

        // Se expenses è OFF, la colonna principale si allarga
        const mainColSpan = expenses_enabled ? 'lg:col-span-8' : 'lg:col-span-12';

        container.innerHTML = `
            <div class="mb-10 animate-fadeIn">
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent italic">Overview</h2>
                        <p class="text-slate-400 mt-2 font-medium flex items-center gap-2">
                            <span class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            Il tuo centro di controllo operativo.
                        </p>
                    </div>
                    <div class="bg-slate-800/40 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-slate-700/50 shadow-2xl">
                        <span id="header-date" class="text-sm font-bold text-slate-200 tracking-tight"></span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                
                ${this.renderKPICard('Task Attivi', 'kpi-tasks-val', '📅', 'from-blue-600 to-indigo-700', 'Pianificati Oggi', 
                    `showSection('agenda'); setTimeout(() => Agenda.showAddModal(), 100)`)}
                
                ${goals_enabled ? this.renderKPICard('Obiettivi', 'kpi-goals-val', '🎯', 'from-purple-600 to-pink-700', 'Focus Traguardi', 
                    `showSection('goals'); setTimeout(() => Goals.showAddModal(), 100)`) : ''}
                
                ${expenses_enabled ? this.renderKPICard('Spese Mese', 'kpi-expenses-val', '💰', 'from-rose-600 to-pink-700', 'Uscite Totali', 
                    `showSection('expenses'); setTimeout(() => ExpenseModals.showAdd(), 100)`) : ''}
                
                ${this.renderKPICard('Completati', 'kpi-completed-val', '✅', 'from-emerald-600 to-teal-700', 'Attività concluse')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div class="${mainColSpan} space-y-8">
                    
                    <div class="bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-xl group">
                        <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-3 transition-transform">
                                    <span class="text-2xl">📅</span>
                                </div>
                                <h3 class="text-2xl font-bold text-white tracking-tight">Priorità in Agenda</h3>
                            </div>
                            <span id="active-tasks-badge" class="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20"></span>
                        </div>
                        <div id="tasks-list-container" class="space-y-4"></div>
                    </div>

                    ${goals_enabled ? `
                        <div class="bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-8 border border-slate-700/40 shadow-xl animate-fadeIn">
                            <div class="flex items-center justify-between mb-8">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <span class="text-2xl">🎯</span>
                                    </div>
                                    <h3 class="text-2xl font-bold text-white tracking-tight">Focus Obiettivi</h3>
                                </div>
                            </div>
                            <div id="dashboard-goals-container" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
                        </div>
                    ` : ''}
                </div>

                ${expenses_enabled ? `
                    <div class="lg:col-span-4 animate-fadeIn">
                        <div class="bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 h-full">
                            <h3 class="font-bold text-white mb-8 flex items-center gap-3 px-2">
                                <span class="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center text-sm">💰</span>
                                Ultime Uscite
                            </h3>
                            <div id="recent-expenses-container" class="space-y-3"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderKPICard(title, id, icon, gradient, subtext, actionClick = null) {
        const actionHtml = actionClick ? `
            <button onclick="${actionClick}" 
                    class="group/btn relative w-12 h-12 bg-white/20 hover:bg-white text-white hover:text-indigo-900 backdrop-blur-md rounded-2xl border border-white/20 transition-all duration-300 hover:scale-110 active:scale-90 shadow-xl flex items-center justify-center">
                <span class="text-2xl font-bold transform group-hover/btn:rotate-90 transition-transform">＋</span>
            </button>
        ` : '';

        return `
            <div class="relative overflow-hidden bg-gradient-to-br ${gradient} rounded-[2.5rem] shadow-2xl p-7 text-white group transition-all duration-500 animate-fadeIn">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl group-hover:bg-white/20 transition-all"></div>
                
                <div class="relative flex justify-between items-start mb-1">
                    <div class="flex-1">
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">${title}</p>
                        <p id="${id}" class="text-5xl font-black tracking-tighter leading-none">-</p>
                    </div>
                    <div class="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10 group-hover:rotate-6 transition-transform">
                        ${icon}
                    </div>
                </div>

                <div class="relative flex items-end justify-between mt-8">
                    <p class="text-[9px] font-bold opacity-50 uppercase tracking-widest max-w-[100px] leading-tight">${subtext}</p>
                    ${actionHtml}
                </div>
            </div>`;
    },

    async updateValues() {
        if (this.updateInProgress) return;
        this.updateInProgress = true;

        try {
            const { expenses_enabled, goals_enabled } = this.getCurrentStates();

            // 1. Task (Sempre presenti)
            const tasks = await CachedCRUD.getTasks().catch(() => []);
            
            // Calcolo conteggi
            const todayStr = new Date().toDateString();
            const tomorrowStr = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
            const activeTasks = tasks.filter(t => !t.completed);
            const todayCount = activeTasks.filter(t => new Date(t.date).toDateString() === todayStr).length;
            const tomorrowCount = activeTasks.filter(t => new Date(t.date).toDateString() === tomorrowStr).length;

            this.setSafeText('kpi-tasks-val', todayCount);
            this.setSafeText('kpi-completed-val', tasks.filter(t => t.completed).length);
            this.setSafeText('active-tasks-badge', `${todayCount} OGGI, ${tomorrowCount} DOMANI`);
            this.setSafeText('header-date', Helpers.formatDate(new Date(), 'full'));

            this.updateTasksList(tasks); // Qui usiamo la versione "Ricca"

            // 2. Spese
            if (expenses_enabled) {
                const expenses = await CachedCRUD.getExpenses().catch(() => []);
                const total = expenses.filter(e => e.type !== 'income').reduce((sum, e) => sum + Math.abs(e.amount), 0);
                this.setSafeText('kpi-expenses-val', Helpers.formatCurrency(total));
                this.updateRecentExpenses(expenses);
            }

            // 3. Goals
            if (goals_enabled) {
                const goals = await CachedCRUD.getGoals().catch(() => []);
                this.setSafeText('kpi-goals-val', goals.filter(g => !g.completed).length);
                this.updateGoalsList(goals);
            }

        } catch (e) {
            console.error('Dashboard Update Failed:', e);
        } finally {
            this.updateInProgress = false;
        }
    },

    setSafeText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    // RIPRISTINATA LA LISTA TASK "PREMIUM" (Con sezioni Oggi, Domani, In Arrivo)
    updateTasksList(tasks) {
        const container = document.getElementById('tasks-list-container');
        if (!container) return;

        const now = new Date();
        const todayStr = now.toDateString();
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        const activeTasks = tasks.filter(t => !t.completed);
        const todayTasks = activeTasks.filter(t => new Date(t.date).toDateString() === todayStr);
        const tomorrowTasks = activeTasks.filter(t => new Date(t.date).toDateString() === tomorrowStr);
        const upcomingTasks = activeTasks
            .filter(t => new Date(t.date) > tomorrow)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3);

        if (todayTasks.length === 0 && tomorrowTasks.length === 0 && upcomingTasks.length === 0) {
            container.innerHTML = `<div class="p-12 text-center border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 font-medium">Nessun task in programma ☕</div>`;
            return;
        }

        let html = '';
        if (todayTasks.length > 0) {
            html += `<div class="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4 pl-2 opacity-60">Oggi</div>`;
            html += todayTasks.map(t => this.renderTaskRow(t)).join('');
        }
        if (tomorrowTasks.length > 0) {
            html += `<div class="text-[10px] font-black uppercase text-purple-400 tracking-widest mt-8 mb-4 pl-2 opacity-60">Domani</div>`;
            html += tomorrowTasks.map(t => this.renderTaskRow(t)).join('');
        }
        if (upcomingTasks.length > 0) {
            html += `<div class="text-[10px] font-black uppercase text-amber-400 tracking-widest mt-8 mb-4 pl-2 opacity-60">In Arrivo</div>`;
            html += upcomingTasks.map(t => this.renderTaskRow(t)).join('');
        }
        container.innerHTML = html;
    },

    renderTaskRow(t) {
        const timeLabel = Helpers.formatDate(t.date, 'time');
        return `
            <div class="flex items-start gap-5 p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:bg-slate-800/80 hover:border-indigo-500/30 transition-all cursor-default mb-3 group">
                <button onclick="Dashboard.handleToggleTask('${t.id}')" class="mt-1 w-6 h-6 rounded-full border-2 border-slate-500 group-hover:border-indigo-400 flex items-center justify-center transition-colors shrink-0">
                    <div class="w-2.5 h-2.5 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-4">
                        <p class="font-bold text-slate-200 group-hover:text-white transition-colors truncate text-lg tracking-tight">${Helpers.escapeHtml(t.title)}</p>
                        <span class="text-[10px] font-black text-slate-500 uppercase bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50 whitespace-nowrap">${timeLabel}</span>
                    </div>
                </div>
                <button onclick="showSection('agenda')" class="p-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    ✏️
                </button>
            </div>`;
    },

    updateRecentExpenses(expenses) {
        const container = document.getElementById('recent-expenses-container');
        if (!container) return;
        const recent = expenses.filter(e => e.type !== 'income').sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
        container.innerHTML = recent.map(e => `
            <div class="flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl transition-colors border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg shadow-inner">${window.Categories?.getById(e.category)?.icon || '📦'}</div>
                    <div class="min-w-0"><p class="font-bold text-slate-200 text-sm truncate">${Helpers.escapeHtml(e.description)}</p><p class="text-[10px] text-slate-500 font-bold uppercase">${Helpers.formatDate(e.date, 'short')}</p></div>
                </div>
                <span class="font-black text-red-400 text-sm">-${Helpers.formatCurrency(Math.abs(e.amount))}</span>
            </div>`).join('') || '<p class="text-slate-600 text-center py-4">Nessuna spesa recente</p>';
    },

    updateGoalsList(goals) {
        const container = document.getElementById('dashboard-goals-container');
        if (!container) return;
        const active = goals.filter(g => !g.completed).slice(0, 2);
        
        container.innerHTML = active.map(g => {
            const total = g.subtasks?.length || 0;
            const completed = g.subtasks?.filter(s => s.completed).length || 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            return `
            <div class="p-6 bg-slate-800/40 border border-slate-700/50 rounded-[2rem] hover:border-purple-500/30 transition-all group animate-fadeIn">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="font-bold text-white text-xl tracking-tight">${Helpers.escapeHtml(g.title)}</h4>
                    <span class="text-2xl font-black text-purple-400">${percent}%</span>
                </div>
                <div class="h-2 w-full bg-slate-900 rounded-full overflow-hidden mb-4">
                    <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000" style="width: ${percent}%"></div>
                </div>
                <button onclick="showSection('goals')" class="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors">Vedi Dettagli →</button>
            </div>`;
        }).join('') || `<div class="col-span-full p-12 text-center border-2 border-dashed border-slate-700 rounded-3xl text-slate-500 font-medium italic">Pianifica nuovi traguardi 🎯</div>`;
    },

    async handleToggleTask(taskId) {
        await CachedCRUD.toggleTaskCompleted(taskId);
        // EventBus attiverà il refresh automatico
    }
};

window.Dashboard = Dashboard;