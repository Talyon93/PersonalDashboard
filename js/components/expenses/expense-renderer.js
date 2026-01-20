/**
 * Expense Renderer Module - Rendering UI Spese
 */

const ExpenseRenderer = {
    /**
     * Renderizza la lista delle spese
     */
    renderList(expenses) {
        if (expenses.length === 0) {
            return '<p class="text-gray-500 text-center py-8">Nessuna spesa in questo mese</p>';
        }

        // Sort and normalize dates
        const sorted = expenses
            .map(e => ({
                ...e,
                date: e.date.split(' ')[0].split('T')[0]
            }))
            .sort((a, b) => {
                const dateA = new Date(a.date + 'T12:00:00');
                const dateB = new Date(b.date + 'T12:00:00');
                return dateB - dateA;
            });

        // Group by date
        const groupedByDate = {};
        sorted.forEach(expense => {
            if (!groupedByDate[expense.date]) {
                groupedByDate[expense.date] = [];
            }
            groupedByDate[expense.date].push(expense);
        });

        let html = '<div class="space-y-8">';

        Object.entries(groupedByDate).forEach(([dateStr, dayExpenses]) => {
            const date = new Date(dateStr + 'T12:00:00');
            const isToday = Helpers.isToday(date);
            const dayTotal = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

            html += `
                <div class="relative">
                    <div class="flex items-center gap-4 mb-4">
                        <div class="w-20 h-20 rounded-2xl ${isToday ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-slate-700 to-slate-800'} shadow-lg flex flex-col items-center justify-center">
                            <span class="text-xs ${isToday ? 'text-blue-200' : 'text-gray-400'} font-semibold uppercase">
                                ${isToday ? 'Oggi' : date.toLocaleDateString('it-IT', { weekday: 'short' })}
                            </span>
                            <span class="text-2xl ${isToday ? 'text-white' : 'text-gray-200'} font-bold leading-none my-1">
                                ${date.getDate()}
                            </span>
                            <span class="text-xs ${isToday ? 'text-blue-200' : 'text-gray-400'} uppercase">
                                ${date.toLocaleDateString('it-IT', { month: 'short' })}
                            </span>
                        </div>
                        <div>
                            <div class="text-sm text-gray-400">${dayExpenses.length} operazioni</div>
                            <div class="text-xl font-bold text-red-400">${Helpers.formatCurrency(dayTotal)}</div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        ${dayExpenses.map(expense => this.renderCard(expense)).join('')}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        return html;
    },

    /**
     * Renderizza una singola card spesa
     */
    renderCard(expense) {
        const category = Categories.getById(expense.category);
        const categoryIcon = category ? category.icon : '📦';
        const categoryName = category ? category.name : 'Altro';

        const isIncome = expense.type === 'income';
        const amountColor = isIncome ? 'text-green-400' : 'text-red-400';
        const amountPrefix = isIncome ? '+' : '-';

        return `
            <div class="expense-card group relative overflow-hidden bg-slate-700/50 backdrop-blur-sm rounded-xl border border-slate-600/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
                 onclick="ExpenseModals.showDetail('${expense.id}')">
                <div class="relative z-10 p-4">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                            ${categoryIcon}
                        </div>
                        <h4 class="flex-1 font-semibold text-white text-base line-clamp-2 group-hover:text-blue-300 transition-colors">
                            ${Helpers.escapeHtml(expense.description)}
                        </h4>
                        <button onclick="event.stopPropagation(); ExpenseModals.confirmDelete('${expense.id}')" 
                                class="opacity-0 group-hover:opacity-100 flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 transition-all text-sm">
                            🗑️
                        </button>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap mb-3">
                        <span class="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-slate-800 text-gray-300">
                            ${categoryName}
                        </span>
                        ${expense.tags && expense.tags.length > 0 ? expense.tags.slice(0, 1).map(tag => `
                            <span class="inline-flex items-center px-2.5 py-1 rounded text-sm font-medium bg-purple-900 text-purple-200">
                                ${Helpers.escapeHtml(tag)}
                            </span>
                        `).join('') : ''}
                        ${expense.notes ? '<span class="text-blue-400 text-sm">📝</span>' : ''}
                    </div>
                    <div class="flex items-center justify-between pt-3 border-t border-slate-600/30">
                        <span class="text-3xl font-bold ${amountColor}">
                            ${amountPrefix}${Helpers.formatCurrency(expense.amount)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Renderizza il breakdown categorie
     */
    renderCategoryBreakdown(expenses) {
        const stats = ExpenseStats.calculate(expenses);
        const total = stats.total;

        if (total === 0) {
            return '<p class="text-gray-500 text-center py-4">Nessuna spesa registrata</p>';
        }

        const categories = Categories.getAll();

        return categories.map(category => {
            const categoryData = stats.byCategory[category.id];
            if (!categoryData) return '';

            const categoryTotal = categoryData.total;
            const percentage = total > 0 ? (categoryTotal / total * 100) : 0;

            return `
                <div class="flex items-center gap-4">
                    <span class="text-2xl">${category.icon}</span>
                    <div class="flex-1">
                        <div class="flex justify-between mb-1">
                            <span class="text-sm font-medium">${category.name}</span>
                            <span class="text-sm font-semibold">${Helpers.formatCurrency(categoryTotal)}</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                        <span class="text-xs text-gray-500">${percentage.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
    },

    /**
     * Renderizza i filtri categorie
     */
    renderCategoryFilters() {
        const categories = Categories.getAll();
        const currentFilter = ExpenseFilters.getCategory();

        return categories.map(category => `
            <button onclick="ExpenseFilters.setCategory('${category.id}'); Expenses.render();"
                    class="px-4 py-2 rounded-lg transition ${currentFilter === category.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}">
                ${category.icon} ${category.name}
            </button>
        `).join('');
    }
};

// Export globale
window.ExpenseRenderer = ExpenseRenderer;
console.log('✅ ExpenseRenderer module loaded');
