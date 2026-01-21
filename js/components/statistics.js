/**
 * Statistics Component - Original Design + Multi-View + FIXED CATEGORY COUNTS
 */

const Statistics = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    viewMode: 'month', // 'month', 'year', 'all'
    expenses: [],

    // Safe settings getter
    safeGetSetting(key, fallback) {
        try {
            if (window.SettingsManager) return window.SettingsManager.get(key) ?? fallback;
            const raw = localStorage.getItem(key);
            if (raw !== null) return Number.isFinite(Number(raw)) ? Number(raw) : raw;
        } catch (e) {}
        return fallback;
    },

    async init() {
        await this.loadData();
        await this.render();
    },

    async loadData() {
        try {
            if (window.CachedCRUD) {
                this.expenses = await CachedCRUD.getExpenses();
            } else {
                this.expenses = await ExpenseCRUD.getAll();
            }
        } catch (e) {
            console.error('Error loading expenses:', e);
            this.expenses = [];
        }
    },

    async render() {
        // Ricarica i dati se necessario (per sicurezza)
        if (this.expenses.length === 0) await this.loadData();
        
        const container = document.getElementById('statisticsContent');
        if (!container) return;

        // 1. Filtra le spese in base alla modalità (Mese/Anno/Tutto)
        const expenses = this.getFilteredExpenses();
        const stats = this.calculateAdvancedStats(expenses);

        // 2. Genera il titolo dinamico
        let titleLabel = '';
        if (this.viewMode === 'month') {
            titleLabel = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 1));
        } else if (this.viewMode === 'year') {
            titleLabel = `Anno ${this.currentYear}`;
        } else {
            titleLabel = 'Tutto lo Storico';
        }

        container.innerHTML = `
            <div class="mb-6">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        📊 Statistiche Avanzate
                    </h2>
                    
                    <div class="bg-white p-1 rounded-lg flex shadow-md border border-gray-100">
                        <button onclick="Statistics.setViewMode('month')" 
                                class="px-4 py-2 rounded-md text-sm font-bold transition-all ${this.viewMode === 'month' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}">
                            Mese
                        </button>
                        <button onclick="Statistics.setViewMode('year')" 
                                class="px-4 py-2 rounded-md text-sm font-bold transition-all ${this.viewMode === 'year' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}">
                            Anno
                        </button>
                        <button onclick="Statistics.setViewMode('all')" 
                                class="px-4 py-2 rounded-md text-sm font-bold transition-all ${this.viewMode === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}">
                            Tutto
                        </button>
                    </div>
                </div>

                ${this.viewMode !== 'all' ? `
                <div class="flex items-center gap-4 mb-8 bg-white rounded-xl shadow-md p-4">
                    <button onclick="Statistics.changePeriod(-1)" class="p-3 hover:bg-gray-100 rounded-lg transition">
                        ◀️
                    </button>
                    <h3 class="text-2xl font-bold text-gray-800 flex-1 text-center capitalize">
                        ${titleLabel}
                    </h3>
                    <button onclick="Statistics.changePeriod(1)" class="p-3 hover:bg-gray-100 rounded-lg transition">
                        ▶️
                    </button>
                    ${this.viewMode === 'month' ? `
                    <button onclick="Statistics.handleResetMonth()" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition">
                        📅 Oggi
                    </button>
                    ` : ''}
                </div>
                ` : ''}
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

            ${this.viewMode === 'month' ? this.renderBudgetSection(stats) : ''}

            <div class="mb-8">
                <div class="bg-white rounded-2xl shadow-xl p-6">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>📈</span>
                        <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ${this.viewMode === 'month' ? 'Andamento Spese' : 'Andamento Mensile'}
                        </span>
                    </h3>
                    <div class="relative px-4" style="height: 300px;">
                        ${this.viewMode === 'month' 
                            ? this.renderSpendingChart(expenses, stats) 
                            : this.renderBarChart(expenses)}
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

            ${this.viewMode !== 'all' ? `
            <div class="bg-white rounded-2xl shadow-xl p-6">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>📅</span>
                    <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Analisi Giornaliera</span>
                </h3>
                ${this.renderDailyHeatmap(expenses)}
            </div>
            ` : ''}
        `;
    },

    // --- Logic Switcher ---

    setViewMode(mode) {
        this.viewMode = mode;
        this.render();
    },

    changePeriod(delta) {
        if (this.viewMode === 'month') {
            this.currentMonth += delta;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            } else if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
        } else if (this.viewMode === 'year') {
            this.currentYear += delta;
        }
        this.render();
    },

    handleResetMonth() {
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
        this.render();
    },

    getFilteredExpenses() {
        if (this.viewMode === 'all') {
            return this.expenses;
        }

        if (this.viewMode === 'year') {
            const startYear = new Date(this.currentYear, 0, 1);
            const endYear = new Date(this.currentYear, 11, 31, 23, 59, 59);
            return this.expenses.filter(e => {
                const d = new Date(e.date);
                return d >= startYear && d <= endYear;
            });
        }

        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(referenceDate);
        return this.expenses.filter(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            const expDate = new Date(dateStr + 'T12:00:00');
            return expDate >= startDate && expDate <= endDate;
        });
    },

    // --- Core Logic (FIXED) ---

    getNormalExpenses(expenses) {
        return ExpenseFilters.notExcluded(expenses);
    },

    getExcludedExpenses(expenses) {
        return ExpenseFilters.excluded(expenses);
    },

    calculateAdvancedStats(expenses) {
        const incomeTransactions = expenses.filter(e => e.type === 'income');
        const income = incomeTransactions.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
        const incomeCount = incomeTransactions.length;
        
        const expensesOnly = expenses.filter(e => !e.type || e.type === 'expense');
        const normalExpenses = this.getNormalExpenses(expensesOnly);
        const excludedExpenses = this.getExcludedExpenses(expensesOnly);
        
        const total = normalExpenses.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
        const excludedTotal = excludedExpenses.reduce((sum, e) => sum + Math.abs(parseFloat(e.amount)), 0);
        const count = normalExpenses.length;
        const excludedCount = excludedExpenses.length;
        
        // FIX: Inizializza sia i totali che i conteggi
        const categoryTotals = {};
        const categoryCounts = {}; // <--- AGGIUNTO
        
        // Setup iniziale a 0 per tutte le categorie
        Categories.getAll().forEach(cat => {
            categoryTotals[cat.id] = 0;
            categoryCounts[cat.id] = 0; // <--- AGGIUNTO
        });

        normalExpenses.forEach(expense => {
            const catId = expense.category || 'other';
            categoryTotals[catId] = (categoryTotals[catId] || 0) + Math.abs(parseFloat(expense.amount));
            categoryCounts[catId] = (categoryCounts[catId] || 0) + 1; // <--- AGGIUNTO
        });

        const categories = Categories.getAll()
            .map(cat => ({
                ...cat,
                total: categoryTotals[cat.id] || 0,
                count: categoryCounts[cat.id] || 0, // <--- AGGIUNTO (fixa undefined transazioni)
                percentage: total > 0 ? ((categoryTotals[cat.id] || 0) / total * 100).toFixed(1) : 0
            }))
            .filter(cat => cat.total > 0)
            .sort((a, b) => b.total - a.total);

        const activeDays = new Set(normalExpenses.map(e => e.date.split('T')[0])).size;

        return {
            total, count, activeDays, categories, income, incomeCount,
            balance: income - total, excludedTotal, excludedCount
        };
    },

    // --- Renderers UI ---

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
                        <span class="font-bold ${percentage > 90 ? 'text-white' : 'text-gray-700'}">${isOver ? '⚠️ ' : ''}${Math.max(0, 100 - percentage).toFixed(0)}% disponibile</span>
                    </div>
                    <div class="h-full bg-gradient-to-r ${isOver ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-600'} transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    },

    // Grafico a LINEA (Mese)
    renderSpendingChart(expenses, stats) {
        const normalExpenses = this.getNormalExpenses(expenses).filter(e => !e.type || e.type === 'expense');
        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(referenceDate);
        
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysInCustomMonth = Math.ceil((endDate - startDate) / msPerDay) + 1;
        
        const customMonthDates = [];
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = new Date(startDate.getTime() + (i * msPerDay));
            customMonthDates.push(date);
        }
        
        const dailyTotals = {};
        customMonthDates.forEach(date => {
            const dateKey = date.toISOString().split('T')[0];
            dailyTotals[dateKey] = 0;
        });
        
        normalExpenses.forEach(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            if (dailyTotals.hasOwnProperty(dateStr)) dailyTotals[dateStr] += Math.abs(parseFloat(expense.amount));
        });

        const cumulativeTotals = {};
        let runningTotal = 0;
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = customMonthDates[i];
            const dateKey = date.toISOString().split('T')[0];
            runningTotal += (dailyTotals[dateKey] || 0);
            cumulativeTotals[i] = runningTotal;
        }

        const monthlyBudget = this.safeGetSetting('monthlyBudget', 700);
        const totalSpending = cumulativeTotals[daysInCustomMonth - 1] || 1;
        const maxCumulative = Math.max(totalSpending, monthlyBudget);
        const chartWidth = 1160;
        
        let areaPath = `M 0,200`;
        let linePath = '';
        const points = [];
        
        for (let i = 0; i < daysInCustomMonth; i++) {
            const date = customMonthDates[i];
            const cumulativeAmount = cumulativeTotals[i] || 0;
            const x = ((i) / (daysInCustomMonth - 1)) * chartWidth;
            const y = 200 - ((cumulativeAmount / maxCumulative) * 160);
            
            points.push({ x, y, day: date.getDate(), amount: cumulativeAmount });
            
            if (linePath === '') {
                linePath = `M ${x},${y}`;
                areaPath += ` L ${x},${y}`;
            } else {
                linePath += ` L ${x},${y}`;
                areaPath += ` L ${x},${y}`;
            }
        }
        areaPath += ` L ${chartWidth},200 Z`;

        const calculateBudgetY = (dayIndex) => {
            const budgetAtDay = (dayIndex / (daysInCustomMonth - 1)) * monthlyBudget;
            return 200 - ((budgetAtDay / maxCumulative) * 160);
        };
        
        let budgetLine = '';
        for (let i = 0; i < daysInCustomMonth; i++) {
            const x = ((i) / (daysInCustomMonth - 1)) * chartWidth;
            const y = calculateBudgetY(i);
            if (budgetLine === '') budgetLine = `M ${x},${y}`;
            else budgetLine += ` L ${x},${y}`;
        }
        
        const spendingGradient = (cumulativeTotals[daysInCustomMonth - 1] > monthlyBudget) ? 'areaGradRed' : 'areaGrad';

        let html = `
            <div id="chartTooltip" class="fixed hidden bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-50 border border-emerald-500/50">
                <div class="font-semibold text-white" id="tooltipDay"></div>
                <div class="text-emerald-400 font-bold text-lg" id="tooltipAmount"></div>
            </div>
            <div class="relative" id="chartContainer"><svg width="100%" height="200" viewBox="-20 -20 1200 240" preserveAspectRatio="xMidYMid meet" class="mt-4" id="spendingChart">
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
            <path d="${areaPath}" fill="url(#${spendingGradient})" />
            <path d="${budgetLine}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="8,4" opacity="0.6" />
            <text x="${chartWidth + 5}" y="${calculateBudgetY(daysInCustomMonth - 1) + 5}" fill="#94a3b8" font-size="12" font-weight="600">Budget ${Helpers.formatCurrency(monthlyBudget)}</text>
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
            
            html += `<circle cx="${point.x}" cy="${point.y}" r="15" fill="transparent" class="cursor-pointer"
                    onmouseenter="Statistics.showChartTooltip(event, ${point.day}, ${point.amount}, ${point.x}, ${point.y})"
                    onmouseleave="Statistics.hideChartTooltip()"></circle>`;
            html += `<circle cx="${point.x}" cy="${point.y}" r="5" fill="${pointColor}" stroke="#1e293b" stroke-width="2" class="pointer-events-none"></circle>`;
        });

        const keyIndices = [0, Math.floor(daysInCustomMonth / 2), daysInCustomMonth - 1];
        keyIndices.forEach(i => {
            const point = points[i];
            if (point) {
                html += `<rect x="${point.x - 15}" y="185" width="30" height="16" fill="#1e293b" rx="4" opacity="0.8"/>`;
                html += `<text x="${point.x}" y="197" text-anchor="middle" fill="#94a3b8" font-size="13" font-weight="600">${point.day}</text>`;
            }
        });

        html += '</svg></div>';
        return html;
    },

    // Nuovo Grafico a BARRE (Anno/Tutto)
    renderBarChart(expenses) {
        const aggregated = {};
        const labels = [];
        
        if (this.viewMode === 'year') {
            for(let i=0; i<12; i++) {
                aggregated[i] = 0;
                labels.push(Helpers.getMonthName(i).substring(0, 3));
            }
            expenses.filter(e => !e.exclude_from_stats && (!e.type || e.type === 'expense')).forEach(e => {
                aggregated[new Date(e.date).getMonth()] += Math.abs(parseFloat(e.amount));
            });
        } else {
            // View All
            expenses.filter(e => !e.exclude_from_stats && (!e.type || e.type === 'expense')).forEach(e => {
                const year = new Date(e.date).getFullYear();
                aggregated[year] = (aggregated[year] || 0) + Math.abs(parseFloat(e.amount));
                if(!labels.includes(year)) labels.push(year);
            });
            labels.sort();
        }

        const keys = this.viewMode === 'year' ? Object.keys(aggregated) : labels;
        const values = keys.map(k => aggregated[k] || 0);
        const maxVal = Math.max(...values, 100);

        const bars = keys.map((key, i) => {
            const val = this.viewMode === 'year' ? aggregated[key] : (aggregated[key] || 0);
            const height = (val / maxVal) * 160; 
            const x = (i / keys.length) * 1160;
            const width = (1160 / keys.length) - 20;
            const label = this.viewMode === 'year' ? labels[key] : key;

            return `
                <g class="group" onmouseenter="Statistics.showChartTooltip(event, '${label}', ${val}, ${x + width/2}, ${200-height})" onmouseleave="Statistics.hideChartTooltip()">
                    <rect x="${x + 10}" y="${200 - height}" width="${width}" height="${height}" 
                          fill="url(#barGradient)" rx="4" class="transition-all hover:opacity-80 cursor-pointer" />
                    <text x="${x + width/2 + 10}" y="220" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="bold">${label}</text>
                </g>
            `;
        }).join('');

        return `
            <div id="chartTooltip" class="fixed hidden bg-slate-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-50 border border-emerald-500/50">
                <div class="font-semibold text-white" id="tooltipDay"></div>
                <div class="text-emerald-400 font-bold text-lg" id="tooltipAmount"></div>
            </div>
            <div class="relative" id="chartContainer">
                <svg width="100%" height="240" viewBox="-20 -20 1200 260" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#3b82f6" />
                            <stop offset="100%" stop-color="#2563eb" />
                        </linearGradient>
                    </defs>
                    ${bars}
                </svg>
            </div>`;
    },

    showChartTooltip(event, label, amount, svgX, svgY) {
        const tooltip = document.getElementById('chartTooltip');
        const dayEl = document.getElementById('tooltipDay');
        const amountEl = document.getElementById('tooltipAmount');
        
        if (tooltip && dayEl && amountEl) {
            dayEl.textContent = typeof label === 'number' ? `Giorno ${label}` : label;
            amountEl.textContent = Helpers.formatCurrency(amount);
            
            const svg = document.getElementById('spendingChart') || document.querySelector('#chartContainer svg');
            const rect = svg.getBoundingClientRect();
            const actualX = rect.left + (svgX * (rect.width / 1160));
            const actualY = rect.top + (svgY * (rect.height / 200)) + window.scrollY;
            
            tooltip.style.left = `${actualX}px`;
            tooltip.style.top = `${actualY - 80}px`;
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.classList.remove('hidden');
        }
    },

    hideChartTooltip() {
        const tooltip = document.getElementById('chartTooltip');
        if (tooltip) tooltip.classList.add('hidden');
    },

    renderCategoryBars(categories, total) {
        if (!categories || categories.length === 0) return '<p class="text-gray-500 text-center py-8">Nessuna categoria</p>';
        const maxValue = Math.max(...categories.map(c => c.total));

        return categories.map((cat, index) => {
            const percentageOfTotal = (cat.total / total) * 100;
            const barWidth = (cat.total / maxValue) * 100;
            const colors = ['from-red-500 to-pink-600', 'from-orange-500 to-yellow-600', 'from-green-500 to-emerald-600', 'from-blue-500 to-cyan-600', 'from-purple-500 to-indigo-600'];
            const gradient = colors[index % colors.length];

            return `
                <div class="flex items-center gap-4">
                    <div class="flex items-center gap-3 w-48">
                        <span class="text-3xl">${cat.icon}</span>
                        <div><p class="font-semibold text-gray-800">${cat.name}</p><p class="text-xs text-gray-500">${cat.count} transazioni</p></div>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-3">
                            <div class="flex-1 h-10 bg-gray-100 rounded-full overflow-hidden relative">
                                <div class="h-full bg-gradient-to-r ${gradient} rounded-full flex items-center justify-end pr-3" style="width: ${barWidth}%">
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
                    const isExcluded = MerchantMappings.excludedTags.some(ex => tag.toLowerCase() === ex.toLowerCase());
                    if (!isExcluded) {
                        if (!tagStats[tag]) tagStats[tag] = { tag, total: 0, count: 0 };
                        tagStats[tag].total += Math.abs(parseFloat(expense.amount));
                        tagStats[tag].count++;
                    }
                });
            }
        });

        const sortedTags = Object.values(tagStats).sort((a, b) => b.total - a.total);
        if (sortedTags.length === 0) return '<div class="text-center text-gray-500 py-8">Nessun tag personalizzato trovato.</div>';

        const totalWithTags = sortedTags.reduce((sum, t) => sum + t.total, 0);
        let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
        const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-red-500'];

        sortedTags.forEach((tagData, index) => {
            const percentage = ((tagData.total / totalWithTags) * 100).toFixed(1);
            const colorClass = colors[index % colors.length];
            html += `
                <div class="bg-gradient-to-r ${colorClass} rounded-xl p-5 text-white shadow-lg">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl backdrop-blur">🏷️</div>
                            <div><div class="font-bold text-xl">${tagData.tag}</div><div class="text-sm opacity-90">${tagData.count} transazioni</div></div>
                        </div>
                        <div class="text-right"><div class="font-bold text-2xl">${Helpers.formatCurrency(tagData.total)}</div><div class="text-sm opacity-90">${percentage}%</div></div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    },

    renderDailyHeatmap(expenses) {
        const ref = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(ref);
        const days = Math.ceil((endDate - startDate) / 86400000) + 1;
        const dailyTotals = {};
        const expensesOnly = expenses.filter(e => !e.type || e.type === 'expense');
        const normalExpenses = this.getNormalExpenses(expensesOnly);

        normalExpenses.forEach(e => {
            const d = e.date.split('T')[0];
            dailyTotals[d] = (dailyTotals[d] || 0) + Math.abs(parseFloat(e.amount));
        });

        const max = Math.max(...Object.values(dailyTotals), 1);
        let html = '<div class="grid grid-cols-7 gap-2">';
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        dayNames.forEach(day => html += `<div class="text-center text-sm font-semibold text-gray-400">${day}</div>`);

        for(let i=0; i<startDate.getDay(); i++) html += '<div></div>';

        for(let i=0; i<days; i++) {
            const curr = new Date(startDate.getTime() + i * 86400000);
            const val = dailyTotals[curr.toISOString().split('T')[0]] || 0;
            const intensity = val > 0 ? Math.min((val / max) * 100, 100) : 0;
            let bgClass, textClass;
            
            if (intensity === 0) { bgClass = 'bg-slate-700'; textClass = 'text-gray-500'; }
            else if (intensity < 25) { bgClass = 'bg-green-500'; textClass = 'text-white'; }
            else if (intensity < 50) { bgClass = 'bg-yellow-400'; textClass = 'text-gray-900'; }
            else if (intensity < 75) { bgClass = 'bg-orange-500'; textClass = 'text-white'; }
            else { bgClass = 'bg-red-500'; textClass = 'text-white'; }

            html += `
                <div class="h-16 ${bgClass} rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:shadow-lg transition-all"
                     title="${curr.toLocaleDateString()}: ${Helpers.formatCurrency(val)}">
                    <span class="font-bold text-sm ${textClass}">${curr.getDate()}</span>
                    ${val > 0 ? `<span class="text-xs ${textClass} opacity-90">${Helpers.formatCurrency(val)}</span>` : ''}
                </div>
            `;
        }
        return html + '</div>';
    }
};

window.Statistics = Statistics;