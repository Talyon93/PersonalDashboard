/**
 * Expense Stats Module - Calcolo Statistiche
 */

const ExpenseStats = {
    /**
     * Calcola le statistiche per un array di spese
     */
    calculate(expenses) {
        const stats = {
            total: 0,
            count: 0,
            income: 0,
            incomeCount: 0,
            balance: 0,
            byCategory: {},
            excludedTotal: 0,
            excludedCount: 0
        };

        expenses.forEach(expense => {
            const amount = Math.abs(expense.amount);
            const isExcluded = MerchantMappings.isExcluded(expense);

            if (expense.type === 'income') {
                stats.income += amount;
                stats.incomeCount++;
            } else {
                if (isExcluded) {
                    stats.excludedTotal += amount;
                    stats.excludedCount++;
                } else {
                    stats.total += amount;
                    stats.count++;

                    // Count by category
                    if (!stats.byCategory[expense.category]) {
                        stats.byCategory[expense.category] = {
                            total: 0,
                            count: 0
                        };
                    }
                    stats.byCategory[expense.category].total += amount;
                    stats.byCategory[expense.category].count++;
                }
            }
        });

        stats.balance = stats.income - stats.total;

        return stats;
    },

    /**
     * Ottiene le top categorie per importo
     */
    getTopCategories(expenses, limit = 5) {
        const stats = this.calculate(expenses);
        const categories = Object.entries(stats.byCategory)
            .map(([id, data]) => {
                const category = Categories.getById(id);
                return {
                    id,
                    name: category ? category.name : id,
                    icon: category ? category.icon : '📦',
                    total: data.total,
                    count: data.count
                };
            })
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);

        return categories;
    },

    /**
     * Calcola la media giornaliera di spesa
     */
    getDailyAverage(expenses, days) {
        const stats = this.calculate(expenses);
        return days > 0 ? stats.total / days : 0;
    },

    /**
     * Ottiene il progresso rispetto al budget
     */
    getBudgetProgress(expenses, budget) {
        const stats = this.calculate(expenses);
        const percentage = budget > 0 ? (stats.total / budget) * 100 : 0;
        const remaining = budget - stats.total;

        return {
            spent: stats.total,
            budget,
            percentage,
            remaining,
            isOverBudget: stats.total > budget
        };
    }
};

// Export globale
window.ExpenseStats = ExpenseStats;
console.log('✅ ExpenseStats module loaded');
