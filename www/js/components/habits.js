/**
 * Habits Module
 * habits.days: integer[] | null
 *   null / [] = ogni giorno
 *   [0,4]     = lunedì e venerdì (0=lun, 1=mar, 2=mer, 3=gio, 4=ven, 5=sab, 6=dom)
 */

const Habits = {
    habits: [],
    entries: [],   // last 90 days
    selectedDate: null,

    // ── Init ──────────────────────────────────────────────────────────────────

    async init() { await this.loadData(); await this.render(); },

    async loadData() {
        try {
            this.habits = await CachedCRUD.getHabits();
            const today = this._today();
            this.entries = await CachedCRUD.getHabitEntries(this._addDays(today, -90), today);
        } catch (e) { console.error('Habits loadData:', e); }
    },

    // ── Date helpers ──────────────────────────────────────────────────────────

    _today() { return new Date().toISOString().split('T')[0]; },

    _addDays(dateStr, n) {
        const d = new Date(dateStr + 'T12:00:00');
        d.setDate(d.getDate() + n);
        return d.toISOString().split('T')[0];
    },

    _formatDate(dateStr) {
        const [, m, d] = dateStr.split('-');
        return `${d}/${m}`;
    },

    // 0=lun…6=dom (same convention as diet.js)
    _dayIndex(dateStr) {
        return (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7;
    },

    // Does this habit apply on the given date?
    _appliesToDate(habit, dateStr) {
        if (!habit.days || habit.days.length === 0) return true;
        return habit.days.includes(this._dayIndex(dateStr));
    },

    getSelectedDate() { return this.selectedDate || this._today(); },
    selectDate(dateStr) { this.selectedDate = dateStr; this.render(true); },

    // ── Entry helpers ─────────────────────────────────────────────────────────

    isCompleted(habitId, dateStr) {
        return this.entries.some(e => e.habit_id === habitId && e.entry_date === dateStr);
    },

    getStreak(habitId) {
        const habit = this.habits.find(h => h.id === habitId);
        if (!habit) return 0;

        const dateSet = new Set(
            this.entries.filter(e => e.habit_id === habitId).map(e => e.entry_date)
        );
        if (!dateSet.size) return 0;

        let streak = 0;
        // Walk back up to 90 days; skip days the habit doesn't apply to
        for (let i = 0; i <= 90; i++) {
            const d = this._addDays(this._today(), -i);
            if (!this._appliesToDate(habit, d)) continue;
            if (dateSet.has(d)) streak++;
            else break;
        }
        return streak;
    },

    // ── Toggle ────────────────────────────────────────────────────────────────

    async toggleEntry(habitId, dateStr) {
        const wasCompleted = this.isCompleted(habitId, dateStr);
        if (wasCompleted) {
            this.entries = this.entries.filter(
                e => !(e.habit_id === habitId && e.entry_date === dateStr)
            );
        } else {
            this.entries.push({ habit_id: habitId, entry_date: dateStr });
        }
        this.render(true);

        try {
            await CachedCRUD.toggleHabitEntry(habitId, dateStr);
            const today = this._today();
            this.entries = await CachedCRUD.getHabitEntries(this._addDays(today, -90), today);
            this.render(true);
        } catch (e) {
            console.error('Toggle habit error:', e);
            await this.loadData();
            this.render(true);
        }
    },

    // Toggle called from dashboard widget (no page navigation)
    async toggleFromWidget(habitId, dateStr) {
        const wasCompleted = this.isCompleted(habitId, dateStr);
        if (wasCompleted) {
            this.entries = this.entries.filter(
                e => !(e.habit_id === habitId && e.entry_date === dateStr)
            );
        } else {
            this.entries.push({ habit_id: habitId, entry_date: dateStr });
        }
        this._refreshWidgetDOM();

        try {
            await CachedCRUD.toggleHabitEntry(habitId, dateStr);
            const today = this._today();
            this.entries = await CachedCRUD.getHabitEntries(this._addDays(today, -90), today);
        } catch (e) {
            console.error('toggleFromWidget error:', e);
            await this.loadData();
        }
        this._refreshWidgetDOM();
    },

    _refreshWidgetDOM() {
        document.querySelectorAll('[data-habits-widget="today"]').forEach(el => {
            const temp = document.createElement('div');
            temp.innerHTML = this.renderWidgetToday();
            el.replaceWith(temp.firstElementChild);
        });
    },

    // ── Main render ───────────────────────────────────────────────────────────

    async render(skipLoad = false) {
        if (!skipLoad) await this.loadData();
        const container = document.getElementById('habitsContent');
        if (!container) return;

        const today = this._today();
        const sel = this.getSelectedDate();
        const applicable = this.habits.filter(h => this._appliesToDate(h, sel));
        const done  = applicable.filter(h => this.isCompleted(h.id, sel)).length;
        const total = applicable.length;
        const pct   = total > 0 ? Math.round(done / total * 100) : 0;

        const navDays  = Array.from({ length: 7 }, (_, i) => this._addDays(today, i - 3));
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

        container.innerHTML = `
        <div class="animate-fadeIn">

            <!-- Header -->
            <div class="flex items-center justify-between mb-4 md:mb-6">
                <div>
                    <h2 class="text-2xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent italic">Habits</h2>
                    <p class="text-slate-500 text-[11px] md:text-sm font-medium mt-0.5">
                        ${total === 0
                            ? 'Nessuna habit per questo giorno'
                            : `${done} di ${total} completat${done === 1 ? 'a' : 'e'} ${sel === today ? 'oggi' : 'il ' + this._formatDate(sel)}`}
                    </p>
                </div>
                <button onclick="Habits.showAddModal()"
                        class="flex items-center gap-2 px-3 md:px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-900/30">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                    <span class="hidden sm:inline">Aggiungi</span>
                </button>
            </div>

            <!-- Day navigator -->
            <div class="flex gap-1.5 md:gap-2 mb-5 md:mb-7 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
                ${navDays.map(dateStr => {
                    const d = new Date(dateStr + 'T12:00:00');
                    const isSelected = dateStr === sel;
                    const isToday    = dateStr === today;
                    const isFuture   = dateStr > today;
                    const dayApp = this.habits.filter(h => this._appliesToDate(h, dateStr));
                    const dayDone = dayApp.filter(h => this.isCompleted(h.id, dateStr)).length;

                    const cls = isSelected
                        ? 'bg-violet-600 border-violet-400 shadow-lg shadow-violet-500/25 text-white'
                        : isFuture
                            ? 'bg-slate-800/20 border-slate-700/20 text-slate-600 cursor-default'
                            : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200 cursor-pointer';

                    return `
                    <button onclick="${isFuture ? '' : `Habits.selectDate('${dateStr}')`}"
                            class="flex flex-col items-center px-3 py-2 rounded-xl border transition-all shrink-0 min-w-[52px] ${cls}">
                        <span class="text-[9px] font-black uppercase tracking-widest mb-0.5 ${isToday && !isSelected ? 'text-violet-400' : isSelected ? 'text-violet-200' : ''}">
                            ${isToday ? 'OGGI' : dayNames[d.getDay()]}
                        </span>
                        <span class="text-lg font-black leading-none">${d.getDate()}</span>
                        <div class="flex gap-0.5 mt-1.5 h-1">
                            ${!isFuture && dayApp.length > 0
                                ? dayApp.slice(0, 5).map(h =>
                                    `<div class="w-1 h-1 rounded-full" style="background:${this.isCompleted(h.id, dateStr) ? h.color : (isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)')}"></div>`
                                  ).join('')
                                : '<div class="w-1 h-1"></div>'}
                        </div>
                    </button>`;
                }).join('')}
            </div>

            <!-- Progress bar -->
            ${total > 0 ? `
                <div class="mb-5 md:mb-7">
                    <div class="flex items-center justify-between mb-1.5">
                        <span class="text-xs font-bold text-slate-500">Progresso giornaliero</span>
                        <span class="text-xs font-black ${pct === 100 ? 'text-emerald-400' : 'text-violet-400'}">${pct}%</span>
                    </div>
                    <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-gradient-to-r from-violet-500 to-indigo-400'}"
                             style="width:${pct}%"></div>
                    </div>
                </div>
            ` : ''}

            <!-- Habits grid -->
            ${this.habits.length === 0
                ? `<div class="flex flex-col items-center justify-center py-24 text-center">
                       <div class="text-6xl mb-4">🌱</div>
                       <h3 class="text-xl font-bold text-slate-300 mb-2">Nessuna habit ancora</h3>
                       <p class="text-slate-500 text-sm mb-6">Inizia con una piccola abitudine quotidiana</p>
                       <button onclick="Habits.showAddModal()" class="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all active:scale-95">
                           + Aggiungi Habit
                       </button>
                   </div>`
                : applicable.length === 0
                    ? `<div class="flex flex-col items-center justify-center py-16 text-center">
                           <div class="text-5xl mb-3">😌</div>
                           <h3 class="text-lg font-bold text-slate-400 mb-1">Giorno libero</h3>
                           <p class="text-slate-600 text-sm">Nessuna habit prevista per questo giorno</p>
                       </div>`
                    : `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                           ${applicable.map(h => this._renderCard(h, sel)).join('')}
                       </div>`
            }
        </div>`;
    },

    _renderCard(habit, dateStr) {
        const done     = this.isCompleted(habit.id, dateStr);
        const streak   = this.getStreak(habit.id);
        const isFuture = dateStr > this._today();
        const dayLabels = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
        const scheduleLabel = (!habit.days || habit.days.length === 0)
            ? 'Ogni giorno'
            : habit.days.map(i => dayLabels[i]).join(', ');

        // Last 7 applicable days for the mini strip
        const stripDays = [];
        for (let i = 90; i >= 0 && stripDays.length < 7; i--) {
            const d = this._addDays(this._today(), -i);
            if (this._appliesToDate(habit, d)) stripDays.push(d);
        }

        return `
        <div class="relative rounded-2xl border overflow-hidden transition-all group"
             style="background:${habit.color}${done ? '16' : '0a'}; border-color:${habit.color}${done ? '55' : '25'};">

            ${done ? `<div class="absolute top-0 left-0 right-0 h-0.5" style="background:linear-gradient(to right,${habit.color},${habit.color}44)"></div>` : ''}

            <div class="p-4 md:p-5">
                <!-- Header row -->
                <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                             style="background:${habit.color}20; border:1px solid ${habit.color}40;">
                            ${habit.icon}
                        </div>
                        <div class="min-w-0">
                            <h4 class="font-bold text-white text-sm md:text-base leading-tight truncate">${Helpers.escapeHtml(habit.name)}</h4>
                            <div class="flex items-center gap-2 mt-0.5">
                                ${streak > 0
                                    ? `<p class="text-xs font-bold" style="color:${habit.color}">🔥 ${streak} ${streak === 1 ? 'giorno' : 'giorni'}</p>`
                                    : `<p class="text-[11px] text-slate-600">Inizia oggi!</p>`
                                }
                                <span class="text-[10px] text-slate-600">·</span>
                                <p class="text-[10px] text-slate-600 truncate">${scheduleLabel}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Toggle -->
                    ${!isFuture ? `
                        <button onclick="Habits.toggleEntry('${habit.id}','${dateStr}')"
                                class="shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${done ? 'text-white' : 'text-transparent hover:text-white/30'}"
                                style="${done
                                    ? `background:${habit.color};border-color:${habit.color};box-shadow:0 0 12px ${habit.color}50`
                                    : `border-color:${habit.color}50`}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                            </svg>
                        </button>
                    ` : `<div class="shrink-0 w-9 h-9 rounded-full border-2 border-slate-700/20"></div>`}
                </div>

                <!-- Applicable days strip -->
                <div class="flex gap-1">
                    ${stripDays.map(d => `
                        <div class="flex-1 h-1.5 rounded-full"
                             style="background:${this.isCompleted(habit.id, d) ? habit.color : habit.color + '15'}"></div>
                    `).join('')}
                </div>
            </div>

            <!-- Edit button (hover) -->
            <button onclick="event.stopPropagation(); Habits.showEditModal('${habit.id}')"
                    class="absolute bottom-3 right-3 w-6 h-6 rounded-lg bg-slate-900/60 text-slate-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
        </div>`;
    },

    // ── Modals ────────────────────────────────────────────────────────────────

    showAddModal()    { this._openModal(null); },
    showEditModal(id) { this._openModal(this.habits.find(h => h.id === id)); },
    closeModal()      { document.getElementById('habitsModal')?.remove(); },

    // Called by the day-picker buttons inside the modal
    _toggleModalDay(idx) {
        const input = document.getElementById('habitDaysVal');
        let days = JSON.parse(input.value || '[]');
        if (days.length === 0) {
            // Was "every day" → switch to just this one day
            days = [idx];
        } else if (days.includes(idx)) {
            days = days.filter(d => d !== idx);
            // If none left → back to every day
        } else {
            days.push(idx);
            days.sort();
        }
        input.value = JSON.stringify(days);
        // Update button styles
        document.querySelectorAll('#habitDaysPicker button[data-day]').forEach(btn => {
            const d = parseInt(btn.dataset.day);
            const active = days.length === 0 || days.includes(d);
            btn.style.background = active ? btn.dataset.color : '';
            btn.style.color      = active ? '#fff' : '';
            btn.style.borderColor = active ? btn.dataset.color : '';
            btn.style.opacity     = active ? '1' : '0.35';
        });
        document.getElementById('habitDaysLabel').textContent = this._daysLabel(days);
    },

    _setAllDays() {
        document.getElementById('habitDaysVal').value = '[]';
        const color = document.getElementById('habitColorVal')?.value || '#6366f1';
        document.querySelectorAll('#habitDaysPicker button[data-day]').forEach(btn => {
            btn.style.background  = color;
            btn.style.color       = '#fff';
            btn.style.borderColor = color;
            btn.style.opacity     = '1';
        });
        document.getElementById('habitDaysLabel').textContent = 'Ogni giorno';
    },

    _daysLabel(days) {
        if (!days || days.length === 0) return 'Ogni giorno';
        const labels = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
        if (days.length === 5 && !days.includes(5) && !days.includes(6)) return 'Giorni feriali';
        if (days.length === 2 && days.includes(5) && days.includes(6)) return 'Weekend';
        return days.map(i => labels[i]).join(', ');
    },

    _openModal(habit) {
        const isEdit   = !!habit;
        const icons    = ['💧','📚','🏃','🧘','💪','🥗','😴','✍️','🎯','🎸','🌿','🧹','💊','🚴','🤸','🧠','🫁','🌅','🥤','🎨'];
        const colors   = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#3b82f6','#f97316','#14b8a6','#ec4899','#84cc16'];
        const selIcon  = habit?.icon  || '⭐';
        const selColor = habit?.color || colors[0];
        const selDays  = habit?.days  || [];
        const dayNames = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];

        document.getElementById('habitsModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
        <div id="habitsModal"
             class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center z-50 animate-fadeIn"
             onclick="if(event.target===this)Habits.closeModal()">
            <div class="bg-slate-900 w-full md:max-w-md md:mx-4 rounded-t-2xl md:rounded-2xl border-0 md:border border-slate-700 shadow-2xl animate-slideUp overflow-y-auto max-h-[92vh]">

                <!-- Header -->
                <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                    <h3 class="text-lg font-black text-white">${isEdit ? 'Modifica Habit' : 'Nuova Habit'}</h3>
                    <button onclick="Habits.closeModal()"
                            class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm">✕</button>
                </div>

                <div class="p-5 space-y-5">

                    <!-- Name -->
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome</label>
                        <input id="habitName" type="text" value="${Helpers.escapeHtml(habit?.name || '')}"
                               placeholder="Es. Corsa mattutina, Leggi 20 min…"
                               class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500 focus:outline-none placeholder-slate-600">
                    </div>

                    <!-- Days picker -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giorni</label>
                            <span id="habitDaysLabel" class="text-xs font-bold text-violet-400">${this._daysLabel(selDays)}</span>
                        </div>
                        <div class="flex gap-1.5 mb-2" id="habitDaysPicker">
                            ${dayNames.map((name, i) => {
                                const active = selDays.length === 0 || selDays.includes(i);
                                return `<button type="button"
                                                data-day="${i}"
                                                data-color="${selColor}"
                                                onclick="Habits._toggleModalDay(${i})"
                                                class="flex-1 py-2 rounded-xl text-[11px] font-black border border-slate-700 transition-all"
                                                style="background:${active ? selColor : ''}; color:${active ? '#fff' : ''}; border-color:${active ? selColor : ''}; opacity:${active ? '1' : '0.35'}">
                                            ${name}
                                        </button>`;
                            }).join('')}
                        </div>
                        <button type="button" onclick="Habits._setAllDays()"
                                class="text-[10px] text-slate-500 hover:text-violet-400 font-bold transition-colors">
                            Seleziona tutti
                        </button>
                        <input type="hidden" id="habitDaysVal" value='${JSON.stringify(selDays)}'>
                    </div>

                    <!-- Icon picker -->
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Icona</label>
                        <div class="flex flex-wrap gap-1.5" id="habitIconPicker">
                            ${icons.map(ic => `
                                <button type="button"
                                        onclick="document.getElementById('habitIconVal').value='${ic}';
                                                 document.querySelectorAll('#habitIconPicker button').forEach(b=>b.classList.remove('ring-2','ring-violet-500','bg-violet-500/20'));
                                                 this.classList.add('ring-2','ring-violet-500','bg-violet-500/20')"
                                        class="w-10 h-10 rounded-xl text-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all ${ic === selIcon ? 'ring-2 ring-violet-500 bg-violet-500/20' : ''}">
                                    ${ic}
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="habitIconVal" value="${selIcon}">
                    </div>

                    <!-- Color picker -->
                    <div>
                        <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Colore</label>
                        <div class="flex flex-wrap gap-2" id="habitColorPicker">
                            ${colors.map(c => `
                                <button type="button"
                                        onclick="document.getElementById('habitColorVal').value='${c}';
                                                 document.querySelectorAll('#habitColorPicker button').forEach(b=>b.classList.remove('ring-2','ring-offset-2','ring-offset-slate-900','ring-white'));
                                                 this.classList.add('ring-2','ring-offset-2','ring-offset-slate-900','ring-white');
                                                 document.querySelectorAll('#habitDaysPicker button[data-day]').forEach(b=>{b.dataset.color='${c}'; if(parseFloat(b.style.opacity||1)>0.4){b.style.background='${c}';b.style.borderColor='${c}'}})"
                                        class="w-8 h-8 rounded-full transition-all ${c === selColor ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : ''}"
                                        style="background:${c}">
                                </button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="habitColorVal" value="${selColor}">
                    </div>
                </div>

                <!-- Footer -->
                <div class="px-5 pb-5 flex gap-3">
                    ${isEdit ? `
                        <button onclick="Habits.deleteHabit('${habit.id}')"
                                class="py-2.5 px-4 rounded-xl bg-slate-800 text-red-400 hover:bg-red-500/10 border border-red-500/20 font-bold text-sm transition-all">
                            Elimina
                        </button>
                    ` : ''}
                    <button onclick="Habits.saveHabit('${habit?.id || ''}')"
                            class="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98]">
                        ${isEdit ? 'Salva modifiche' : 'Aggiungi'}
                    </button>
                </div>
            </div>
        </div>`);

        setTimeout(() => document.getElementById('habitName')?.focus(), 100);
    },

    async saveHabit(id) {
        const name  = document.getElementById('habitName')?.value.trim();
        if (!name) { alert('Inserisci un nome per la habit'); return; }
        const icon  = document.getElementById('habitIconVal')?.value  || '⭐';
        const color = document.getElementById('habitColorVal')?.value || '#6366f1';
        const days  = JSON.parse(document.getElementById('habitDaysVal')?.value || '[]');

        try {
            if (id) {
                await CachedCRUD.updateHabit(id, { name, icon, color, days });
            } else {
                await CachedCRUD.createHabit({ name, icon, color, days });
            }
            this.closeModal();
            await this.init();
        } catch (e) { console.error('saveHabit error:', e); }
    },

    async deleteHabit(id) {
        if (!confirm('Eliminare questa habit e tutti i suoi progressi?')) return;
        try {
            await CachedCRUD.deleteHabit(id);
            this.closeModal();
            await this.init();
        } catch (e) { console.error('deleteHabit error:', e); }
    },

    // ── Dashboard Widgets ─────────────────────────────────────────────────────

    getWidgets() {
        return [
            {
                id: 'habits_today',
                name: 'Habits Oggi',
                description: 'Abitudini di oggi con stato completamento',
                size: { cols: 2, rows: 1 },
                render: () => this.renderWidgetToday()
            },
            {
                id: 'habits_streak',
                name: 'Streak Habits',
                description: 'Streak più lungo attivo',
                size: { cols: 1, rows: 1 },
                render: () => this.renderWidgetStreak()
            }
        ];
    },

    renderWidgetToday() {
        const today = this._today();
        const applicable = this.habits.filter(h => this._appliesToDate(h, today));
        const total = applicable.length;
        const done  = applicable.filter(h => this.isCompleted(h.id, today)).length;
        const pct   = total > 0 ? Math.round(done / total * 100) : 0;

        if (this.habits.length === 0) return `
            <div data-habits-widget="today"
                 class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/5 shadow-2xl flex flex-col items-center justify-center cursor-pointer hover:border-white/10 transition-all"
                 onclick="window.showSection('habits')">
                <div class="text-4xl mb-2">🌱</div>
                <p class="text-xs text-slate-500 font-medium text-center">Nessuna habit<br>ancora</p>
            </div>`;

        return `
        <div data-habits-widget="today"
             class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/5 shadow-2xl flex flex-col hover:border-white/10 transition-all">
            <!-- Header (cliccabile per navigare) -->
            <div class="flex items-center justify-between mb-3 cursor-pointer" onclick="window.showSection('habits')">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-0.5">HABITS</p>
                    <p class="font-black text-2xl text-white">${done}<span class="text-slate-500 text-lg font-bold"> / ${total}</span></p>
                </div>
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                     style="background:#6366f120; border:1px solid #6366f135;">🌿</div>
            </div>
            <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div class="h-full rounded-full transition-all duration-300" style="width:${pct}%; background:linear-gradient(to right,#8b5cf6,#6366f1)"></div>
            </div>
            <!-- Lista habit con toggle -->
            <div class="flex-1 space-y-1 overflow-hidden">
                ${applicable.slice(0, 5).map(h => {
                    const c = this.isCompleted(h.id, today);
                    return `
                    <div onclick="event.stopPropagation(); Habits.toggleFromWidget('${h.id}', '${today}')"
                         class="flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all group">
                        <div class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black border-2 transition-all ${c ? 'text-white' : 'text-transparent border-slate-600 group-hover:border-slate-500'}"
                             style="${c ? `background:${h.color}; border-color:${h.color}` : ''}">✓</div>
                        <span class="text-xs font-medium ${c ? 'text-slate-500 line-through' : 'text-slate-300'} truncate flex-1">${h.icon} ${Helpers.escapeHtml(h.name)}</span>
                        ${this.getStreak(h.id) > 0 ? `<span class="text-[10px] font-bold shrink-0" style="color:${h.color}">🔥${this.getStreak(h.id)}</span>` : ''}
                    </div>`;
                }).join('')}
                ${total > 5 ? `<p class="text-[10px] text-slate-600 pl-2 pt-0.5 cursor-pointer hover:text-slate-400" onclick="window.showSection('habits')">+${total - 5} altre →</p>` : ''}
            </div>
        </div>`;
    },

    renderWidgetStreak() {
        const bestStreak = this.habits.reduce((max, h) => Math.max(max, this.getStreak(h.id)), 0);
        const topHabit   = this.habits.find(h => this.getStreak(h.id) === bestStreak && bestStreak > 0);

        return `
        <div class="h-full bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-5 border border-white/5 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-white/10 transition-all" onclick="window.showSection('habits')">
            <div class="flex items-center justify-between">
                <p class="text-[10px] font-black uppercase tracking-widest text-amber-400">STREAK</p>
                <span class="text-2xl">🔥</span>
            </div>
            <div>
                <p class="text-5xl font-black text-white leading-none mb-1">${bestStreak}</p>
                <p class="text-xs text-slate-500">
                    ${bestStreak === 1 ? 'giorno' : 'giorni'}${topHabit ? ` · ${topHabit.icon} ${Helpers.escapeHtml(topHabit.name)}` : bestStreak === 0 ? ' · Inizia oggi!' : ''}
                </p>
            </div>
        </div>`;
    },

    // ── AgendaBridge ──────────────────────────────────────────────────────────

    async getAgendaEvents(fromStr, toStr) {
        try {
            if (!this.habits.length) await this.loadData();
            const entries = await HabitCRUD.getEntries(fromStr, toStr);

            const events = [];
            const from = new Date(fromStr + 'T12:00:00');
            const to   = new Date(toStr   + 'T12:00:00');

            for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                for (const habit of this.habits) {
                    if (!this._appliesToDate(habit, dateStr)) continue;
                    const done = entries.some(e => e.habit_id === habit.id && e.entry_date === dateStr);
                    if (!done) continue; // only log completed habits in agenda
                    events.push({
                        id: `ext_habit_${habit.id}_${dateStr}`,
                        _isExternal: true,
                        moduleId: 'habits',
                        moduleLabel: 'Habits',
                        date: dateStr,
                        time: null,
                        title: habit.name,
                        subtitle: '✓ Completata',
                        color: habit.color,
                        icon: habit.icon,
                        onNavigate: `window.showSection('habits'); setTimeout(()=>Habits.selectDate('${dateStr}'),200)`,
                    });
                }
            }
            return events;
        } catch (e) {
            console.error('AgendaBridge [habits]:', e);
            return [];
        }
    }
};

window.Habits = Habits;

if (window.ModuleManager) {
    ModuleManager.register({
        id: 'habits',
        name: 'Habits',
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        category: 'growth',
        order: 30,
        init:    () => Habits.init(),
        render:  () => Habits.render(),
        widgets: Habits.getWidgets()
    });
}

if (window.AgendaBridge) {
    AgendaBridge.register({
        id: 'habits',
        label: 'Habits',
        color: '#8b5cf6',
        icon: '🌿',
        getEvents: (from, to) => Habits.getAgendaEvents(from, to)
    });
}
