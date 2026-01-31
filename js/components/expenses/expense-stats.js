/**
 * Expense Stats Module - FINAL FIXED
 * Calcola i totali separando le spese ordinarie (Box Rosso) dagli investimenti (Box Blu)
 */
const ExpenseStats = {
    calculate(expenses) {
        let total = 0;          // Box Rosso
        let income = 0;         // Box Verde
        let excludedTotal = 0;  // Box Blu (Extra)
        
        let count = 0;
        let incomeCount = 0;

        expenses.forEach(expense => {
            const amount = parseFloat(expense.amount);

            if (expense.type === 'income') {
                income += amount;
                incomeCount++;
            } else {
                if (!!expense.is_excluded) {
                    excludedTotal += Math.abs(amount);
                } else {
                    total += Math.abs(amount);
                    count++;
                }
            }
        });

        const balance = income - (total + excludedTotal);

        return {
            total, 
            income, 
            excludedTotal, 
            balance, 
            count, 
            incomeCount
        };
    }
};

window.ExpenseStats = ExpenseStats;
console.log('✅ ExpenseStats Logica Aggiornata Caricata');