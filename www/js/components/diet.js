/**
 * Diet Module V4.3 - WEEKLY WIDGET EDITION
 * Features: Day Planner, Shopping List Avanzata, Widget Oggi/Domani + Widget Settimana.
 */

const Diet = {
    plans: {}, 
    days: ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'],
    mealTypes: [
        { id: 'breakfast', label: 'Colazione', icon: '☕' },
        { id: 'lunch', label: 'Pranzo', icon: '🍝' },
        { id: 'dinner', label: 'Cena', icon: '🌙' },
        { id: 'snacks', label: 'Spuntini', icon: '🍎' }
    ],

    async init() {
        await this.loadData();
        await this.render();
    },

    async loadData() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const { data, error } = await window.supabaseClient
                .from('diet_plans')
                .select('*')
                .eq('user_id', user.id);

            if (error) throw error;

            this.plans = {};
            data.forEach(item => {
                let parsedPlan = item.full_plan || {};
                this.mealTypes.forEach(type => {
                    if (!parsedPlan[type.id]) {
                        parsedPlan[type.id] = { 
                            main: { name: '', ingredients: [], recipe: '' },
                            alts: [] 
                        };
                    }
                });
                this.plans[item.day_index] = parsedPlan;
            });
        } catch (e) {
            console.error('Error loading diet:', e);
        }
    },

    async render() {
        const container = document.getElementById('dietContent');
        if (!container) return;

        container.innerHTML = `
            <div class="mb-10 animate-fadeIn">
                <div class="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 via-green-400 to-teal-500 bg-clip-text text-transparent italic">Meal Planner Pro</h2>
                        <p class="text-slate-400 mt-2 font-medium flex items-center gap-2">
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Colazione, Pranzo, Cena e Alternative.
                        </p>
                    </div>
                    <button onclick="Diet.showShoppingList()" 
                            class="group relative px-6 py-3 bg-slate-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/10 flex items-center gap-3 overflow-hidden">
                        <div class="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span class="relative text-xl">🛒</span> 
                        <span class="relative">Lista della Spesa</span>
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    ${this.days.map((day, index) => this.renderDayCard(day, index)).join('')}
                </div>
            </div>
        `;
    },

    renderDayCard(dayName, index) {
        const plan = this.plans[index] || {};
        const hasAnyMeal = this.mealTypes.some(type => plan[type.id] && plan[type.id].main.name);
        const todayIndex = (new Date().getDay() + 6) % 7;
        const isToday = index === todayIndex;
        
        const borderClass = isToday ? 'border-emerald-500 shadow-[0_0_25px_-5px_rgba(16,185,129,0.3)]' : 'border-slate-700/40 hover:border-slate-600';
        const bgClass = isToday ? 'bg-slate-800/80' : 'bg-slate-800/30';
        const textClass = isToday ? 'text-emerald-400' : 'text-slate-300';

        return `
            <div class="group relative flex flex-col h-full rounded-[1.5rem] border ${borderClass} ${bgClass} backdrop-blur-sm p-0 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
                    <h3 class="text-lg font-bold tracking-tight ${textClass} uppercase">${dayName}</h3>
                    <div class="flex gap-2">
                        ${isToday ? '<span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Oggi</span>' : ''}
                        <button onclick="Diet.openModal(${index})" class="text-slate-400 hover:text-white transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="flex-1 p-5 space-y-4">
                    ${hasAnyMeal ? this.mealTypes.map(type => {
                        const mealData = plan[type.id];
                        if (!mealData || !mealData.main.name) return '';
                        const altCount = mealData.alts ? mealData.alts.length : 0;
                        return `
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-lg shrink-0">
                                    ${type.icon}
                                </div>
                                <div class="min-w-0 flex-1">
                                    <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">${type.label}</p>
                                    <p class="text-sm font-medium text-slate-200 truncate">${Helpers.escapeHtml(mealData.main.name)}</p>
                                    ${altCount > 0 ? `<p class="text-[10px] text-emerald-500/80 mt-0.5">+ ${altCount} alternative</p>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('') : `
                        <div class="h-32 flex flex-col items-center justify-center text-center opacity-50">
                            <span class="text-4xl mb-2">🍽️</span>
                            <p class="text-xs font-medium text-slate-400">Nessun pasto pianificato</p>
                        </div>
                    `}
                </div>
                <div class="p-4 border-t border-slate-700/50 bg-slate-800/30">
                    <button onclick="Diet.openModal(${index})" 
                            class="w-full py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors">
                        ${hasAnyMeal ? 'Modifica Piano' : 'Pianifica Giornata'}
                    </button>
                </div>
            </div>
        `;
    },

    // ============================================================
    //  MODAL LOGIC
    // ============================================================

    openModal(dayIndex) {
        const plan = this.plans[dayIndex] || {};
        this.mealTypes.forEach(type => {
            if (!plan[type.id]) {
                plan[type.id] = { main: { name: '', ingredients: [], recipe: '' }, alts: [] };
            }
        });

        const tabsHtml = this.mealTypes.map((type, i) => `
            <button onclick="Diet.switchTab('${type.id}')" 
                    id="tab-btn-${type.id}"
                    class="flex-1 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${i === 0 ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'}">
                ${type.icon} <span class="hidden sm:inline ml-1">${type.label}</span>
            </button>
        `).join('');

        const contentHtml = this.mealTypes.map((type, i) => this.renderMealEditor(type.id, plan[type.id], i === 0)).join('');

        const modalHTML = `
            <div id="dietModal" class="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-6 animate-fadeIn">
                <div class="bg-slate-900 w-full h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[2rem] sm:max-w-4xl border-0 sm:border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slideUp relative">
                    
                    <div class="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0 z-10">
                        <div>
                            <p class="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Piano Alimentare</p>
                            <h3 class="text-3xl font-black text-white italic tracking-tight">${this.days[dayIndex]}</h3>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="Diet.savePlan(event, ${dayIndex})" class="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold text-sm transition shadow-lg shadow-emerald-900/20">Salva Tutto</button>
                            <button onclick="document.getElementById('dietModal').remove()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 w-10 h-10 rounded-xl flex items-center justify-center transition border border-slate-700">✕</button>
                        </div>
                    </div>

                    <div class="flex border-b border-slate-800 bg-slate-900 shrink-0 z-10">
                        ${tabsHtml}
                    </div>

                    <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/50">
                        <form id="dietForm" onsubmit="event.preventDefault();">
                            ${contentHtml}
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    renderMealEditor(mealId, data, isVisible) {
        const main = data.main || { name: '', ingredients: [], recipe: '' };
        const alts = data.alts || [];
        const ingText = main.ingredients.join('\n');

        return `
            <div id="meal-content-${mealId}" class="${isVisible ? '' : 'hidden'} space-y-8 animate-fadeIn pb-10">
                <div class="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 relative group focus-within:border-emerald-500/30 transition-colors">
                    <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity"><span class="text-4xl">👑</span></div>
                    <h4 class="text-lg font-bold text-white mb-6 flex items-center gap-2"><span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>Opzione Principale</h4>
                    <div class="space-y-6">
                        <div><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Nome Piatto</label><input type="text" name="${mealId}_main_name" value="${Helpers.escapeHtml(main.name)}" class="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-4 text-white focus:border-emerald-500 focus:outline-none placeholder-slate-600 font-bold text-lg" placeholder="Es: Riso Basmati con Pollo"></div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Ingredienti (1 per riga)</label><textarea name="${mealId}_main_ings" rows="6" class="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-emerald-500 focus:outline-none resize-none placeholder-slate-600 leading-relaxed" placeholder="Riso&#10;Pollo">${Helpers.escapeHtml(ingText)}</textarea></div>
                            <div><label class="block text-xs font-bold text-slate-400 uppercase mb-2">Procedimento</label><textarea name="${mealId}_main_recipe" rows="6" class="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 text-sm focus:border-emerald-500 focus:outline-none resize-none placeholder-slate-600 leading-relaxed" placeholder="Note sulla preparazione...">${Helpers.escapeHtml(main.recipe)}</textarea></div>
                        </div>
                    </div>
                </div>
                <div class="space-y-4 pt-4 border-t border-slate-800">
                    <div class="flex items-center justify-between"><h4 class="text-lg font-bold text-slate-300 flex items-center gap-2"><span class="text-xl">🔀</span> Alternative</h4><button type="button" onclick="Diet.addAlternative('${mealId}')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider transition border border-slate-700 hover:border-emerald-500/30">+ Aggiungi</button></div>
                    <div id="alts-container-${mealId}" class="grid gap-4">${alts.map((alt, idx) => this.renderAltCard(mealId, idx, alt)).join('')}</div>
                </div>
            </div>
        `;
    },

    renderAltCard(mealId, index, alt = { name: '', ingredients: [], recipe: '' }) {
        const ingText = alt.ingredients ? alt.ingredients.join('\n') : '';
        return `
            <div class="alt-card bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 relative group hover:border-slate-600 transition-all hover:bg-slate-800/50" id="${mealId}_alt_${index}">
                <button type="button" onclick="document.getElementById('${mealId}_alt_${index}').remove()" class="absolute top-4 right-4 p-1.5 bg-slate-700/50 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                <div class="space-y-4 pr-10">
                    <div><label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nome Alternativa</label><input type="text" name="${mealId}_alt_name_${index}" value="${Helpers.escapeHtml(alt.name)}" class="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 focus:outline-none font-bold" placeholder="Es. Insalata"></div>
                    <div class="grid grid-cols-2 gap-3">
                        <textarea name="${mealId}_alt_ings_${index}" rows="3" class="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-xs focus:border-emerald-500 focus:outline-none resize-none" placeholder="Ingredienti...">${Helpers.escapeHtml(ingText)}</textarea>
                        <textarea name="${mealId}_alt_recipe_${index}" rows="3" class="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-400 text-xs focus:border-emerald-500 focus:outline-none resize-none" placeholder="Note...">${Helpers.escapeHtml(alt.recipe)}</textarea>
                    </div>
                </div>
            </div>
        `;
    },

    addAlternative(mealId) {
        const container = document.getElementById(`alts-container-${mealId}`);
        container.insertAdjacentHTML('beforeend', this.renderAltCard(mealId, Date.now()));
    },

    switchTab(mealId) {
        this.mealTypes.forEach(type => {
            document.getElementById(`meal-content-${type.id}`).classList.add('hidden');
            const btn = document.getElementById(`tab-btn-${type.id}`);
            btn.classList.remove('border-emerald-500', 'text-emerald-400', 'bg-slate-800/50');
            btn.classList.add('border-transparent', 'text-slate-500');
        });
        document.getElementById(`meal-content-${mealId}`).classList.remove('hidden');
        const activeBtn = document.getElementById(`tab-btn-${mealId}`);
        activeBtn.classList.remove('border-transparent', 'text-slate-500');
        activeBtn.classList.add('border-emerald-500', 'text-emerald-400', 'bg-slate-800/50');
    },

    async savePlan(e, dayIndex) {
        e.preventDefault();
        const form = document.getElementById('dietForm');
        const fullPlan = {};

        this.mealTypes.forEach(type => {
            const mId = type.id;
            const mainName = form.querySelector(`[name="${mId}_main_name"]`).value.trim();
            const mainIngs = form.querySelector(`[name="${mId}_main_ings"]`).value.split('\n').map(l=>l.trim()).filter(l=>l);
            const mainRecipe = form.querySelector(`[name="${mId}_main_recipe"]`).value.trim();

            const altsContainer = document.getElementById(`alts-container-${mId}`);
            const altDivs = altsContainer.querySelectorAll('.alt-card');
            const alts = [];

            altDivs.forEach(div => {
                const nameInput = div.querySelector('input[type="text"]');
                const textareas = div.querySelectorAll('textarea');
                const altName = nameInput.value.trim();
                if(altName) {
                    alts.push({ name: altName, ingredients: textareas[0].value.split('\n').map(l=>l.trim()).filter(l=>l), recipe: textareas[1].value.trim() });
                }
            });
            fullPlan[mId] = { main: { name: mainName, ingredients: mainIngs, recipe: mainRecipe }, alts: alts };
        });

        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const { error } = await window.supabaseClient
                .from('diet_plans')
                .upsert({ user_id: user.id, day_index: dayIndex, full_plan: fullPlan }, { onConflict: 'user_id, day_index' });

            if (error) throw error;
            this.plans[dayIndex] = fullPlan;
            document.getElementById('dietModal').remove();
            this.render();
            Helpers.showToast('✅ Giornata salvata!', 'success');
        } catch (err) {
            console.error(err);
            Helpers.showToast('Errore salvataggio', 'error');
        }
    },

    // ============================================================
    //  SHOPPING LIST (IMPROVED)
    // ============================================================

    showShoppingList() {
        const allIngredients = [];
        Object.values(this.plans).forEach(dayPlan => {
            this.mealTypes.forEach(type => {
                if (dayPlan[type.id] && dayPlan[type.id].main) {
                    allIngredients.push(...(dayPlan[type.id].main.ingredients || []));
                }
            });
        });

        const uniqueIngs = [...new Set(allIngredients)].sort();

        if (uniqueIngs.length === 0) {
            Helpers.showToast('Nessun ingrediente nei piani!', 'info');
            return;
        }

        window.copyShoppingList = () => {
            const text = uniqueIngs.map(i => `- ${i}`).join('\n');
            navigator.clipboard.writeText(text).then(() => Helpers.showToast('Copiata! 📋', 'success'));
        };

        window.shareShoppingList = () => {
            const text = "Lista Spesa:\n\n" + uniqueIngs.map(i => `- ${i}`).join('\n');
            if (navigator.share) navigator.share({ title: 'Lista Spesa', text: text }).catch(console.error);
            else window.copyShoppingList();
        };

        const modalHTML = `
            <div id="shopModal" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fadeIn">
                <div class="bg-slate-900 border border-slate-700 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-slideUp flex flex-col max-h-[85vh]">
                    <div class="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 relative overflow-hidden shrink-0">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div class="relative z-10 flex justify-between items-start">
                            <div><h3 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">🛒 Shopping List</h3><p class="mt-1 text-emerald-100 text-xs font-bold uppercase tracking-widest opacity-80">${uniqueIngs.length} Ingredienti</p></div>
                            <button onclick="document.getElementById('shopModal').remove()" class="bg-black/20 hover:bg-black/40 text-white rounded-xl w-8 h-8 flex items-center justify-center transition backdrop-blur-sm">✕</button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 bg-slate-900 custom-scrollbar space-y-2">
                        ${uniqueIngs.map(ing => `
                            <label class="group flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800 transition-all cursor-pointer select-none active:scale-[0.98]">
                                <div class="relative flex items-center">
                                    <input type="checkbox" class="peer w-5 h-5 rounded border-2 border-slate-500 bg-slate-700/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer appearance-none checked:bg-emerald-500 checked:border-emerald-500 transition-all">
                                    <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span class="text-slate-300 font-medium peer-checked:text-slate-500 peer-checked:line-through transition-colors">${Helpers.escapeHtml(ing)}</span>
                            </label>
                        `).join('')}
                    </div>
                    <div class="p-4 bg-slate-800 border-t border-slate-700 shrink-0 grid grid-cols-2 gap-3">
                        <button onclick="window.copyShoppingList()" class="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition">📋 Copia</button>
                        ${navigator.share ? `<button onclick="window.shareShoppingList()" class="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition shadow-lg">📤 Invia</button>` : `<button onclick="window.print()" class="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm transition">🖨️ Stampa</button>`}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        setTimeout(() => {
            document.querySelectorAll('#shopModal input[type="checkbox"]').forEach(input => {
                input.addEventListener('change', (e) => {
                    const span = e.target.closest('label').querySelector('span');
                    if(e.target.checked) { span.classList.add('line-through', 'text-slate-500'); span.classList.remove('text-slate-300'); }
                    else { span.classList.remove('line-through', 'text-slate-500'); span.classList.add('text-slate-300'); }
                });
            });
        }, 50);
    },

    // ============================================================
    //  WIDGET EXPORT LOGIC
    // ============================================================

    getWidgets() {
        return [
            {
                id: 'diet_today',
                name: 'Menu di Oggi',
                description: 'Pasti pianificati per oggi',
                size: { cols: 1, rows: 2 },
                render: () => this.renderWidgetMeals(0, 'Oggi')
            },
            {
                id: 'diet_tomorrow',
                name: 'Menu di Domani',
                description: 'Pasti pianificati per domani',
                size: { cols: 1, rows: 2 },
                render: () => this.renderWidgetMeals(1, 'Domani')
            },
            {
                id: 'diet_shopping',
                name: 'Spesa Smart 48h',
                description: 'Ingredienti per oggi e domani',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetShopping()
            },
            // WIDGET SETTIMANALE AGGIORNATO
            {
                id: 'diet_week',
                name: 'Piano Settimanale',
                description: 'Panoramica dettagliata 7 giorni',
                size: { cols: 4, rows: 2 }, // 2 RIGHE DI ALTEZZA
                render: () => this.renderWidgetWeekly()
            }
        ];
    },

    renderWidgetMeals(dayOffset, title) {
        const todayIndex = (new Date().getDay() + 6) % 7;
        const targetIndex = (todayIndex + dayOffset) % 7;
        const dayName = this.days[targetIndex];
        const plan = this.plans[targetIndex] || {};
        
        let hasMeals = false;
        
        const mealsHtml = ['breakfast', 'lunch', 'dinner'].map(typeId => {
            const meal = plan[typeId]?.main;
            const typeConfig = this.mealTypes.find(t => t.id === typeId);
            if (meal && meal.name) {
                hasMeals = true;
                return `
                    <div class="flex items-start gap-3 p-2 bg-slate-700/30 rounded-xl border border-white/5">
                        <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-700">${typeConfig.icon}</div>
                        <div class="min-w-0">
                            <p class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">${typeConfig.label}</p>
                            <p class="text-xs font-bold text-slate-200 truncate leading-tight">${Helpers.escapeHtml(meal.name)}</p>
                        </div>
                    </div>
                `;
            }
            return '';
        }).join('');

        if (!hasMeals) {
            return `
                <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col cursor-pointer hover:border-emerald-500/30 transition-all" onclick="Diet.openModal(${targetIndex})">
                    <div class="flex justify-between items-center mb-4">
                        <div><span class="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">${title}</span><h4 class="text-lg font-bold text-white capitalize">${dayName}</h4></div>
                        <span class="text-2xl grayscale opacity-50">🍽️</span>
                    </div>
                    <div class="flex-1 flex flex-col items-center justify-center text-center opacity-60"><span class="text-2xl mb-2">✏️</span><p class="text-xs font-bold uppercase tracking-wide">Pianifica ora</p></div>
                </div>
            `;
        }

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col cursor-pointer group hover:bg-slate-800/40 transition-all" onclick="window.showSection('diet')">
                <div class="flex justify-between items-center mb-4">
                    <div><span class="text-[10px] font-black uppercase tracking-widest ${dayOffset === 0 ? 'text-emerald-400' : 'text-slate-500'}">${title}</span><h4 class="text-lg font-bold text-white capitalize">${dayName}</h4></div>
                    <div class="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">➜</div>
                </div>
                <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-1">${mealsHtml}</div>
            </div>
        `;
    },

    renderWidgetShopping() {
        const todayIndex = (new Date().getDay() + 6) % 7;
        const tomorrowIndex = (todayIndex + 1) % 7;
        const indices = [todayIndex, tomorrowIndex];
        let allIngredients = [];
        indices.forEach(idx => {
            const plan = this.plans[idx] || {};
            this.mealTypes.forEach(type => { if (plan[type.id]?.main?.ingredients) allIngredients.push(...plan[type.id].main.ingredients); });
        });
        const uniqueCount = new Set(allIngredients).size;

        return `
            <div class="h-full bg-gradient-to-br from-emerald-600/90 to-teal-700/90 backdrop-blur-md rounded-[2.5rem] p-6 border border-emerald-500/30 shadow-xl flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-all relative overflow-hidden" onclick="Diet.showShoppingList()">
                <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div class="flex justify-between items-start relative z-10">
                    <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">🛒</div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-emerald-100 bg-black/10 px-2 py-1 rounded-lg">48h</span>
                </div>
                <div class="relative z-10"><p class="text-4xl font-black text-white tracking-tighter mb-1">${uniqueCount}</p><p class="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Ingredienti nec.</p></div>
            </div>
        `;
    },

    renderWidgetWeekly() {
        const todayIndex = (new Date().getDay() + 6) % 7;
        
        let daysHtml = this.days.map((day, i) => {
            const plan = this.plans[i] || {};
            const lunch = plan.lunch?.main?.name;
            const dinner = plan.dinner?.main?.name;
            
            const isToday = i === todayIndex;
            
            // Stili condizionali
            const containerClass = isToday 
                ? 'bg-slate-700/80 border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-lg' 
                : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/50';
            
            const dayTextClass = isToday ? 'text-emerald-400 font-black' : 'text-slate-400 font-bold';

            return `
                <div onclick="Diet.openModal(${i})" 
                     class="flex flex-col gap-2 p-3 rounded-2xl border ${containerClass} cursor-pointer transition-all group h-full relative overflow-hidden">
                    
                    <div class="flex justify-between items-center border-b border-white/5 pb-2 mb-1">
                        <span class="text-[10px] uppercase tracking-widest ${dayTextClass}">${day.substring(0, 3)}</span>
                        ${isToday ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>' : ''}
                    </div>

                    <div class="flex-1 flex flex-col gap-2 justify-center">
                        <div class="space-y-0.5">
                            <div class="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                                <span>🍝</span> <span>Pranzo</span>
                            </div>
                            <p class="text-xs font-medium ${lunch ? 'text-white' : 'text-slate-600 italic'} truncate leading-tight">
                                ${lunch ? Helpers.escapeHtml(lunch) : '---'}
                            </p>
                        </div>

                        <div class="space-y-0.5 pt-1 border-t border-dashed border-white/5">
                            <div class="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                                <span>🌙</span> <span>Cena</span>
                            </div>
                            <p class="text-xs font-medium ${dinner ? 'text-white' : 'text-slate-600 italic'} truncate leading-tight">
                                ${dinner ? Helpers.escapeHtml(dinner) : '---'}
                            </p>
                        </div>
                    </div>
                    
                    <div class="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span class="bg-slate-900/80 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded backdrop-blur-sm">Modifica</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-6 border border-slate-700/40 shadow-xl flex flex-col">
                <div class="flex justify-between items-center mb-4 px-1">
                    <div class="flex items-center gap-3">
                        <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shadow-inner">📅</span>
                        <h3 class="font-bold text-white text-sm uppercase tracking-wide">Piano Settimanale</h3>
                    </div>
                </div>
                
                <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 overflow-y-auto lg:overflow-visible custom-scrollbar">
                    ${daysHtml}
                </div>
            </div>
        `;
    }
};

if (window.ModuleManager) {
    ModuleManager.register({
        id: 'diet',
        name: 'Dieta',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        category: 'growth',
        order: 25,
        init: () => Diet.init(),
        render: () => Diet.render(),
        widgets: Diet.getWidgets() 
    });
}