/**
 * Expense CRUD Operations - Final Fixed Version
 * Include: getAll, bulkCreate e deleteMonth (Corretto per Mese 0 e Range Personalizzati)
 */

const ExpenseCRUD = {
    
    /**
     * 1. GET ALL: Scarica tutte le spese
     */
    async getAll() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) return [];

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .select('*') // Prende automaticamente anche is_excluded
                .eq('user_id', user.data.user.id)
                .order('date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching expenses:', error);
            throw error;
        }
    },

    /**
     * 2. CREATE: Crea una singola spesa
     */
    async create(expense) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) throw new Error('Utente non autenticato');

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .upsert([{
                    ...expense,
                    user_id: user.data.user.id,
                    created_at: new Date().toISOString()
                }], { 
                    onConflict: 'user_id, date, amount, description',
                    ignoreDuplicates: true 
                })
                .select()
                .single();

            if (error) throw error;
            
            if (window.DataCache) window.DataCache.invalidate('expenses');
            return data;
        } catch (error) {
            console.error('Error creating expense:', error);
            throw error;
        }
    },

    /**
     * 3. BULK IMPORT: Importazione massiva sicura
     */
    async bulkCreate(expenses) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) throw new Error('Utente non autenticato');

            if (!expenses || expenses.length === 0) return { addedCount: 0, skippedCount: 0 };

            const expensesToInsert = expenses.map(e => ({
                user_id: user.data.user.id,
                date: e.date,
                amount: e.amount,
                description: e.description,
                category: e.category || 'other',
                tags: e.tags || [],
                notes: e.notes || '',
                type: e.type || 'expense',
                is_excluded: e.is_excluded || false, // <--- NUOVO CAMPO
                created_at: new Date().toISOString()
            }));

            const { data, error } = await window.supabaseClient
                .from('expenses')
                .upsert(expensesToInsert, { 
                    onConflict: 'user_id, date, amount, description', 
                    ignoreDuplicates: true 
                })
                .select();

            if (error && error.code !== '23505') throw error;

            if (window.DataCache) {
                window.DataCache.invalidate('expenses');
                window.DataCache.invalidate('statistics');
            }

            return { addedCount: data ? data.length : 0, skippedCount: 0 }; // Semplificato per brevità

        } catch (error) {
            console.error('CRITICAL IMPORT ERROR:', error);
            throw error;
        }
    },

    /**
     * 4. DELETE MONTH: Cancella spese del mese (Range Corretto & Sicuro)
     * Risolve l'errore "2026-00-01" e rispetta i range personalizzati (es. 25-24).
     */
    async deleteMonth(year, month) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) throw new Error('Utente non autenticato');

            // 1. Creiamo una data di riferimento sicura (giorno 15 per evitare cambi mese col fuso orario)
            // 'month' qui arriva come 0-11 (es. Gennaio = 0), Javascript lo gestisce correttamente.
            const referenceDate = new Date(year, month, 15);

            // 2. Chiediamo agli Helper di calcolare il range corretto (es. 25 Dic - 24 Gen)
            // Se window.Helpers non esiste, usiamo un fallback standard 1-31
            let startObj, endObj;
            
            if (window.Helpers && typeof window.Helpers.getCustomMonthRange === 'function') {
                const range = window.Helpers.getCustomMonthRange(referenceDate);
                startObj = range.startDate;
                endObj = range.endDate;
            } else {
                // Fallback classico se Helpers manca
                startObj = new Date(year, month, 1);
                endObj = new Date(year, month + 1, 0);
            }

            // 3. Formattazione Manuale "YYYY-MM-DD"
            // IMPORTANTE: Non usiamo toISOString() per evitare che il fuso orario sposti la data indietro di un giorno.
            const formatDateLocal = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0'); // +1 perché getMonth è 0-11
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const startStr = formatDateLocal(startObj);
            const endStr = formatDateLocal(endObj);

            console.log(`🗑️ Eliminazione Mese (Range): ${startStr} -> ${endStr}`);

            // 4. Esecuzione Cancellazione
            const { error, count } = await window.supabaseClient
                .from('expenses')
                .delete({ count: 'exact' })
                .eq('user_id', user.data.user.id)
                .gte('date', startStr)
                .lte('date', endStr);

            if (error) throw error;

            console.log(`✅ Eliminati ${count} record.`);

            if (window.DataCache) {
                window.DataCache.invalidate('expenses');
                window.DataCache.invalidate('statistics');
            }
            
            // Ricarica la pagina per mostrare i dati aggiornati
            setTimeout(() => window.location.reload(), 500);
            
            return true;
        } catch (error) {
            console.error('Error deleting month:', error);
            throw error;
        }
    },

    // --- Metodi Standard ---
    async read(id) { const { data, error } = await window.supabaseClient.from('expenses').select('*').eq('id', id).single(); if (error) throw error; return data; },
    
    async update(id, updates) {
        const { error } = await window.supabaseClient.from('expenses').update(updates).eq('id', id);
        if (error) throw error; 
        if (window.DataCache) window.DataCache.invalidate('expenses');
        return true;
    },

    async delete(id) { const { error } = await window.supabaseClient.from('expenses').delete().eq('id', id); if (error) throw error; if (window.DataCache) window.DataCache.invalidate('expenses'); return true; },
};

// Alias di sicurezza
ExpenseCRUD.readAll = ExpenseCRUD.getAll;

window.ExpenseCRUD = ExpenseCRUD;
console.log('✅ ExpenseCRUD Final Loaded');