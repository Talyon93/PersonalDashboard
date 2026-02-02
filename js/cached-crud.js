/**
 * Cached CRUD Wrappers - Use DataCache for faster operations
 * 
 * Usage: Replace direct CRUD calls with these cached versions
 * Example: ExpenseCRUD.getAll() → CachedCRUD.getExpenses()
 */

const CachedCRUD = {
    /**
     * Get all notes (cached)
     */
    async getNotes() {
        return await DataCache.get('notes', () => NoteCRUD.getAll());
    },

    async createNote(data) {
        const result = await NoteCRUD.create(data);
        DataCache.invalidateMultiple(['notes']);
        if (window.EventBus) EventBus.emit('dataChanged');
        return result;
    },

    async updateNote(id, content) {
        const result = await NoteCRUD.update(id, content);
        DataCache.invalidateMultiple(['notes']);
        if (window.EventBus) EventBus.emit('dataChanged');
        return result;
    },

    async deleteNote(id) {
        await NoteCRUD.delete(id);
        DataCache.invalidateMultiple(['notes']);
        if (window.EventBus) EventBus.emit('dataChanged');
    },
    /**
     * Get all expenses (cached)
     */
    async getExpenses() {
        return await DataCache.get('expenses', () => ExpenseCRUD.getAll());
    },

    /**
     * Create expense and invalidate cache
     */
    async createExpense(data) {
        const result = await ExpenseCRUD.create(data);
        DataCache.invalidateMultiple(['expenses']);
        if (window.EventBus) {
            EventBus.emit('expenseCreated', result);
            EventBus.emit('dataChanged', { type: 'expense', action: 'create' });
        }
        return result;
    },

    /**
     * Update expense and invalidate cache
     */
    async updateExpense(id, data) {
        const result = await ExpenseCRUD.update(id, data);
        DataCache.invalidateMultiple(['expenses']);
        if (window.EventBus) {
            EventBus.emit('expenseUpdated', { id, data: result });
            EventBus.emit('dataChanged', { type: 'expense', action: 'update' });
        }
        return result;
    },

    /**
     * Delete expense and invalidate cache
     */
    async deleteExpense(id) {
        await ExpenseCRUD.delete(id);
        DataCache.invalidateMultiple(['expenses']);
        if (window.EventBus) {
            EventBus.emit('expenseDeleted', { id });
            EventBus.emit('dataChanged', { type: 'expense', action: 'delete' });
        }
    },

    /**
     * Get all tasks (cached)
     */
    async getTasks() {
        return await DataCache.get('tasks', () => TaskCRUD.getAll());
    },

    /**
     * Create task and invalidate cache
     */
    async createTask(data) {
        const result = await TaskCRUD.create(data);
        DataCache.invalidateMultiple(['tasks']);
        if (window.EventBus) {
            EventBus.emit('taskCreated', result);
            EventBus.emit('dataChanged', { type: 'task', action: 'create' });
        }
        return result;
    },

    /**
     * Update task and invalidate cache
     */
    async updateTask(id, data) {
        const result = await TaskCRUD.update(id, data);
        DataCache.invalidateMultiple(['tasks']);
        if (window.EventBus) {
            EventBus.emit('taskUpdated', { id, data: result });
            EventBus.emit('dataChanged', { type: 'task', action: 'update' });
        }
        return result;
    },

    /**
     * Delete task and invalidate cache
     */
    async deleteTask(id) {
        await TaskCRUD.delete(id);
        DataCache.invalidateMultiple(['tasks']);
        if (window.EventBus) {
            EventBus.emit('taskDeleted', { id });
            EventBus.emit('dataChanged', { type: 'task', action: 'delete' });
        }
    },

    /**
     * Toggle task completed and invalidate cache
     */
    async toggleTaskCompleted(id) {
        const result = await TaskCRUD.toggleCompleted(id);
        DataCache.invalidateMultiple(['tasks']);
        if (window.EventBus) {
            EventBus.emit('taskToggled', { id, completed: result.completed });
            EventBus.emit('dataChanged', { type: 'task', action: 'toggle' });
        }
        return result;
    },

    /**
     * Get all goals (cached)
     */
    async getGoals() {
        return await DataCache.get('goals', () => GoalCRUD.getAll());
    },

    /**
     * Create goal and invalidate cache
     */
    async createGoal(data) {
        const result = await GoalCRUD.create(data);
        DataCache.invalidateMultiple(['goals']);
        if (window.EventBus) {
            EventBus.emit('goalCreated', result);
            EventBus.emit('dataChanged', { type: 'goal', action: 'create' });
        }
        return result;
    },

    /**
     * Update goal and invalidate cache
     */
    async updateGoal(id, data) {
        const result = await GoalCRUD.update(id, data);
        DataCache.invalidateMultiple(['goals']);
        if (window.EventBus) {
            EventBus.emit('goalUpdated', { id, data: result });
            EventBus.emit('dataChanged', { type: 'goal', action: 'update' });
        }
        return result;
    },

    /**
     * Delete goal and invalidate cache
     */
    async deleteGoal(id) {
        await GoalCRUD.delete(id);
        DataCache.invalidateMultiple(['goals']);
        if (window.EventBus) {
            EventBus.emit('goalDeleted', { id });
            EventBus.emit('dataChanged', { type: 'goal', action: 'delete' });
        }
    },

    /**
     * Toggle goal subtask and invalidate cache
     */
    async toggleGoalSubtask(goalId, subtaskIndex) {
        const result = await GoalCRUD.toggleSubtaskByIndex(goalId, subtaskIndex);
        DataCache.invalidateMultiple(['goals']);
        if (window.EventBus) {
            EventBus.emit('goalSubtaskToggled', { goalId, subtaskIndex });
            EventBus.emit('dataChanged', { type: 'goal', action: 'subtask-toggle' });
        }
        return result;
    },

    /**
     * Get categories (cached - rarely changes)
     */
    getCategories() {
        return Categories.getAll();
    },

    /**
     * Get merchant mappings (cached - rarely changes)
     */
    getMerchantMappings() {
        return MerchantMapping.getAll();
    },

    async getSettings() {
        // Definisce come scaricare i settings se non sono in cache
        const fetchSettings = async () => {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) return null;
            const { data } = await window.supabaseClient
                .from('user_settings')
                .select('*')
                .eq('user_id', user.data.user.id)
                .single();
            return data;
        };
        // Usa la chiave 'settings' definita in data-cache.js
        return await DataCache.get('settings', fetchSettings);
    },

    async updateSettings(newSettings) {
        // Aggiorna manualmente la cache senza dover rileggere dal DB
        if (window.DataCache) {
            // Invalida vecchia cache
            window.DataCache.invalidate('settings');
            // Opzionale: Se DataCache supportasse il set manuale, potremmo farlo qui.
            // Per ora invalidiamo, così la prossima lettura sarà fresca dal DB.
        }
        return true; 
    },
};

// Export globale
window.CachedCRUD = CachedCRUD;
console.log('✅ CachedCRUD module loaded');
