/**
 * ModulesHub Component - LIVE DASHBOARD UPDATE
 * Quando attivi un modulo, forza il ridisegno della Dashboard.
 */
const ModulesHub = {
    states: {
        expenses_enabled: false,
        goals_enabled: false
    },

    async init() {
        await this.fetchStates();
        await this.render();
    },

    async fetchStates() {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return;

            const { data } = await supabaseClient
                .from('user_modules')
                .select('expenses_enabled, goals_enabled')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                this.states = data;
                if(window.refreshSidebar) window.refreshSidebar(data);
            }
        } catch (e) { console.error(e); }
    },

    async toggleModule(moduleKey) {
        const newState = !this.states[moduleKey];
        const oldState = this.states[moduleKey];
        
        // 1. Aggiorna stato in memoria
        this.states[moduleKey] = newState;
        this.render(); // Ridisegna i bottoni

        // 2. AGGIORNA SIDEBAR (Menu a sinistra)
        if (window.refreshSidebar) {
            window.refreshSidebar(this.states);
        }

        // 3. AGGIORNA DASHBOARD (Layout centrale) - PUNTO CHIAVE
        // Se la dashboard esiste, forziamo il render() completo per mostrare/nascondere le card
        if (window.Dashboard && document.getElementById('dashboardContent')) {
            console.log('🔄 Ridisegno Dashboard...');
            await Dashboard.render();
        }

        // 4. Salva nel Database
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const { error } = await supabaseClient
                .from('user_modules')
                .update({ [moduleKey]: newState })
                .eq('user_id', user.id);

            if (error) throw error;
            Helpers.showToast(`Modulo ${newState ? 'Attivato' : 'Disattivato'}!`, "success");

        } catch (e) {
            console.error(e);
            Helpers.showToast("Errore salvataggio", "error");
            // Rollback visuale in caso di errore
            this.states[moduleKey] = oldState;
            this.render();
            if (window.refreshSidebar) window.refreshSidebar(this.states);
            if (window.Dashboard) Dashboard.render();
        }
    },

    async render() {
        const container = document.getElementById('modulesContent');
        if (!container) return;

        container.innerHTML = `
            <div class="max-w-5xl mx-auto animate-fadeIn">
                <div class="mb-8">
                    <h2 class="text-3xl font-black italic text-white mb-2">Hub Moduli</h2>
                    <p class="text-slate-400">Attiva le funzionalità extra per personalizzare la tua esperienza.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${this.renderCard(
                        'Gestione Spese & Analytics', 
                        'Monitora transazioni e visualizza grafici dettagliati.',
                        '💰', 
                        'expenses_enabled',
                        'from-pink-600 to-rose-600'
                    )}

                    ${this.renderCard(
                        'Obiettivi (Goals)', 
                        'Definisci traguardi e traccia il progresso.',
                        '🎯', 
                        'goals_enabled',
                        'from-purple-600 to-indigo-600'
                    )}
                </div>
            </div>
        `;
    },

    renderCard(title, desc, icon, key, gradient) {
        const isActive = this.states[key];
        return `
            <div class="relative group overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-800/40 p-1 transition-all hover:border-slate-600">
                <div class="absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                <div class="relative h-full flex flex-col p-6">
                    <div class="flex items-start justify-between mb-4">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${isActive ? gradient : 'from-slate-700 to-slate-600'} flex items-center justify-center text-2xl shadow-lg transition-colors duration-300">
                            ${icon}
                        </div>
                        <div class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}">
                            ${isActive ? 'Attivo' : 'Inattivo'}
                        </div>
                    </div>
                    <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                    <p class="text-sm text-slate-400 leading-relaxed mb-8 flex-1">${desc}</p>
                    <button onclick="ModulesHub.toggleModule('${key}')" 
                        class="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 
                        ${isActive 
                            ? 'bg-slate-700/50 text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent' 
                            : `bg-gradient-to-r ${gradient} text-white shadow-lg hover:shadow-${gradient.split('-')[1]}/20 hover:scale-[1.02] active:scale-[0.98]`
                        }">
                        ${isActive ? 'Disattiva' : 'Attiva Modulo'}
                    </button>
                </div>
            </div>
        `;
    }
};

window.ModulesHub = ModulesHub;