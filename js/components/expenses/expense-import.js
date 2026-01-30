/**
 * Expense Import Module - V3.8 Native Date Objects 📅
 * Fix Definitivo: Converte i seriali Excel in Oggetti Data nativi JS.
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

    // --- LOGICA ---

    async parseRawFile(file) {
        let rows = [];
        try {
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                rows = this.parseCSV(text);
            } else {
                if (typeof XLSX === 'undefined') throw new Error('Libreria XLSX mancante');
                rows = await this.parseExcel(file);
            }
        } catch (e) { console.error(e); throw new Error("File illeggibile."); }

        if (!rows || rows.length < 2) throw new Error("File vuoto.");

        // Pulizia Righe
        const potentialRows = rows.filter(r => r.filter(c => c && String(c).trim().length > 0).length >= 2);
        
        if (potentialRows.length === 0) throw new Error("Nessuna riga valida.");

        const headerIndex = this.detectRealHeaderRow(potentialRows);
        const headerRow = potentialRows[headerIndex];
        const dataRows = potentialRows.slice(headerIndex + 1);
        const signature = headerRow.map(c => String(c).trim().toLowerCase()).join('|');

        console.log(`🧠 Header: ${headerRow.join(' | ')}`);

        return { headers: headerRow, rows: dataRows, signature: signature };
    },

    detectRealHeaderRow(rows) {
        let bestScore = -1, bestIndex = 0;
        const limit = Math.min(rows.length, 30);

        for (let i = 0; i < limit; i++) {
            const rowStr = rows[i].map(c => String(c).toLowerCase()).join(' ');
            let score = 0;
            this.headerKeywords.forEach(k => {
                if (rowStr.includes(k)) score += 2;
                rows[i].forEach(cell => {
                    if (String(cell).toLowerCase().trim() === k) score += 3;
                });
            });
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

    applyMapping(rawRows, mapping, configName) {
        const expenses = [];
        const { dateIndex, amountIndex, descIndex, categoryIndex, amountMode, outflowIndex, inflowIndex } = mapping;

        let sourceTag = '#import';
        if (configName && configName.trim().length > 0) {
            const cleanName = configName.replace(/[^a-zA-Z0-9]/g, ''); 
            sourceTag = '#' + cleanName;
        }
        // ------------------------------

        rawRows.forEach((row, i) => {
            // Controllo esistenza dati: serve o l'Amount unico, o almeno uno tra Inflow/Outflow
            const hasAmount = (amountIndex > -1 && row[amountIndex]) || 
                              (outflowIndex > -1 && row[outflowIndex]) || 
                              (inflowIndex > -1 && row[inflowIndex]);
            
            if (!hasAmount && !row[dateIndex]) return;

            // 1. DATA
            const dateObj = this.parseDate(row[dateIndex]);
            if (!dateObj) return;

            // 2. IMPORTO & TIPO (Logica Complessa)
            let amountVal = 0;
            let type = 'expense';

            // CASO A: Colonna Unica "Importo"
            if (amountIndex > -1) {
                let rawVal = this.parseNumber(row[amountIndex]);
                
                if (amountMode === 'inverted') {
                    // MODALITÀ CARTA DI CREDITO: I numeri positivi sono SPESE
                    if (rawVal > 0) {
                        type = 'expense';
                        amountVal = rawVal;
                    } else {
                        // Se è negativo, è un rimborso/pagamento carta -> Entrata
                        type = 'income';
                        amountVal = Math.abs(rawVal);
                    }
                } else {
                    // MODALITÀ STANDARD: I numeri negativi sono SPESE
                    if (rawVal < 0) {
                        type = 'expense';
                        amountVal = Math.abs(rawVal);
                    } else {
                        type = 'income';
                        amountVal = rawVal;
                    }
                }
            }
            // CASO B: Colonne Separate (Entrate / Uscite)
            else {
                const outVal = outflowIndex > -1 ? this.parseNumber(row[outflowIndex]) : 0;
                const inVal = inflowIndex > -1 ? this.parseNumber(row[inflowIndex]) : 0;

                if (outVal !== 0) {
                    type = 'expense';
                    amountVal = Math.abs(outVal); // Assicuriamoci sia positivo
                } else if (inVal !== 0) {
                    type = 'income';
                    amountVal = Math.abs(inVal);
                }
            }

            // Se l'importo è 0 o nullo, saltiamo
            if (amountVal === 0) return;

            // 3. DESCRIZIONE & CATEGORIA
            let description = row[descIndex] || 'Movimento';
            description = String(description).replace(/\s+/g, ' ').trim();

            let category = 'other';
            if (categoryIndex > -1 && row[categoryIndex]) category = this.normalizeCategory(row[categoryIndex]);
            if (category === 'other') category = this.guessCategory(description);
            
            // Correzione Stipendio solo se è entrata
            if (type === 'income' && category === 'other') {
                 if (this.checkKeyword(description, this.categoryKeywords.salary)) category = 'salary';
                 else category = 'income_other';
            }

            expenses.push({
                id: Date.now() + Math.random() + i,
                date: dateObj,
                description: description,
                amount: parseFloat(amountVal.toFixed(2)), // Arrotondamento sicurezza
                type: type,
                category: category,
                tags: [sourceTag] // <--- QUI ORA USIAMO IL TAG DINAMICO
            });
        });

        return expenses;
    },

    // --- HELPERS (Invariati) ---
    guessCategory(d) {
        if(!d) return 'other'; const l = d.toLowerCase();
        for(const [k,w] of Object.entries(this.categoryKeywords)) if(w.some(x=>l.includes(x))) return k;
        return 'other';
    },
    normalizeCategory(c) {
        if(!c) return 'other'; const s = String(c).toLowerCase();
        if(s.includes('alim')||s.includes('rist')||s.includes('cibo')) return 'food';
        if(s.includes('super')||s.includes('spesa')||s.includes('shop')) return 'shopping';
        if(s.includes('trasp')||s.includes('benz')) return 'transport';
        return 'other';
    },
    checkKeyword(t,k){return t&&k.some(w=>t.toLowerCase().includes(w));},

    // --- PARSERS ---

    parseCSV(text) {
        const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, ''); 
        const lines = clean.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return [];

        const s = lines.slice(0,10).join('\n');
        const sc = (s.match(/;/g)||[]).length, cm = (s.match(/,/g)||[]).length, tb = (s.match(/\t/g)||[]).length;
        let d = ','; if (sc > cm && sc > tb) d = ';'; else if (tb > sc && tb > cm) d = '\t';

        return lines.map(l => {
             const r = [];
             const re = new RegExp(`(?:${d}|^)(?:(?:"([^"]*(?:""[^"]*)*)")|([^"${d}]*))`, 'g');
             let m;
             while (m = re.exec(l)) {
                 if (m.index === re.lastIndex) re.lastIndex++;
                 let v = m[1] !== undefined ? m[1].replace(/""/g, '"') : m[2];
                 r.push(v ? v.trim() : '');
             }
             return r;
        }).filter(r => r.length > 0);
    },

    // 🔥 FIX EXCEL NATIVO
    async parseExcel(file) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = e => {
                try {
                    const d = new Uint8Array(e.target.result);
                    // cellDates: true -> Converte i numeri (45321) in oggetti JS Date!
                    const wb = XLSX.read(d, {type:'array', cellDates: true});
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    // raw: true -> Mantiene l'oggetto Date, non lo converte in stringa
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
        if (c.lastIndexOf(',') > c.lastIndexOf('.')) c = c.replace(/\./g, '').replace(',', '.');
        else if (c.lastIndexOf('.') > c.lastIndexOf(',')) c = c.replace(/,/g, '');
        return parseFloat(c) || 0;
    },

    // 🔥 PARSE DATE UNIVERSALE
    parseDate(input) {
        if (!input) return null;

        // 1. SE È GIÀ UN OGGETTO DATA (Grazie a cellDates: true)
        if (input instanceof Date) {
            // A volte Excel aggiunge ore per fuso orario, usiamo toISOString e prendiamo la data
            // Aggiungiamo 12 ore per evitare problemi di fuso orario (00:00 -> giorno prima)
            const safeDate = new Date(input.getTime() - (input.getTimezoneOffset() * 60000));
            return safeDate.toISOString().split('T')[0];
        }

        // 2. Se è ancora una stringa (es. CSV)
        let s = String(input).trim().split(' ')[0];
        
        const parts = s.split(/[\/\-\.]/);
        if (parts.length === 3) {
            let d, m, y;
            const p0 = parseInt(parts[0]);
            
            if (p0 > 1000) { y = parts[0]; m = parts[1]; d = parts[2]; } // ISO
            else { d = parts[0]; m = parts[1]; y = parts[2]; } // IT

            if (y.length === 2) y = '20' + y;
            return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
        }
        return null;
    }
};

window.ExpenseImport = ExpenseImport;