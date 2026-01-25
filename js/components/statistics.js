/**
 * Statistics Component - Fixed Layout & Responsive
 */

const Statistics = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    viewMode: 'month', // 'month', 'year', 'all'
    expenses: [],
    tooltipTimeout: null,
    safeGetSetting(key, fallback) {
        try {
            if (window.SettingsManager) return window.SettingsManager.get(key) ?? fallback;
            return fallback;
        } catch (e) { return fallback; }
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
        if (this.expenses.length === 0) await this.loadData();
        
        const container = document.getElementById('statisticsContent');
        if (!container) return;

        const expenses = this.getFilteredExpenses();
        const stats = this.calculateAdvancedStats(expenses);

        let titleLabel = '';
        if (this.viewMode === 'month') {
            titleLabel = Helpers.formatCustomMonthName(new Date(this.currentYear, this.currentMonth, 1));
        } else if (this.viewMode === 'year') {
            titleLabel = `Anno ${this.currentYear}`;
        } else {
            titleLabel = 'Tutto lo Storico';
        }

        container.innerHTML = `
            <div class="mb-8">
                <div class="flex flex-col xl:flex-row justify-between items-center mb-8 gap-6">
                    <h2 class="text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-300 via-teal-200 to-slate-400 bg-clip-text text-transparent">Analytics</h2>
                    
                    <div class="flex items-center gap-4">
                        <div class="bg-slate-800/50 p-1 rounded-xl flex shadow-lg border border-slate-700/50 backdrop-blur-sm">
                            <button onclick="Statistics.setViewMode('month')" 
                                    class="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${this.viewMode === 'month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
                                Mese
                            </button>
                            <button onclick="Statistics.setViewMode('year')" 
                                    class="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${this.viewMode === 'year' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
                                Anno
                            </button>
                            <button onclick="Statistics.setViewMode('all')" 
                                    class="px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${this.viewMode === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}">
                                Tutto
                            </button>
                        </div>
                    </div>
                </div>

                ${this.viewMode !== 'all' ? `
                <div class="relative flex items-center justify-between gap-6 mb-10 bg-slate-800/40 backdrop-blur-md p-2 pr-3 rounded-2xl border border-slate-700/50 shadow-xl max-w-lg mx-auto">
                    
                    <button onclick="Statistics.changePeriod(-1)" 
                            class="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-slate-500 border border-transparent transition-all duration-300 active:scale-95 group">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 group-hover:-translate-x-1 transition-transform">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <h3 class="text-2xl font-black text-white flex-1 text-center capitalize tracking-tight select-none">
                        ${titleLabel}
                    </h3>

                    <div class="flex items-center gap-2">
                        <button onclick="Statistics.changePeriod(1)" 
                                class="w-12 h-12 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-slate-500 border border-transparent transition-all duration-300 active:scale-95 group">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 group-hover:translate-x-1 transition-transform">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </button>

                        ${this.viewMode === 'month' ? `
                        <div class="w-px h-8 bg-slate-700 mx-1"></div>
                        <button onclick="Statistics.handleResetMonth()" 
                                title="Torna a Oggi"
                                class="w-12 h-12 flex items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 hover:border-indigo-500 transition-all duration-300 active:scale-95 shadow-lg shadow-indigo-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                ${this.renderKpiCard('Spese', stats.total, `${stats.count} transazioni`, 'from-rose-500 to-pink-600')}
                ${this.renderKpiCard('Entrate', stats.income, `${stats.incomeCount} transazioni`, 'from-emerald-500 to-teal-600')}
                ${this.renderKpiCard('Bilancio', stats.balance, stats.balance >= 0 ? 'Positivo' : 'Negativo', stats.balance >= 0 ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600')}
                ${this.renderKpiCard('Totali', stats.count + stats.incomeCount, `${stats.activeDays} giorni attivi`, 'from-violet-500 to-purple-600')}
                ${this.renderKpiCard('Investimenti', stats.excludedTotal, `${stats.excludedCount} op.`, 'from-cyan-500 to-blue-600')}
            </div>

            ${this.viewMode === 'month' ? this.renderBudgetSection(stats) : ''}

            <div class="mb-8">
                <div class="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-slate-700/50">
                    <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span class="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">📈</span>
                        <span class="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            ${this.viewMode === 'month' ? 'Andamento Spese' : 'Andamento Mensile'}
                        </span>
                    </h3>
                    <div class="relative w-full">
                        ${this.viewMode === 'month' 
                            ? this.renderSpendingChart(expenses, stats) 
                            : this.renderBarChart(expenses)}
                    </div>
                </div>
            </div>

            <div class="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-8 border border-slate-700/50">
                <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span class="bg-blue-500/20 p-2 rounded-lg text-blue-400">📊</span> Dettaglio Categorie
                </h3>
                <div class="space-y-4">
                    ${this.renderCategoryBars(stats.categories, stats.total)}
                </div>
            </div>

            <div class="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-8 border border-slate-700/50">
                <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span class="bg-amber-500/20 p-2 rounded-lg text-amber-400">🏷️</span> Statistiche per Tag
                </h3>
                ${this.renderTagStats(expenses)}
            </div>

            ${this.viewMode !== 'all' ? `
            <div class="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-slate-700/50">
                <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span class="bg-purple-500/20 p-2 rounded-lg text-purple-400">📅</span> Analisi Giornaliera
                </h3>
                ${this.renderDailyHeatmap(expenses)}
            </div>
            ` : ''}
        `;
    },

    renderKpiCard(title, value, sub, grad) {
        return `
            <div class="relative overflow-hidden bg-gradient-to-br ${grad} rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                <div class="relative">
                    <p class="text-sm opacity-90 mb-2">${title}</p>
                    <p class="text-4xl font-bold mb-2">${value !== undefined && typeof value === 'number' ? Helpers.formatCurrency(value) : value}</p>
                    <div class="text-sm opacity-90">${sub}</div>
                </div>
            </div>`;
    },

    // Grafico a LINEA (Mese) - Correctly Sized Wrapper
    renderSpendingChart(expenses, stats) {
        // Dati
        const normalExpenses = this.getNormalExpenses(expenses).filter(e => !e.type || e.type === 'expense');
        const referenceDate = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(referenceDate);
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysInCustomMonth = Math.ceil((endDate - startDate) / msPerDay) + 1;
        
        const customMonthDates = [];
        for (let i = 0; i < daysInCustomMonth; i++) {
            customMonthDates.push(new Date(startDate.getTime() + (i * msPerDay)));
        }
        
        const dailyTotals = {};
        customMonthDates.forEach(d => dailyTotals[d.toISOString().split('T')[0]] = 0);
        
        normalExpenses.forEach(expense => {
            const dateStr = expense.date.split(' ')[0].split('T')[0];
            if (dailyTotals.hasOwnProperty(dateStr)) dailyTotals[dateStr] += Math.abs(parseFloat(expense.amount));
        });

        const cumulativeTotals = [];
        let runningTotal = 0;
        for (let i = 0; i < daysInCustomMonth; i++) {
            const dateStr = customMonthDates[i].toISOString().split('T')[0];
            runningTotal += (dailyTotals[dateStr] || 0);
            cumulativeTotals.push({
                day: customMonthDates[i].getDate(),
                dateStr: dateStr,
                total: runningTotal,
                daily: dailyTotals[dateStr] || 0
            });
        }

        const monthlyBudget = this.safeGetSetting('monthlyBudget', 700);
        const maxVal = Math.max(runningTotal, monthlyBudget) * 1.15; 
        
        // Dimensioni SVG
        const W = 1200;
        const H = 350; // SVG Height matches Wrapper Height
        const PAD_L = 70;
        const PAD_R = 30;
        const PAD_T = 30;
        const PAD_B = 40;

        const DRAW_W = W - PAD_L - PAD_R;
        const DRAW_H = H - PAD_T - PAD_B;

        const getX = (i) => PAD_L + (i / (daysInCustomMonth - 1)) * DRAW_W;
        const getY = (val) => (H - PAD_B) - ((val / maxVal) * DRAW_H);

        const points = cumulativeTotals.map((d, i) => ({
            x: getX(i),
            y: getY(d.total),
            budgetY: getY((i / (daysInCustomMonth - 1)) * monthlyBudget),
            data: d
        }));

        let linePath = `M ${points[0].x},${points[0].y}`;
        points.slice(1).forEach(p => linePath += ` L ${p.x},${p.y}`);
        const areaPath = `${linePath} L ${points[points.length-1].x},${H - PAD_B} L ${points[0].x},${H - PAD_B} Z`;

        const bStart = { x: points[0].x, y: getY(0) };
        const bEnd = { x: points[points.length-1].x, y: getY(monthlyBudget) };

        return `
            <div id="chartWrapper" class="relative w-full h-[350px] bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden select-none group">
                
                <div id="chartTooltip" class="absolute hidden top-0 left-0 z-50 pointer-events-none transition-opacity duration-150">
                    <div class="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-600 text-sm min-w-[120px] text-center">
                        <div class="font-bold text-slate-400 mb-1" id="tooltipDate"></div>
                        <div class="text-xl font-bold text-white" id="tooltipTotal"></div>
                        <div class="text-xs text-emerald-400 mt-1" id="tooltipDaily"></div>
                    </div>
                </div>

                <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="w-full h-full block">
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
                        </linearGradient>
                    </defs>

                    ${[0, 0.5, 1].map(pct => {
                        const val = maxVal * pct;
                        const y = getY(val);
                        return `
                            <line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#334155" stroke-width="1" stroke-dasharray="4" />
                            <text x="${PAD_L - 15}" y="${y + 5}" fill="#94a3b8" font-size="12" text-anchor="end" font-family="sans-serif">
                                ${Helpers.formatCurrency(val).split(',')[0]}€
                            </text>
                        `;
                    }).join('')}

                    <line x1="${bStart.x}" y1="${bStart.y}" x2="${bEnd.x}" y2="${bEnd.y}" 
                          stroke="#ef4444" stroke-width="2" stroke-dasharray="8,6" opacity="0.7" />
                    <text x="${bEnd.x}" y="${bEnd.y - 10}" fill="#ef4444" font-size="12" text-anchor="end" font-weight="bold">
                        Budget: ${Helpers.formatCurrency(monthlyBudget)}
                    </text>

                    <path d="${areaPath}" fill="url(#areaGradient)" />
                    <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

                    ${points.map((p, i) => {
                        if (i === 0) return '';
                        const prev = points[i-1];
                        if (p.y < p.budgetY && prev.y < prev.budgetY) {
                            return `<line x1="${prev.x}" y1="${prev.y}" x2="${p.x}" y2="${p.y}" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />`;
                        }
                        return '';
                    }).join('')}

                    ${points.map((p, i) => {
                        const isOver = p.y < p.budgetY; 
                        const color = isOver ? '#ef4444' : '#10b981';
                        
                        const showLabel = i === 0 || i === points.length - 1 || i % 5 === 0;

                        return `
                            <g class="group/point cursor-pointer"
                               onmouseenter="Statistics.showChartTooltip(event, '${p.data.day}', ${p.data.total}, ${p.data.daily})"
                               onmouseleave="Statistics.hideChartTooltip()">
                                <circle cx="${p.x}" cy="${p.y}" r="15" fill="transparent" />
                                <circle cx="${p.x}" cy="${p.y}" r="5" fill="#1e293b" stroke="${color}" stroke-width="2" 
                                        class="transition-all duration-200 group-hover/point:r-7 group-hover/point:stroke-4" />
                                ${showLabel ? `<text x="${p.x}" y="${H - 10}" fill="#64748b" font-size="12" text-anchor="middle" font-weight="600">${p.data.day}</text>` : ''}
                            </g>
                        `;
                    }).join('')}
                </svg>
            </div>
        `;
    },

    // Grafico a BARRE (Anno/Tutto) - Wrapper Size Match
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
            expenses.filter(e => !e.exclude_from_stats && (!e.type || e.type === 'expense')).forEach(e => {
                const year = new Date(e.date).getFullYear();
                aggregated[year] = (aggregated[year] || 0) + Math.abs(parseFloat(e.amount));
                if(!labels.includes(year)) labels.push(year);
            });
            labels.sort();
        }

        const keys = this.viewMode === 'year' ? Object.keys(aggregated) : labels;
        const values = keys.map(k => aggregated[k] || 0);
        const maxVal = Math.max(...values, 100) * 1.1;

        // SVG Dimensions
        const W = 1200;
        const H = 350;
        const PAD_L = 70;
        const PAD_B = 40;
        const CHART_H = H - 60; // Top + Bottom padding

        const bars = keys.map((key, i) => {
            const val = this.viewMode === 'year' ? aggregated[key] : (aggregated[key] || 0);
            const height = (val / maxVal) * CHART_H;
            const x = PAD_L + (i / keys.length) * (W - PAD_L - 20);
            const width = ((W - PAD_L - 20) / keys.length) - 20;
            const label = this.viewMode === 'year' ? labels[key] : key;

            return `
                <g class="group" onmouseenter="Statistics.showChartTooltip(event, '${label}', ${val}, 0)" onmouseleave="Statistics.hideChartTooltip()">
                    <rect x="${x + 10}" y="${H - PAD_B - height}" width="${width}" height="${height}" 
                          fill="url(#barGradient)" rx="4" class="transition-all hover:opacity-80 cursor-pointer" />
                    <text x="${x + width/2 + 10}" y="${H - 10}" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="bold">${label}</text>
                </g>
            `;
        }).join('');

        return `
            <div id="chartWrapper" class="relative w-full h-[350px] bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden select-none">
                <div id="chartTooltip" class="absolute hidden top-0 left-0 z-50 pointer-events-none transition-opacity duration-150">
                    <div class="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-600 text-sm min-w-[120px] text-center">
                        <div class="font-bold text-slate-400 mb-1" id="tooltipDate"></div>
                        <div class="text-xl font-bold text-white" id="tooltipTotal"></div>
                        <div class="text-xs text-emerald-400 mt-1" id="tooltipDaily"></div>
                    </div>
                </div>
                <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" class="w-full h-full block">
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

    showChartTooltip(event, day, total, daily) {
        const tooltip = document.getElementById('chartTooltip');
        const wrapper = document.getElementById('chartWrapper');
        if (!tooltip || !wrapper) return;

        document.getElementById('tooltipDate').textContent = isNaN(day) ? day : `Giorno ${day}`;
        document.getElementById('tooltipTotal').textContent = Helpers.formatCurrency(total);
        document.getElementById('tooltipDaily').textContent = daily > 0 ? `+${Helpers.formatCurrency(daily)}` : '';

        const rect = wrapper.getBoundingClientRect();
        let left = event.clientX - rect.left;
        let top = event.clientY - rect.top - 80;

        if (left < 10) left = 10;
        if (left > rect.width - 140) left = rect.width - 140;
        if (top < 0) top = 10;

        tooltip.style.transform = `translate(${left}px, ${top}px)`;
        tooltip.classList.remove('hidden');
        tooltip.style.opacity = '1';
    },

    hideChartTooltip() {
        const tooltip = document.getElementById('chartTooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.classList.add('hidden'), 200);
        }
    },

    // --- Helpers Logici ---
    setViewMode(mode) {
        this.viewMode = mode;
        this.render();
    },

    changePeriod(delta) {
        if (this.viewMode === 'month') {
            this.currentMonth += delta;
            if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
            else if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
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
        if (this.viewMode === 'all') return this.expenses;
        if (this.viewMode === 'year') {
            const startYear = new Date(this.currentYear, 0, 1);
            const endYear = new Date(this.currentYear, 11, 31, 23, 59, 59);
            return this.expenses.filter(e => {
                const d = new Date(e.date);
                return d >= startYear && d <= endYear;
            });
        }
        const ref = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(ref);
        return this.expenses.filter(e => {
            const d = new Date(e.date.split(' ')[0] + 'T12:00:00');
            return d >= startDate && d <= endDate;
        });
    },

    getNormalExpenses(expenses) { return ExpenseFilters.notExcluded(expenses); },
    getExcludedExpenses(expenses) { return ExpenseFilters.excluded(expenses); },

    calculateAdvancedStats(expenses) {
        const incomeTx = expenses.filter(e => e.type === 'income');
        const income = incomeTx.reduce((s, e) => s + Math.abs(parseFloat(e.amount)), 0);
        
        const expOnly = expenses.filter(e => !e.type || e.type === 'expense');
        const normal = this.getNormalExpenses(expOnly);
        const excluded = this.getExcludedExpenses(expOnly);
        
        const total = normal.reduce((s, e) => s + Math.abs(parseFloat(e.amount)), 0);
        const excludedTotal = excluded.reduce((s, e) => s + Math.abs(parseFloat(e.amount)), 0);
        
        const categoryTotals = {};
        const categoryCounts = {};
        Categories.getAll().forEach(c => { categoryTotals[c.id] = 0; categoryCounts[c.id] = 0; });

        normal.forEach(e => {
            const c = e.category || 'other';
            categoryTotals[c] = (categoryTotals[c] || 0) + Math.abs(parseFloat(e.amount));
            categoryCounts[c] = (categoryCounts[c] || 0) + 1;
        });

        const categories = Categories.getAll().map(c => ({
            ...c,
            total: categoryTotals[c.id] || 0,
            count: categoryCounts[c.id] || 0,
            percentage: total > 0 ? ((categoryTotals[c.id] || 0) / total * 100).toFixed(1) : 0
        })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

        const activeDays = new Set(normal.map(e => e.date.split('T')[0])).size;

        return { total, count: normal.length, activeDays, categories, income, incomeCount: incomeTx.length, balance: income - total, excludedTotal, excludedCount: excluded.length };
    },

    renderBudgetSection(stats) {
        const budget = this.safeGetSetting('monthlyBudget', 700);
        const remaining = budget - stats.total;
        const percentage = Math.min((stats.total / budget) * 100, 100);
        const isOver = stats.total > budget;

        return `
            <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
                <h3 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span>💰</span><span class="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Budget Mensile</span>
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="text-center"><p class="text-sm text-gray-600 mb-2">Budget Totale</p><p class="text-4xl font-bold text-gray-800">${Helpers.formatCurrency(budget)}</p></div>
                    <div class="text-center"><p class="text-sm text-gray-600 mb-2">Speso</p><p class="text-4xl font-bold ${isOver ? 'text-red-600' : 'text-blue-600'}">${Helpers.formatCurrency(stats.total)}</p></div>
                    <div class="text-center"><p class="text-sm text-gray-600 mb-2">${isOver ? 'Oltre Budget' : 'Disponibile'}</p><p class="text-4xl font-bold ${isOver ? 'text-red-600' : 'text-green-600'}">${Helpers.formatCurrency(Math.abs(remaining))}</p></div>
                </div>
                <div class="relative h-12 bg-gray-100 rounded-full overflow-hidden">
                    <div class="absolute inset-0 flex items-center justify-between px-6 z-10"><span class="font-bold ${percentage > 50 ? 'text-white' : 'text-gray-700'}">${percentage.toFixed(0)}% utilizzato</span><span class="font-bold ${percentage > 90 ? 'text-white' : 'text-gray-700'}">${isOver ? '⚠️ ' : ''}${Math.max(0, 100 - percentage).toFixed(0)}% disponibile</span></div>
                    <div class="h-full bg-gradient-to-r ${isOver ? 'from-red-500 to-red-600' : 'from-green-500 to-emerald-600'} transition-all duration-1000" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    },

    renderCategoryBars(categories, total) {
        if (!categories || categories.length === 0) return '<p class="text-gray-500 text-center py-8">Nessuna categoria</p>';
        const maxValue = Math.max(...categories.map(c => c.total));
        return categories.map((cat, index) => {
            const barWidth = (cat.total / maxValue) * 100;
            const colors = ['from-red-500 to-pink-600', 'from-orange-500 to-yellow-600', 'from-green-500 to-emerald-600', 'from-blue-500 to-cyan-600', 'from-purple-500 to-indigo-600'];
            return `
                <div class="flex items-center gap-4"><div class="flex items-center gap-3 w-48"><span class="text-3xl">${cat.icon}</span><div><p class="font-semibold text-gray-800">${cat.name}</p><p class="text-xs text-gray-500">${cat.count} transazioni</p></div></div><div class="flex-1"><div class="flex items-center gap-3"><div class="flex-1 h-10 bg-gray-100 rounded-full overflow-hidden relative"><div class="h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-full flex items-center justify-end pr-3" style="width: ${barWidth}%"><span class="text-white font-bold text-sm">${cat.percentage}%</span></div></div><span class="font-bold text-xl text-gray-800 w-24 text-right">${Helpers.formatCurrency(cat.total)}</span></div></div></div>
            `;
        }).join('');
    },

    renderTagStats(expenses) {
        const tagStats = {};
        this.getNormalExpenses(expenses).forEach(e => {
            if(e.tags) e.tags.forEach(t => {
                if(!MerchantMappings.excludedTags.some(ex => t.toLowerCase()===ex.toLowerCase())) {
                    if(!tagStats[t]) tagStats[t] = { tag: t, total: 0, count: 0 };
                    tagStats[t].total += parseFloat(e.amount);
                    tagStats[t].count++;
                }
            });
        });
        const sorted = Object.values(tagStats).sort((a,b) => b.total - a.total);
        if(sorted.length===0) return '<div class="text-center text-gray-500 py-8">Nessun tag.</div>';
        const total = sorted.reduce((s,t)=>s+t.total,0);
        return `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${sorted.map((t,i) => {
            const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-green-500 to-emerald-500'];
            return `<div class="bg-gradient-to-r ${colors[i%3]} rounded-xl p-5 text-white shadow-lg"><div class="flex justify-between mb-3"><div class="flex items-center gap-3"><div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">🏷️</div><div><div class="font-bold text-xl">${t.tag}</div><div class="text-sm opacity-90">${t.count} transazioni</div></div></div><div class="text-right"><div class="font-bold text-2xl">${Helpers.formatCurrency(t.total)}</div><div class="text-sm opacity-90">${((t.total/total)*100).toFixed(1)}%</div></div></div></div>`;
        }).join('')}</div>`;
    },

    renderDailyHeatmap(expenses) {
        const ref = new Date(this.currentYear, this.currentMonth, 1);
        const { startDate, endDate } = Helpers.getCustomMonthRange(ref);
        const days = Math.ceil((endDate - startDate) / 86400000) + 1;
        const dailyTotals = {};
        
        // 1. Dati
        const expensesOnly = expenses.filter(e => !e.type || e.type === 'expense');
        const normalExpenses = this.getNormalExpenses(expensesOnly);

        normalExpenses.forEach(e => {
            // FIX: Assicuriamoci di prendere la data YYYY-MM-DD pulita dalla stringa originale
            const dateStr = e.date.split('T')[0]; 
            dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + Math.abs(parseFloat(e.amount));
        });

        const max = Math.max(...Object.values(dailyTotals), 1);
        
        // 2. HTML
        let html = `
            <div id="hmTooltip" class="fixed hidden z-[9999] pointer-events-none min-w-[200px] max-w-[280px]">
                <div class="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-500/50 backdrop-blur-xl">
                    <div class="flex justify-between items-center border-b border-slate-700 pb-2 mb-2">
                        <span class="font-bold text-slate-300" id="hmDate"></span>
                        <span class="font-bold text-emerald-400 text-lg" id="hmTotal"></span>
                    </div>
                    <div id="hmList" class="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar"></div>
                </div>
            </div>

            <div class="grid grid-cols-7 gap-3 select-none">
        `;
        
        ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].forEach(d => 
            html += `<div class="text-center text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">${d}</div>`
        );

        for(let i=0; i<startDate.getDay(); i++) html += '<div></div>';

        // Celle
        for(let i=0; i<days; i++) {
            const curr = new Date(startDate.getTime() + i * 86400000);
            
            // --- FIX TIMEZONE CRUCIALE ---
            // Invece di toISOString() che converte in UTC (e quindi al giorno prima se sei GMT+1),
            // costruiamo la stringa YYYY-MM-DD usando i valori locali.
            const year = curr.getFullYear();
            const month = String(curr.getMonth() + 1).padStart(2, '0');
            const day = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`; 
            // -----------------------------

            const val = dailyTotals[dateStr] || 0;
            const intensity = val > 0 ? Math.min((val / max) * 100, 100) : 0;
            
            let bg, textDay, textAmount;
            
            if (val === 0) {
                bg = 'bg-slate-800 border-2 border-slate-700/50'; 
                textDay = 'text-slate-600';
            } else if (intensity < 25) {
                bg = 'bg-emerald-600 shadow-lg shadow-emerald-500/10 border-2 border-emerald-500'; 
                textDay = 'text-white'; textAmount = 'text-emerald-100';
            } else if (intensity < 50) {
                bg = 'bg-yellow-500 shadow-lg shadow-yellow-500/10 border-2 border-yellow-400'; 
                textDay = 'text-white'; textAmount = 'text-yellow-100';
            } else if (intensity < 75) {
                bg = 'bg-orange-500 shadow-lg shadow-orange-500/10 border-2 border-orange-400'; 
                textDay = 'text-white'; textAmount = 'text-orange-100';
            } else {
                bg = 'bg-rose-600 shadow-lg shadow-rose-500/10 border-2 border-rose-500'; 
                textDay = 'text-white'; textAmount = 'text-rose-100';
            }

            html += `
                <div class="h-20 ${bg} rounded-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 hover:brightness-110 transition-all duration-150 relative group"
                     onmouseenter="Statistics.showHeatmapTooltip(event, '${dateStr}', ${val})"
                     onmousemove="Statistics.showHeatmapTooltip(event, '${dateStr}', ${val})"
                     onmouseleave="Statistics.hideHeatmapTooltip()">
                    
                    <span class="font-black text-xl ${textDay}">${curr.getDate()}</span>
                    
                    ${val > 0 ? `<span class="text-xs font-bold ${textAmount} mt-1 bg-black/20 px-2 py-0.5 rounded-full">${Helpers.formatCurrency(val).split(',')[0]}</span>` : ''}
                </div>
            `;
        }
        return html + '</div>';
    },

    showHeatmapTooltip(event, dateStr, total) {
        if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

        if (total === 0) {
            this.hideHeatmapTooltip();
            return;
        }

        let tooltip = document.getElementById('hmTooltip');
        const listContainer = document.getElementById('hmList');
        
        // --- FIX CRUCIALE: Sposta nel body per uscire dal contenitore con overflow ---
        if (tooltip && tooltip.parentElement !== document.body) {
            tooltip.parentElement.removeChild(tooltip);
            document.body.appendChild(tooltip);
        }

        if (!tooltip || !listContainer) return;

        // Popola dati solo se cambia la data
        if (tooltip.dataset.activeDate !== dateStr) {
            const dayExpenses = this.getNormalExpenses(this.expenses).filter(e => e.date.startsWith(dateStr) && (!e.type || e.type === 'expense'));
            
            document.getElementById('hmDate').innerHTML = `<span class="capitalize">${new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>`;
            document.getElementById('hmTotal').textContent = Helpers.formatCurrency(total);
            
            listContainer.innerHTML = dayExpenses.map(e => {
                const cat = window.Categories?.getAll().find(c => c.id === e.category);
                const name = (e.description || 'Spesa').trim() === 'undefined' ? 'Spesa' : e.description;
                return `<div class="flex justify-between text-sm border-b border-slate-700/50 pb-2 mb-2 last:border-0"><div class="flex items-center gap-2"><span class="text-lg">${cat?.icon || '💸'}</span><span class="truncate text-slate-200">${name}</span></div><span class="font-bold text-white">${Helpers.formatCurrency(e.amount).split(',')[0]}</span></div>`;
            }).join('');
            
            tooltip.dataset.activeDate = dateStr;
        }

        tooltip.classList.remove('hidden');
        tooltip.style.opacity = '1';

        // --- CALCOLO POSIZIONE (Sopra/Sotto) ---
        const x = event.clientX;
        const y = event.clientY;
        const rect = tooltip.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const winWidth = window.innerWidth;

        let left = x + 20;
        let top = y + 20;

        // Se esce a destra -> sposta a sinistra
        if (left + rect.width > winWidth) {
            left = x - rect.width - 20;
        }

        // Se è troppo in basso (ultimi 300px dello schermo) -> sposta SOPRA
        if (y > winHeight - 300) {
            top = y - rect.height - 20;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    },

    // 3. Sostituisci interamente la funzione hideHeatmapTooltip con questa:
    hideHeatmapTooltip() {
        const tooltip = document.getElementById('hmTooltip');
        if (tooltip) {
            this.tooltipTimeout = setTimeout(() => {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    if (tooltip.style.opacity === '0') {
                        tooltip.classList.add('hidden');
                        tooltip.dataset.activeDate = '';
                    }
                }, 150);
            }, 50);
        }
    },

};

window.Statistics = Statistics;