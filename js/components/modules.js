/**
 * Modules Component - Modular Manager
 * Permette di attivare/disattivare i moduli (Spese, Obiettivi, ecc.)
 */

const ModulesComponent = {
    async render() {
        const container = document.getElementById('modulesContent');
        if (!container) return;

        // Recupera la lista dei moduli disponibili (escludendo quelli Core e se stesso)
        const allModules = ModuleManager.getActiveModules().concat(
            Array.from(ModuleManager._modules.values()).filter(m => !ModuleManager.isActive(m.id))
        );
        
        // Filtra duplicati e rimuovi core/system
        const uniqueModules = [...new Map(allModules.map(item => [item.id, item])).values()]
            .filter(m => !m.isCore && m.id !== 'modules' && m.id !== 'settings')
            .sort((a, b) => a.order - b.order);

        container.innerHTML = `
            <div class="max-w-5xl mx-auto animate-fadeIn">
                <div class="mb-10">
                    <h2 class="text-4xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent italic mb-2">Hub Moduli</h2>
                    <p class="text-slate-400 font-medium">Attiva le funzionalità extra per personalizzare la tua esperienza.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${uniqueModules.map(mod => this.renderModuleCard(mod)).join('')}
                </div>
            </div>
        `;
    },

    renderModuleCard(mod) {
        const isActive = ModuleManager.isActive(mod.id);
        
        // Definisci stili in base al modulo per mantenere il look "Premium"
        let gradient = 'from-blue-600 to-indigo-600';
        if (mod.id === 'expenses') gradient = 'from-pink-600 to-rose-600';
        if (mod.id === 'goals') gradient = 'from-purple-600 to-indigo-600';

        // Gestione Icona: Se è SVG usalo, altrimenti testo
        let iconHtml = mod.icon;
        if (!iconHtml.includes('<svg')) {
            iconHtml = `<span class="text-3xl">${mod.icon}</span>`;
        }

        return `
            <div class="relative group overflow-hidden rounded-[2rem] border border-slate-700/50 bg-slate-800/40 p-1 transition-all hover:border-slate-600 hover:shadow-2xl">
                <div class="absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500"></div>
                
                <div class="relative h-full flex flex-col p-6">
                    <div class="flex items-start justify-between mb-6">
                        <div class="w-14 h-14 rounded-2xl ${isActive ? `bg-gradient-to-br ${gradient}` : 'bg-slate-700'} flex items-center justify-center text-white shadow-lg transition-all duration-300">
                            <div class="w-8 h-8 flex items-center justify-center text-2xl">
                                ${iconHtml}
                            </div>
                        </div>
                        <div class="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-700/50 text-slate-500 border-slate-600'}">
                            ${isActive ? 'Attivo' : 'Inattivo'}
                        </div>
                    </div>
                    
                    <h3 class="text-xl font-bold text-white mb-2 tracking-tight">${mod.name}</h3>
                    <p class="text-sm text-slate-400 leading-relaxed mb-8 flex-1">
                        Gestisci le funzionalità di ${mod.name} per la tua dashboard.
                    </p>
                    
                    <button onclick="ModuleManager.toggle('${mod.id}')" 
                        class="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-200 border 
                        ${isActive 
                            ? 'bg-slate-700/50 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border-transparent' 
                            : `bg-gradient-to-r ${gradient} text-white shadow-lg hover:brightness-110 border-transparent`
                        }">
                        ${isActive ? 'Disattiva Modulo' : 'Attiva Modulo'}
                    </button>
                </div>
            </div>
        `;
    }
};

// ==========================================
// REGISTRAZIONE NEL SISTEMA (Cruciale!)
// ==========================================
if (window.ModuleManager) {
    ModuleManager.register({
        id: 'modules',
        name: 'Gestione Moduli',
        // Icona SVG per la sidebar
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"></path></svg>',
        category: 'settings', // Categoria tecnica
        order: 100,
        render: () => ModulesComponent.render()
    });
}