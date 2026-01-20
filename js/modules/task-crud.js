/**
 * Task CRUD Module - Gestione Tasks/Eventi con Supabase
 */

const TaskCRUD = {
    /**
     * Ottiene tutti i task dell'utente
     */
    async getAll() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('tasks')
                .select('*')
                .eq('user_id', user.data.user.id)
                .order('date', { ascending: true });

            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('Error in TaskCRUD.getAll:', e);
            return [];
        }
    },

    /**
     * Crea un nuovo task
     */
    async create(taskData) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const task = {
                user_id: user.data.user.id,
                title: taskData.title,
                description: taskData.description || '',
                date: taskData.date,
                priority: taskData.priority || 'medium',
                recurrence: taskData.recurrence || 'none',
                completed: taskData.completed || false,
                created_at: new Date().toISOString()
            };

            const { data, error } = await window.supabaseClient
                .from('tasks')
                .insert(task)
                .select()
                .single();

            if (error) {
                console.error('Error creating task:', error);
                throw new Error('Errore nella creazione del task');
            }

            return data;
        } catch (e) {
            console.error('Error in TaskCRUD.create:', e);
            throw e;
        }
    },

    /**
     * Legge un task per ID
     */
    async read(taskId) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const { data, error } = await window.supabaseClient
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .eq('user_id', user.data.user.id)
                .single();

            if (error) {
                console.error('Error reading task:', error);
                return null;
            }

            return data;
        } catch (e) {
            console.error('Error in TaskCRUD.read:', e);
            return null;
        }
    },

    /**
     * Aggiorna un task esistente
     */
    async update(taskId, updates) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const updateData = {
                ...updates,
                updated_at: new Date().toISOString()
            };

            delete updateData.user_id;
            delete updateData.id;

            const { data, error } = await window.supabaseClient
                .from('tasks')
                .update(updateData)
                .eq('id', taskId)
                .eq('user_id', user.data.user.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating task:', error);
                throw new Error('Errore nell\'aggiornamento del task');
            }

            return data;
        } catch (e) {
            console.error('Error in TaskCRUD.update:', e);
            throw e;
        }
    },

    /**
     * Elimina un task
     */
    async delete(taskId) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const { error } = await window.supabaseClient
                .from('tasks')
                .delete()
                .eq('id', taskId)
                .eq('user_id', user.data.user.id);

            if (error) {
                console.error('Error deleting task:', error);
                throw new Error('Errore nell\'eliminazione del task');
            }
        } catch (e) {
            console.error('Error in TaskCRUD.delete:', e);
            throw e;
        }
    },

    /**
     * Toggle completed status
     */
    async toggleCompleted(taskId) {
        try {
            const task = await this.read(taskId);
            if (!task) {
                throw new Error('Task non trovato');
            }

            return await this.update(taskId, {
                completed: !task.completed
            });
        } catch (e) {
            console.error('Error in TaskCRUD.toggleCompleted:', e);
            throw e;
        }
    }
};

// Export globale
window.TaskCRUD = TaskCRUD;
console.log('✅ TaskCRUD module loaded');
