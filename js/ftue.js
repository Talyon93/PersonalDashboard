/**
 * FTUE.js - Cloud Version
 * Salva lo stato su Supabase per sincronizzazione tra dispositivi.
 */
const FTUE = {
    steps: [
        {
            element: '#sidebar',
            title: 'Menu Principale',
            text: 'Qui trovi la navigazione. Inizialmente vedrai solo Dashboard e Agenda.',
            position: 'right'
        },
        {
            element: '[data-section="agenda"]',
            title: 'Agenda',
            text: 'Il cuore operativo. Gestisci i tuoi task quotidiani e le scadenze qui.',
            position: 'right'
        },
        {
            element: '#modulesContent, .p-4.border-t button', 
            title: 'Hub Moduli',
            text: 'Per gestire Spese o Obiettivi, devi attivarli qui. Personalizza la tua suite!',
            position: 'right'
        }
    ],

    currentStep: 0,

    async init() {
        // 1. Controllo Veloce (Cache Locale)
        if (localStorage.getItem('myfinance_ftue_completed') === 'true') return;

        // 2. Controllo Database (Se non c'è in cache)
        if (window.supabaseClient) {
            try {
                const { data: { user } } = await window.supabaseClient.auth.getUser();
                if (user) {
                    const { data } = await window.supabaseClient
                        .from('user_modules')
                        .select('ftue_completed')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    
                    // Se il DB dice che è completato, salviamo in locale ed usciamo
                    if (data && data.ftue_completed) {
                        localStorage.setItem('myfinance_ftue_completed', 'true');
                        return;
                    }
                }
            } catch (e) {
                console.warn('FTUE check error', e);
            }
        }

        console.log('✨ Avvio FTUE Tour...');
        
        // Aspetta che la UI sia stabile
        setTimeout(() => this.startTour(), 1500);
    },

    startTour() {
        if (!document.getElementById('ftue-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'ftue-overlay';
            overlay.className = 'fixed inset-0 bg-black/80 z-[9000] transition-opacity duration-500 opacity-0';
            
            overlay.innerHTML = `
                <div id="ftue-box" class="absolute z-[9002] bg-[#0B1120] border border-indigo-500/50 p-6 rounded-2xl shadow-2xl max-w-sm transition-all duration-300 transform scale-95 opacity-0 text-white">
                    <div class="flex justify-between items-start mb-4">
                        <h3 id="ftue-title" class="text-lg font-bold text-white"></h3>
                        <span class="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20">TUTORIAL</span>
                    </div>
                    <p id="ftue-text" class="text-slate-300 text-sm mb-6 leading-relaxed"></p>
                    <div class="flex justify-between items-center mt-4">
                        <div class="flex gap-1.5" id="ftue-dots"></div>
                        <button id="ftue-next" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">Avanti</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            document.getElementById('ftue-next').onclick = () => this.nextStep();
        }

        const overlay = document.getElementById('ftue-overlay');
        overlay.classList.remove('hidden');
        void overlay.offsetWidth; 
        overlay.classList.remove('opacity-0');

        this.showStep(0);
    },

    showStep(index) {
        if (index >= this.steps.length) {
            this.finishTour();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];
        let target = document.querySelector(step.element);
        
        if (!target || target.offsetParent === null) {
            this.nextStep(); 
            return;
        }

        document.querySelectorAll('.ftue-highlight').forEach(el => {
            el.classList.remove('ftue-highlight', 'relative', 'z-[9001]', 'ring-4', 'ring-indigo-500/50');
            el.style.pointerEvents = ''; 
        });
        
        target.classList.add('ftue-highlight', 'relative', 'z-[9001]', 'ring-4', 'ring-indigo-500/50');
        target.style.pointerEvents = 'none'; 
        
        const box = document.getElementById('ftue-box');
        const rect = target.getBoundingClientRect();
        
        document.getElementById('ftue-title').textContent = step.title;
        document.getElementById('ftue-text').textContent = step.text;
        document.getElementById('ftue-next').textContent = index === this.steps.length - 1 ? 'Inizia!' : 'Avanti';

        const dotsContainer = document.getElementById('ftue-dots');
        dotsContainer.innerHTML = this.steps.map((_, i) => 
            `<div class="w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-700'}"></div>`
        ).join('');

        let top, left;
        const margin = 20;

        if (rect.left < window.innerWidth / 3) {
            top = rect.top;
            left = rect.right + margin;
        } else {
            top = rect.bottom + margin;
            left = rect.left;
        }

        if (top + 200 > window.innerHeight) top = window.innerHeight - 250;
        if (left + 300 > window.innerWidth) left = window.innerWidth - 320;

        box.style.top = `${top}px`;
        box.style.left = `${left}px`;
        
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');
    },

    nextStep() {
        this.showStep(this.currentStep + 1);
    },

    async finishTour() {
        const overlay = document.getElementById('ftue-overlay');
        overlay.classList.add('opacity-0');
        
        document.querySelectorAll('.ftue-highlight').forEach(el => {
            el.classList.remove('ftue-highlight', 'relative', 'z-[9001]', 'ring-4', 'ring-indigo-500/50');
            el.style.pointerEvents = '';
        });

        setTimeout(async () => {
            overlay.remove();
            
            // 1. Salva in Locale (per velocità immediata)
            localStorage.setItem('myfinance_ftue_completed', 'true');
            
            // 2. Salva in Database (per persistenza cross-device)
            if (window.supabaseClient) {
                try {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (user) {
                        await window.supabaseClient
                            .from('user_modules')
                            .update({ ftue_completed: true })
                            .eq('user_id', user.id);
                        console.log('✅ FTUE salvato su DB');
                    }
                } catch (e) {
                    console.error('Errore salvataggio FTUE su DB:', e);
                }
            }

            Helpers.showToast("Tour completato! 🚀", "success");
        }, 500);
    }
};

window.FTUE = FTUE;