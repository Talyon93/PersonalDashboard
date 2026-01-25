/**
 * NAVIGATION.JS - CLEAN & DYNAMIC
 * Usa direttamente le icone definite nei moduli registrati. Niente duplicati.
 */

// 1. Render Sidebar
window.renderSidebar = function() {
    const navContainer = document.querySelector('#sidebar nav');
    if (!navContainer || !window.ModuleManager) return;

    navContainer.innerHTML = '';

    // Recupera moduli attivi dal sistema
    const modules = ModuleManager.getActiveModules();
    
    // Filtra per sezioni
    const mainModules = modules.filter(m => m.category !== 'settings' && m.id !== 'modules');
    const settingsModules = modules.filter(m => m.category === 'settings');

    let html = `<div class="flex flex-col h-full">`;

    // --- 1. MODULI PRINCIPALI (Scrollable) ---
    html += `<div class="flex-1 space-y-2 py-4 overflow-y-auto no-scrollbar">`;
    mainModules.forEach(mod => {
        html += renderLink(mod);
    });
    html += `</div>`;

    // --- 2. ZONA INFERIORE (Aggiungi Moduli + Settings + Logout) ---
    html += `<div class="mt-auto pt-4 border-t border-slate-800/50 space-y-2">`;

    // A. Bottone "Aggiungi Moduli"
    // Cerchiamo il modulo registrato
    const modulesMod = modules.find(m => m.id === 'modules');
    if (modulesMod) {
        html += renderLink(modulesMod);
    } else {
        // Fallback di sicurezza (se modules.js non fosse caricato)
        const isActive = window.currentSection === 'modules';
        html += `
            <div class="mb-3 px-2">
                <a href="#" onclick="handleNavClick(event, 'modules')"
                   class="flex items-center px-4 py-3 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group ${isActive ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'text-slate-400'}">
                    <span class="mr-3 text-lg group-hover:text-indigo-400 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"></path></svg>
                    </span>
                    <span class="font-bold text-xs uppercase tracking-wider group-hover:text-indigo-300 transition-colors">Aggiungi Moduli</span>
                </a>
            </div>
        `;
    }

    // B. Impostazioni
    settingsModules.forEach(mod => {
        html += renderLink(mod);
    });

    // C. Logout
    html += `
        <a href="#" onclick="supabaseClient.auth.signOut().then(()=>window.location.reload())" 
           class="nav-link flex items-center px-4 py-3 rounded-xl border border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 group">
            <span class="mr-3 text-lg group-hover:text-red-400 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </span>
            <span class="font-medium text-sm">Esci</span>
        </a>
    `;
    
    html += `</div></div>`;
    navContainer.innerHTML = html;
};

// Helper: Genera Link
function renderLink(mod) {
    const isActive = window.currentSection === mod.id;
    const hasSubmenu = mod.subItems && mod.subItems.length > 0;
    const isSubActive = hasSubmenu && mod.subItems.some(sub => sub.section === window.currentSection);
    const isOpen = isActive || isSubActive;

    const activeClass = 'bg-indigo-600/10 border-indigo-500/20 text-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.1)]';
    const inactiveClass = 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50';
    
    // USA L'ICONA REGISTRATA (con fallback generico se manca)
    let icon = mod.icon || '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';

    let html = `
        <div class="mb-1">
            <a href="#" 
               onclick="handleNavClick(event, '${mod.id}')"
               class="nav-link flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${isActive ? activeClass : inactiveClass}">
                
                <div class="flex items-center">
                    <span class="mr-3 text-lg ${isActive ? 'text-indigo-400' : 'text-slate-500'}">${icon}</span>
                    <span class="font-medium text-sm tracking-wide">${mod.name}</span>
                </div>

                ${hasSubmenu ? `
                    <svg class="w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : 'text-slate-600'}" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                ` : (isActive ? '<div class="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>' : '')}
            </a>
    `;

    if (hasSubmenu && isOpen) {
        html += `<div class="mt-1 space-y-1 animate-slideDown overflow-hidden">`;
        mod.subItems.forEach(sub => {
            const subActive = window.currentSection === sub.section;
            const subClassActive = 'text-indigo-300 bg-slate-800/30 font-semibold';
            const subClassInactive = 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/20';

            html += `
                <a href="#" 
                   onclick="handleNavClick(event, '${sub.section}')"
                   class="flex items-center pl-12 pr-4 py-2 text-xs rounded-lg transition-colors ${subActive ? subClassActive : subClassInactive}">
                    ${subActive ? '● ' : ''} ${sub.label}
                </a>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    return html;
}

window.handleNavClick = function(e, sectionId) {
    e.preventDefault();
    if (window.showSection) window.showSection(sectionId);
};

window.showSection = async function(sectionId) {
    window.currentSection = sectionId;
    window.renderSidebar();

    document.querySelectorAll('.content-section').forEach(el => el.classList.add('hidden'));
    
    let target = document.getElementById(sectionId + 'Content');
    if (!target) {
        const main = document.querySelector('main > div') || document.body;
        target = document.createElement('div');
        target.id = sectionId + 'Content';
        target.className = 'content-section hidden animate-fadeIn';
        const dash = document.getElementById('dashboardContent');
        if(dash && dash.parentNode) dash.parentNode.appendChild(target);
        else main.appendChild(target);
    }
    
    target.classList.remove('hidden');

    // Cerca il modulo nel Manager (metodo robusto)
    let mod = null;
    if (window.ModuleManager && window.ModuleManager._modules) {
        if (window.ModuleManager._modules.has(sectionId)) {
            mod = window.ModuleManager._modules.get(sectionId);
        } else {
            // Cerca nei sottomenu
            for (const [key, m] of window.ModuleManager._modules) {
                if (m.subItems && m.subItems.some(s => s.section === sectionId)) {
                    mod = m;
                    break;
                }
            }
        }
    }

    if (mod && mod.render) {
        try {
            await mod.render(target);
        } catch (e) {
            console.error(`Errore render ${sectionId}:`, e);
        }
    } else {
        console.warn(`Modulo '${sectionId}' non trovato.`);
    }
};