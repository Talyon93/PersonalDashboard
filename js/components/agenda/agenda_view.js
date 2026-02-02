/**
 * Agenda Views - VIEW LOGIC (Visual Update)
 * - FULL VERTICAL FIT (RESTORED): Ripristinato layout adattivo 100% altezza (calc 100vh-290px)
 * - PERCENTAGE ROWS: Le righe ora si adattano allo spazio disponibile
 * - IMPORT MODAL: Mantenuto il template del modale
 * - DESIGN: Professional Dark + Font Maggiorati
 */

const AgendaViews = {

    // Helper per data locale YYYY-MM-DD (evita shift UTC di toISOString)
    _iso(date) { 
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    },

    // Helper per estrarre ora/minuti "grezzi" dalla stringa ISO, ignorando il fuso orario
    _parseTime(isoString) {
        if (!isoString) return { h: 0, m: 0 };
        // Formato atteso: YYYY-MM-DDTHH:mm:ss
        const timePart = isoString.split('T')[1]; 
        if (!timePart) return { h: 0, m: 0 };
        const [h, m] = timePart.split(':').map(Number);
        return { h, m };
    },

    // Calcola numero slot orari totali
    _getSlotCount(config) {
        return config.endHour - config.startHour + 1;
    },

    // --- ALGORITMO SMART LAYOUT ---
    _layoutTasks(tasks) {
        // 1. Ordina
        const sorted = [...tasks].sort((a, b) => {
            const timeA = this._parseTime(a.date);
            const timeB = this._parseTime(b.date);
            const startA = timeA.h * 60 + timeA.m;
            const startB = timeB.h * 60 + timeB.m;
            if (startA !== startB) return startA - startB;
            return (b.duration || 60) - (a.duration || 60);
        });

        // 2. Cluster
        const clusters = [];
        if (sorted.length > 0) {
            let currentCluster = { tasks: [sorted[0]], end: this._getEndTimeVal(sorted[0]) };
            clusters.push(currentCluster);

            for (let i = 1; i < sorted.length; i++) {
                const t = sorted[i];
                const tStartVal = this._getStartTimeVal(t);
                const tEndVal = this._getEndTimeVal(t);

                if (tStartVal < currentCluster.end) {
                    currentCluster.tasks.push(t);
                    currentCluster.end = Math.max(currentCluster.end, tEndVal);
                } else {
                    currentCluster = { tasks: [t], end: tEndVal };
                    clusters.push(currentCluster);
                }
            }
        }

        // 3. Colonne
        const finalTasks = [];
        clusters.forEach(cluster => {
            const columns = [];
            cluster.tasks.forEach(t => {
                const tStartVal = this._getStartTimeVal(t);
                let placed = false;
                for (let i = 0; i < columns.length; i++) {
                    const lastInCol = columns[i][columns[i].length - 1];
                    if (tStartVal >= this._getEndTimeVal(lastInCol)) {
                        columns[i].push(t);
                        t._col = i;
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    columns.push([t]);
                    t._col = columns.length - 1;
                }
            });

            const widthPct = 100 / columns.length;
            cluster.tasks.forEach(t => {
                t._left = t._col * widthPct;
                t._width = widthPct;
                finalTasks.push(t);
            });
        });

        return finalTasks;
    },

    _getStartTimeVal(t) {
        const { h, m } = this._parseTime(t.date);
        return h * 60 + m;
    },

    _getEndTimeVal(t) {
        return this._getStartTimeVal(t) + (t.duration || 60);
    },

    // ============================================================
    //  TEMPLATE MODALE IMPORTAZIONE
    // ============================================================
    renderImportModal() {
        return `
            <div id="import-modal" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[120] animate-fadeIn p-4">
                <div class="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-sm w-full flex flex-col items-center text-center">
                    <div class="text-5xl mb-6 animate-bounce">📥</div>
                    <h3 class="text-xl font-black text-white mb-2 uppercase tracking-wide">Importazione...</h3>
                    <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6" id="import-status-text">Analisi file in corso</p>
                    
                    <div class="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700 shadow-inner">
                        <div id="import-progress-bar" class="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-0 transition-all duration-200 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    </div>
                    <p class="mt-4 text-[10px] text-slate-500 font-mono" id="import-count-text">0 / 0</p>
                </div>
            </div>`;
    },

    // ============================================================
    //  1. VISTA GIORNO (FIT VERTICALE RESTORED)
    // ============================================================
    renderDay(tasks, notes, currentDate, config) {
        const dateStr = this._iso(currentDate);
        const dayTasks = tasks.filter(t => t.date.startsWith(dateStr));
        const dayNotes = notes.filter(n => n.date === dateStr);
        const isToday = dateStr === this._iso(new Date());
        
        // Calcolo altezza righe in % (Vertical Fit Logic)
        const slotCount = this._getSlotCount(config);
        const rowHeightPct = 100 / slotCount;

        return `
            <div class="flex flex-col h-[calc(100vh-290px)] gap-2 min-h-[400px]">
                <!-- Compact Header -->
                <div class="bg-[#1e293b] rounded-2xl p-2 border border-slate-700/50 flex items-center gap-3 shadow-lg shrink-0 overflow-x-auto custom-scrollbar min-h-[50px]">
                    <button onclick="Agenda.showAddModal({date:'${dateStr}'}, 'note')" class="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest border border-dashed border-slate-600 transition-all flex items-center gap-2 h-8">
                        <span>＋</span> Nota
                    </button>
                    ${dayNotes.map(n => `
                        <div onclick="Agenda.editNote('${n.id}')" class="shrink-0 bg-[#fef9c3] hover:bg-yellow-200 text-yellow-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-all border-l-2 border-yellow-500 max-w-[250px] truncate flex items-center gap-2 h-8">
                            <span>📝</span> ${Helpers.escapeHtml(n.content)}
                        </div>
                    `).join('')}
                    ${dayNotes.length === 0 ? '<span class="text-slate-600 text-[10px] italic pl-2">Nessuna nota</span>' : ''}
                </div>

                <div class="flex-1 bg-[#0f172a] rounded-[2.5rem] border border-slate-800 relative overflow-hidden flex flex-col shadow-2xl">
                    <div class="flex-1 relative h-full">
                        ${this._renderTimeMarker(config, isToday, rowHeightPct, true)}
                        ${this._renderDayRows(dayTasks, currentDate, config, rowHeightPct)}
                    </div>
                </div>
            </div>`;
    },

    _renderDayRows(tasks, currentDate, config, rowHeightPct) {
        let html = '<div class="h-full flex flex-col">';
        // Griglia con altezze in %
        for (let h = config.startHour; h <= config.endHour; h++) {
            html += `
                <div class="flex border-b border-slate-800/60 relative group w-full" style="height: ${rowHeightPct}%;">
                    <div class="w-16 shrink-0 flex justify-end pr-4 items-start pt-1 border-r border-slate-800/60 bg-[#162032]">
                        <span class="text-xs font-bold text-slate-500 transform -translate-y-1/2">${h}:00</span>
                    </div>
                    <div class="flex-1 relative hover:bg-white/[0.02] transition-colors cursor-crosshair" 
                         onclick="Agenda.showAddModalWithDate('${this._iso(currentDate)}', '${String(h).padStart(2,'0')}:00')">
                        <div class="absolute w-full top-1/2 border-t border-slate-800/40 border-dashed pointer-events-none"></div>
                    </div>
                </div>`;
        }
        html += '</div>';
        
        const layoutTasks = this._layoutTasks(tasks);

        html += `<div class="absolute inset-0 left-16 right-4 pointer-events-none">`;
        layoutTasks.forEach(t => {
            const { h } = this._parseTime(t.date); 
            if (h < config.startHour || h > config.endHour) return;
            // Passiamo true per usare la logica %
            html += this._renderTimelineTask(t, config, rowHeightPct, true);
        });
        html += `</div>`;

        return html;
    },

    // ============================================================
    //  2. VISTA SETTIMANA (FIT VERTICALE RESTORED)
    // ============================================================
    renderWeek(tasks, notes, currentDate, config) {
        const startOfWeek = this._getStartOfWeek(currentDate);
        const weekDays = Array.from({length: 7}, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });

        const colWidthClass = "grid-cols-[50px_repeat(7,1fr)]"; 

        return `
            <div class="flex flex-col h-[calc(100vh-290px)] min-h-[400px] bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                <div class="grid ${colWidthClass} border-b border-slate-800 bg-[#1e293b] divide-x divide-slate-800 shrink-0 z-30 shadow-lg">
                    <div class="p-2 flex items-center justify-center bg-[#162032]">
                        <span class="text-[9px] font-black text-slate-500 uppercase">ORA</span>
                    </div>
                    ${weekDays.map(d => {
                        const isToday = this._iso(d) === this._iso(new Date());
                        return `
                            <div class="py-2 text-center group cursor-pointer hover:bg-slate-700/50 transition-colors" onclick="Agenda.showDayModal('${this._iso(d)}')">
                                <div class="text-[9px] font-black uppercase tracking-widest mb-0.5 ${isToday ? 'text-indigo-400' : 'text-slate-500'}">${d.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                                <div class="w-7 h-7 mx-auto flex items-center justify-center rounded-lg text-sm font-bold transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-300 group-hover:bg-slate-700'}">${d.getDate()}</div>
                            </div>`;
                    }).join('')}
                </div>

                <div class="grid ${colWidthClass} bg-[#162032] border-b border-slate-800 divide-x divide-slate-800 shrink-0 min-h-[30px]">
                    <div class="p-1 flex items-center justify-center border-r border-slate-800 bg-[#131b2c]">
                        <span class="text-[8px] font-bold text-slate-600 uppercase -rotate-90">Note</span>
                    </div>
                    ${weekDays.map(d => {
                        const dateStr = this._iso(d);
                        const dayNotes = notes.filter(n => n.date === dateStr);
                        return `
                            <div class="p-1 flex flex-col gap-1 min-h-[40px] relative group hover:bg-slate-800/30 transition-colors" onclick="Agenda.showAddModal({date:'${dateStr}'}, 'note')">
                                ${dayNotes.length > 0 ? dayNotes.map(n => `
                                    <div onclick="event.stopPropagation(); Agenda.editNote('${n.id}')" 
                                         class="bg-[#fef9c3] text-yellow-900 text-[9px] p-1 rounded shadow-sm border-l-2 border-yellow-500 cursor-pointer hover:scale-[1.02] transition-transform font-medium truncate" 
                                         title="${Helpers.escapeHtml(n.content)}">
                                        📝 ${Helpers.escapeHtml(n.content)}
                                    </div>
                                `).join('') : 
                                `<div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span class="text-slate-600 text-md">＋</span>
                                </div>`}
                            </div>`;
                    }).join('')}
                </div>
                
                <div class="flex-1 relative bg-[#0f172a] h-full overflow-hidden">
                     ${this._renderWeekGrid(weekDays, tasks, config, colWidthClass)}
                </div>
            </div>`;
    },

    _renderWeekGrid(days, tasks, config, colWidthClass) {
        // Vertical Fit Logic (%)
        const slotCount = this._getSlotCount(config);
        const rowHeightPct = 100 / slotCount;
        
        let html = `<div class="grid ${colWidthClass} divide-x divide-slate-800 relative h-full">`;
        
        // Colonna Orari
        html += '<div class="bg-[#162032] text-slate-500 font-bold text-[11px] text-right divide-y divide-slate-800 border-r border-slate-800 h-full flex flex-col">';
        for (let h = config.startHour; h <= config.endHour; h++) {
            html += `<div style="height: ${rowHeightPct}%" class="pr-2 pt-1 relative border-b border-slate-800/50"><span class="-mt-2 block transform -translate-y-1/2">${h}:00</span></div>`;
        }
        html += '</div>';

        // Giorni
        days.forEach(day => {
            const dateStr = this._iso(day);
            const isToday = dateStr === this._iso(new Date());
            const dayTasks = tasks.filter(t => t.date.startsWith(dateStr));
            
            html += `<div class="relative bg-transparent group h-full flex flex-col">`; 
            
            // Grid Rows (Background)
            for (let h = config.startHour; h <= config.endHour; h++) {
                html += `
                    <div style="height: ${rowHeightPct}%" 
                         class="w-full border-b border-slate-800/40 hover:bg-white/[0.02] transition-colors" 
                         onclick="Agenda.showAddModalWithDate('${dateStr}', '${String(h).padStart(2,'0')}:00')">
                    </div>`;
            }
            
            if (isToday) {
                // Time Marker logic for %
                html += this._renderTimeMarker(config, true, rowHeightPct, true);
            }

            const layoutTasks = this._layoutTasks(dayTasks);

            layoutTasks.forEach(t => {
                if (!config.showCompleted && t.completed) return;
                const { h } = this._parseTime(t.date);
                if (h < config.startHour || h > config.endHour) return;

                // Render with Percentage logic
                html += this._renderTimelineTask(t, config, rowHeightPct, true);
            });
            html += `</div>`; 
        });
        
        return html + '</div>';
    },

    _renderTimelineTask(t, config, rowHeight, isPercent = false) {
        const { h, m } = this._parseTime(t.date);
        const duration = t.duration || 60;
        
        let topVal, heightVal, unit;
        
        if (isPercent) {
            // Calcolo in percentuale
            const slotCount = this._getSlotCount(config);
            const totalMinutes = slotCount * 60; // Total minutes in view
            const startMinutes = config.startHour * 60;
            const taskStartMinutes = h * 60 + m;
            
            // Top % relative to container
            topVal = ((taskStartMinutes - startMinutes) / totalMinutes) * 100;
            // Height % relative to container
            heightVal = (duration / totalMinutes) * 100;
            unit = '%';
        } else {
            // Fallback pixel (non usato in questa versione ottimizzata)
            topVal = (h - config.startHour) * rowHeight + (m / 60) * rowHeight;
            heightVal = (duration / 60) * rowHeight;
            unit = 'px';
        }

        // --- STILE PROFESSIONALE (Dark + Linea Colorata) ---
        let baseClass = 'bg-slate-700 hover:bg-slate-600 border-amber-500 text-slate-200'; // Default
        
        if (t.priority === 'high') baseClass = 'bg-slate-700 hover:bg-slate-600 border-rose-500 text-slate-200';
        if (t.priority === 'low')  baseClass = 'bg-slate-700 hover:bg-slate-600 border-yellow-400 text-slate-200';
        
        if(t.completed) baseClass = 'bg-slate-800 border-slate-600 text-slate-500 grayscale opacity-80';

        const positionStyle = `top: ${topVal}${unit}; height: ${heightVal}${unit}; left: ${t._left}%; width: ${t._width}%; min-height: 20px;`;

        return `
            <div onclick="event.stopPropagation(); Agenda.editTask('${t.id}')" 
                 class="pointer-events-auto absolute rounded-r-lg rounded-l-sm p-1 md:p-2 border-l-[4px] shadow-lg cursor-pointer transition-all hover:scale-[1.01] hover:z-50 group/task overflow-hidden z-10 mx-0.5 ${baseClass}"
                 style="${positionStyle}">
                
                <div class="flex flex-col h-full justify-between">
                    <div>
                        <div class="flex items-center justify-between text-[9px] font-black uppercase opacity-70 tracking-wider mb-0.5">
                            <span class="truncate">${Helpers.formatDate(t.date, 'time')} - ${this._calcEndTimeStr(h, m, duration)}</span>
                            ${t.location ? `<span class="flex items-center gap-1 shrink-0"><span class="text-[9px]">📍</span></span>` : ''}
                        </div>
                        <div class="font-bold text-base leading-tight truncate drop-shadow-sm">${Helpers.escapeHtml(t.title)}</div>
                    </div>
                    
                    ${t.description && heightVal > 5 ? `
                        <div class="text-[13px] font-medium opacity-80 line-clamp-1 mt-0.5 border-t border-slate-500/30 pt-0.5 truncate hidden md:block">
                            ${Helpers.escapeHtml(t.description)}
                        </div>` : ''}
                </div>
            </div>`;
    },

    _renderTimeMarker(config, isToday, rowHeight, isPercent = false) {
        if (!isToday) return '';
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour < config.startHour || currentHour > config.endHour) return '';

        let topVal, unit;
        if (isPercent) {
             const slotCount = this._getSlotCount(config);
             const totalMinutes = slotCount * 60;
             const startMinutes = config.startHour * 60;
             const nowMinutes = currentHour * 60 + now.getMinutes();
             topVal = ((nowMinutes - startMinutes) / totalMinutes) * 100;
             unit = '%';
        } else {
            topVal = ((currentHour - config.startHour) * rowHeight) + ((now.getMinutes() / 60) * rowHeight);
            unit = 'px';
        }

        return `
            <div id="time-now-marker" class="absolute left-0 right-0 z-30 flex items-center pointer-events-none" style="top: ${topVal}${unit};">
                ${!isPercent ? `<div class="w-16 text-right pr-4 text-[10px] font-black text-rose-500 bg-[#0f172a] inline-block z-10">${currentHour}:${String(now.getMinutes()).padStart(2,'0')}</div>` : ''}
                <div class="w-2 h-2 bg-rose-500 rounded-full ${isPercent ? '-ml-1' : '-ml-1.5'} shadow-[0_0_10px_rgba(244,63,94,1)] z-20 border-2 border-[#0f172a]"></div>
                <div class="h-[2px] w-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
            </div>`;
    },

    _getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    // Fixed end time calculator using raw values
    _calcEndTimeStr(startH, startM, duration) {
        const totalM = startH * 60 + startM + duration;
        const endH = Math.floor(totalM / 60) % 24;
        const endM = totalM % 60;
        return `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
    },

    // ============================================================
    //  3. VISTA MESE (FIT VERTICALE RESTORED)
    // ============================================================
    renderMonth(tasks, notes, currentDate, config) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = (firstDay === 0 ? 6 : firstDay - 1); 
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // MOD: overflow-hidden sul container e min-h-0 sulla griglia
        let html = `
            <div class="bg-[#0f172a] rounded-[2.5rem] p-4 md:p-6 border border-slate-800 shadow-2xl h-[calc(100vh-290px)] min-h-[400px] animate-fadeIn flex flex-col overflow-hidden">
                <div class="grid grid-cols-7 gap-1 mb-1 bg-[#1e293b] p-1 rounded-2xl border border-slate-800 shrink-0">
                    ${['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => `
                        <div class="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] py-1">${d}</div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-7 gap-1 flex-1 auto-rows-fr min-h-0">
        `;

        for (let i = 0; i < startOffset; i++) html += '<div class="bg-slate-800/10 rounded-2xl"></div>';

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === this._iso(new Date());
            
            const dayTasks = tasks.filter(t => t.date.startsWith(dateStr));
            const dayNotes = notes.filter(n => n.date === dateStr);
            const displayTasks = config.showCompleted ? dayTasks : dayTasks.filter(t => !t.completed);
            
            html += `
                <div onclick="Agenda.showDayModal('${dateStr}')" 
                     class="group relative p-1 rounded-xl border transition-all cursor-pointer flex flex-col gap-0.5 overflow-hidden hover:scale-[1.02] hover:z-10 min-h-0
                            ${isToday ? 'bg-[#1e293b] border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500' : 'bg-[#162032] border-slate-800 hover:bg-[#1e293b] hover:border-slate-600'}">
                    <div class="flex justify-between items-center mb-0.5 px-1 shrink-0">
                        <span class="text-sm font-black ${isToday ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}">${day}</span>
                        ${dayNotes.length > 0 ? `<span class="text-[9px]" title="Note presenti">📝</span>` : ''}
                    </div>
                    
                    <div class="flex-1 flex flex-col gap-0.5 overflow-hidden">
                        ${displayTasks.slice(0, 4).map(t => {
                             let bg = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                             if (t.priority === 'high') bg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                             if (t.priority === 'low') bg = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                             
                             return `<div class="px-1.5 py-0.5 rounded-md ${bg} border truncate text-[9px] font-bold shrink-0">${t.title}</div>`;
                        }).join('')}
                        ${displayTasks.length > 4 ? `<div class="text-[9px] text-center text-slate-500 font-bold mt-auto shrink-0">+${displayTasks.length - 4}</div>` : ''}
                    </div>
                </div>`;
        }
        return html + '</div></div>';
    },

    renderYear(tasks, notes, currentDate) {
        const year = currentDate.getFullYear();
        const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn pb-10">
                ${months.map((mName, mIdx) => {
                    const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
                    const startDay = (new Date(year, mIdx, 1).getDay() + 6) % 7;
                    let daysHtml = '';
                    for(let i=0; i<startDay; i++) daysHtml += `<div class="aspect-square"></div>`;
                    for(let d=1; d<=daysInMonth; d++) {
                        const dateStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const count = tasks.filter(t => t.date.startsWith(dateStr) && !t.completed).length;
                        const hasNote = notes.some(n => n.date === dateStr);
                        
                        let style = 'text-slate-600 hover:text-white';
                        if (hasNote) style = 'bg-yellow-900/40 text-yellow-500 border border-yellow-700/30';
                        if (count > 0) style = 'bg-indigo-900/40 text-indigo-300 border border-indigo-500/30';
                        if (count > 2) style = 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40';
                        
                        daysHtml += `<div onclick="Agenda.showDayModal('${dateStr}')" class="aspect-square rounded-lg flex items-center justify-center text-[9px] font-bold cursor-pointer hover:bg-slate-700 transition-colors ${style}">${d}</div>`;
                    }
                    return `
                        <div class="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-colors">
                            <h4 class="text-white font-bold mb-3 pl-1 text-sm uppercase tracking-widest text-center border-b border-slate-800 pb-2">${mName}</h4>
                            <div class="grid grid-cols-7 gap-1">
                                ${['L','M','M','G','V','S','D'].map(l => `<div class="text-[8px] text-slate-600 text-center font-black">${l}</div>`).join('')}
                                ${daysHtml}
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    },

    renderList(tasks, notes, currentDate, config) {
        // Filtra task e note in base al mese/anno di currentDate
        const targetMonth = currentDate.getMonth();
        const targetYear = currentDate.getFullYear();

        const isInTargetMonth = (dateStr) => {
            const d = new Date(dateStr);
            return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
        };

        let filteredTasks = config.showCompleted ? tasks : tasks.filter(t => !t.completed);
        filteredTasks = filteredTasks.filter(t => isInTargetMonth(t.date));
        
        const filteredNotes = notes.filter(n => isInTargetMonth(n.date));

        const uniqueDates = new Set([...filteredTasks.map(t => t.date.split('T')[0]), ...filteredNotes.map(n => n.date)]);
        const sortedDates = Array.from(uniqueDates).sort();

        if (sortedDates.length === 0) return `<div class="bg-[#0f172a] rounded-[2.5rem] p-20 text-center border border-slate-800 text-slate-500 italic">Nessuna attività per ${currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}</div>`;

        let html = '<div class="space-y-8 max-w-5xl mx-auto">';
        sortedDates.forEach(dateStr => {
            const dateObj = new Date(dateStr);
            const dayTasks = filteredTasks.filter(t => t.date.startsWith(dateStr));
            const dayNotes = filteredNotes.filter(n => n.date === dateStr);

            html += `
                <div class="animate-fadeIn bg-[#162032] rounded-3xl p-6 border border-slate-800 shadow-lg">
                    <div class="flex items-center gap-4 mb-4 border-b border-slate-700/50 pb-3">
                        <div class="text-2xl font-black text-indigo-400">${dateObj.getDate()}</div>
                        <div class="text-sm font-bold text-slate-300 uppercase tracking-widest">${dateObj.toLocaleDateString('it-IT', { month: 'long', weekday: 'long' })}</div>
                    </div>
                    
                    ${dayNotes.map(n => `<div class="bg-yellow-500/10 border-l-4 border-yellow-500 p-3 mb-2 rounded-r-lg text-yellow-200 text-sm italic">📝 ${Helpers.escapeHtml(n.content)}</div>`).join('')}
                    
                    <div class="space-y-2">
                        ${dayTasks.map(t => `
                            <div class="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer" onclick="Agenda.editTask('${t.id}')">
                                <span class="text-xs font-black text-slate-400 bg-slate-900 px-2 py-1 rounded">${Helpers.formatDate(t.date, 'time')}</span>
                                <span class="font-bold text-slate-200">${Helpers.escapeHtml(t.title)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        });
        return html + '</div>';
    }
};

window.AgendaViews = AgendaViews;