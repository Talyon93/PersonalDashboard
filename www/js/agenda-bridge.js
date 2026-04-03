/**
 * AgendaBridge - Registry per eventi esterni nell'agenda
 * Ogni modulo si registra qui con un metodo getEvents(from, to).
 * L'agenda raccoglie e visualizza questi eventi senza conoscere i dettagli dei moduli.
 *
 * Evento normalizzato:
 * {
 *   id: string,          // 'ext_expenses_123'
 *   _isExternal: true,
 *   moduleId: string,    // 'expenses'
 *   moduleLabel: string, // 'Spese'
 *   date: string,        // 'YYYY-MM-DD'
 *   time: string|null,   // 'HH:MM' o null → sezione senza orario
 *   title: string,
 *   subtitle: string,
 *   color: string,       // hex '#f59e0b'
 *   icon: string,        // emoji
 * }
 */

const AgendaBridge = {
    _modules: [],
    _cache: new Map(),  // id → event, per il popup info

    /**
     * Registra un modulo. Può essere richiamato più volte (aggiorna).
     * @param {{ id, label, color, icon, getEvents: (from:string, to:string) => Promise<Event[]> }} mod
     */
    register(mod) {
        const idx = this._modules.findIndex(m => m.id === mod.id);
        if (idx >= 0) this._modules[idx] = mod;
        else this._modules.push(mod);
    },

    /** Ritorna tutti i moduli registrati */
    getRegisteredModules() { return this._modules; },

    /** Legge le impostazioni di visibilità da localStorage */
    getSettings() {
        try { return JSON.parse(localStorage.getItem('agenda_display_settings') || '{}'); }
        catch { return {}; }
    },

    /** Salva la visibilità di un modulo */
    saveSetting(moduleId, visible) {
        const s = this.getSettings();
        s[moduleId] = visible;
        localStorage.setItem('agenda_display_settings', JSON.stringify(s));
    },

    /** Un modulo è visibile per default, a meno che non sia stato esplicitamente nascosto */
    isVisible(moduleId) {
        return this.getSettings()[moduleId] !== false;
    },

    /**
     * Raccoglie gli eventi da tutti i moduli visibili per il range di date dato.
     * @param {string} fromStr - 'YYYY-MM-DD'
     * @param {string} toStr   - 'YYYY-MM-DD'
     * @returns {Promise<Event[]>}
     */
    async getEvents(fromStr, toStr) {
        const all = [];
        for (const mod of this._modules) {
            if (!this.isVisible(mod.id)) continue;
            // Salta i moduli non abilitati dall'utente
            if (window.ModuleManager && !ModuleManager.isActive(mod.id)) continue;
            try {
                const evs = await mod.getEvents(fromStr, toStr);
                (evs || []).forEach(ev => this._cache.set(ev.id, ev));
                all.push(...(evs || []));
            } catch (e) {
                console.error(`AgendaBridge [${mod.id}]:`, e);
            }
        }
        return all;
    },

    showEventInfo(id) {
        const ev = this._cache.get(id);
        if (!ev) return;

        document.getElementById('agenda-bridge-popup')?.remove();

        const dateLabel = ev.date ? ev.date.split('-').reverse().join('/') : '';

        document.body.insertAdjacentHTML('beforeend', `
            <div id="agenda-bridge-popup"
                 class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                 onclick="if(event.target===this)document.getElementById('agenda-bridge-popup').remove()">
                <div class="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-5 max-w-sm w-full animate-fadeIn">
                    <div class="flex items-start justify-between gap-3 mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                 style="background:${ev.color}20; border:1px solid ${ev.color}40;">
                                ${ev.icon}
                            </div>
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-widest mb-0.5"
                                   style="color:${ev.color}">${Helpers.escapeHtml(ev.moduleLabel)}</p>
                                <p class="font-bold text-white text-base leading-tight">${Helpers.escapeHtml(ev.title)}</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('agenda-bridge-popup').remove()"
                                class="shrink-0 w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm">
                            ✕
                        </button>
                    </div>

                    ${ev.subtitle ? `<p class="text-sm text-slate-300 mb-3 pl-1 font-medium">${Helpers.escapeHtml(ev.subtitle)}</p>` : ''}

                    <div class="flex items-center gap-3 text-xs text-slate-500 mb-4 pl-1">
                        ${dateLabel ? `<span class="flex items-center gap-1">📅 ${dateLabel}</span>` : ''}
                        ${ev.time  ? `<span class="flex items-center gap-1">🕐 ${ev.time}</span>` : '<span class="flex items-center gap-1">🕐 Tutto il giorno</span>'}
                    </div>

                    ${ev.onNavigate
                        ? `<button onclick="document.getElementById('agenda-bridge-popup').remove(); ${ev.onNavigate}"
                                   class="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                                   style="background:${ev.color}">
                               Apri dettaglio →
                           </button>`
                        : `<button onclick="document.getElementById('agenda-bridge-popup').remove(); window.showSection('${ev.moduleId}')"
                                   class="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                                   style="background:${ev.color}">
                               Vai a ${Helpers.escapeHtml(ev.moduleLabel)} →
                           </button>`
                    }
                </div>
            </div>
        `);
    },
};

window.AgendaBridge = AgendaBridge;

