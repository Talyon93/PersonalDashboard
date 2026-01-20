/**
 * Expense CRUD Module - Create, Read, Update, Delete con Supabase
 */

const ExpenseCRUD = {
    /**
     * Crea una nuova spesa
     */
    async create(expenseData) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const expense = {
                user_id: user.data.user.id,
                description: expenseData.description,
                amount: parseFloat(expenseData.amount),
                date: expenseData.date,
                category: expenseData.category || 'other',
                type: expenseData.type || 'expense',
                tags: expenseData.tags || [],
                notes: expenseData.notes || ''
            };

            // Apply merchant mapping if available
            if (expenseData.merchant) {
                const mapping = MerchantMappings.get(expenseData.merchant.toLowerCase().trim());
                if (mapping) {
                    expense.category = mapping.category;
                    expense.tags = mapping.tags || [];
                }
            }

            // Insert into Supabase
            const { data, error } = await window.supabaseClient
                .from('expenses')
                .insert(expense)
                .select()
                .single();

            if (error) {
                console.error('Error creating expense:', error);
                throw new Error('Errore nella creazione della spesa');
            }

            return data;
        } catch (e) {
            console.error('Error in create:', e);
            throw e;
        }
    },

    /**
     * Legge una spesa per ID
     */
    async read(expenseId) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .select('*')
                .eq('id', expenseId)
                .eq('user_id', user.data.user.id)
                .single();

            if (error) {
                console.error('Error reading expense:', error);
                return null;
            }

            return data;
        } catch (e) {
            console.error('Error in read:', e);
            return null;
        }
    },

    /**
     * Ottiene tutte le spese dell'utente
     */
    async getAll() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .select('*')
                .eq('user_id', user.data.user.id)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching expenses:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('Error in getAll:', e);
            return [];
        }
    },

    /**
     * Ottiene le spese in un range di date
     */
    async getByDateRange(startDate, endDate) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                return [];
            }

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .select('*')
                .eq('user_id', user.data.user.id)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching expenses by date range:', error);
                return [];
            }

            return data || [];
        } catch (e) {
            console.error('Error in getByDateRange:', e);
            return [];
        }
    },

    /**
     * Aggiorna una spesa esistente
     */
    async update(expenseId, updates) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Prepare update object
            const updateData = {
                ...updates,
                updated_at: new Date().toISOString()
            };

            // Don't update user_id
            delete updateData.user_id;
            delete updateData.id;

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .update(updateData)
                .eq('id', expenseId)
                .eq('user_id', user.data.user.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating expense:', error);
                throw new Error('Errore nell\'aggiornamento della spesa');
            }

            return data;
        } catch (e) {
            console.error('Error in update:', e);
            throw e;
        }
    },

    /**
     * Elimina una spesa
     */
    async delete(expenseId) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            const { error } = await window.supabaseClient
                .from('expenses')
                .delete()
                .eq('id', expenseId)
                .eq('user_id', user.data.user.id);

            if (error) {
                console.error('Error deleting expense:', error);
                throw new Error('Errore nell\'eliminazione della spesa');
            }
        } catch (e) {
            console.error('Error in delete:', e);
            throw e;
        }
    },

    /**
     * Importa spese da array (con controllo duplicati)
     */
    async bulkCreate(expensesArray) {
        let addedCount = 0;
        let skippedCount = 0;

        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Get existing expenses to check for duplicates
            const existing = await this.getAll();

            for (const expenseData of expensesArray) {
                // Check for duplicates
                if (this.isDuplicate(expenseData, existing)) {
                    skippedCount++;
                    continue;
                }

                try {
                    await this.create(expenseData);
                    addedCount++;
                } catch (e) {
                    console.error('Error creating expense during bulk import:', e);
                    skippedCount++;
                }
            }

            return { addedCount, skippedCount };
        } catch (e) {
            console.error('Error in bulkCreate:', e);
            return { addedCount, skippedCount };
        }
    },

    /**
     * Verifica se una spesa è duplicata
     */
    isDuplicate(newExpense, existingExpenses) {
        const newDate = newExpense.date.split(' ')[0].split('T')[0];
        const newAmount = parseFloat(newExpense.amount);
        const newDesc = newExpense.description.toLowerCase().trim();

        return existingExpenses.some(existing => {
            const existingDate = existing.date.split(' ')[0].split('T')[0];
            const existingAmount = parseFloat(existing.amount);
            const existingDesc = existing.description.toLowerCase().trim();

            const sameDate = existingDate === newDate;
            const sameAmount = Math.abs(existingAmount - newAmount) < 0.01;
            const sameDesc = existingDesc === newDesc || 
                           existingDesc.includes(newDesc) || 
                           newDesc.includes(existingDesc);

            return sameDate && sameAmount && sameDesc;
        });
    },

    /**
     * Elimina tutte le spese di un mese specifico
     */
    async deleteMonth(year, month) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) {
                throw new Error('Utente non autenticato');
            }

            // Calculate date range
            const { start, end } = Helpers.getCustomMonthRange(year, month);
            const startDate = start.toISOString().split('T')[0];
            const endDate = end.toISOString().split('T')[0];

            // Delete expenses in date range
            const { data, error } = await window.supabaseClient
                .from('expenses')
                .delete()
                .eq('user_id', user.data.user.id)
                .gte('date', startDate)
                .lte('date', endDate)
                .select();

            if (error) {
                console.error('Error deleting month expenses:', error);
                throw new Error('Errore nell\'eliminazione delle spese del mese');
            }

            return data ? data.length : 0;
        } catch (e) {
            console.error('Error in deleteMonth:', e);
            throw e;
        }
    }
};

// Export globale
window.ExpenseCRUD = ExpenseCRUD;
console.log('✅ ExpenseCRUD module loaded');
