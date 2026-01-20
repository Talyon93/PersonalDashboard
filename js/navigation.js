/**
 * Optimized Navigation - Fast section switching with cache
 * FIXED: Properly calls init() for Agenda before rendering
 */

// Replace the old showSection function
window.showSection = async function(sectionName) {
    console.log(`📄 Switching to section: ${sectionName}`);
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.classList.add('hidden'));

    // Show target section
    const targetSection = document.getElementById(sectionName + 'Content');
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(sectionName)) {
            link.classList.add('active');
        }
    });

    // Render section with cached data (fast!)
    const components = {
        'dashboard': Dashboard,
        'expenses': Expenses,
        'statistics': Statistics,
        'agenda': Agenda,
        'goals': Goals,
        'settings': Settings
    };

    const component = components[sectionName];
    if (component) {
        // Show loading state for component
        if (targetSection) {
            targetSection.innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            `;
        }

        // If switching to Dashboard, invalidate cache first to show fresh data
        if (sectionName === 'dashboard' && window.DataCache) {
            console.log('🔄 Invalidating cache for Dashboard refresh');
            DataCache.invalidate('tasks');
            DataCache.invalidate('expenses');
            DataCache.invalidate('goals');
        }

        // Render with cache (should be instant if preloaded)
        try {
            // Special handling for Agenda: call init() first to load tasks
            if (sectionName === 'agenda' && component.init) {
                console.log('📅 Calling Agenda.init() to load tasks');
                await component.init();
            } else if (component.render) {
                await component.render();
            } else if (component.init) {
                await component.init();
            }
        } catch (e) {
            console.error(`Error rendering ${sectionName}:`, e);
            if (targetSection) {
                targetSection.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p class="text-red-800">Errore nel caricamento della sezione</p>
                        <button onclick="window.location.reload()" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            Ricarica
                        </button>
                    </div>
                `;
            }
        }
    }
};

console.log('✅ Optimized navigation loaded (with Agenda fix)');
