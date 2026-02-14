/**
 * Note CRUD Module - Gestione Note Giornaliere
 */

const NoteCRUD = {
    async getAll() {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) return [];

            const { data, error } = await window.supabaseClient
                .from('agenda_notes')
                .select('*')
                .eq('user_id', user.data.user.id)
                .order('date', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Error in NoteCRUD.getAll:', e);
            return [];
        }
    },

    async create(noteData) {
        try {
            const user = await window.supabaseClient.auth.getUser();
            if (!user.data.user) throw new Error('No user');

            const { data, error } = await window.supabaseClient
                .from('agenda_notes')
                .insert({
                    user_id: user.data.user.id,
                    date: noteData.date,
                    content: noteData.content,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Error in NoteCRUD.create:', e);
            throw e;
        }
    },

    async update(id, content) {
        try {
            const { data, error } = await window.supabaseClient
                .from('agenda_notes')
                .update({ 
                    content, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Error in NoteCRUD.update:', e);
            throw e;
        }
    },

    async delete(id) {
        try {
            const { error } = await window.supabaseClient
                .from('agenda_notes')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error('Error in NoteCRUD.delete:', e);
            throw e;
        }
    }
};

window.NoteCRUD = NoteCRUD;