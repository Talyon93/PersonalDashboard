/**
 * Goals WOW - Gestione Obiettivi Ultra-Moderna
 * Features: Design spettacolare, animazioni smooth, progress tracking
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

    async render(skipLoad = false) {
        
        if (!skipLoad) {
            await this.loadData();
        }
        

        const container = document.getElementById('goalsContent');
        if (!container) return;
        
        // Stats
        const activeGoals = this.goals.filter(g => !g.completed);
        const completedGoals = this.goals.filter(g => g.completed);
        const totalSubtasks = this.goals.reduce((sum, g) => sum + g.subtasks.length, 0);
        const completedSubtasks = this.goals.reduce((sum, g) => 
            sum + g.subtasks.filter(st => st.completed).length, 0);
        const overallProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

        // Filter goals
        let filteredGoals = this.goals;
        if (this.currentView === 'active') {
            filteredGoals = activeGoals;
        } else if (this.currentView === 'completed') {
            filteredGoals = completedGoals;
        }

        // Group by quarter
        const groupedGoals = this.groupByQuarter(filteredGoals);

        container.innerHTML = `
            <div class="p-6 animate-fadeIn">
                <!-- Header -->
                <div class="mb-8">
                    <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                        <div>
                            <h2 class="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                                🎯 Obiettivi
                            </h2>
                            <p class="text-slate-400">Pianifica e raggiungi i tuoi traguardi</p>
                        </div>
                        
                        <button onclick="Goals.showAddModal()" 
                                class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:scale-105 transition-all shadow-2xl font-bold text-lg">
                            ✨ Nuovo Obiettivo
                        </button>
                    </div>

                    <!-- Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <!-- Overall Progress -->
                        <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-sm font-semibold opacity-90">Progresso Totale</span>
                                <div class="text-3xl">📊</div>
                            </div>
                            <div class="text-4xl font-black mb-2">${overallProgress}%</div>
                            <div class="text-xs opacity-80">${completedSubtasks}/${totalSubtasks} subtask</div>
                        </div>

                        <!-- Active Goals -->
                        <div class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-xl p-6 text-white">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-sm font-semibold opacity-90">Obiettivi Attivi</span>
                                <div class="text-3xl">🔥</div>
                            </div>
                            <div class="text-4xl font-black mb-2">${activeGoals.length}</div>
                            <div class="text-xs opacity-80">In corso</div>
                        </div>

                        <!-- Completed Goals -->
                        <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-sm font-semibold opacity-90">Completati</span>
                                <div class="text-3xl">✅</div>
                            </div>
                            <div class="text-4xl font-black mb-2">${completedGoals.length}</div>
                            <div class="text-xs opacity-80">Raggiunto!</div>
                        </div>

                        <!-- Total Goals -->
                        <div class="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-xl p-6 text-white border border-slate-600">
                            <div class="flex items-center justify-between mb-3">
                                <span class="text-sm font-semibold opacity-90">Totali</span>
                                <div class="text-3xl">🎯</div>
                            </div>
                            <div class="text-4xl font-black mb-2">${this.goals.length}</div>
                            <div class="text-xs opacity-80">Obiettivi</div>
                        </div>
                    </div>

                    <!-- View Filters -->
                    <div class="flex gap-2 bg-slate-800 rounded-xl p-1 border border-slate-700 inline-flex">
                        <button onclick="Goals.setView('all')" 
                                class="px-6 py-2 rounded-lg transition-all font-semibold ${this.currentView === 'all' ? 'bg-purple-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
                            Tutti
                        </button>
                        <button onclick="Goals.setView('active')" 
                                class="px-6 py-2 rounded-lg transition-all font-semibold ${this.currentView === 'active' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
                            Attivi
                        </button>
                        <button onclick="Goals.setView('completed')" 
                                class="px-6 py-2 rounded-lg transition-all font-semibold ${this.currentView === 'completed' ? 'bg-green-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}">
                            Completati
                        </button>
                    </div>
                </div>

                <!-- Goals Content -->
                ${filteredGoals.length === 0 ? this.renderEmptyState() : `
                    <div class="space-y-8">
                        ${Object.entries(groupedGoals).map(([quarter, goals]) => 
                            this.renderQuarterSection(quarter, goals)
                        ).join('')}
                    </div>
                `}
            </div>
        `;
    },

    renderEmptyState() {
        const messages = {
            all: {
                icon: '🎯',
                title: 'Nessun obiettivo',
                subtitle: 'Inizia a pianificare i tuoi traguardi!'
            },
            active: {
                icon: '🔥',
                title: 'Nessun obiettivo attivo',
                subtitle: 'Tutti gli obiettivi sono stati completati!'
            },
            completed: {
                icon: '✅',
                title: 'Nessun obiettivo completato',
                subtitle: 'Completa i tuoi primi obiettivi!'
            }
        };

        const msg = messages[this.currentView];

        return `
            <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-16 text-center">
                <div class="text-8xl mb-6">${msg.icon}</div>
                <h3 class="text-3xl font-bold text-white mb-3">${msg.title}</h3>
                <p class="text-slate-400 text-lg mb-8">${msg.subtitle}</p>
                ${this.currentView === 'all' ? `
                    <button onclick="Goals.showAddModal()" 
                            class="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:scale-105 transition-all shadow-2xl font-bold text-lg">
                        ✨ Crea il tuo primo obiettivo
                    </button>
                ` : ''}
            </div>
        `;
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

        // Sort by quarter (most recent first)
        const sorted = {};
        Object.keys(grouped).sort().reverse().forEach(key => {
            sorted[key] = grouped[key];
        });

        return sorted;
    },

    renderQuarterSection(quarterKey, goals) {
        const [year, quarter] = quarterKey.split('-');
        
        return `
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="h-1 w-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    <h3 class="text-2xl font-bold text-white">
                        📅 ${quarter} ${year}
                    </h3>
                    <div class="h-1 flex-1 bg-gradient-to-r from-pink-500 to-transparent rounded-full"></div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    ${goals.map(goal => this.renderGoalCard(goal)).join('')}
                </div>
            </div>
        `;
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
            <div class="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 ${
                isCompleted ? 'border-green-500' : `border-${priorityColor}-500/50`
            } hover:border-${isCompleted ? 'green' : priorityColor}-400 transition-all overflow-hidden">
                
                <!-- Glow effect -->
                <div class="absolute inset-0 bg-gradient-to-r ${
                    isCompleted ? 'from-green-500/10 to-emerald-500/10' : 
                    `from-${priorityColor}-500/5 to-${priorityColor}-600/5`
                } opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div class="relative p-6">
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <h4 class="text-xl font-bold ${isCompleted ? 'text-green-400' : 'text-white'}">
                                    ${isCompleted ? '✅ ' : ''}${Helpers.escapeHtml(goal.title)}
                                </h4>
                            </div>
                            ${goal.description ? `
                                <p class="text-slate-400 text-sm line-clamp-2">${Helpers.escapeHtml(goal.description)}</p>
                            ` : ''}
                        </div>
                        
                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="Goals.showEditModal('${goal.id}')" 
                                    class="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition text-blue-400">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                            </button>
                            <button onclick="Goals.handleDeleteGoal('${goal.id}')" 
                                    class="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition text-red-400">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-semibold text-slate-400">Progresso</span>
                            <div class="flex items-center gap-2">
                                <span class="text-2xl font-black ${
                                    percentage === 100 ? 'text-green-400' : 
                                    percentage >= 75 ? 'text-blue-400' :
                                    percentage >= 50 ? 'text-yellow-400' :
                                    'text-slate-400'
                                }">${percentage}%</span>
                            </div>
                        </div>
                        
                        <!-- Animated progress bar -->
                        <div class="relative h-4 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600">
                            <div class="absolute inset-0 bg-gradient-to-r ${
                                percentage === 100 ? 'from-green-500 to-emerald-600' :
                                percentage >= 75 ? 'from-blue-500 to-cyan-600' :
                                percentage >= 50 ? 'from-yellow-500 to-orange-600' :
                                'from-purple-500 to-pink-600'
                            } transition-all duration-1000 ease-out" 
                                 style="width: ${percentage}%; box-shadow: 0 0 20px currentColor;"></div>
                        </div>
                        
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-xs text-slate-500">${completed}/${total} subtask</span>
                            ${daysUntil >= 0 ? `
                                <span class="text-xs px-2 py-1 rounded-full ${
                                    daysUntil < 30 ? 'bg-red-500/20 text-red-400' :
                                    daysUntil < 60 ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }">
                                    ⏰ ${daysUntil} giorni
                                </span>
                            ` : `
                                <span class="text-xs px-2 py-1 rounded-full bg-red-500/30 text-red-400 font-semibold animate-pulse">
                                    ⚠️ Scaduto
                                </span>
                            `}
                        </div>
                    </div>

                    <!-- Subtasks -->
                    <div class="space-y-2 mb-4 max-h-48 overflow-y-auto">
                        ${goal.subtasks.length === 0 ? `
                            <p class="text-sm text-slate-500 italic py-4 text-center">Nessun subtask definito</p>
                        ` : goal.subtasks.map((subtask, index) => `
                            <div class="group/subtask flex items-center gap-3 p-3 rounded-xl ${
                                subtask.completed ? 'bg-green-500/10' : 'bg-slate-700/30'
                            } hover:bg-slate-700/50 transition-all">
                                <button onclick="Goals.handleToggleSubtask('${goal.id}', ${index})"
                                        class="flex-shrink-0 w-6 h-6 rounded-full border-2 ${
                                            subtask.completed 
                                                ? 'border-green-400 bg-green-500' 
                                                : 'border-slate-500 hover:border-blue-400'
                                        } transition flex items-center justify-center">
                                    ${subtask.completed ? `
                                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                        </svg>
                                    ` : ''}
                                </button>
                                <span class="flex-1 text-sm ${
                                    subtask.completed 
                                        ? 'line-through text-slate-500' 
                                        : 'text-slate-300'
                                }">${Helpers.escapeHtml(subtask.title)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Footer -->
                    <div class="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div class="flex items-center gap-2 text-sm text-slate-400">
                            <span>🎯</span>
                            <span>${Helpers.formatDate(goal.targetDate, 'short')}</span>
                        </div>
                        
                        ${isCompleted ? `
                            <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                                ✅ Completato
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    setView(view) {
        this.currentView = view;
        this.render();
    },

    async handleToggleSubtask(goalId, subtaskIndex) {
        try {
            await CachedCRUD.toggleGoalSubtask(goalId, subtaskIndex);
            
            // Check if goal is completed
            await this.loadData();
            const goal = this.goals.find(g => g.id === goalId);
            
            if (goal) {
                const allCompleted = goal.subtasks.every(st => st.completed);
                if (allCompleted && !goal.completed) {
                    Helpers.showToast('🎉 Obiettivo completato! Grande!', 'success');
                }
            }
            
            this.render();
            if (window.Dashboard) Dashboard.render();
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('Errore', 'error');
        }
    },

    async handleDeleteGoal(id) {
        if (!confirm('Sei sicuro di voler eliminare questo obiettivo?')) return;
        
        try {
            await CachedCRUD.deleteGoal(id);
            await this.loadData();
            this.render();
            if (window.Dashboard) Dashboard.render();
            Helpers.showToast('Obiettivo eliminato', 'success');
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('Errore', 'error');
        }
    },

    showAddModal() {
        const modalHTML = `
            <div id="goalModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 animate-slideUp my-8">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h3 class="text-2xl font-bold text-white">✨ Nuovo Obiettivo</h3>
                        <button onclick="Goals.closeModal()" class="text-white/80 hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Form -->
                    <form onsubmit="Goals.handleAddGoal(event)" class="p-6 space-y-6">
                        <!-- Title -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Titolo Obiettivo *</label>
                            <input type="text" id="goalTitle" required
                                   placeholder="Es: Migliorare la mia produttività"
                                   class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none">
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Descrizione</label>
                            <textarea id="goalDescription" rows="3"
                                      placeholder="Descrivi il tuo obiettivo in dettaglio..."
                                      class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none resize-none"></textarea>
                        </div>

                        <!-- Target Date -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Data Obiettivo *</label>
                            <input type="date" id="goalTargetDate" required
                                   class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none">
                        </div>

                        <!-- Subtasks -->
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <label class="text-sm font-semibold text-slate-300">Subtask (Step intermedi)</label>
                                <button type="button" onclick="Goals.addSubtaskField()" 
                                        class="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition text-sm font-semibold">
                                    ➕ Aggiungi
                                </button>
                            </div>
                            <div id="subtasksList" class="space-y-2 max-h-64 overflow-y-auto pr-2">
                                <!-- Subtasks will be added here -->
                            </div>
                        </div>

                        <!-- Buttons -->
                        <div class="flex gap-3 pt-4">
                            <button type="submit" 
                                    class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg font-semibold">
                                🎯 Crea Obiettivo
                            </button>
                            <button type="button" onclick="Goals.closeModal()" 
                                    class="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition font-semibold">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Set default target date (end of current quarter)
        const now = new Date();
        const quarter = Helpers.getQuarter(now);
        const endMonth = quarter * 3;
        const endDate = new Date(now.getFullYear(), endMonth, 0);
        document.getElementById('goalTargetDate').value = endDate.toISOString().split('T')[0];

        // Add initial subtask fields
        this.addSubtaskField();
        this.addSubtaskField();
        this.addSubtaskField();

        // Close modal on backdrop click
        document.getElementById('goalModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalModal') Goals.closeModal();
        });
    },

    addSubtaskField() {
        const container = document.getElementById('subtasksList');
        if (!container) return;
        
        const subtaskId = Date.now() + Math.random();
        const subtaskHtml = `
            <div class="flex gap-2 animate-slideUp" id="subtask-${subtaskId}">
                <input type="text" 
                       class="flex-1 bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none subtask-input" 
                       placeholder="Es: Implementare feature X">
                <button type="button" 
                        onclick="document.getElementById('subtask-${subtaskId}').remove()" 
                        class="px-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', subtaskHtml);
    },

    async handleAddGoal(event) {
        event.preventDefault();
        
        // Get subtasks
        const subtaskInputs = document.querySelectorAll('.subtask-input');
        const subtasks = Array.from(subtaskInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '')
            .map(title => ({ title, completed: false }));

        const goalData = {
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value || '',
            targetDate: document.getElementById('goalTargetDate').value,
            subtasks: subtasks,
            completed: false
        };

        try {
            await CachedCRUD.createGoal(goalData);
            this.closeModal();
            await this.loadData();
            this.render();
            if (window.Dashboard) Dashboard.render();
            Helpers.showToast('🎉 Obiettivo creato!', 'success');
        } catch (e) {
            console.error('Error:', e);
            Helpers.showToast('Errore', 'error');
        }
    },

    showEditModal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const modalHTML = `
            <div id="goalModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn overflow-y-auto">
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 animate-slideUp my-8">
                    <!-- Header -->
                    <div class="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <h3 class="text-2xl font-bold text-white">✏️ Modifica Obiettivo</h3>
                        <button onclick="Goals.closeModal()" class="text-white/80 hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    <!-- Form -->
                    <form onsubmit="Goals.handleEditGoal(event, '${goal.id}')" class="p-6 space-y-6">
                        <!-- Title -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Titolo Obiettivo *</label>
                            <input type="text" id="goalTitle" required
                                   value="${Helpers.escapeHtml(goal.title)}"
                                   class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none">
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Descrizione</label>
                            <textarea id="goalDescription" rows="3"
                                      class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none resize-none">${Helpers.escapeHtml(goal.description || '')}</textarea>
                        </div>

                        <!-- Target Date -->
                        <div>
                            <label class="block text-sm font-semibold text-slate-300 mb-2">Data Obiettivo *</label>
                            <input type="date" id="goalTargetDate" required
                                   value="${goal.targetDate}"
                                   class="w-full bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none">
                        </div>

                        <!-- Subtasks -->
                        <div>
                            <div class="flex items-center justify-between mb-3">
                                <label class="text-sm font-semibold text-slate-300">Subtask</label>
                                <button type="button" onclick="Goals.addSubtaskField()" 
                                        class="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition text-sm font-semibold">
                                    ➕ Aggiungi
                                </button>
                            </div>
                            <div id="subtasksList" class="space-y-2 max-h-64 overflow-y-auto pr-2">
                                ${goal.subtasks.map((subtask, index) => `
                                    <div class="flex gap-2 items-center" data-subtask-index="${index}">
                                        <input type="checkbox" 
                                               ${subtask.completed ? 'checked' : ''} 
                                               class="w-5 h-5 rounded border-2 border-slate-500 bg-slate-700/50 checked:bg-green-500 checked:border-green-500 cursor-pointer subtask-completed"
                                               data-index="${index}">
                                        <input type="text" 
                                               value="${Helpers.escapeHtml(subtask.title)}"
                                               class="flex-1 bg-slate-700/50 border-2 border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none subtask-input ${subtask.completed ? 'line-through opacity-60' : ''}"
                                               data-index="${index}">
                                        <button type="button" 
                                                onclick="this.parentElement.remove()" 
                                                class="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Buttons -->
                        <div class="flex gap-3 pt-4">
                            <button type="submit" 
                                    class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:scale-105 transition-all shadow-lg font-semibold">
                                💾 Salva Modifiche
                            </button>
                            <button type="button" onclick="Goals.closeModal()" 
                                    class="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition font-semibold">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Add event listeners for checkboxes to update line-through
        document.querySelectorAll('.subtask-completed').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = e.target.dataset.index;
                const input = document.querySelector(`.subtask-input[data-index="${index}"]`);
                if (e.target.checked) {
                    input.classList.add('line-through', 'opacity-60');
                } else {
                    input.classList.remove('line-through', 'opacity-60');
                }
            });
        });

        // Close modal on backdrop click
        document.getElementById('goalModal').addEventListener('click', (e) => {
            if (e.target.id === 'goalModal') Goals.closeModal();
        });
    },

    async handleEditGoal(event, goalId) {
        event.preventDefault();
        
        // Collect all subtasks from the form
        const subtaskElements = document.querySelectorAll('#subtasksList > div');
        const subtasks = [];
        
        subtaskElements.forEach(el => {
            const checkbox = el.querySelector('.subtask-completed');
            const input = el.querySelector('.subtask-input');
            
            if (input && input.value.trim()) {
                subtasks.push({
                    title: input.value.trim(),
                    completed: checkbox ? checkbox.checked : false
                });
            }
        });

        const goalData = {
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value || '',
            targetDate: document.getElementById('goalTargetDate').value,
            subtasks: subtasks
        };


        try {
            // Use GoalCRUD directly to bypass cache
            const updatedGoal = await GoalCRUD.update(goalId, goalData);
            
            // Clear cache
            DataCache.invalidate('goals');
            
            // Force reload from database and assign directly
            const freshGoals = await GoalCRUD.getAll();
            
            // IMPORTANT: Assign directly to this.goals
            this.goals = freshGoals;
            
            this.closeModal();
            
            // Render with skipLoad=true to avoid reloading from cache
            this.render(true);
            
            if (window.Dashboard) Dashboard.render();
            Helpers.showToast('✅ Obiettivo aggiornato!', 'success');
        } catch (e) {
            console.error('❌ Error updating goal:', e);
            Helpers.showToast('Errore: ' + e.message, 'error');
        }
    },

    closeModal() {
        const modal = document.getElementById('goalModal');
        if (modal) modal.remove();
    }
};

// Export globale
window.Goals = Goals;
console.log('✅ Goals WOW module loaded');
