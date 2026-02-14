/**
 * Expenses Widgets - DASHBOARD COMPONENTS
 * Versione ULTIMATE PRO: Design Glassmorphism, Neon Glow e Tipografia High-End.
 * Include logica di confronto Budget e Widget di Sincronizzazione con icone SVG integrate.
 */

const ExpensesWidgets = {
    // Helper per icone SVG inline (Garantisce che non ci siano quadratini vuoti)
    getSvgIcon(name, color = "currentColor") {
        const icons = {
            'alert': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            'sync': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`,
            'activity': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`
        };
        return icons[name] || '';
    },
    
    getIcon(name, size = 18) {
        return `<i data-lucide="${name}" style="width: ${size}px; height: ${size}px;"></i>`;
    },

    getDefinitions() {
        return [
            {
                id: 'expenses_balance',
                name: 'Bilancio Mese',
                description: 'Entrate vs Uscite correnti',
                size: { cols: 1, rows: 1 },
                type: 'kpi',
                render: () => this.renderWidgetBalance()
            },
            {
                id: 'expenses_sync_status',
                name: 'Stato Sync',
                description: 'Giorni dall\'ultimo caricamento dati',
                size: { cols: 1, rows: 1 },
                type: 'kpi',
                render: () => this.renderWidgetSyncStatus()
            },
            { 
                id: 'expenses_recent', 
                name: 'Ultime Spese', 
                description: 'Lista attività recenti', 
                size: { cols: 1, rows: 2 }, 
                type: 'list',
                render: () => this.renderWidgetRecent()
            },
            {
                id: 'expenses_trend',
                name: 'Trend 7gg',
                description: 'Grafico spese settimanale',
                size: { cols: 1, rows: 1 },
                type: 'chart',
                render: () => this.renderWidgetTrend()
            },
            {
                id: 'expenses_budget',
                name: 'Stato Budget',
                description: 'Speso vs Obiettivo mensile',
                size: { cols: 2, rows: 1 },
                type: 'chart',
                render: () => this.renderWidgetBudget()
            },
            {
                id: 'expenses_categories',
                name: 'Distribuzione Categorie',
                description: 'Scomposizione spese per categoria',
                size: { cols: 2, rows: 2 },
                type: 'chart',
                render: () => this.renderWidgetCategories()
            },
            {
                id: 'expenses_savings_rate',
                name: 'Tasso Risparmio',
                description: '% di entrate non spese',
                size: { cols: 1, rows: 1 },
                type: 'kpi',
                render: () => this.renderWidgetSavings()
            },
            {
                id: 'expenses_merchants',
                name: 'Top Merchant',
                description: 'Dove spendi più spesso',
                size: { cols: 1, rows: 1 },
                type: 'list',
                render: () => this.renderWidgetTopMerchants()
            },
            {
                id: 'expenses_quick_add',
                name: 'Quick Cash',
                description: 'Inserimento rapido spese comuni',
                size: { cols: 1, rows: 1 },
                type: 'generic',
                render: () => this.renderWidgetQuickActions()
            },
            {
                id: 'expenses_budget_full',
                name: 'Budget Pro',
                description: 'Barra dettagliata a larghezza intera',
                size: { cols: 4, rows: 1 },
                type: 'kpi',
                render: () => this.renderWidgetBudgetFull()
            },
            {
                id: 'expenses_monthly_graph',
                name: 'Andamento Spese',
                description: 'Visualizzazione premium dell\'andamento mensile con soglie di budget',
                size: { cols: 2, rows: 2 },
                type: 'chart',
                render: () => this.renderWidgetMonthlyGraph()
            }
        ];
    },

    // --- WIDGET STATO SINCRONIZZAZIONE (RE-DESIGNED) ---
    async renderWidgetSyncStatus() {
        const expenses = await window.CachedCRUD.getExpenses();
        if (!expenses || expenses.length === 0) {
            return `<div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-7 flex items-center justify-center text-slate-500 font-black uppercase text-[10px] tracking-widest border border-white/5 shadow-2xl">Dati mancanti</div>`;
        }

        const lastDate = new Date(Math.max(...expenses.map(e => new Date(e.date))));
        const today = new Date();
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const isWarning = diffDays > 7;
        const mainColor = isWarning ? '#f43f5e' : '#10b981';
        const colorClass = isWarning ? 'text-rose-500' : 'text-emerald-400';
        const bgGlow = isWarning ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)';
        const iconName = isWarning ? 'alert' : 'sync';

        return `
            <div class="h-full bg-slate-950/60 backdrop-blur-2xl rounded-[2.5rem] p-7 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col justify-between group cursor-pointer transition-all hover:border-white/10" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1.5">Database Status</p>
                        <div class="flex items-center gap-2">
                            <div class="relative w-2 h-2">
                                <div class="absolute inset-0 ${isWarning ? 'bg-rose-500' : 'bg-emerald-400'} rounded-full animate-ping opacity-75"></div>
                                <div class="relative w-2 h-2 ${isWarning ? 'bg-rose-500' : 'bg-emerald-400'} rounded-full shadow-[0_0_8px_${mainColor}]"></div>
                            </div>
                            <span class="text-[10px] font-black text-white/90 uppercase tracking-widest">${isWarning ? 'Action Required' : 'Up to Date'}</span>
                        </div>
                    </div>
                    <div class="w-8 h-8 ${colorClass} opacity-40 group-hover:opacity-100 transition-opacity">
                        ${this.getSvgIcon(iconName, mainColor)}
                    </div>
                </div>

                <div class="py-2">
                    <h4 class="text-5xl font-black text-white tracking-tighter leading-none">${diffDays}<span class="text-xl text-slate-600 font-bold ml-1 uppercase">gg</span></h4>
                    <p class="text-[9px] font-black text-slate-500 uppercase mt-3 tracking-[0.2em]">Dall'ultimo aggiornamento</p>
                </div>

                <div class="mt-4 h-1.5 w-full bg-black/60 rounded-full p-0.5 border border-white/5 shadow-inner overflow-hidden">
                    <div class="h-full rounded-full bg-current ${colorClass} transition-all duration-1000 ease-out shadow-[0_0_20px_${mainColor}]" style="width: ${Math.min((diffDays/14)*100, 100)}%;"></div>
                </div>
            </div>`;
    },

    async renderWidgetRecent() {
        const expenses = await window.CachedCRUD.getExpenses();
        const recent = expenses
            .filter(e => !e.is_excluded)
            .sort((a,b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);

        if (recent.length === 0) return `<div class="h-full bg-slate-800/30 backdrop-blur-md rounded-[2.5rem] p-7 flex items-center justify-center text-slate-500 font-bold">Nessun dato</div>`;

        const listHtml = recent.map(e => {
            const cat = window.Categories?.getById(e.category) || { icon: '📦', name: 'Altro' };
            const isIncome = e.type === 'income';
            return `
                <div class="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer group" onclick="ExpenseModals.showDetail('${e.id}')">
                    <div class="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">${cat.icon}</div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-white truncate">${e.description}</p>
                        <p class="text-[10px] text-slate-400 font-medium">${new Date(e.date).toLocaleDateString('it-IT', {day:'2-digit', month:'short'})}</p>
                    </div>
                    <span class="font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-200'}">${isIncome?'+':'-'}${Helpers.formatCurrency(Math.abs(e.amount))}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 shadow-2xl flex flex-col cursor-pointer hover:border-white/10 transition-all" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-center mb-4 px-2">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Ultime Attività</span>
                    <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                </div>
                <div class="flex-1 overflow-y-auto space-y-1">${listHtml}</div>
            </div>`;
    },

    async renderWidgetBalance() {
        const expenses = await window.CachedCRUD.getExpenses();
        const { startDate, endDate } = Helpers.getCustomMonthRange(new Date());
        const currentMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate && !e.is_excluded; 
        });
        
        const income = currentMonthExpenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const outcome = currentMonthExpenses.filter(e => e.type !== 'income').reduce((s, e) => s + Math.abs(e.amount), 0);
        const balance = income - outcome;
        
        const isPositive = balance >= 0;
        const bgGradient = isPositive ? 'from-indigo-600/90 to-violet-800/90' : 'from-rose-600/90 to-pink-800/90';

        return `
            <div class="h-full relative overflow-hidden bg-gradient-to-br ${bgGradient} rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] p-7 text-white group cursor-pointer transition-all hover:scale-[1.02]" onclick="window.showSection('expenses')">
                <div class="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                <div class="flex flex-col h-full justify-between relative z-10">
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">Balance</span>
                        <div class="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-xl backdrop-blur-md border border-white/20 shadow-xl">💰</div>
                    </div>
                    <div>
                        <p class="text-4xl font-black tracking-tighter truncate leading-none mb-4">${Helpers.formatCurrency(balance)}</p>
                        <div class="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <span class="block text-[8px] font-black uppercase tracking-widest text-white/50">Income</span>
                                <span class="text-xs font-bold text-white">${Helpers.formatCurrency(income)}</span>
                            </div>
                            <div class="text-right">
                                <span class="block text-[8px] font-black uppercase tracking-widest text-white/50">Spent</span>
                                <span class="text-xs font-bold text-white">${Helpers.formatCurrency(outcome)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async renderWidgetBudget() {
        const expenses = await window.CachedCRUD.getExpenses();
        const { startDate, endDate } = Helpers.getCustomMonthRange(new Date());
        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate && e.type !== 'income' && !e.is_excluded;
        });

        const totalSpent = monthExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        let budgetTarget = 700;
        try {
            const settings = await window.CachedCRUD.getSettings();
            if (settings?.monthly_budget) budgetTarget = parseFloat(settings.monthly_budget);
        } catch(e) {}

        const percent = Math.min(Math.round((totalSpent / budgetTarget) * 100), 100);
        const remaining = budgetTarget - totalSpent;

        return `
            <div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/5 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-indigo-500/30 transition-all group" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center text-2xl border border-white/5 shadow-inner">🎯</div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Month Limit</p>
                            <h4 class="text-2xl font-black text-white leading-none tracking-tighter">${Helpers.formatCurrency(totalSpent)}</h4>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="block text-2xl font-black ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-500'} tracking-tighter">${Math.round(Math.abs(remaining))}€</span>
                        <span class="text-[9px] font-bold text-slate-600 uppercase tracking-widest">${remaining >= 0 ? 'To Spend' : 'Over'}</span>
                    </div>
                </div>
                <div class="mt-8">
                    <div class="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">
                        <span>Progress</span>
                        <span class="text-indigo-400">${percent}%</span>
                    </div>
                    <div class="h-5 w-full bg-black rounded-full p-1.5 border border-white/5 shadow-inner overflow-hidden">
                        <div class="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-gradient shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out" style="width: ${percent}%"></div>
                    </div>
                </div>
            </div>`;
    },

    async renderWidgetTrend() {
        const expenses = await window.CachedCRUD.getExpenses();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const val = expenses
                .filter(e => !e.is_excluded && e.type !== 'income' && e.date.startsWith(dStr))
                .reduce((sum, e) => sum + Math.abs(e.amount), 0);
            days.push({ day: d.toLocaleDateString('it-IT', { weekday: 'narrow' }), val });
        }
        const max = Math.max(...days.map(d => d.val), 10);

        return `
             <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-indigo-500/20 transition-all" onclick="window.showSection('statistics')">
                <div class="flex justify-between items-start mb-2">
                    <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Activity Trend</p>
                    <div class="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center border border-white/5">📉</div>
                </div>
                <div class="flex items-end justify-between h-20 gap-2.5 pt-2">
                    ${days.map(d => {
                        const h = Math.max((d.val / max) * 100, 20);
                        return `
                            <div class="flex-1 flex flex-col items-center gap-2 group">
                                <div class="w-full bg-gradient-to-t from-indigo-500/10 to-indigo-500/40 rounded-t-xl transition-all duration-500 group-hover:to-indigo-500/60 relative overflow-hidden" style="height: ${h}%">
                                    <div class="absolute top-0 left-0 right-0 h-0.5 bg-indigo-300 shadow-[0_0_8px_rgba(129,140,248,1)]"></div>
                                </div>
                                <span class="text-[9px] font-black text-slate-600 uppercase group-hover:text-indigo-300 transition-colors">${d.day}</span>
                            </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    async renderWidgetCategories() {
        const expenses = await window.CachedCRUD.getExpenses();
        const { startDate, endDate } = Helpers.getCustomMonthRange(new Date());

        const currentExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate && e.type !== 'income' && !e.is_excluded;
        });

        const totalsByCategory = {};
        currentExpenses.forEach(e => {
            totalsByCategory[e.category] = (totalsByCategory[e.category] || 0) + Math.abs(e.amount);
        });

        const sorted = Object.entries(totalsByCategory)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 5);

        const totalSpent = currentExpenses.reduce((s, e) => s + Math.abs(e.amount), 0) || 1;

        return `
            <div class="h-full bg-slate-950/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex flex-col">
                <h3 class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-10 flex items-center gap-4">
                    <span class="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-xl border border-white/5">📊</span>
                    Categories
                </h3>
                <div class="flex-1 flex flex-col justify-center gap-8">
                    ${sorted.map(([catId, amount]) => {
                        const cat = window.Categories?.getById(catId) || { icon: '📦', name: 'Altro' };
                        const perc = Math.round((amount / totalSpent) * 100);
                        return `
                            <div class="space-y-3 group cursor-pointer">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-4 text-white group-hover:translate-x-1 transition-transform">
                                        <span class="text-2xl drop-shadow-lg">${cat.icon}</span> 
                                        <span class="text-sm font-black tracking-tight opacity-80 group-hover:opacity-100">${cat.name}</span>
                                    </div>
                                    <span class="text-indigo-400 font-black text-sm">${Math.round(amount)}€</span>
                                </div>
                                <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)]" style="width: ${perc}%"></div>
                                </div>
                            </div>`;
                    }).join('')}
                </div>
            </div>`;
    },

    async renderWidgetSavings() {
        const expenses = await window.CachedCRUD.getExpenses();
        const { startDate, endDate } = Helpers.getCustomMonthRange(new Date());

        const current = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate && !e.is_excluded;
        });

        const income = current.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
        const spent = current.filter(e => e.type !== 'income').reduce((s, e) => s + Math.abs(e.amount), 0);
        
        const savings = income - spent;
        const rate = income > 0 ? Math.round((savings / income) * 100) : 0;
        const color = rate >= 20 ? 'text-emerald-400' : rate > 0 ? 'text-indigo-400' : 'text-rose-400';

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center group">
                <h4 class="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4 group-hover:text-indigo-400 transition-colors">Savings Rate</h4>
                <div class="text-6xl font-black ${color} tracking-tighter drop-shadow-[0_0_20px_rgba(16,185,129,0.2)]">${rate}%</div>
                <div class="mt-6 px-5 py-2 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black text-white/70 uppercase tracking-widest shadow-inner">
                    ${savings > 0 ? 'Surplus' : 'Deficit'} ${Math.round(Math.abs(savings))}€
                </div>
            </div>`;
    },

    async renderWidgetTopMerchants() {
        const expenses = await window.CachedCRUD.getExpenses();
        const counts = {};
        expenses.slice(0, 100).filter(e => e.type !== 'income').forEach(e => {
            counts[e.description] = (counts[e.description] || 0) + 1;
        });

        const top = Object.entries(counts)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 3);

        return `
            <div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-7 border border-white/5 shadow-2xl flex flex-col justify-center">
                <h4 class="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500 mb-6 text-center">Top Merchants</h4>
                <div class="space-y-5">
                    ${top.map(([name, count]) => `
                        <div class="flex items-center justify-between group cursor-pointer">
                            <span class="text-xs font-black text-white/70 group-hover:text-white transition-colors truncate w-2/3 tracking-tight">${name}</span>
                            <div class="flex items-center gap-3">
                                <div class="w-1.5 h-1.5 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                                <span class="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">${count}x</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    },

    renderWidgetQuickActions() {
        const actions = [
            { label: 'Coffee', icon: 'coffee', val: 1.2 },
            { label: 'Food', icon: 'utensils', val: 12 },
            { label: 'Car', icon: 'car', val: 20 },
            { label: 'Plus', icon: 'plus', val: 0 }
        ];

        return `
            <div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/5 flex flex-col shadow-2xl overflow-hidden relative">
                <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
                <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 text-center">Quick Input</h4>
                <div class="grid grid-cols-2 gap-4 flex-1">
                    ${actions.map(a => `
                        <button onclick="ExpenseModals.showAdd('expense', {description: '${a.label}', amount: ${a.val}})" 
                                class="flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white/80 border border-white/5 rounded-[1.8rem] transition-all group active:scale-90 shadow-lg">
                            <div class="p-3 bg-indigo-500/5 rounded-2xl group-hover:bg-indigo-500/20 transition-colors border border-white/5">
                                ${this.getIcon(a.icon, 22)}
                            </div>
                            <span class="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">${a.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>`;
    },

    async renderWidgetBudgetFull() {
        const expenses = await window.CachedCRUD.getExpenses();
        const { startDate, endDate } = Helpers.getCustomMonthRange(new Date());

        const monthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d >= startDate && d <= endDate && e.type !== 'income' && !e.is_excluded;
        });

        const totalSpent = monthExpenses.reduce((sum, e) => sum + Math.abs(e.amount), 0);
        let budgetTarget = 700;
        try {
            const settings = await window.CachedCRUD.getSettings();
            if (settings?.monthly_budget) budgetTarget = parseFloat(settings.monthly_budget);
        } catch(e) {}

        const percent = Math.min(Math.round((totalSpent / budgetTarget) * 100), 100);
        const remaining = budgetTarget - totalSpent;
        const isOver = remaining < 0;

        return `
            <div class="h-full bg-slate-950/90 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col justify-center cursor-pointer group transition-all" onclick="window.showSection('expenses')">
                <div class="flex justify-between items-center mb-8">
                    <div class="flex items-center gap-6">
                        <div class="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-3xl flex items-center justify-center text-4xl border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">🏦</div>
                        <div>
                            <p class="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">Monthly Budget Planning</p>
                            <h3 class="text-5xl font-black text-white tracking-tighter leading-none">${Helpers.formatCurrency(budgetTarget)}</h3>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">${isOver ? 'Deficit' : 'Remaining'}</p>
                        <p class="text-5xl font-black ${isOver ? 'text-rose-500' : 'text-emerald-400'} tracking-tighter leading-none">
                            ${Helpers.formatCurrency(Math.abs(remaining))}
                        </p>
                    </div>
                </div>
                <div class="relative h-24 bg-black/40 rounded-[2rem] p-2 border border-white/5 shadow-[inset_0_4px_12_rgba(0,0,0,0.5)]">
                    <div class="absolute inset-0 flex items-center justify-between px-12 z-10 pointer-events-none">
                        <span class="text-sm font-black uppercase tracking-[0.3em] text-white drop-shadow-xl">Spent ${percent}%</span>
                        <span class="text-sm font-black uppercase tracking-[0.3em] text-white/30">${Math.max(0, 100 - percent)}% Left</span>
                    </div>
                    <div class="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-gradient rounded-[1.4rem] transition-all duration-1000 ease-out relative shadow-[0_0_40px_rgba(99,102,241,0.4)]" style="width: ${percent}%;">
                        <div class="absolute inset-0 bg-white/20 blur-[1px]" style="background-image: linear-gradient(45deg,rgba(255,255,255,.1) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.1) 50%,rgba(255,255,255,.1) 75%,transparent 75%,transparent); background-size: 3rem 3rem;"></div>
                    </div>
                </div>
            </div>`;
    },

    async renderWidgetMonthlyGraph() {
        const expenses = await window.CachedCRUD.getExpenses();
        const { startDate, endDate } = Helpers.getCustomMonthRange(new Date());
        
        const normalExpenses = expenses.filter(e => !e.is_excluded && (!e.type || e.type === 'expense'));
        const msPerDay = 24 * 60 * 60 * 1000;
        const totalDays = Math.ceil((endDate - startDate) / msPerDay) + 1;
        
        const dailyTotals = {};
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startDate.getTime() + (i * msPerDay));
            dailyTotals[d.toISOString().split('T')[0]] = 0;
        }

        normalExpenses.forEach(e => {
            const d = e.date.split('T')[0];
            if (dailyTotals[d] !== undefined) dailyTotals[d] += Math.abs(parseFloat(e.amount));
        });

        let running = 0;
        const dataPoints = Object.keys(dailyTotals).sort().map((dateStr, i) => {
            running += dailyTotals[dateStr];
            const d = new Date(dateStr);
            return { x: i, y: running, day: d.getDate() };
        });

        let budget = 700;
        try { const s = await window.CachedCRUD.getSettings(); if(s?.monthly_budget) budget = parseFloat(s.monthly_budget); } catch(e){}

        // Dimensioni e Padding (Stile Dashboard Pro)
        const W = 1000; const H = 400; const paddingX = 80; const paddingY = 60;
        const chartW = W - (paddingX * 2);
        const chartH = H - (paddingY * 2);
        
        const maxVal = Math.max(running, budget) * 1.15;
        const getX = (i) => paddingX + (i / (totalDays - 1)) * chartW;
        const getY = (v) => (H - paddingY) - ((v / maxVal) * chartH);

        // Path Stepped
        let pathD = `M ${getX(0)},${H - paddingY} `;
        let lineD = `M ${getX(0)},${getY(dataPoints[0].y)} `;
        for (let i = 1; i < dataPoints.length; i++) {
            const cx = getX(i); const cy = getY(dataPoints[i].y);
            lineD += `H ${cx} V ${cy} `;
            pathD += `H ${cx} V ${cy} `;
        }
        pathD += `L ${getX(dataPoints.length - 1)},${H - paddingY} Z`;

        // Generazione Punti con colore dinamico (Red se spesa > target temporale)
        const pointsHtml = dataPoints.map((p, i) => {
            const targetAtDay = (budget / (totalDays - 1)) * i;
            const color = p.y > targetAtDay ? '#ef4444' : '#10b981'; // Rosso se sopra budget, verde se sotto
            return `<circle cx="${getX(i)}" cy="${getY(p.y)}" r="5" fill="${color}" stroke="#1e293b" stroke-width="2" />`;
        }).join('');

        // Etichette Y (Professionali)
        const yLabels = [0, maxVal / 2, maxVal].map(val => `
            <text x="${paddingX - 15}" y="${getY(val)}" text-anchor="end" alignment-baseline="middle" class="fill-slate-500 text-sm font-bold">${Math.round(val)} €</text>
            <line x1="${paddingX}" y1="${getY(val)}" x2="${W - paddingX}" y2="${getY(val)}" stroke="rgba(255,255,255,0.03)" stroke-width="1" stroke-dasharray="4,4" />
        `).join('');

        // Etichette X (Ogni 5 giorni)
        const xLabels = dataPoints.filter((_, i) => i % 5 === 0 || i === dataPoints.length - 1).map(p => `
            <text x="${getX(p.x)}" y="${H - paddingY + 30}" text-anchor="middle" class="fill-slate-500 text-xs font-bold uppercase">${p.day}</text>
        `).join('');

        return `
            <div class="h-full bg-slate-900/60 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex flex-col">
                <div class="flex justify-between items-center mb-10">
                    <div class="flex items-center gap-4">
                                                <div class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>

                        <h4 class="text-xl font-black text-white tracking-tight">Andamento Spese</h4>
                    </div>
                </div>

                <div class="flex-1 relative">
                    <svg viewBox="0 0 ${W} ${H}" class="w-full h-full">
                        <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.15"/>
                                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        
                        <!-- Griglia e Labels Y -->
                        ${yLabels}
                        
                        <!-- Budget Line (Diagonale di Proiezione) -->
                        <line x1="${getX(0)}" y1="${getY(0)}" x2="${getX(totalDays - 1)}" y2="${getY(budget)}" stroke="#ef4444" stroke-width="2" stroke-dasharray="8,6" opacity="0.4" />
                        <text x="${getX(totalDays - 1)}" y="${getY(budget) - 15}" text-anchor="end" class="fill-rose-500 text-xs font-black uppercase tracking-widest">Budget: ${Math.round(budget)}€</text>
                        
                        <!-- Area e Linea Spesa -->
                        <path d="${pathD}" fill="url(#areaGrad)" />
                        <path d="${lineD}" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="drop-shadow-[0_4px_10px_rgba(99,102,241,0.4)]" />
                        
                        <!-- Punti Dati -->
                        ${pointsHtml}
                        
                        <!-- Labels X -->
                        ${xLabels}
                    </svg>
                </div>
            </div>`;
    }
};

window.ExpensesWidgets = ExpensesWidgets;