/**
 * NAVIGATION.JS - LIVE UPDATE READY
 * Include una funzione pubblica per aggiornare la sidebar istantaneamente.
 */

const STORAGE_KEY = 'myfinance_module_states';

// 1. Gestione UI (Mostra/Nascondi menu)
function applyUI(states) {
    if (!states) return;

    const map = {
        'group-finance': states.expenses_enabled, 
        'group-goals': states.goals_enabled
    };

    let updated = false;
    for (const [id, active] of Object.entries(map)) {
        const el = document.getElementById(id);
        if (el) {
            if (active) {
                el.classList.remove('hidden');
                el.style.display = ''; 
                // Animazione opzionale
                el.classList.add('animate-fadeIn'); 
            } else {
                el.classList.add('hidden');
                el.classList.remove('animate-fadeIn');
            }
            updated = true;
        }
    }
    return updated;
}

// 2. Riparazione Profilo
async function repairProfile(user) {
    console.log('🔧 Navigation: Creazione riga in user_modules...');
    const { data, error } = await supabaseClient
        .from('user_modules')
        .upsert({
            user_id: user.id,
            updated_at: new Date(),
            expenses_enabled: true,
            goals_enabled: true
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Errore riparazione DB:', error);
        return null;
    }
    return data;
}

// 3. Fetch dal Database
async function fetchAndApply() {
    if (!window.supabaseClient) return false;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return false;

        let { data, error } = await supabaseClient
            .from('user_modules')
            .select('expenses_enabled, goals_enabled')
            .eq('user_id', user.id)
            .maybeSingle();

        if (!data || error) {
            data = await repairProfile(user);
        }

        if (data) {
            applyUI(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            if (window.ModulesHub) ModulesHub.states = data;
            return true;
        }
    } catch (e) { console.error('Errore Fetch Navigation:', e); }
    return false;
}

// 4. Navigazione Principale
window.showSection = async function(sectionName) {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (cached) applyUI(cached);
    fetchAndApply(); // Background check

    let states = cached;
    if (window.ModulesHub && ModulesHub.states) states = ModulesHub.states;
    if (!states) states = { expenses_enabled: true, goals_enabled: true }; 

    // Security Check
    if ((sectionName === 'expenses' || sectionName === 'statistics') && !states.expenses_enabled) {
        window.triggerModuleUpsell('Finanza');
        return;
    }
    if (sectionName === 'goals' && !states.goals_enabled) {
        window.triggerModuleUpsell('Obiettivi');
        return;
    }

    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(sectionName + 'Content');
    if (target) target.classList.remove('hidden');

    // Active State
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('bg-indigo-600/10', 'border-indigo-500/20', 'text-indigo-100', 'text-indigo-300', 'bg-slate-800/30');
        link.classList.add('text-slate-400');
        
        if (link.dataset.section === sectionName) {
             link.classList.remove('text-slate-400');
             if (sectionName === 'statistics') {
                 link.classList.add('text-indigo-300', 'bg-slate-800/30');
             } else {
                 link.classList.add('bg-indigo-600/10', 'border', 'border-indigo-500/20', 'text-indigo-100');
             }
        }
    });

    // Lazy Load
    const components = {
        'dashboard': window.Dashboard,
        'expenses': window.Expenses,
        'statistics': window.Statistics,
        'agenda': window.Agenda,
        'goals': window.Goals,
        'settings': window.Settings,
        'modules': window.ModulesHub
    };

    const component = components[sectionName];
    if (component) {
        if (target && target.innerHTML.trim() === '') {
             target.innerHTML = `<div class="flex justify-center py-20 opacity-50"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>`;
        }
        try {
            if (component.init) await component.init();
            else if (component.render) await component.render();
        } catch (e) { console.error(e); }
    }
};

window.triggerModuleUpsell = function(name) {
    if (window.Helpers) Helpers.showToast(`🔒 Modulo ${name} non attivo.`, "info");
    window.showSection('modules');
};

// === NUOVA FUNZIONE PER AGGIORNAMENTO ISTANTANEO ===
// Questa viene chiamata da modules.js quando clicchi i bottoni
window.refreshSidebar = function(newStates) {
    console.log('⚡ Refresh Sidebar Live:', newStates);
    applyUI(newStates);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStates));
};

// Avvio
document.addEventListener('DOMContentLoaded', () => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) applyUI(JSON.parse(cached));
    
    let tentativi = 0;
    const intv = setInterval(async () => {
        tentativi++;
        const ok = await fetchAndApply();
        if (ok || tentativi > 5) clearInterval(intv);
    }, 1000);
});