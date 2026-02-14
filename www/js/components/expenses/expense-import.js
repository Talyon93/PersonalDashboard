/**
 * Expense Import Module - V4.4 Excel Range Fix 🔧
 * Fix: Ricalcola forzatamente il range dei file Excel per trovare righe nascoste.
 * Fix: Mantiene il parser CSV robusto per i file di testo.
 */
const ExpenseImport = {
    // --- CATEGORIE (Invariato) ---
    categoryKeywords: {
        shopping: ['coop', 'conad', 'lidl', 'esselunga', 'carrefour', 'spesa', 'market', 'eurospin', 'iper', 'decathlon', 'zara', 'h&m', 'amazon', 'aliexpress', 'temu', 'tigota', 'acqua e sapone'],
        food: ['mcdonald', 'glovo', 'deliveroo', 'just eat', 'ristorante', 'pizzeria', 'burger', 'sushi', 'cafe', 'bar ', 'starbucks', 'autogrill', 'poke', 'kfc', 'old wild west'],
        transport: ['benzina', 'q8', 'eni', 'ip ', 'tamoil', 'autostrade', 'telepass', 'trenitalia', 'italo', 'uber', 'taxi', 'parcheggio', 'bird', 'lime', 'atm', 'atac'],
        entertainment: ['netflix', 'spotify', 'cinema', 'the space', 'uci', 'prime video', 'disney', 'ticketone', 'steam', 'playstation', 'nintendo', 'audible'],
        utilities: ['enel', 'a2a', 'iren', 'luce', 'gas', 'acqua', 'internet', 'vodafone', 'tim', 'wind', 'iliad', 'fastweb', 'sorgenia', 'eon', 'telecom'],
        health: ['farmacia', 'dentista', 'medico', 'ospedale', 'visita', 'ticket sanitario', 'asl', 'cup', 'analisi'],
        salary: ['stipendio', 'emolumenti', 'bonifico a vostro favore', 'accredito', 'salary'],
        house: ['affitto', 'mutuo', 'condominio', 'ikea', 'leroy merlin', 'bricoman', 'tecnocasa']
    },
    
    headerKeywords: [
        'data', 'date', 'giorno', 'dt', 
        'importo', 'amount', 'euro', 'eur', 'valore',
        'descrizione', 'description', 'causale', 'dettagli', 'operazione', 'merchant', 
        'valuta', 'category', 'categoria', 'entrate', 'uscite', 'conto'
    ],

    // --- LOGICA PRINCIPALE ---

    async parseRawFile(file) {
        let rows = [];
        console.log(`🕵️‍♂️ FILE: ${file.name}`);

        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                rows = this.parseCSV_V2(text);
            } else {
                if (typeof XLSX === 'undefined') throw new Error('Libreria XLSX mancante');
                // Qui avviene la magia per i file Excel rotti
                rows = await this.parseExcel(file);
            }
        } catch (e) { console.error("❌ ERRORE LETTURA:", e); throw new Error("File illeggibile."); }

        if (!rows || rows.length < 2) throw new Error("File vuoto o troppo breve.");

        // 1. HEADER DETECTION
        const headerIndex = this.detectRealHeaderRow(rows);
        const headerRow = rows[headerIndex];
        
        // 2. ESTRAZIONE DATI
        let dataRows = rows.slice(headerIndex + 1);
        const originalCount = dataRows.length;

        // 3. FILTRO RIGHE VUOTE
        dataRows = dataRows.filter(r => r && r.length > 0 && r.some(c => c && String(c).trim().length > 0));
        
        const signature = headerRow.map(c => String(c).trim().toLowerCase()).join('|');

        console.log(`🧠 Header riga: ${headerIndex} | Righe Excel totali: ${rows.length} | Dati validi: ${dataRows.length}`);
        
        return { headers: headerRow, rows: dataRows, signature: signature };
    },

    detectRealHeaderRow(rows) {
        let bestScore = -1, bestIndex = 0;
        const limit = Math.min(rows.length, 50); 

        for (let i = 0; i < limit; i++) {
            if (!rows[i] || rows[i].length < 2) continue;
            const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
            let score = 0;
            this.headerKeywords.forEach(k => {
                if (rowStr.includes(k)) score += 1;
                rows[i].forEach(cell => { if (String(cell).toLowerCase().trim() === k) score += 5; });
            });
            if (/\d{4}-\d{2}-\d{2}/.test(rowStr) || /\d{2}\/\d{2}\/\d{4}/.test(rowStr)) score -= 5;
            if (/[\d]+[.,][\d]{2}/.test(rowStr)) score -= 2;

            if (score > bestScore) { bestScore = score; bestIndex = i; }
        }
        return bestScore > 0 ? bestIndex : 0;
    },

    async findConfig(sig) {
        const c = window.supabaseClient; 
        if (!c?.from) return null;
        try { const {data} = await c.from('import_configs').select('*').eq('header_signature', sig).single(); return data; } catch(e){return null;}
    },
    async saveConfig(name, sig, map) {
        const c = window.supabaseClient; 
        if (!c?.from) return null;
        try {
            const {data:{user}} = await c.auth.getUser();
            if(!user) return null;
            return await c.from('import_configs').insert([{user_id:user.id, bank_name:name, header_signature:sig, mapping_json:map}]);
        } catch(e){return null;}
    },

    // --- MAPPING ---
    applyMapping(rawRows, mapping, configName) {
        const expenses = [];
        const { dateIndex, amountIndex, descIndex, categoryIndex, amountMode, outflowIndex, inflowIndex } = mapping;

        let sourceTag = '#import';
        if (configName && configName.trim().length > 0) sourceTag = '#' + configName.replace(/[^a-zA-Z0-9]/g, '');

        rawRows.forEach((row, i) => {
            if (!row) return;

            const dateObj = this.parseDate(row[dateIndex]);
            if (!dateObj) return; 

            let amountVal = 0;
            let type = 'expense';

            if (amountIndex > -1) {
                let rawVal = this.parseNumber(row[amountIndex]);
                if (amountMode === 'inverted') {
                    if (rawVal > 0) { type = 'expense'; amountVal = rawVal; }
                    else { type = 'income'; amountVal = Math.abs(rawVal); }
                } else {
                    if (rawVal < 0) { type = 'expense'; amountVal = Math.abs(rawVal); }
                    else { type = 'income'; amountVal = rawVal; }
                }
            } else {
                const outVal = outflowIndex > -1 ? this.parseNumber(row[outflowIndex]) : 0;
                const inVal = inflowIndex > -1 ? this.parseNumber(row[inflowIndex]) : 0;
                if (outVal !== 0) { type = 'expense'; amountVal = Math.abs(outVal); }
                else if (inVal !== 0) { type = 'income'; amountVal = Math.abs(inVal); }
            }

            if (amountVal === 0) return;

            let description = row[descIndex] || 'Movimento';
            description = String(description).replace(/\s+/g, ' ').trim();

            let category = 'other';
            if (categoryIndex > -1 && row[categoryIndex]) category = this.normalizeCategory(row[categoryIndex]);
            if (category === 'other') category = this.guessCategory(description);
            
            if (type === 'income' && category === 'other') {
                 if (this.checkKeyword(description, this.categoryKeywords.salary)) category = 'salary';
                 else category = 'income_other';
            }

            expenses.push({
                id: Date.now() + Math.random() + i,
                date: dateObj,
                description: description,
                amount: parseFloat(amountVal.toFixed(2)),
                type: type,
                category: category,
                tags: [sourceTag]
            });
        });

        return expenses;
    },

    // --- HELPERS ---
    guessCategory(d) {
        if(!d) return 'other'; const l = d.toLowerCase();
        for(const [k,w] of Object.entries(this.categoryKeywords)) if(w.some(x=>l.includes(x))) return k;
        return 'other';
    },
    normalizeCategory(c) {
        if(!c) return 'other'; const s = String(c).toLowerCase();
        if(s.includes('alim')||s.includes('rist')||s.includes('cibo')) return 'food';
        if(s.includes('super')||s.includes('spesa')||s.includes('shop')) return 'shopping';
        if(s.includes('trasp')||s.includes('benz')||s.includes('taxi')) return 'transport';
        if(s.includes('utenze')||s.includes('bollet')) return 'utilities';
        return 'other';
    },
    checkKeyword(t,k){return t&&k.some(w=>t.toLowerCase().includes(w));},

    // --- PARSERS AVANZATI ---

    // 1. CSV Parser (Gestisce newline nelle stringhe)
    parseCSV_V2(text) {
        const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const rows = [];
        let currentRow = [];
        let currentVal = '';
        let inQuote = false;

        const sample = src.slice(0, 5000);
        const sc = (sample.match(/;/g)||[]).length;
        const cm = (sample.match(/,/g)||[]).length;
        const sep = sc > cm ? ';' : ',';
        
        for (let i = 0; i < src.length; i++) {
            const char = src[i];
            const nextChar = src[i+1];
            if (char === '"') {
                if (inQuote && nextChar === '"') { currentVal += '"'; i++; }
                else { inQuote = !inQuote; }
            } 
            else if (char === sep && !inQuote) { currentRow.push(currentVal.trim()); currentVal = ''; } 
            else if (char === '\n' && !inQuote) {
                currentRow.push(currentVal.trim()); rows.push(currentRow); currentRow = []; currentVal = '';
            } 
            else { currentVal += char; }
        }
        if (currentVal || currentRow.length > 0) { currentRow.push(currentVal.trim()); rows.push(currentRow); }
        return rows;
    },

    // 2. EXCEL Parser (Con Fix Range !)
    async parseExcel(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = e => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const wb = XLSX.read(data, {type:'array', cellDates: true});
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    
                    // --- FIX: RANGE EXPANDER ---
                    // Se il file ha un !ref sbagliato (es. finisce a riga 33 ma ci sono dati a riga 60)
                    // lo ricalcoliamo manualmente scansionando le celle.
                    if (ws['!ref']) {
                        const range = XLSX.utils.decode_range(ws['!ref']);
                        let maxRow = range.e.r;
                        let maxCol = range.e.c;
                        
                        // Scansiona tutte le chiavi della sheet
                        Object.keys(ws).forEach(key => {
                            if (key.startsWith('!')) return; // Salta metadati
                            if (!key.match(/[A-Z]+\d+/)) return; // Solo chiavi tipo A1, B2...
                            try {
                                const cell = XLSX.utils.decode_cell(key);
                                if (cell.r > maxRow) maxRow = cell.r;
                                if (cell.c > maxCol) maxCol = cell.c;
                            } catch(e) {}
                        });

                        // Se abbiamo trovato celle oltre il limite ufficiale, espandiamo il range
                        if (maxRow > range.e.r) {
                            const newRange = XLSX.utils.encode_range({
                                s: range.s,
                                e: { r: maxRow, c: maxCol }
                            });
                            ws['!ref'] = newRange;
                            console.log(`🔧 EXCEL FIX: Range esteso da riga ${range.e.r} a ${maxRow}.`);
                        }
                    }
                    // ---------------------------

                    const json = XLSX.utils.sheet_to_json(ws, {header: 1, defval: "", raw: true});
                    res(json);
                } catch(err) { rej(err); }
            };
            r.readAsArrayBuffer(file);
        });
    },

    parseNumber(str) {
        if (typeof str === 'number') return str;
        if (!str) return 0;
        let c = String(str).replace(/[^\d.,-]/g, '').trim();
        if (!c) return 0;
        if (c.lastIndexOf('.') > c.lastIndexOf(',')) c = c.replace(/,/g, '');
        else c = c.replace(/\./g, '').replace(',', '.');
        return parseFloat(c) || 0;
    },

    parseDate(input) {
        if (!input) return null;
        if (input instanceof Date) {
            const safeDate = new Date(input.getTime() - (input.getTimezoneOffset() * 60000));
            return safeDate.toISOString().split('T')[0];
        }
        let s = String(input).trim().split(' ')[0];
        const parts = s.split(/[\/\-\.]/);
        if (parts.length === 3) {
            let d, m, y;
            const p0 = parseInt(parts[0]);
            if (p0 > 1000) { y = parts[0]; m = parts[1]; d = parts[2]; }
            else { d = parts[0]; m = parts[1]; y = parts[2]; }
            if (y.length === 2) y = '20' + y;
            return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
        return null;
    }
};

window.ExpenseImport = ExpenseImport;