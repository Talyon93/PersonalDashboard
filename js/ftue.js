/**
 * FTUE.js - Final Fix 🚀
 * Fix: Punta al link della sidebar per i moduli, non al contenuto nascosto.
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
            element: '#dashboardContent', 
            title: 'Area di Lavoro',
            text: 'Qui appariranno i tuoi Widget e i dati operativi.',
            position: 'right'
        },
        {
            // FIX: Ora punta al bottone nel menu usando il data-id che abbiamo messo in navigation.js
            element: '[data-id="modules"], a[onclick*="modules"]', 
            title: 'Hub Moduli',
            text: 'Per gestire Spese o Obiettivi, clicca qui e attivali!',
            position: 'right'
        }
    ],

    currentStep: 0,

    async init(force = false) {
        if (force) {
            console.log('⚡ FTUE: Avvio forzato.');
            localStorage.removeItem('myfinance_ftue_completed');
        } else {
            if (localStorage.getItem('myfinance_ftue_completed') === 'true') return;

            if (window.supabaseClient) {
                try {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (user) {
                        const { data } = await window.supabaseClient
                            .from('user_modules')
                            .select('ftue_completed')
                            .eq('user_id', user.id)
                            .maybeSingle();
                        
                        if (data && data.ftue_completed) {
                            localStorage.setItem('myfinance_ftue_completed', 'true');
                            return;
                        }
                    }
                } catch (e) { console.warn(e); }
            }
        }

        console.log('⏳ FTUE: Attesa elemento iniziale...');
        
        // Aspetta che appaia la sidebar
        this.waitForElement('#sidebar').then(() => {
            console.log('✨ FTUE: Sidebar trovata, avvio.');
            // Timeout extra per dare tempo al rendering dei child
            setTimeout(() => this.startTour(), 500);
        }).catch(err => {
            console.error('FTUE Errore:', err);
        });
    },

    waitForElement(selector) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));

            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => { observer.disconnect(); resolve(document.querySelector(selector)); }, 5000); 
        });
    },

    startTour() {
        if (document.getElementById('ftue-overlay')) document.getElementById('ftue-overlay').remove();

        const overlay = document.createElement('div');
        overlay.id = 'ftue-overlay';
        overlay.className = 'fixed inset-0 bg-black/80 z-[9999] transition-opacity duration-500 opacity-0';
        
        overlay.innerHTML = `
            <div id="ftue-box" class="absolute z-[10000] bg-[#0B1120] border border-indigo-500/50 p-6 rounded-2xl shadow-2xl max-w-sm transition-all duration-300 transform scale-95 opacity-0 text-white">
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
        
        document.getElementById('ftue-next').addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            this.nextStep();
        });

        requestAnimationFrame(() => {
            overlay.classList.remove('hidden', 'opacity-0');
            this.showStep(0);
        });
    },

    showStep(index) {
        if (index >= this.steps.length) {
            this.finishTour();
            return;
        }

        this.currentStep = index;
        const step = this.steps[index];
        let target = document.querySelector(step.element);
        
        // Fallback se l'elemento non c'è: passa al prossimo
        if (!target || target.offsetParent === null) {
            console.warn(`FTUE: Elemento ${step.element} non trovato. Salto.`);
            this.nextStep(); 
            return;
        }

        document.querySelectorAll('.ftue-highlight').forEach(el => {
            el.classList.remove('ftue-highlight', 'relative', 'z-[9998]', 'ring-4', 'ring-indigo-500/50');
        });
        
        target.classList.add('ftue-highlight', 'relative', 'z-[9998]', 'ring-4', 'ring-indigo-500/50');
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const box = document.getElementById('ftue-box');
        const rect = target.getBoundingClientRect();
        
        document.getElementById('ftue-title').textContent = step.title;
        document.getElementById('ftue-text').textContent = step.text;
        document.getElementById('ftue-next').textContent = index === this.steps.length - 1 ? 'Inizia!' : 'Avanti';

        document.getElementById('ftue-dots').innerHTML = this.steps.map((_, i) => 
            `<div class="w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-indigo-500' : 'bg-slate-700'}"></div>`
        ).join('');

        // Posizionamento Smart
        const boxW = 320, boxH = 200, margin = 20;
        let top, left;

        if (rect.right + boxW + margin < window.innerWidth) {
            left = rect.right + margin; top = rect.top;
        } else if (rect.bottom + boxH + margin < window.innerHeight) {
            top = rect.bottom + margin; left = rect.left;
        } else {
            top = rect.top - boxH - margin; left = rect.left;
        }
        
        // Limiti schermo
        if (left < 10) left = 10;
        if (top < 10) top = 10;
        if (left + boxW > window.innerWidth) left = window.innerWidth - boxW - 10;

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
        if (overlay) overlay.classList.add('opacity-0');
        
        document.querySelectorAll('.ftue-highlight').forEach(el => {
            el.classList.remove('ftue-highlight', 'relative', 'z-[9998]', 'ring-4', 'ring-indigo-500/50');
        });

        setTimeout(async () => {
            if (overlay) overlay.remove();
            
            localStorage.setItem('myfinance_ftue_completed', 'true');
            
            if (window.supabaseClient) {
                try {
                    const { data: { user } } = await window.supabaseClient.auth.getUser();
                    if (user) {
                        await window.supabaseClient.from('user_modules').update({ ftue_completed: true }).eq('user_id', user.id);
                    }
                } catch (e) {}
            }
            if (window.Helpers && window.Helpers.showToast) Helpers.showToast("Tour completato! 🚀", "success");
        }, 500);
    }
};

window.FTUE = FTUE;