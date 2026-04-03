/**
 * HabitCRUD - Raw Supabase operations for habits
 *
 * Required Supabase tables:
 *
 * habits:
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid not null references auth.users,
 *   name text not null,
 *   icon text default '⭐',
 *   color text default '#6366f1',
 *   created_at timestamptz default now()
 *
 * habit_entries:
 *   id uuid primary key default gen_random_uuid(),
 *   habit_id uuid not null references habits on delete cascade,
 *   user_id uuid not null references auth.users,
 *   entry_date date not null,
 *   created_at timestamptz default now(),
 *   unique(habit_id, user_id, entry_date)
 *
 * Enable RLS on both tables with policy: user_id = auth.uid()
 */

const HabitCRUD = {
    async getAll() {
        const user = await window.getUser();
        if (!user) return [];
        const { data, error } = await window.supabaseClient
            .from('habits')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getEntries(fromDate, toDate) {
        const user = await window.getUser();
        if (!user) return [];
        const { data, error } = await window.supabaseClient
            .from('habit_entries')
            .select('*')
            .eq('user_id', user.id)
            .gte('entry_date', fromDate)
            .lte('entry_date', toDate);
        if (error) throw error;
        return data || [];
    },

    async create(data) {
        const user = await window.getUser();
        const { data: result, error } = await window.supabaseClient
            .from('habits')
            .insert({ ...data, user_id: user.id })
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async update(id, data) {
        const { data: result, error } = await window.supabaseClient
            .from('habits')
            .update(data)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    async delete(id) {
        await window.supabaseClient.from('habit_entries').delete().eq('habit_id', id);
        const { error } = await window.supabaseClient.from('habits').delete().eq('id', id);
        if (error) throw error;
    },

    async toggleEntry(habitId, dateStr) {
        const user = await window.getUser();
        const { data: existing } = await window.supabaseClient
            .from('habit_entries')
            .select('id')
            .eq('habit_id', habitId)
            .eq('entry_date', dateStr)
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            await window.supabaseClient.from('habit_entries').delete().eq('id', existing.id);
            return false;
        } else {
            await window.supabaseClient
                .from('habit_entries')
                .insert({ habit_id: habitId, user_id: user.id, entry_date: dateStr });
            return true;
        }
    }
};

window.HabitCRUD = HabitCRUD;
console.log('✅ HabitCRUD loaded');
