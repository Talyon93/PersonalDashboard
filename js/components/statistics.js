/**
 * Statistics Component - ORIGINAL WOW Design con Supabase
 * VERSION: FIXED BUDGET LINE - Multi-segment path
 */

console.log('🔥 STATISTICS FIXED VERSION LOADED - Budget line is multi-segment!');

const Statistics = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    expenses: [], // Local cache

    // Safe settings getter (compat: Settings.getSetting / Settings.get / localStorage)
    safeGetSetting(key, fallback) {
        try {
            if (window.Settings) {
                if (typeof window.Settings.getSetting === 'function') {
                    const v = window.Settings.getSetting(key);
                    return (v ?? fallback);
                }
                if (typeof window.Settings.get === 'function') {
                    const v = window.Settings.get(key);
                    return (v ?? fallback);
                }
            }

            // fallback localStorage: plain key
            const raw = localStorage.getItem(key);
            if (raw !== null && raw !== undefined) {
                const n = Number(raw);
                return Number.isFinite(n) ? n : raw;
            }

            // fallback localStorage: JSON blob (common patterns)
            const rawSettings = localStorage.getItem('settings') || localStorage.getItem('appSettings');
            if (rawSettings) {
                const obj = JSON.parse(rawSettings);
                if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
            }
        } catch (e) {
            // ignore
        }
        return fallback;
    },

    async init() {
        console.log('📊 Statistics.init()');
        await this.loadData();
        await this.render();
    },

    async loadData() {
        try {
            this.expenses = await ExpenseCRUD.getAll();
            console.log(`✅ Loaded ${this.expenses.length} expenses for statistics`);
        } catch (e) {
            console.error('Error loading expenses:', e);
            this.expenses = [];
        }
    },

    async render() {
        console.log('📊 Statistics.render()');
        await this.loadData();
        
        const container = document.getElementById('statisticsContent');
        if (!container) {
            console.error('❌ Container #statisticsContent not found');
            return;
        }

        const expenses = this.getMonthExpenses();
        const stats = this.calculateAdvancedStats(expenses);

        // FIXED: Pass a Date object to Helpers, not two numbers
        const monthLabel = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 1));

        container.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        📊 Statistiche Avanzate
                    </h2>
                </div>

                <div class="flex items-center gap-4 mb-8 bg-white rounded-xl shadow-md p-4">
                    <button onclick="Statistics.handleChangeMonth(-1)" class="p-3 hover:bg-gray-100 rounded-lg transition">
                        ◀️
                    </button>
                    <h3 class="text-2xl font-bold text-gray-800 flex-1 text-center">
                        ${monthLabel}
                    </h3>
                    <button onclick="Statistics.handleChangeMonth(1)" class="p-3 hover:bg-gray-100 rounded-lg transition">
                        ▶️
                    </button>
                    <button onclick="Statistics.handleResetMonth()" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition">
                        📅 Oggi
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div class="relative overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative">
                        <p class="text-sm opacity-90 mb-2">💸 Spese</p>
                        <p class="text-4xl font-bold mb-2">${Helpers.formatCurrency(stats.total)}</p>
                        <div class="text-sm opacity-90">${stats.count} transazioni</div>
                    </div>
                </div>

                <div class="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative">
                        <p class="text-sm opacity-90 mb-2">💰 Entrate</p>
                        <p class="text-4xl font-bold mb-2">${Helpers.formatCurrency(stats.income)}</p>
                        <div class="text-sm opacity-90">${stats.incomeCount} transazioni</div>
                    </div>
                </div>

                <div class="relative overflow-hidden bg-gradient-to-br ${stats.balance >= 0 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600'} rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative">
                        <p class="text-sm opacity-90 mb-2">📊 Bilancio</p>
                        <p class="text-4xl font-bold mb-2">${stats.balance >= 0 ? '+' : ''}${Helpers.formatCurrency(stats.balance)}</p>
                        <div class="text-sm opacity-90">${stats.balance >= 0 ? 'Positivo ✓' : 'Negativo'}</div>
                    </div>
                </div>

                <div class="relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative">
                        <p class="text-sm opacity-90 mb-2">🔢 Totali</p>
                        <p class="text-4xl font-bold mb-2">${stats.count + stats.incomeCount}</p>
                        <div class="text-sm opacity-90">${stats.activeDays} giorni attivi</div>
                    </div>
                </div>

                <div class="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div class="relative">
                        <p class="text-sm opacity-90 mb-2">💎 Investimenti</p>
                        <p class="text-4xl font-bold mb-2">${Helpers.formatCurrency(stats.excludedTotal)}</p>
                        <div class="text-sm opacity-90">${stats.excludedCount > 0 ? stats.excludedCount + ' operazioni' : 'Nessuno'}</div>
                    </div>
                </div>
            </div>

            ${this.renderBudgetSection(stats)}

            <div class="mb-8">
                <div class="bg-white rounded-2xl shadow-xl p-6">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>📈</span>
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Andamento Spese</span>
                    </h3>
                    <div class="relative px-4" style="height: 300px;">
                        ${this.renderSpendingChart(expenses, stats)}
                    </div>
                    <div class="mt-4 flex justify-between text-sm text-gray-600">
                        <span>Giorno più costoso: ${stats.maxDay ? `${stats.maxDay.day} (${Helpers.formatCurrency(stats.maxDay.total)})` : 'N/A'}</span>
                        <span>Picco: ${stats.maxDay ? Helpers.formatCurrency(stats.maxDay.total) : '0€'}</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>📊</span>
                    <span class="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Dettaglio Categorie</span>
                </h3>
                <div class="space-y-4">
                    ${this.renderCategoryBars(stats.categories, stats.total)}
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>🏷️</span>
                    <span class="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Statistiche per Tag</span>
                </h3>
                ${this.renderTagStats(expenses)}
            </div>

            <div class="bg-white rounded-2xl shadow-xl p-6">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>📅</span>
                    <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Analisi Giornaliera</span>
                </h3>
                ${this.renderDailyHeatmap(expenses)}
            </div>
        `;
    },

    // Sync wrappers for onclick handlers
    handleChangeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.render(); // async but don't await in onclick
    },

    handleResetMonth() {
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
        this.render(); // async but don't await in onclick
    },

    /**
     * Get expenses for current selected month
     */
    getMonthExpenses() {
        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(referenceDate);
        
        return this.expenses.filter(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            const expDate = new Date(dateStr + 'T12:00:00');
            return expDate >= startDate && expDate <= endDate;
        });
    },

    /**
     * Safe wrapper for Settings.getSetting with fallback
     */
    safeGetSetting(key, defaultValue) {
        try {
            if (typeof Settings !== 'undefined' && Settings.getSetting) {
                const value = Settings.getSetting(key);
                return value !== null && value !== undefined ? value : defaultValue;
            }
        } catch (e) {
            console.warn(`Settings not available, using default for ${key}:`, e);
        }
        return defaultValue;
    },

    /**
     * Filter normal expenses (exclude investments)
     */
    getNormalExpenses(expenses) {
        return ExpenseFilters.notExcluded(expenses);
    },

    /**
     * Filter excluded expenses (investments)
     */
    getExcludedExpenses(expenses) {
        return ExpenseFilters.excluded(expenses);
    },

    /**
     * Calculate advanced statistics
     */
    calculateAdvancedStats(expenses) {
        // Separate income from expenses
        const incomeTransactions = expenses.filter(e => e.type === 'income');
        const income = incomeTransactions.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
        const incomeCount = incomeTransactions.length;
        
        // Filter out income
        const expensesOnly = expenses.filter(e => !e.type || e.type === 'expense');
        
        // Separate normal from excluded
        const normalExpenses = this.getNormalExpenses(expensesOnly);
        const excludedExpenses = this.getExcludedExpenses(expensesOnly);
        
        const total = normalExpenses.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
        const excludedTotal = excludedExpenses.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
        
        const count = normalExpenses.length;
        const excludedCount = excludedExpenses.length;
        
        // Category breakdown
        const categoryTotals = {};
        const categoryCounts = {};
        
        Categories.getAll().forEach(cat => {
            categoryTotals[cat.id] = 0;
            categoryCounts[cat.id] = 0;
        });

        normalExpenses.forEach(expense => {
            const catId = expense.category || 'other';
            categoryTotals[catId] = (categoryTotals[catId] || 0) + Math.abs(parseFloat(expense.amount));
            categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
        });

        const categories = Categories.getAll()
            .map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                total: categoryTotals[cat.id] || 0,
                count: categoryCounts[cat.id] || 0,
                percentage: total > 0 ? ((categoryTotals[cat.id] || 0) / total * 100).toFixed(1) : 0
            }))
            .filter(cat => cat.total > 0)
            .sort((a, b) => b.total - a.total);

        // Daily breakdown
        const dailyTotals = {};
        normalExpenses.forEach(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            const day = new Date(dateStr + 'T12:00:00').getDate();
            dailyTotals[day] = (dailyTotals[day] || 0) + Math.abs(parseFloat(expense.amount));
        });
        
        const activeDays = Object.keys(dailyTotals).length;
        const maxDay = Object.entries(dailyTotals).reduce((max, [day, total]) => {
            return total > (max?.total || 0) ? { day: parseInt(day), total } : max;
        }, null);

        return {
            total,
            count,
            activeDays,
            maxDay,
            categories,
            income,
            incomeCount,
            balance: income - total,
            excludedTotal,
            excludedCount
        };
    },

    renderBudgetSection(stats) {
        const budget = this.safeGetSetting('monthlyBudget', 700);
        const remaining = budget - stats.total;
        const percentage = Math.min((stats.total / budget) * 100, 100);
        const isOver = stats.total > budget;

        return `
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>💰</span>
                    <span class="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Budget Mensile</span>
                </h3>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">Budget Totale</p>
                        <p class="text-4xl font-bold text-gray-800">${Helpers.formatCurrency(budget)}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">Speso</p>
                        <p class="text-4xl font-bold ${isOver ? 'text-red-600' : 'text-blue-600'}">${Helpers.formatCurrency(stats.total)}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-gray-600 mb-2">${isOver ? 'Oltre Budget' : 'Disponibile'}</p>
                        <p class="text-4xl font-bold ${isOver ? 'text-red-600' : 'text-green-600'}">${Helpers.formatCurrency(Math.abs(remaining))}</p>
                    </div>
                </div>

                <div class="relative h-12 bg-gray-100 rounded-full overflow-hidden">
                    <div class="absolute inset-0 flex items-center justify-between px-6 z-10">
                        <span class="font-bold ${percentage > 50 ? 'text-white' : 'text-gray-700'}">${percentage.toFixed(0)}% utilizzato</span>
                        <span class="font-bold ${percentage > 90 ? 'text-white' : 'text-gray-700'}">
                            ${isOver ? '⚠️ ' : ''}${Math.max(0, 100 - percentage).toFixed(0)}% disponibile
                        </span>
                    </div>
                    <div class="h-full bg-gradient-to-r ${isOver ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-600'} transition-all duration-1000" 
                         style="width: ${percentage}%"></div>
                </div>

                <div class="mt-4 text-center">
                    <span class="inline-flex items-center px-4 py-2 rounded-full ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} font-semibold">
                        ${isOver ? '⚠️ Attenzione! Budget superato' : '✓ Budget sotto controllo'}
                    </span>
                </div>
            </div>
        `;
    },

    renderSpendingChart(expenses, stats) {
        const normalExpenses = this.getNormalExpenses(expenses).filter(e => !e.type || e.type === 'expense');
        
        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        const range = Helpers.getCustomMonthRange(referenceDate);
        const start = range.startDate;
        const end = range.endDate;
        
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysInCustomMonth = Math.ceil((end - start) / msPerDay) + 1;
        
        const customMonthDates = [];
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = new Date(start.getTime() + (i * msPerDay));
            customMonthDates.push(date);
        }
        
        const dailyTotals = this.getDailyTotalsCustom(normalExpenses, customMonthDates);
        const amounts = Object.values(dailyTotals);
        const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 100;

        if (maxAmount === 0 || normalExpenses.length === 0) {
            return '<div class="flex items-center justify-center h-full text-gray-400"><div class="text-center"><div class="text-6xl mb-4">📈</div><p class="text-lg">Nessuna spesa in questo mese</p></div></div>';
        }

        const cumulativeTotals = {};
        let runningTotal = 0;
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = customMonthDates[i];
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            runningTotal += (dailyTotals[dateKey] || 0);
            cumulativeTotals[i] = runningTotal;
        }

        const firstValue = cumulativeTotals[0] || 0;
        const lastValue = cumulativeTotals[daysInCustomMonth - 1] || 0;
        const trend = lastValue - firstValue;
        const trendPercentage = firstValue !== 0 ? ((trend / firstValue) * 100).toFixed(0) : 0;

        let html = `
            <div class="mb-6">
                <div class="flex items-baseline gap-3 mb-2">
                    <span class="text-5xl font-bold text-gray-800">${Helpers.formatCurrency(stats.total)}</span>
                    <span class="text-lg ${trend >= 0 ? 'text-red-400' : 'text-green-400'} flex items-center gap-1">
                        ${trend >= 0 ? '▲' : '▼'} ${Math.abs(trendPercentage)}%
                    </span>
                </div>
                <div class="text-sm text-gray-400">
                    <span>${customMonthDates[0].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
                    <span class="mx-2">–</span>
                    <span>${customMonthDates[daysInCustomMonth - 1].toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                </div>
            </div>
        `;

        html += `
            <div id="chartTooltip" class="fixed hidden bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-50 border border-emerald-500/50">
                <div class="font-semibold text-white" id="tooltipDay"></div>
                <div class="text-emerald-400 font-bold text-lg" id="tooltipAmount"></div>
            </div>
        `;

        html += '<div class="relative" id="chartContainer"><svg width="100%" height="200" viewBox="-20 -20 1200 240" preserveAspectRatio="xMidYMid meet" class="mt-4" id="spendingChart">';
        
        const monthlyBudget = this.safeGetSetting('monthlyBudget', 700);
        const totalSpending = cumulativeTotals[daysInCustomMonth - 1] || 1;
        
        // Use the maximum between total spending and budget for Y-axis scale
        const maxCumulative = Math.max(totalSpending, monthlyBudget);
        const chartWidth = 1160;
        
        let areaPath = `M 0,200`;
        let linePath = '';
        const points = [];
        
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = customMonthDates[i];
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const cumulativeAmount = cumulativeTotals[i] || 0;
            const dailyAmount = dailyTotals[dateKey] || 0;
            const x = ((i) / (daysInCustomMonth - 1)) * chartWidth;
            const y = 200 - ((cumulativeAmount / maxCumulative) * 160);
            
            points.push({ x, y, day: date.getDate(), date: dateKey, cumulativeAmount, dailyAmount });
            
            if (linePath === '') {
                linePath = `M ${x},${y}`;
                areaPath += ` L ${x},${y}`;
            } else {
                linePath += ` L ${x},${y}`;
                areaPath += ` L ${x},${y}`;
            }
        }
        
        areaPath += ` L ${chartWidth},200 Z`;

        // monthlyBudget already declared above
        
        const calculateBudgetY = (dayIndex) => {
            const budgetAtDay = (dayIndex / (daysInCustomMonth - 1)) * monthlyBudget;
            return 200 - ((budgetAtDay / maxCumulative) * 160);
        };
        
        // Create budget line as multi-segment path (not a simple diagonal)
        let budgetLine = '';
        for (let i = 0; i < daysInCustomMonth; i++) {
            const x = ((i) / (daysInCustomMonth - 1)) * chartWidth;
            const y = calculateBudgetY(i);
            
            if (budgetLine === '') {
                budgetLine = `M ${x},${y}`;
            } else {
                budgetLine += ` L ${x},${y}`;
            }
        }
        
        console.log('📊 Budget line created with', daysInCustomMonth, 'points');
        console.log('📊 Budget line path:', budgetLine.substring(0, 100) + '...');
        
        const finalSpending = cumulativeTotals[daysInCustomMonth - 1] || 0;
        const isOverBudget = finalSpending > monthlyBudget;
        const spendingGradient = isOverBudget ? 'areaGradRed' : 'areaGrad';

        html += `
            <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.05" />
                </linearGradient>
                <linearGradient id="areaGradRed" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.05" />
                </linearGradient>
            </defs>
        `;

        html += `<path d="${areaPath}" fill="url(#${spendingGradient})" />`;
        html += `<path d="${budgetLine}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8,4" opacity="0.6" />`;
        
        // Budget label at end of line
        const budgetEndY = calculateBudgetY(daysInCustomMonth - 1);
        html += `
            <text x="${chartWidth + 5}" y="${budgetEndY + 5}" fill="#94a3b8" font-size="12" font-weight="600">
                Budget ${Helpers.formatCurrency(monthlyBudget)}
            </text>
        `;
        
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const budgetY = calculateBudgetY(i);
            const isUnderBudget = p1.y > budgetY;
            const segmentColor = isUnderBudget ? '#10b981' : '#ef4444';
            html += `<path d="M ${p1.x},${p1.y} L ${p2.x},${p2.y}" fill="none" stroke="${segmentColor}" stroke-width="2.5" />`;
        }

        points.forEach((point, i) => {
            const budgetY = calculateBudgetY(i);
            const isUnderBudget = point.y > budgetY;
            const pointColor = isUnderBudget ? '#10b981' : '#ef4444';
            
            html += `
                <circle 
                    cx="${point.x}" 
                    cy="${point.y}" 
                    r="15" 
                    fill="transparent" 
                    class="chart-hover-area cursor-pointer"
                    onmouseenter="Statistics.showChartTooltip(event, ${point.day}, ${point.dailyAmount}, ${point.x}, ${point.y})"
                    onmouseleave="Statistics.hideChartTooltip()">
                </circle>
            `;
            html += `
                <circle 
                    cx="${point.x}" 
                    cy="${point.y}" 
                    r="5" 
                    fill="${pointColor}" 
                    stroke="#1e293b" 
                    stroke-width="2" 
                    class="chart-point pointer-events-none">
                </circle>
            `;
        });

        const keyIndices = [0, Math.floor(daysInCustomMonth / 2), daysInCustomMonth - 1];
        keyIndices.forEach(i => {
            const point = points[i];
            if (point) {
                const x = point.x;
                html += `<rect x="${x - 15}" y="185" width="30" height="16" fill="#1e293b" rx="4" opacity="0.8"/>`;
                html += `<text x="${x}" y="197" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="600">${point.day}</text>`;
            }
        });

        html += '</svg></div>';
        
        return html;
    },

    showChartTooltip(event, day, amount, svgX, svgY) {
        const tooltip = document.getElementById('chartTooltip');
        const dayEl = document.getElementById('tooltipDay');
        const amountEl = document.getElementById('tooltipAmount');
        
        if (tooltip && dayEl && amountEl) {
            dayEl.textContent = `Giorno ${day}`;
            amountEl.textContent = Helpers.formatCurrency(amount);
            
            const svg = document.getElementById('spendingChart');
            const rect = svg.getBoundingClientRect();
            const scaleX = rect.width / 1160;
            const scaleY = rect.height / 200;
            
            const actualX = rect.left + (svgX * scaleX);
            const actualY = rect.top + (svgY * scaleY) + window.scrollY;
            
            tooltip.style.left = `${actualX}px`;
            tooltip.style.top = `${actualY - 80}px`;
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.classList.remove('hidden');
        }
    },

    hideChartTooltip() {
        const tooltip = document.getElementById('chartTooltip');
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
    },

    getDailyTotalsCustom(expenses, customMonthDates) {
        const dailyTotals = {};
        
        customMonthDates.forEach(date => {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            dailyTotals[dateKey] = 0;
        });
        
        expenses.forEach(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            if (dailyTotals.hasOwnProperty(dateStr)) {
                dailyTotals[dateStr] += Math.abs(parseFloat(expense.amount));
            }
        });
        
        return dailyTotals;
    },

    renderCategoryBars(categories, total) {
        if (!categories || categories.length === 0) {
            return '<p class="text-gray-500 text-center py-8">Nessuna categoria</p>';
        }

        const maxValue = Math.max(...categories.map(c => c.total));

        return categories.map((cat, index) => {
            const percentageOfTotal = (cat.total / total) * 100;
            const barWidth = (cat.total / maxValue) * 100;
            
            const colors = [
                'from-red-500 to-pink-600',
                'from-orange-500 to-yellow-600',
                'from-green-500 to-emerald-600',
                'from-blue-500 to-cyan-600',
                'from-purple-500 to-indigo-600',
                'from-pink-500 to-rose-600',
                'from-teal-500 to-green-600',
                'from-amber-500 to-orange-600'
            ];
            const gradient = colors[index % colors.length];

            return `
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-3 w-48">
                        <span class="text-3xl">${cat.icon}</span>
                        <div>
                            <p class="font-semibold text-gray-800">${cat.name}</p>
                            <p class="text-xs text-gray-500">${cat.count} transazioni</p>
                        </div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3">
                            <div class="flex-1 h-10 bg-gray-100 rounded-full overflow-hidden relative">
                                <div class="h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 flex items-center justify-end pr-3" 
                                     style="width: ${barWidth}%">
                                    <span class="text-white font-bold text-sm">${percentageOfTotal.toFixed(1)}%</span>
                                </div>
                            </div>
                            <span class="font-bold text-xl text-gray-800 w-24 text-right">${Helpers.formatCurrency(cat.total)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderTagStats(expenses) {
        const normalExpenses = this.getNormalExpenses(expenses);
        
        const tagStats = {};
        normalExpenses.forEach(expense => {
            if (expense.tags && expense.tags.length > 0) {
                expense.tags.forEach(tag => {
                    const isExcluded = MerchantMappings.excludedTags.some(excluded => 
                        tag.toLowerCase() === excluded.toLowerCase()
                    );
                    
                    if (!isExcluded) {
                        if (!tagStats[tag]) {
                            tagStats[tag] = {
                                tag: tag,
                                total: 0,
                                count: 0,
                                expenses: []
                            };
                        }
                        tagStats[tag].total += Math.abs(parseFloat(expense.amount));
                        tagStats[tag].count++;
                        tagStats[tag].expenses.push(expense);
                    }
                });
            }
        });

        const sortedTags = Object.values(tagStats).sort((a, b) => b.total - a.total);

        if (sortedTags.length === 0) {
            return '<div class="text-center text-gray-500 py-8">Nessun tag personalizzato trovato. Aggiungi tag alle tue spese per vedere le statistiche!</div>';
        }

        const totalWithTags = sortedTags.reduce((sum, t) => sum + t.total, 0);

        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        
        const colors = [
            'from-blue-500 to-cyan-500',
            'from-purple-500 to-pink-500',
            'from-green-500 to-emerald-500',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-purple-500',
            'from-pink-500 to-rose-500',
            'from-teal-500 to-green-500',
            'from-yellow-500 to-orange-500'
        ];

        sortedTags.forEach((tagData, index) => {
            const percentage = ((tagData.total / totalWithTags) * 100).toFixed(1);
            const colorClass = colors[index % colors.length];
            const avgPerTransaction = tagData.total / tagData.count;

            html += `
                <div class="bg-gradient-to-r ${colorClass} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur">
                                🏷️
                            </div>
                            <div>
                                <div class="font-bold text-xl">${tagData.tag}</div>
                                <div class="text-sm opacity-90">${tagData.count} transazioni</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-2xl">${Helpers.formatCurrency(tagData.total)}</div>
                            <div class="text-sm opacity-90">${percentage}%</div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-sm opacity-90 bg-white/10 rounded-lg px-3 py-2">
                        <span>Media:</span>
                        <span class="font-semibold">${Helpers.formatCurrency(avgPerTransaction)}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        html += `
            <div class="mt-6 bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-gray-300">Totale spese con tag:</span>
                    <span class="font-bold text-white text-lg">${Helpers.formatCurrency(totalWithTags)}</span>
                </div>
                <div class="flex items-center justify-between text-sm mt-2">
                    <span class="text-gray-300">Tag unici:</span>
                    <span class="font-semibold text-gray-200">${sortedTags.length}</span>
                </div>
            </div>
        `;

        return html;
    },

    renderDailyHeatmap(expenses) {
        const expensesOnly = expenses.filter(e => !e.type || e.type === 'expense');
        const normalExpenses = this.getNormalExpenses(expensesOnly);
        
        // Crea un oggetto Date per il mese/anno corrente delle statistiche
        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        
        // Helpers.getCustomMonthRange restituisce { startDate, endDate }
        const range = Helpers.getCustomMonthRange(referenceDate);
        const start = range.startDate; 
        const end = range.endDate;

        const msPerDay = 24 * 60 * 60 * 1000;
        const daysInCustomMonth = Math.ceil((end - start) / msPerDay) + 1;
        
        const customMonthDates = [];
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = new Date(start.getTime() + (i * msPerDay));
            customMonthDates.push(date);
        }
        
        const expensesByDate = {};
        const dailyTotals = {};
        
        normalExpenses.forEach(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            const expDate = new Date(dateStr + 'T12:00:00');
            const dateKey = dateStr;
            
            if (!expensesByDate[dateKey]) {
                expensesByDate[dateKey] = [];
                dailyTotals[dateKey] = 0;
            }
            expensesByDate[dateKey].push(expense);
            dailyTotals[dateKey] += Math.abs(parseFloat(expense.amount));
        });
        
        const amounts = Object.values(dailyTotals);
        const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 1;
        
        const firstDayOfWeek = start.getDay();
        const totalCells = firstDayOfWeek + daysInCustomMonth;
        const weeks = Math.ceil(totalCells / 7);

        let html = `
            <div id="heatmapTooltip" class="fixed hidden bg-slate-800 text-white px-4 py-3 rounded-xl shadow-2xl text-sm pointer-events-none z-50 border border-slate-600 min-w-[250px]">
                <div class="font-bold text-lg mb-2" id="heatmapTooltipDate"></div>
                <div class="space-y-1" id="heatmapTooltipContent"></div>
            </div>

            <div class="grid grid-cols-7 gap-2 mb-6">
        `;
        
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        dayNames.forEach(day => {
            html += `<div class="text-center text-sm font-semibold text-gray-400">${day}</div>`;
        });

        let dateIndex = 0;
        for (let week = 0; week < weeks; week++) {
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const cellIndex = week * 7 + dayOfWeek;
                
                if (cellIndex < firstDayOfWeek) {
                    html += '<div class="h-16"></div>';
                    continue;
                }
                
                if (dateIndex >= customMonthDates.length) {
                    html += '<div class="h-16"></div>';
                    continue;
                }
                
                const currentDate = customMonthDates[dateIndex];
                const dateKey = currentDate.toISOString().split('T')[0];
                const dayNumber = currentDate.getDate();
                const monthName = Helpers.getMonthName(currentDate.getMonth());
                
                const amount = dailyTotals[dateKey] || 0;
                const dayExpenses = expensesByDate[dateKey] || [];
                const intensity = amount > 0 ? Math.min((amount / maxAmount) * 100, 100) : 0;
                
                let bgClass, textClass;
                if (intensity === 0) {
                    bgClass = 'bg-slate-700';
                    textClass = 'text-gray-500';
                } else if (intensity < 25) {
                    bgClass = 'bg-green-500';
                    textClass = 'text-white';
                } else if (intensity < 50) {
                    bgClass = 'bg-yellow-400';
                    textClass = 'text-gray-900';
                } else if (intensity < 75) {
                    bgClass = 'bg-orange-500';
                    textClass = 'text-white';
                } else {
                    bgClass = 'bg-red-500';
                    textClass = 'text-white';
                }

                const tooltipData = JSON.stringify({
                    day: dayNumber,
                    month: monthName,
                    amount: amount,
                    count: dayExpenses.length,
                    expenses: dayExpenses.slice(0, 5).map(e => ({
                        desc: e.description,
                        amount: e.amount,
                        category: Categories.getById(e.category)?.icon || '📦'
                    }))
                }).replace(/"/g, '&quot;');
                
                html += `
                    <div class="h-16 ${bgClass} rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all"
                         onmouseenter="Statistics.showHeatmapTooltip(event, '${tooltipData}')"
                         onmouseleave="Statistics.hideHeatmapTooltip()">
                        <span class="font-bold text-sm ${textClass}">${dayNumber}</span>
                        ${amount > 0 ? `<span class="text-xs ${textClass} opacity-90">${Helpers.formatCurrency(amount)}</span>` : ''}
                    </div>
                `;
                
                dateIndex++;
            }
        }

        html += '</div>';
        
        html += `
            <div class="flex items-center justify-center gap-4 text-sm flex-wrap">
                <span class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-slate-700 rounded"></div>
                    <span class="text-gray-400">Nessuna</span>
                </span>
                <span class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-green-500 rounded"></div>
                    <span class="text-gray-400">Basso</span>
                </span>
                <span class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-yellow-400 rounded"></div>
                    <span class="text-gray-400">Medio</span>
                </span>
                <span class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-orange-500 rounded"></div>
                    <span class="text-gray-400">Alto</span>
                </span>
                <span class="flex items-center gap-2">
                    <div class="w-6 h-6 bg-red-500 rounded"></div>
                    <span class="text-gray-400">Molto Alto</span>
                </span>
            </div>
        `;

        return html;
    },

    showHeatmapTooltip(event, dataStr) {
        const tooltip = document.getElementById('heatmapTooltip');
        const dateEl = document.getElementById('heatmapTooltipDate');
        const contentEl = document.getElementById('heatmapTooltipContent');
        
        if (!tooltip || !dateEl || !contentEl) return;
        
        const data = JSON.parse(dataStr.replace(/&quot;/g, '"'));
        
        dateEl.textContent = `${data.day} ${data.month}`;
        
        let content = `
            <div class="flex justify-between items-center mb-2 pb-2 border-b border-slate-600">
                <span class="text-gray-300">Totale:</span>
                <span class="font-bold text-xl text-emerald-400">${Helpers.formatCurrency(data.amount)}</span>
            </div>
            <div class="text-gray-400 text-xs mb-2">${data.count} transazioni</div>
        `;
        
        if (data.expenses.length > 0) {
            content += '<div class="space-y-1.5 mt-2">';
            data.expenses.forEach(exp => {
                content += `
                    <div class="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1.5">
                        <div class="flex items-center gap-2 flex-1 min-w-0">
                            <span class="text-lg">${exp.category}</span>
                            <span class="text-xs text-gray-300 truncate">${exp.desc}</span>
                        </div>
                        <span class="font-semibold text-white ml-2">${Helpers.formatCurrency(exp.amount)}</span>
                    </div>
                `;
            });
            content += '</div>';
            
            if (data.count > 5) {
                content += `<div class="text-xs text-gray-500 mt-2 text-center">+${data.count - 5} altre...</div>`;
            }
        }
        
        contentEl.innerHTML = content;
        
        tooltip.style.left = `${event.pageX + 15}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
        tooltip.classList.remove('hidden');
    },

    hideHeatmapTooltip() {
        const tooltip = document.getElementById('heatmapTooltip');
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
    }
};

// Export globale
window.Statistics = Statistics;
console.log('✅ Statistics module loaded');