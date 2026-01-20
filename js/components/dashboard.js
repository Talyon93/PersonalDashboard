/**
 * Dashboard Component - Improved Version
 * Features:
 * - Show nearest upcoming tasks if today/tomorrow empty
 * - Clickable KPI cards that navigate to sections
 * - Completed tasks modal
 * - Task descriptions visible
 * - Goal subgoals and status visible
 */

const Dashboard = {
    
    async init() {
        console.log('📊 Dashboard.init()');
        
        // Subscribe to data change events
        this.setupEventListeners();
        
        await this.render();
    },

    setupEventListeners() {
        // Listen for any data changes
        EventBus.on('dataChanged', (data) => {
            console.log('📊 Dashboard: Data changed, refreshing...', data);
            
            // Only refresh if Dashboard is visible
            const dashboardContent = document.getElementById('dashboardContent');
            if (dashboardContent && !dashboardContent.classList.contains('hidden')) {
                this.render();
            }
        });

        // Listen for specific events if needed
        EventBus.on('taskUpdated', () => {
            console.log('📊 Dashboard: Task updated, refreshing...');
            const dashboardContent = document.getElementById('dashboardContent');
            if (dashboardContent && !dashboardContent.classList.contains('hidden')) {
                this.render();
            }
        });
    },

    async render() {
        const container = document.getElementById('dashboardContent');
        
        // Show beautiful loading state
        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <div class="relative">
                        <div class="w-20 h-20 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div class="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                    </div>
                    <p class="text-gray-600 mt-6 font-medium animate-pulse">Caricamento Dashboard...</p>
                </div>
            </div>
        `;
        
        try {
            // Load data from cache (much faster!)
            const [tasks, expenses, goals] = await Promise.all([
                CachedCRUD.getTasks(),
                CachedCRUD.getExpenses(),
                CachedCRUD.getGoals()
            ]);

            // Calculate statistics
            const stats = this.calculateStats(tasks, expenses, goals);

            container.innerHTML = `
                <!-- Header -->
                <div class="mb-8 animate-fadeIn">
                    <div class="flex items-center justify-between mb-2">
                        <h2 class="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Benvenuto! 👋
                        </h2>
                        <div class="flex items-center gap-2 text-sm text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${Helpers.formatDate(new Date(), 'full')}
                        </div>
                    </div>
                    <p class="text-slate-400">Ecco la tua panoramica personale</p>
                </div>

                <!-- Stats Cards - Clickable -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    ${this.renderStatCard('Task Oggi', stats.todayTasks, '📅', 'from-blue-500 to-cyan-600', 0.1, "showSection('agenda')")}
                    ${this.renderStatCard('Obiettivi Attivi', stats.activeGoals, '🎯', 'from-purple-500 to-pink-600', 0.2, "showSection('goals')")}
                    ${this.renderStatCard('Spese Mese', Helpers.formatCurrency(stats.monthExpenses), '💰', 'from-green-500 to-emerald-600', 0.3, "showSection('expenses')")}
                    ${this.renderStatCard('Completati', stats.completedTasks, '✅', 'from-orange-500 to-red-600', 0.4, "Dashboard.showCompletedTasksModal()")}
                </div>

                <!-- Main Content Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    <!-- Task Oggi e Domani - DARK -->
                    <div class="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 animate-slideUp">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span class="text-2xl">📅</span>
                                </div>
                                Task Oggi & Domani
                            </h3>
                            <div class="px-4 py-2 bg-blue-500/20 rounded-full border border-blue-500/30">
                                <span class="text-sm font-bold text-blue-400">${stats.todayTasks + stats.tomorrowTasks} attivi</span>
                            </div>
                        </div>
                        ${this.renderTodayTomorrowTasks(tasks)}
                    </div>

                    <!-- Quick Actions - DARK -->
                    <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 animate-slideUp" style="animation-delay: 0.1s;">
                        <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span class="text-3xl">⚡</span>
                            Azioni Rapide
                        </h3>
                        <div class="space-y-3">
                            ${this.renderQuickAction('➕', 'Aggiungi Task', 'from-blue-500 to-cyan-600', "showSection('agenda'); setTimeout(() => Agenda.showAddModal(), 100)")}
                            ${this.renderQuickAction('🎯', 'Nuovo Obiettivo', 'from-purple-500 to-pink-600', "showSection('goals'); setTimeout(() => Goals.showAddModal(), 100)")}
                            ${this.renderQuickAction('💵', 'Registra Spesa', 'from-green-500 to-emerald-600', "showSection('expenses'); setTimeout(() => ExpenseModals.showAdd(), 100)")}
                        </div>
                        
                        <!-- Mini Stats -->
                        <div class="mt-6 pt-6 border-t border-slate-700">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center p-3 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl border border-slate-700/50">
                                    <div class="text-2xl font-bold text-white">${stats.completionRate}%</div>
                                    <div class="text-xs text-slate-400 mt-1">Completamento</div>
                                </div>
                                <div class="text-center p-3 bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl border border-slate-700/50">
                                    <div class="text-2xl font-bold text-white">${stats.totalTasks}</div>
                                    <div class="text-xs text-slate-400 mt-1">Task Totali</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Obiettivi in Corso - DARK -->
                    <div class="lg:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 animate-slideUp" style="animation-delay: 0.2s;">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span class="text-2xl">🎯</span>
                                </div>
                                Obiettivi in Corso
                            </h3>
                            <button onclick="showSection('goals')" class="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-full transition text-sm font-semibold text-purple-400 border border-purple-500/30">
                                Vedi tutti →
                            </button>
                        </div>
                        <div class="space-y-4">
                            ${this.renderGoalsProgress(goals)}
                        </div>
                    </div>

                    <!-- Spese Recenti - DARK -->
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all duration-300 animate-slideUp" style="animation-delay: 0.3s;">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                                <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <span class="text-2xl">💰</span>
                                </div>
                                Spese Recenti
                            </h3>
                        </div>
                        <div class="space-y-3">
                            ${this.renderRecentExpenses(expenses)}
                        </div>
                        <button onclick="showSection('expenses')" class="w-full mt-4 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition text-sm font-semibold text-green-400 border border-green-500/30">
                            Vedi tutte le spese →
                        </button>
                    </div>

                </div>
            `;
        } catch (e) {
            console.error('Dashboard render error:', e);
            container.innerHTML = `
                <div class="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 text-center animate-shake">
                    <div class="text-6xl mb-4">😵</div>
                    <h3 class="text-2xl font-bold text-red-800 mb-2">Ops! Qualcosa è andato storto</h3>
                    <p class="text-red-600 mb-6">${e.message}</p>
                    <button onclick="Dashboard.render()" class="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition shadow-lg font-semibold">
                        🔄 Riprova
                    </button>
                </div>
            `;
        }
    },

    renderStatCard(title, value, icon, gradient, delay, onclick) {
        return `
            <div onclick="${onclick}" class="stat-card group bg-gradient-to-br ${gradient} rounded-2xl shadow-xl p-6 text-white hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20 animate-fadeIn" style="animation-delay: ${delay}s;">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-medium opacity-90 mb-2">${title}</p>
                        <p class="text-4xl font-black tracking-tight">${value}</p>
                    </div>
                    <div class="text-6xl opacity-80 group-hover:scale-110 transition-transform duration-300">${icon}</div>
                </div>
                <div class="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div class="h-full bg-white/40 rounded-full animate-pulse" style="width: 70%"></div>
                </div>
            </div>
        `;
    },

    renderQuickAction(icon, text, gradient, onclick) {
        return `
            <button onclick="${onclick}" class="w-full flex items-center gap-4 p-4 bg-gradient-to-r ${gradient} rounded-xl hover:scale-[1.02] transition-all duration-200 shadow-lg group border border-white/20">
                <div class="text-3xl group-hover:scale-110 transition-transform">${icon}</div>
                <span class="text-white font-semibold text-lg flex-1 text-left">${text}</span>
                <svg class="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </button>
        `;
    },

    calculateStats(tasks, expenses, goals) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Task oggi (non completati)
        const todayTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate.toDateString() === today.toDateString() && !task.completed;
        }).length;

        // Task domani (non completati)
        const tomorrowTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate.toDateString() === tomorrow.toDateString() && !task.completed;
        }).length;

        // Task completati
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;

        // Completion rate
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Obiettivi attivi (non completati)
        const activeGoals = goals.filter(g => !g.completed).length;

        // Spese del mese corrente (usando custom month range)
        const { start, end } = Helpers.getCustomMonthRange(now.getFullYear(), now.getMonth());
        
        const monthExpenses = expenses
            .filter(e => {
                // Exclude income
                if (e.type === 'income') return false;
                
                // Exclude investments
                if (e.tags && e.tags.some(tag => 
                    ['Investimenti', 'Risparmi', 'Trasferimenti'].includes(tag)
                )) return false;
                
                const expDate = new Date(e.date.split(' ')[0].split('T')[0] + 'T12:00:00');
                return expDate >= start && expDate <= end;
            })
            .reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);

        return {
            todayTasks,
            tomorrowTasks,
            completedTasks,
            totalTasks,
            completionRate,
            activeGoals,
            monthExpenses
        };
    },

    renderTodayTomorrowTasks(tasks) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Task di oggi
        const todayTasks = tasks
            .filter(task => {
                if (task.completed) return false;
                const taskDate = new Date(task.date);
                return taskDate.toDateString() === today.toDateString();
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Task di domani
        const tomorrowTasks = tasks
            .filter(task => {
                if (task.completed) return false;
                const taskDate = new Date(task.date);
                return taskDate.toDateString() === tomorrow.toDateString();
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Se entrambi vuoti, trova i prossimi task
        let upcomingTasks = [];
        if (todayTasks.length === 0 && tomorrowTasks.length === 0) {
            upcomingTasks = tasks
                .filter(task => {
                    if (task.completed) return false;
                    const taskDate = new Date(task.date);
                    return taskDate > tomorrow; // Dopo domani
                })
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 5); // Mostra max 5 task
        }

        return `
            <!-- Oggi -->
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                        <span class="text-xl">📅</span>
                    </div>
                    <h4 class="text-xl font-bold text-white">
                        Oggi
                        <span class="ml-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold border border-blue-500/30">${todayTasks.length}</span>
                    </h4>
                </div>
                ${todayTasks.length === 0 ? 
                    '<div class="text-center py-8 bg-slate-700/30 rounded-xl border border-slate-600"><p class="text-slate-400">Nessun task per oggi 🎉</p></div>' :
                    '<div class="space-y-2">' + todayTasks.map(task => this.renderTaskItem(task)).join('') + '</div>'
                }
            </div>

            <!-- Domani -->
            <div class="mb-8">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <span class="text-xl">📆</span>
                    </div>
                    <h4 class="text-xl font-bold text-white">
                        Domani
                        <span class="ml-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold border border-purple-500/30">${tomorrowTasks.length}</span>
                    </h4>
                </div>
                ${tomorrowTasks.length === 0 ? 
                    '<div class="text-center py-8 bg-slate-700/30 rounded-xl border border-slate-600"><p class="text-slate-400">Nessun task per domani</p></div>' :
                    '<div class="space-y-2">' + tomorrowTasks.map(task => this.renderTaskItem(task)).join('') + '</div>'
                }
            </div>

            <!-- Prossimi task (se oggi e domani vuoti) -->
            ${upcomingTasks.length > 0 ? `
                <div>
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                            <span class="text-xl">🔮</span>
                        </div>
                        <h4 class="text-xl font-bold text-white">
                            Prossimi Task
                            <span class="ml-2 px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold border border-orange-500/30">${upcomingTasks.length}</span>
                        </h4>
                    </div>
                    <div class="space-y-2">
                        ${upcomingTasks.map(task => this.renderTaskItem(task, true)).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    },

    renderTaskItem(task, showDate = false) {
        const isOverdue = Helpers.isOverdue(task.date);
        const hasDescription = task.description && task.description.trim();
        
        return `
            <div class="group flex items-start gap-4 p-4 border-2 ${isOverdue ? 'border-red-500/50 bg-red-900/20' : 'border-slate-600 bg-slate-700/30'} rounded-xl hover:border-blue-500/50 hover:bg-slate-700/50 transition-all duration-200">
                <button onclick="Dashboard.handleToggleTask('${task.id}')" class="mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 border-slate-400 hover:border-blue-400 transition-colors flex items-center justify-center">
                    <svg class="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                    </svg>
                </button>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-white mb-1">${Helpers.escapeHtml(task.title)}</p>
                    ${hasDescription ? `<p class="text-sm text-slate-400 mb-2 line-clamp-2">${Helpers.escapeHtml(task.description)}</p>` : ''}
                    <div class="flex items-center gap-3 flex-wrap">
                        ${showDate ? `
                            <span class="inline-flex items-center gap-1 text-sm text-slate-400">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                ${Helpers.formatDate(task.date, 'short')}
                            </span>
                        ` : ''}
                        <span class="inline-flex items-center gap-1 text-sm text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${Helpers.formatDate(task.date, 'time')}
                        </span>
                        ${task.priority ? `
                            <span class="px-2 py-0.5 bg-${this.getPriorityColor(task.priority)}-500/20 text-${this.getPriorityColor(task.priority)}-400 rounded text-xs font-semibold border border-${this.getPriorityColor(task.priority)}-500/30">
                                ${this.getPriorityLabel(task.priority)}
                            </span>
                        ` : ''}
                        ${isOverdue ? '<span class="px-2 py-0.5 bg-red-500/30 text-red-400 rounded text-xs font-semibold border border-red-500/50">In ritardo</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    },

    getPriorityColor(priority) {
        const colors = { high: 'red', medium: 'yellow', low: 'blue' };
        return colors[priority] || 'gray';
    },

    getPriorityLabel(priority) {
        const labels = { high: 'Alta', medium: 'Media', low: 'Bassa' };
        return labels[priority] || priority;
    },

    renderGoalsProgress(goals) {
        const activeGoals = goals
            .filter(g => !g.completed)
            .sort((a, b) => {
                // Sort by deadline if available
                if (a.deadline && b.deadline) {
                    return new Date(a.deadline) - new Date(b.deadline);
                }
                return 0;
            })
            .slice(0, 5); // Show max 5 goals

        if (activeGoals.length === 0) {
            return '<div class="text-center py-8 bg-slate-700/30 rounded-xl border border-slate-600"><p class="text-slate-400">Nessun obiettivo in corso</p></div>';
        }

        return activeGoals.map(goal => {
            const subtasks = goal.subtasks || [];
            const completedSubtasks = subtasks.filter(s => s.completed).length;
            const totalSubtasks = subtasks.length;
            const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

            return `
                <div class="p-4 bg-slate-700/30 rounded-xl border border-slate-600 hover:border-purple-500/50 transition-all duration-200">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h4 class="font-semibold text-white mb-1">${Helpers.escapeHtml(goal.title)}</h4>
                            ${goal.description ? `<p class="text-sm text-slate-400 mb-2 line-clamp-2">${Helpers.escapeHtml(goal.description)}</p>` : ''}
                        </div>
                        <div class="flex-shrink-0 ml-4">
                            <div class="relative w-16 h-16">
                                <svg class="transform -rotate-90" viewBox="0 0 36 36">
                                    <path class="text-slate-600" stroke="currentColor" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                    <path class="text-purple-500" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"></path>
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-sm font-bold text-white">${progress}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Subtasks Preview -->
                    ${totalSubtasks > 0 ? `
                        <div class="mt-3 pt-3 border-t border-slate-600">
                            <div class="text-xs text-slate-400 mb-2 font-semibold">Subtask (${completedSubtasks}/${totalSubtasks})</div>
                            <div class="space-y-1">
                                ${subtasks.slice(0, 3).map(subtask => `
                                    <div class="flex items-center gap-2 text-sm">
                                        <div class="w-4 h-4 rounded flex-shrink-0 ${subtask.completed ? 'bg-purple-500' : 'border-2 border-slate-500'}">
                                            ${subtask.completed ? '<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : ''}
                                        </div>
                                        <span class="${subtask.completed ? 'text-slate-500 line-through' : 'text-slate-300'}">${Helpers.escapeHtml(subtask.title)}</span>
                                    </div>
                                `).join('')}
                                ${subtasks.length > 3 ? `<div class="text-xs text-slate-500 ml-6">+${subtasks.length - 3} altri...</div>` : ''}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Deadline -->
                    ${goal.deadline ? `
                        <div class="mt-3 flex items-center gap-2 text-xs text-slate-400">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            Scadenza: ${Helpers.formatDate(goal.deadline, 'short')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    renderRecentExpenses(expenses) {
        const recentExpenses = expenses
            .filter(e => e.type !== 'income') // Exclude income
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentExpenses.length === 0) {
            return '<div class="text-center py-8 bg-slate-700/30 rounded-xl border border-slate-600"><p class="text-slate-400">Nessuna spesa recente</p></div>';
        }

        return recentExpenses.map(expense => {
            const amount = Math.abs(parseFloat(expense.amount));
            const isExpense = amount > 0;

            return `
                <div class="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600 hover:border-green-500/50 transition-all duration-200">
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-white truncate">${Helpers.escapeHtml(expense.description)}</p>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-xs text-slate-400">${Helpers.formatDate(expense.date, 'short')}</span>
                            ${expense.tags && expense.tags[0] ? 
                                `<span class="px-2 py-0.5 bg-slate-600/50 text-slate-300 rounded text-xs">${expense.tags[0]}</span>` 
                                : ''}
                        </div>
                    </div>
                    <div class="text-right ml-4">
                        <div class="text-lg font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}">
                            ${isExpense ? '-' : '+'}${Helpers.formatCurrency(amount)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    async handleToggleTask(taskId) {
        try {
            await CachedCRUD.toggleTaskCompleted(taskId);
            Helpers.showToast('Task completato!', 'success');
            this.render(); // Refresh dashboard
        } catch (e) {
            console.error('Error toggling task:', e);
            Helpers.showToast('Errore nell\'aggiornamento', 'error');
        }
    },

    async showCompletedTasksModal() {
        try {
            const tasks = await CachedCRUD.getTasks();
            const completedTasks = tasks
                .filter(t => t.completed)
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const modalHTML = `
                <div id="completedTasksModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
                    <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700 animate-slideUp">
                        <!-- Header -->
                        <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
                            <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                                <span class="text-3xl">✅</span>
                                Task Completati
                            </h3>
                            <button onclick="document.getElementById('completedTasksModal').remove()" class="text-white/80 hover:text-white transition">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                            ${completedTasks.length === 0 ? `
                                <div class="text-center py-12">
                                    <div class="text-6xl mb-4">🎉</div>
                                    <p class="text-slate-400 text-lg">Nessun task completato ancora</p>
                                </div>
                            ` : `
                                <div class="space-y-3">
                                    ${completedTasks.map(task => `
                                        <div class="p-4 bg-slate-700/50 rounded-xl border border-slate-600">
                                            <div class="flex items-start gap-3">
                                                <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                                    </svg>
                                                </div>
                                                <div class="flex-1">
                                                    <p class="font-semibold text-white mb-1">${Helpers.escapeHtml(task.title)}</p>
                                                    ${task.description ? `<p class="text-sm text-slate-400 mb-2">${Helpers.escapeHtml(task.description)}</p>` : ''}
                                                    <div class="flex items-center gap-3 text-xs text-slate-500">
                                                        <span>📅 ${Helpers.formatDate(task.date, 'short')}</span>
                                                        ${task.completedAt ? `<span>✅ Completato: ${Helpers.formatDate(task.completedAt, 'short')}</span>` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);

            // Close on click outside
            document.getElementById('completedTasksModal').addEventListener('click', (e) => {
                if (e.target.id === 'completedTasksModal') {
                    e.target.remove();
                }
            });
        } catch (e) {
            console.error('Error showing completed tasks:', e);
            Helpers.showToast('Errore nel caricamento dei task completati', 'error');
        }
    }
};

// Export globale
window.Dashboard = Dashboard;
console.log('✅ Improved Dashboard module loaded');
