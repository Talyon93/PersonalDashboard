/**
 * Expense Renderer Module - COMPACT 5-COLUMNS EDITION
 */
const ExpenseRenderer = {
    renderList(expenses) {
        if (expenses.length === 0) {
            return `<div class="text-center py-20 opacity-40"><p class="text-2xl font-bold text-slate-400 tracking-tight">Nessun dato nel periodo</p></div>`;
        }

        const sorted = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        const groupedByDate = {};
        
        sorted.forEach(expense => {
            const dateStr = expense.date.split('T')[0];
            if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
            groupedByDate[dateStr].push(expense);
        });

        let html = '<div class="space-y-12 relative before:absolute before:left-[43px] before:top-0 before:bottom-0 before:w-px before:bg-slate-700/50">';

        Object.entries(groupedByDate).forEach(([dateStr, dayExpenses]) => {
            const date = new Date(dateStr + 'T12:00:00');
            const isToday = Helpers.isToday(date);
            
            const dayTotal = dayExpenses.reduce((sum, e) => {
                const val = parseFloat(e.amount);
                return e.type === 'income' ? sum + val : sum - Math.abs(val);
            }, 0);

            html += `
                <div class="relative pl-24 animate-fadeIn">
                    <div class="absolute left-0 top-0 flex flex-col items-center gap-3">
                        <div class="w-20 h-20 rounded-[1.8rem] ${isToday ? 'bg-indigo-600 shadow-lg' : 'bg-slate-800 border border-slate-700'} flex flex-col items-center justify-center">
                            <span class="text-[11px] ${isToday ? 'text-indigo-200' : 'text-slate-500'} font-black uppercase tracking-widest">${isToday ? 'Oggi' : date.toLocaleDateString('it-IT', { weekday: 'short' })}</span>
                            <span class="text-3xl ${isToday ? 'text-white' : 'text-slate-100'} font-black leading-none my-1">${date.getDate()}</span>
                            <span class="text-[11px] ${isToday ? 'text-indigo-200' : 'text-slate-500'} uppercase font-black">${date.toLocaleDateString('it-IT', { month: 'short' })}</span>
                        </div>
                        <div class="px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 shadow-sm text-[12px] font-black ${dayTotal >= 0 ? 'text-emerald-400' : 'text-rose-500'} whitespace-nowrap">
                            ${dayTotal >= 0 ? '+' : '-'}${Helpers.formatCurrency(Math.abs(dayTotal))}
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        ${dayExpenses.map(expense => this.renderCard(expense)).join('')}
                    </div>
                </div>`;
        });

        return html + '</div>';
    },

    renderCard(expense) {
        const category = window.Categories?.getById(expense.category) || { icon: '📦', name: 'Altro' };
        const isIncome = expense.type === 'income';
        const absAmount = Math.abs(parseFloat(expense.amount));

        return `
            <div class="group relative bg-slate-800/40 backdrop-blur-md rounded-[1.8rem] border border-slate-700/50 p-4 transition-all duration-500 hover:bg-slate-800/80 hover:border-indigo-500/40 hover:-translate-y-1 cursor-pointer overflow-hidden shadow-sm"
                 onclick="ExpenseModals.showDetail('${expense.id}')">
                
                <div class="relative z-10 flex flex-col h-full">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="w-10 h-10 shrink-0 rounded-xl bg-slate-900/80 flex items-center justify-center text-xl shadow-inner border border-white/5">
                            ${category.icon}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-sm font-bold text-white truncate leading-tight mb-1 tracking-tight">${Helpers.escapeHtml(expense.description)}</h4>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">${category.name}</p>
                        </div>
                    </div>

                    <div class="mt-auto pt-3 border-t border-slate-700/30 flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Importo</span>
                            <div class="text-lg font-black ${isIncome ? 'text-emerald-400' : 'text-rose-500'} tracking-tighter">
                                ${isIncome ? '+' : '-'}${Helpers.formatCurrency(absAmount)}
                            </div>
                        </div>
                        <div class="w-8 h-8 rounded-full flex items-center justify-center ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'} border border-white/5 shadow-lg">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${isIncome 
                                    ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M7 11l5-5m0 0l5 5m-5-5v12"/>' 
                                    : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M17 13l-5 5m0 0l-5-5m5-5v12"/>'}
                            </svg>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    renderCategoryFilters() {
        const categories = window.Categories?.getAll() || [];
        const currentFilter = window.ExpenseFilters?.getCategory();
        return categories.map(cat => `
            <button onclick="ExpenseFilters.setCategory('${cat.id}'); Expenses.render();"
                    class="px-4 py-2 rounded-xl transition-all text-[11px] font-black uppercase tracking-[0.1em] flex items-center gap-2 
                    ${currentFilter === cat.id ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-800/40 text-slate-400 border border-slate-700 hover:text-white'}">
                <span class="text-base">${cat.icon}</span><span>${cat.name}</span>
            </button>`).join('');
    }
};

window.ExpenseRenderer = ExpenseRenderer;