/**
 * Agenda WOW - Final Version
 * Features: Completed tasks view, no debug
 */

const Agenda = {
    currentDate: new Date(),
    currentView: 'calendar',
    filterView: 'all',
    showCompleted: false,
    tasks: [],

    async init() {
        console.log('📅 Agenda.init()');
        await this.loadTasks();
        await this.render();
    },

    async loadTasks() {
        try {
            this.tasks = await CachedCRUD.getTasks();
        } catch (e) {
            console.error('Error loading tasks:', e);
            this.tasks = [];
        }
    },

    async render() {
        const container = document.getElementById('agendaContent');
        
        const activeTasks = this.tasks.filter(t => !t.completed).length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        
        container.innerHTML = `
            <div class="p-6 animate-fadeIn">
                <!-- Header -->
                <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-4">
                        <h2 class="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            📅 Agenda
                        </h2>
                        
                        <!-- View Toggle -->
                        <div class="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button onclick="Agenda.setView('calendar')" 
                                    class="px-4 py-2 rounded-md transition-all text-sm font-semibold ${this.currentView === 'calendar' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}">
                                📅 Calendario
                            </button>
                            <button onclick="Agenda.setView('list')" 
                                    class="px-4 py-2 rounded-md transition-all text-sm font-semibold ${this.currentView === 'list' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}">
                                📋 Lista
                            </button>
                        </div>
                        
                        <!-- Stats -->
                        <div class="flex items-center gap-2">
                            <span class="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm font-semibold text-blue-300">
                                ${activeTasks} attivi
                            </span>
                            <span class="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-sm font-semibold text-green-300">
                                ${completedTasks} completati
                            </span>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="flex items-center gap-2">
                        <button onclick="Agenda.setFilter('all')" 
                                class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${this.filterView === 'all' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}">
                            Tutti
                        </button>
                        <button onclick="Agenda.setFilter('today')" 
                                class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${this.filterView === 'today' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}">
                            Oggi
                        </button>
                        <button onclick="Agenda.setFilter('week')" 
                                class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${this.filterView === 'week' ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}">
                            Settimana
                        </button>
                        
                        <button onclick="Agenda.toggleCompleted()" 
                                class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${this.showCompleted ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}">
                            ${this.showCompleted ? '✅ Nascondi' : '👁️ Completati'}
                        </button>
                        
                        <button onclick="Agenda.showAddModal()" 
                                class="ml-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg font-semibold">
                                ➕ Aggiungi Task
                        </button>
                    </div>
                </div>

                <!-- Content -->
                ${this.currentView === 'calendar' ? this.renderCalendar() : this.renderList()}
            </div>
        `;
    },

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthName = new Date(year, month).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

        return `
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                <!-- Calendar Header -->
                <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <button onclick="Agenda.previousMonth()" 
                            class="p-2 hover:bg-white/20 rounded-lg transition">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </button>
                    
                    <div class="text-center">
                        <h3 class="text-2xl font-bold text-white capitalize">${monthName}</h3>
                        <button onclick="Agenda.goToToday()" 
                                class="mt-1 text-sm text-white/80 hover:text-white transition">
                            Vai a oggi
                        </button>
                    </div>
                    
                    <button onclick="Agenda.nextMonth()" 
                            class="p-2 hover:bg-white/20 rounded-lg transition">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                    </button>
                </div>

                <!-- Calendar Grid -->
                <div class="p-6">
                    <!-- Days of week -->
                    <div class="grid grid-cols-7 gap-3 mb-3">
                        ${['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => `
                            <div class="text-center text-sm font-bold text-slate-400 py-2">${day}</div>
                        `).join('')}
                    </div>

                    <!-- Calendar days -->
                    <div class="grid grid-cols-7 gap-3">
                        ${this.renderCalendarDays(year, month)}
                    </div>
                </div>
            </div>
        `;
    },

    renderCalendarDays(year, month) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
        
        let html = '';
        
        // Empty cells
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="min-h-[120px]"></div>';
        }
        
        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day, 12, 0, 0);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const isToday = isCurrentMonth && day === today.getDate();
            
            const allDayTasks = this.tasks.filter(task => {
                const taskDate = new Date(task.date);
                const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
                return taskDateStr === dateStr;
            });
            
            // Active tasks (not completed)
            const activeTasks = allDayTasks.filter(t => !t.completed).slice(0, 3);
            const activeCount = allDayTasks.filter(t => !t.completed).length;
            
            // Completed tasks
            const completedCount = allDayTasks.filter(t => t.completed).length;
            
            const hasOverdue = activeTasks.some(task => Helpers.isOverdue(task.date));
            
            html += `
                <div onclick="Agenda.showDayModal('${dateStr}')" 
                     class="group min-h-[120px] p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col
                            ${isToday 
                                ? 'bg-blue-500/20 border-blue-400 shadow-lg' 
                                : 'bg-slate-700/30 border-slate-600 hover:border-blue-500/50 hover:bg-slate-700/50'}">
                    
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-2">
                        <span class="text-lg font-bold ${isToday ? 'text-white' : 'text-slate-300'}">${day}</span>
                        <div class="flex gap-1">
                            ${activeCount > 0 ? `
                                <span class="px-2 py-1 rounded-full text-xs font-bold ${hasOverdue ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}">
                                    ${activeCount}
                                </span>
                            ` : ''}
                            ${completedCount > 0 ? `
                                <span class="px-2 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                    ✓${completedCount}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Task previews -->
                    <div class="flex-1 space-y-1 overflow-hidden">
                        ${activeTasks.map(task => {
                            const isOverdue = Helpers.isOverdue(task.date);
                            const priorityColors = {
                                high: 'bg-red-500/20 border-red-500/50 text-red-300',
                                medium: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
                                low: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            };
                            const colorClass = isOverdue 
                                ? 'bg-red-500/30 border-red-500 text-red-200' 
                                : (priorityColors[task.priority] || 'bg-slate-600/50 border-slate-500 text-slate-300');
                            
                            return `
                                <div class="px-2 py-1 rounded border ${colorClass} text-xs font-medium truncate group-hover:shadow-md transition">
                                    ${Helpers.formatDate(task.date, 'time')} ${Helpers.escapeHtml(task.title)}
                                </div>
                            `;
                        }).join('')}
                        ${activeCount > 3 ? `
                            <div class="text-xs text-slate-400 font-semibold px-2">+${activeCount - 3} altri...</div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        
        return html;
    },

    renderList() {
        // Filter by completion status
        let filteredTasks = this.showCompleted 
            ? this.tasks 
            : this.tasks.filter(t => !t.completed);
        
        // Filter by time
        if (this.filterView === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            filteredTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.date);
                const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
                return taskDateStr === todayStr;
            });
        } else if (this.filterView === 'week') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            weekEnd.setHours(23, 59, 59, 999);
            
            filteredTasks = filteredTasks.filter(task => {
                const taskDate = new Date(task.date);
                return taskDate >= today && taskDate <= weekEnd;
            });
        }
        
        filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const groupedTasks = {};
        filteredTasks.forEach(task => {
            const taskDate = new Date(task.date);
            const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
            if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
            groupedTasks[dateStr].push(task);
        });

        if (Object.keys(groupedTasks).length === 0) {
            return `
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-12 text-center">
                    <div class="text-6xl mb-4">📭</div>
                    <h3 class="text-2xl font-bold text-white mb-2">Nessun task</h3>
                    <p class="text-slate-400 mb-6">
                        ${this.filterView === 'today' ? 'Non ci sono task per oggi' : 
                          this.filterView === 'week' ? 'Non ci sono task per questa settimana' : 
                          this.showCompleted ? 'Non ci sono task completati' :
                          'Non ci sono task in agenda'}
                    </p>
                    <button onclick="Agenda.showAddModal()" 
                            class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg font-semibold">
                        ➕ Aggiungi il primo task
                    </button>
                </div>
            `;
        }

        return `
            <div class="space-y-6">
                ${Object.entries(groupedTasks).map(([dateStr, tasks]) => {
                    const [year, month, day] = dateStr.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
                    
                    const isToday = dateStr === todayStr;
                    const isTomorrow = dateStr === tomorrowStr;
                    
                    const activeTasks = tasks.filter(t => !t.completed);
                    const completedTasks = tasks.filter(t => t.completed);
                    
                    let dateLabel = Helpers.formatDate(dateObj, 'full');
                    if (isToday) dateLabel = '🔥 Oggi - ' + dateLabel;
                    else if (isTomorrow) dateLabel = '⭐ Domani - ' + dateLabel;
                    
                    return `
                        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700">
                            <div class="bg-gradient-to-r ${isToday ? 'from-blue-600 to-purple-600' : isTomorrow ? 'from-purple-600 to-pink-600' : 'from-slate-700 to-slate-800'} px-6 py-3 flex items-center justify-between">
                                <h3 class="text-lg font-bold text-white">${dateLabel}</h3>
                                <div class="flex gap-2">
                                    ${activeTasks.length > 0 ? `
                                        <span class="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold text-white">
                                            ${activeTasks.length} attivi
                                        </span>
                                    ` : ''}
                                    ${completedTasks.length > 0 ? `
                                        <span class="px-3 py-1 bg-green-500/30 rounded-full text-sm font-semibold text-white">
                                            ✓ ${completedTasks.length}
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="p-6 space-y-3">
                                ${tasks.map(task => this.renderTaskCard(task)).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    renderTaskCard(task, fromModal = false) {
        const isOverdue = !task.completed && Helpers.isOverdue(task.date);
        const priorityColors = {
            high: 'border-red-500/50 bg-red-500/10',
            medium: 'border-yellow-500/50 bg-yellow-500/10',
            low: 'border-blue-500/50 bg-blue-500/10'
        };
        const borderClass = task.completed 
            ? 'border-green-500/50 bg-green-500/10 opacity-60'
            : isOverdue 
                ? 'border-red-500/50 bg-red-500/20' 
                : (priorityColors[task.priority] || 'border-slate-600 bg-slate-700/30');
        
        return `
            <div class="group relative rounded-xl border-2 ${borderClass} hover:border-blue-500/50 transition-all">
                <div class="flex items-start gap-4 p-4">
                    <button onclick="Agenda.toggleTask('${task.id}', ${fromModal})" 
                            class="flex-shrink-0 mt-1 w-6 h-6 rounded-full border-2 ${task.completed ? 'border-green-400 bg-green-500' : 'border-slate-400'} hover:border-blue-400 transition flex items-center justify-center">
                        ${task.completed ? `
                            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        ` : `
                            <svg class="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        `}
                    </button>
                    
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-white mb-1 ${task.completed ? 'line-through opacity-60' : ''}">${Helpers.escapeHtml(task.title)}</h4>
                        
                        ${task.description ? `
                            <p class="text-sm text-slate-400 mb-2 line-clamp-2 ${task.completed ? 'opacity-60' : ''}">${Helpers.escapeHtml(task.description)}</p>
                        ` : ''}
                        
                        <div class="flex items-center gap-3 flex-wrap">
                            <span class="text-sm text-slate-400">
                                🕐 ${Helpers.formatDate(task.date, 'time')}
                            </span>
                            
                            ${task.priority && !task.completed ? `
                                <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                                    task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }">
                                    ${task.priority === 'high' ? '🔴 Alta' : task.priority === 'medium' ? '🟡 Media' : '🔵 Bassa'}
                                </span>
                            ` : ''}
                            
                            ${task.completed ? `
                                <span class="px-2 py-1 bg-green-500/30 text-green-400 rounded-full text-xs font-semibold border border-green-500/50">
                                    ✅ Completato
                                </span>
                            ` : isOverdue ? `
                                <span class="px-2 py-1 bg-red-500/30 text-red-400 rounded-full text-xs font-semibold border border-red-500/50 animate-pulse">
                                    ⚠️ In ritardo
                                </span>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        ${!task.completed ? `
                            <button onclick="Agenda.editTask('${task.id}')" 
                                    class="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition text-blue-400">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                        ` : ''}
                        <button onclick="Agenda.deleteTask('${task.id}', ${fromModal})" 
                                class="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-red-400">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Navigation
    previousMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
        this.render();
    },

    nextMonth() {
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
        this.render();
    },

    goToToday() {
        this.currentDate = new Date();
        this.render();
    },

    setView(view) {
        this.currentView = view;
        this.render();
    },

    setFilter(filter) {
        this.filterView = filter;
        this.render();
    },

    toggleCompleted() {
        this.showCompleted = !this.showCompleted;
        this.render();
    },

    // Task actions
    async toggleTask(taskId, fromModal = false) {
        try {
            await CachedCRUD.toggleTaskCompleted(taskId);
            await this.loadTasks();
            
            if (fromModal) {
                // Re-open modal with updated data
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    const taskDate = new Date(task.date);
                    const dateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
                    
                    // Close current modal
                    const modal = document.getElementById('dayModal');
                    if (modal) modal.remove();
                    
                    // Re-open with updated data
                    this.showDayModal(dateStr);
                }
            } else {
                this.render();
            }
            
            Helpers.showToast('Task aggiornato! 🎉', 'success');
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('Errore', 'error');
        }
    },

    async deleteTask(taskId, fromModal = false) {
        if (!confirm('Eliminare questo task?')) return;
        
        try {
            const task = this.tasks.find(t => t.id === taskId);
            const taskDate = task ? new Date(task.date) : null;
            const dateStr = taskDate ? `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}` : null;
            
            await CachedCRUD.deleteTask(taskId);
            await this.loadTasks();
            
            if (fromModal && dateStr) {
                // Close current modal
                const modal = document.getElementById('dayModal');
                if (modal) modal.remove();
                
                // Re-open with updated data (or close if no tasks left)
                const remainingTasks = this.tasks.filter(t => {
                    const td = new Date(t.date);
                    const tds = `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(2, '0')}-${String(td.getDate()).padStart(2, '0')}`;
                    return tds === dateStr;
                });
                
                if (remainingTasks.length > 0) {
                    this.showDayModal(dateStr);
                } else {
                    // Just refresh main view
                    this.render();
                }
            } else {
                this.render();
            }
            
            Helpers.showToast('Task eliminato', 'success');
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('Errore', 'error');
        }
    },

    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        this.showAddModal(task);
    },

    showAddModal(task = null) {
        const isEdit = !!task;
        const modalHTML = `
            <div id="taskModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700 animate-slideUp">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h3 class="text-2xl font-bold text-white">
                            ${isEdit ? '✏️ Modifica Task' : '➕ Nuovo Task'}
                        </h3>
                        <button onclick="document.getElementById('taskModal').remove()" 
                                class="text-white/80 hover:text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <form onsubmit="Agenda.handleSubmit(event, ${isEdit ? `'${task.id}'` : 'null'})" class="p-6 space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Titolo *</label>
                            <input type="text" id="taskTitle" required
                                   value="${isEdit ? Helpers.escapeHtml(task.title) : ''}"
                                   class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Descrizione</label>
                            <textarea id="taskDescription" rows="3"
                                      class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none">${isEdit && task.description ? Helpers.escapeHtml(task.description) : ''}</textarea>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-slate-300 mb-2">Data *</label>
                                <input type="date" id="taskDate" required
                                       value="${isEdit ? new Date(task.date).toISOString().split('T')[0] : ''}"
                                       class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-slate-300 mb-2">Ora *</label>
                                <input type="time" id="taskTime" required
                                       value="${isEdit ? new Date(task.date).toTimeString().slice(0, 5) : ''}"
                                       class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Priorità</label>
                            <div class="grid grid-cols-3 gap-3">
                                <label class="cursor-pointer">
                                    <input type="radio" name="priority" value="high" ${isEdit && task.priority === 'high' ? 'checked' : ''} class="peer sr-only">
                                    <div class="px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-center transition peer-checked:border-red-500 peer-checked:bg-red-500/20 peer-checked:text-red-400 text-slate-400 font-semibold">
                                        🔴 Alta
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="priority" value="medium" ${isEdit && task.priority === 'medium' ? 'checked' : ''} ${!isEdit ? 'checked' : ''} class="peer sr-only">
                                    <div class="px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-center transition peer-checked:border-yellow-500 peer-checked:bg-yellow-500/20 peer-checked:text-yellow-400 text-slate-400 font-semibold">
                                        🟡 Media
                                    </div>
                                </label>
                                <label class="cursor-pointer">
                                    <input type="radio" name="priority" value="low" ${isEdit && task.priority === 'low' ? 'checked' : ''} class="peer sr-only">
                                    <div class="px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-lg text-center transition peer-checked:border-blue-500 peer-checked:bg-blue-500/20 peer-checked:text-blue-400 text-slate-400 font-semibold">
                                        🔵 Bassa
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="flex gap-3 pt-4">
                            <button type="submit" 
                                    class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg font-semibold">
                                ${isEdit ? '💾 Salva modifiche' : '➕ Crea task'}
                            </button>
                            <button type="button" onclick="document.getElementById('taskModal').remove()" 
                                    class="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition font-semibold">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('taskModal').addEventListener('click', (e) => {
            if (e.target.id === 'taskModal') e.target.remove();
        });

        if (!isEdit) {
            document.getElementById('taskDate').valueAsDate = new Date();
            document.getElementById('taskTime').value = '09:00';
        }
    },

    async handleSubmit(e, taskId) {
        e.preventDefault();

        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            date: `${document.getElementById('taskDate').value}T${document.getElementById('taskTime').value}:00`,
            priority: document.querySelector('input[name="priority"]:checked').value,
            completed: false
        };

        try {
            if (taskId) {
                await CachedCRUD.updateTask(taskId, taskData);
                Helpers.showToast('Task aggiornato! ✅', 'success');
            } else {
                await CachedCRUD.createTask(taskData);
                Helpers.showToast('Task creato! 🎉', 'success');
            }

            document.getElementById('taskModal').remove();
            await this.loadTasks();
            this.render();
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('Errore', 'error');
        }
    },

    showDayModal(dateStr) {
        const dayTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.date);
            const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
            return taskDateStr === dateStr;
        });

        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        const dateLabel = Helpers.formatDate(date, 'full');
        
        const activeTasks = dayTasks.filter(t => !t.completed);
        const completedTasks = dayTasks.filter(t => t.completed);

        const modalHTML = `
            <div id="dayModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-slate-700 animate-slideUp">
                    <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-white">📅 ${dateLabel}</h3>
                            <div class="flex gap-2 mt-1">
                                ${activeTasks.length > 0 ? `
                                    <span class="text-sm text-white/80">${activeTasks.length} attivi</span>
                                ` : ''}
                                ${completedTasks.length > 0 ? `
                                    <span class="text-sm text-white/80">• ✓ ${completedTasks.length} completati</span>
                                ` : ''}
                            </div>
                        </div>
                        <button onclick="document.getElementById('dayModal').remove()" 
                                class="text-white/80 hover:text-white">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                        ${dayTasks.length === 0 ? `
                            <div class="text-center py-12">
                                <div class="text-6xl mb-4">📭</div>
                                <p class="text-slate-400 text-lg mb-4">Nessun task per questa data</p>
                                <button onclick="Agenda.showAddModalWithDate('${dateStr}'); document.getElementById('dayModal').remove();" 
                                        class="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg font-semibold">
                                    ➕ Aggiungi task
                                </button>
                            </div>
                        ` : `
                            <div class="space-y-3">
                                ${dayTasks.map(task => this.renderTaskCard(task, true)).join('')}
                            </div>
                            <button onclick="Agenda.showAddModalWithDate('${dateStr}'); document.getElementById('dayModal').remove();" 
                                    class="w-full mt-4 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/30 hover:border-blue-500/50 text-blue-400 rounded-lg transition font-semibold">
                                ➕ Aggiungi altro task
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('dayModal').addEventListener('click', (e) => {
            if (e.target.id === 'dayModal') e.target.remove();
        });
    },

    showAddModalWithDate(dateStr) {
        this.showAddModal();
        setTimeout(() => document.getElementById('taskDate').value = dateStr, 50);
    }
};

window.Agenda = Agenda;
console.log('✅ Agenda Final module loaded');
