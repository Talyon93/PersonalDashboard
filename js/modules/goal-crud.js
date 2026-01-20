/**
 * Goal CRUD Module - Gestione Goals con Supabase
 * FIXED: Now properly updates subtasks
 */

const GoalCRUD = {
    /**
     * Ottiene tutti i goal dell'utente con i loro subtask
     */
    async getAll() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('goals')
                .select(`
                    *,
                    subtasks:goal_subtasks(*)
                `)
                .eq('user_id', user.data.user.id)
                .order('target_date', { ascending: false });

            if (error) {
                console.error('Error fetching goals:', error);
                return [];
            }

            // Transform data to match old format
            return (data || []).map(goal => ({
                ...goal,
                targetDate: goal.target_date,
                subtasks: (goal.subtasks || []).map(st => ({
                    title: st.title,
                    completed: st.completed
                }))
            }));
        } catch (e) {
            console.error('Error in GoalCRUD.getAll:', e);
            return [];
        }
    },

    /**
     * Crea un nuovo goal con i suoi subtask
     */
    async create(goalData) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Create goal
            const goal = {
                user_id: user.data.user.id,
                title: goalData.title,
                description: goalData.description || '',
                target_date: goalData.targetDate,
                completed: goalData.completed || false,
                created_at: new Date().toISOString()
            };

            const { data: goalRecord, error: goalError } = await window.supabaseClient
                .from('goals')
                .insert(goal)
                .select()
                .single();

            if (goalError) {
                console.error('Error creating goal:', goalError);
                throw new Error('Errore nella creazione del goal');
            }

            // Create subtasks if any
            if (goalData.subtasks && goalData.subtasks.length > 0) {
                const subtasks = goalData.subtasks.map(st => ({
                    goal_id: goalRecord.id,
                    title: st.title,
                    completed: st.completed || false
                }));

                const { error: subtasksError } = await window.supabaseClient
                    .from('goal_subtasks')
                    .insert(subtasks);

                if (subtasksError) {
                    console.error('Error creating subtasks:', subtasksError);
                    // Don't fail the whole operation, just log
                }
            }

            return goalRecord;
        } catch (e) {
            console.error('Error in GoalCRUD.create:', e);
            throw e;
        }
    },

    /**
     * Legge un goal per ID con i suoi subtask
     */
    async read(goalId) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const { data, error } = await window.supabaseClient
                .from('goals')
                .select(`
                    *,
                    subtasks:goal_subtasks(*)
                `)
                .eq('id', goalId)
                .eq('user_id', user.data.user.id)
                .single();

            if (error) {
                console.error('Error reading goal:', error);
                return null;
            }

            return {
                ...data,
                targetDate: data.target_date,
                subtasks: (data.subtasks || []).map(st => ({
                    id: st.id,
                    title: st.title,
                    completed: st.completed
                }))
            };
        } catch (e) {
            console.error('Error in GoalCRUD.read:', e);
            return null;
        }
    },

    /**
     * Aggiorna un goal esistente e i suoi subtask
     * FIXED: Now properly handles subtasks update
     */
    async update(goalId, updates) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const updateData = {
                title: updates.title,
                description: updates.description,
                target_date: updates.targetDate,
                completed: updates.completed,
                updated_at: new Date().toISOString()
            };

            // Remove undefined fields
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) delete updateData[key];
            });

            // Update goal
            const { data, error } = await window.supabaseClient
                .from('goals')
                .update(updateData)
                .eq('id', goalId)
                .eq('user_id', user.data.user.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating goal:', error);
                throw new Error('Errore nell\'aggiornamento del goal');
            }

            // Update subtasks if provided
            if (updates.subtasks !== undefined) {
                console.log('🔄 Updating subtasks for goal:', goalId);
                console.log('   New subtasks:', updates.subtasks);
                
                // Delete all existing subtasks
                const { error: deleteError } = await window.supabaseClient
                    .from('goal_subtasks')
                    .delete()
                    .eq('goal_id', goalId);

                if (deleteError) {
                    console.error('Error deleting old subtasks:', deleteError);
                }

                // Insert new subtasks
                if (updates.subtasks.length > 0) {
                    const subtasks = updates.subtasks.map(st => ({
                        goal_id: goalId,
                        title: st.title,
                        completed: st.completed || false,
                        created_at: new Date().toISOString()
                    }));

                    console.log('   Inserting subtasks:', subtasks);

                    const { error: subtasksError } = await window.supabaseClient
                        .from('goal_subtasks')
                        .insert(subtasks);

                    if (subtasksError) {
                        console.error('Error updating subtasks:', subtasksError);
                        throw new Error('Errore nell\'aggiornamento dei subtask');
                    }
                    
                    console.log('   ✅ Subtasks updated successfully');
                }
            }

            return data;
        } catch (e) {
            console.error('Error in GoalCRUD.update:', e);
            throw e;
        }
    },

    /**
     * Elimina un goal e i suoi subtask
     */
    async delete(goalId) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Delete subtasks first (if not cascading)
            await window.supabaseClient
                .from('goal_subtasks')
                .delete()
                .eq('goal_id', goalId);

            // Delete goal
            const { error } = await window.supabaseClient
                .from('goals')
                .delete()
                .eq('id', goalId)
                .eq('user_id', user.data.user.id);

            if (error) {
                console.error('Error deleting goal:', error);
                throw new Error('Errore nell\'eliminazione del goal');
            }
        } catch (e) {
            console.error('Error in GoalCRUD.delete:', e);
            throw e;
        }
    },

    /**
     * Aggiorna un subtask specifico
     */
    async updateSubtask(subtaskId, completed) {
        try {
            const { data, error } = await window.supabaseClient
                .from('goal_subtasks')
                .update({ 
                    completed,
                    updated_at: new Date().toISOString()
                })
                .eq('id', subtaskId)
                .select()
                .single();

            if (error) {
                console.error('Error updating subtask:', error);
                throw new Error('Errore nell\'aggiornamento del subtask');
            }

            // Check if all subtasks of this goal are completed
            const { data: goal } = await window.supabaseClient
                .from('goal_subtasks')
                .select('goal_id, completed')
                .eq('goal_id', data.goal_id);

            if (goal && goal.every(st => st.completed)) {
                // Mark goal as completed
                await this.update(data.goal_id, { completed: true });
            }

            return data;
        } catch (e) {
            console.error('Error in GoalCRUD.updateSubtask:', e);
            throw e;
        }
    },

    /**
     * Toggle subtask by goal_id and subtask index
     */
    async toggleSubtaskByIndex(goalId, subtaskIndex) {
        try {
            // Get all subtasks for this goal
            const { data: subtasks, error } = await window.supabaseClient
                .from('goal_subtasks')
                .select('*')
                .eq('goal_id', goalId)
                .order('created_at', { ascending: true });

            if (error || !subtasks || !subtasks[subtaskIndex]) {
                throw new Error('Subtask non trovato');
            }

            const subtask = subtasks[subtaskIndex];
            return await this.updateSubtask(subtask.id, !subtask.completed);
        } catch (e) {
            console.error('Error in GoalCRUD.toggleSubtaskByIndex:', e);
            throw e;
        }
    }
};

// Export globale
window.GoalCRUD = GoalCRUD;
console.log('✅ GoalCRUD module loaded (FIXED with subtask updates)');
