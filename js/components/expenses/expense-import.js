/**
 * Expense Import Module - "Blind Scan" + Smart Date Fix
 * Corregge automaticamente date invertite (Mese 31 -> Giorno 31)
 */

const ExpenseImport = {
    async processFile(file, bankType) {
        console.log(`📂 Processing ${file.name} for ${bankType}`);
        try {
            let expenses = [];
            
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                expenses = this.parseCSV(text, bankType);
            } else {
                if (typeof XLSX === 'undefined') throw new Error('Excel lib missing');
                expenses = await this.parseExcel(file, bankType);
            }

            console.log(`✅ Imported ${expenses.length} transactions`);
            return expenses;
        } catch (error) {
            console.error('Import Error:', error);
            throw error;
        }
    },

    parseCSV(text, bankType) {
        if (bankType === 'intesa') return this.parseIntesaCSV(text);
        if (bankType === 'revolut') return this.parseRevolutCSV(text);
        return [];
    },

    // ==========================================
    // 🏦 INTESA SAN PAOLO
    // ==========================================
    parseIntesaCSV(text) {
        return this.genericScanner(text, {
            startKeywords: ['data', 'importo'],
            colKeywords: {
                date: ['data'],
                desc: ['descrizione', 'operazione', 'dettagli'],
                amount: ['importo', 'accrediti']
            },
            bankTag: '#intesa',
            dateFormat: 'DD/MM/YYYY', // Hint iniziale
            amountFormat: 'IT'
        });
    },

    // ==========================================
    // 💳 REVOLUT
    // ==========================================
    parseRevolutCSV(text) {
        return this.genericScanner(text, {
            startKeywords: ['descrizione|description', 'importo|amount'], 
            colKeywords: {
                date: ['completata', 'completed', 'data', 'date'],
                desc: ['descrizione', 'description'],
                amount: ['importo', 'amount'],
                fee: ['commissione', 'fee'],
                state: ['stato', 'state']
            },
            bankTag: '#revolut',
            dateFormat: 'AUTO',
            amountFormat: 'AUTO'
        });
    },

    // ==========================================
    // 🧠 SCANNER UNIVERSALE
    // ==========================================
    genericScanner(text, config) {
        const lines = text.trim().split('\n');
        const expenses = [];
        let dataStart = false;
        let delimiter = ';';
        let colMap = null;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            const lower = line.toLowerCase();

            // 1. CERCA INTESTAZIONE
            if (!dataStart) {
                const matchAll = config.startKeywords.every(keyword => {
                    const options = keyword.split('|');
                    return options.some(opt => lower.includes(opt));
                });

                if (matchAll) {
                    console.log(`🎯 Header trovato alla riga ${i+1}:`, line);
                    dataStart = true;
                    
                    const countSemi = (line.match(/;/g) || []).length;
                    const countComma = (line.match(/,/g) || []).length;
                    delimiter = countSemi > countComma ? ';' : ',';

                    const headers = line.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
                    
                    colMap = {
                        date: this.findColIndex(headers, config.colKeywords.date),
                        desc: this.findColIndex(headers, config.colKeywords.desc),
                        amount: this.findColIndex(headers, config.colKeywords.amount),
                        fee: config.colKeywords.fee ? this.findColIndex(headers, config.colKeywords.fee) : -1,
                        state: config.colKeywords.state ? this.findColIndex(headers, config.colKeywords.state) : -1,
                    };

                    if (colMap.date === -1 || colMap.amount === -1) {
                        dataStart = false; 
                    }
                }
                continue;
            }

            // 2. LEGGI I DATI
            const cols = this.splitCSVLine(line, delimiter);
            if (!colMap || cols.length < 2) continue;
            
            const rawDate = cols[colMap.date];
            const rawDesc = cols[colMap.desc];
            const rawAmount = cols[colMap.amount];
            
            if (!rawDate || !rawAmount) continue;

            if (colMap.state !== -1) {
                const state = (cols[colMap.state] || '').toUpperCase();
                if (state && !state.includes('COMPLET') && state !== '') continue;
            }

            let amount = 0;
            if (config.amountFormat === 'IT' || delimiter === ';') {
                amount = this.parseItalianNumber(rawAmount);
            } else {
                amount = parseFloat(rawAmount);
            }

            if (isNaN(amount) || amount >= 0) continue; 

            let finalAmount = Math.abs(amount);
            if (colMap.fee !== -1 && cols[colMap.fee]) {
                let fee = 0;
                if (delimiter === ';') fee = this.parseItalianNumber(cols[colMap.fee]);
                else fee = parseFloat(cols[colMap.fee]);
                if (!isNaN(fee) && fee < 0) finalAmount += Math.abs(fee);
            }

            const date = this.parseDateSmart(rawDate, config.dateFormat);
            if (!date) continue;

            expenses.push({
                id: Date.now() + Math.random() + i,
                date: date,
                description: this.sanitizeInput(rawDesc || 'Spesa Importata'),
                amount: parseFloat(finalAmount.toFixed(2)),
                category: this.categorizeExpense(rawDesc),
                tags: [config.bankTag]
            });
        }

        return expenses;
    },

    // ==========================================
    // 🛠️ UTILS & DATE ENGINE (FIXED)
    // ==========================================
    
    findColIndex(headers, keywords) {
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
    },

    parseDateSmart(dateStr, formatHint) {
        if (!dateStr) return null;
        // Pulisce e normalizza separatori
        let clean = dateStr.trim().split(' ')[0].replace(/\./g, '/').replace(/-/g, '/');

        let parts = clean.split('/');
        if (parts.length !== 3) return null;

        let d, m, y;
        
        // Caso: YYYY all'inizio (2025/12/31)
        if (parts[0].length === 4) { 
            y = parseInt(parts[0]); m = parseInt(parts[1]); d = parseInt(parts[2]);
        } 
        // Caso: YYYY alla fine (31/12/2025)
        else if (parts[2].length === 4) { 
            y = parseInt(parts[2]);
            let p1 = parseInt(parts[0]);
            let p2 = parseInt(parts[1]);

            if (formatHint === 'DD/MM/YYYY') {
                d = p1; m = p2;
            } else {
                if (p1 > 12) { d = p1; m = p2; }
                else if (p2 > 12) { d = p2; m = p1; }
                else { d = p1; m = p2; } 
            }
        } else {
            return null;
        }

        // --- SAFETY CHECK (Il Fix per il tuo errore) ---
        // Se il "mese" rilevato è > 12 (es. 31), è impossibile. 
        // Significa che giorno e mese sono invertiti. Scambiamoli.
        if (m > 12 && d <= 12) {
             let temp = d; d = m; m = temp;
        }

        // Anti-Future: Se data futura, prova swap
        const check = new Date(y, m-1, d);
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        if (check > tomorrow && d <= 12 && m <= 12) {
             let temp = d; d = m; m = temp;
        }

        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    },

    parseItalianNumber(str) {
        if (!str) return 0;
        let clean = str.replace(/[^\d.,-]/g, '');
        if (clean.includes(',') && !clean.endsWith(',')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        }
        return parseFloat(clean) || 0;
    },

    splitCSVLine(line, delimiter) {
        const res = [];
        let curr = '', quote = false;
        for (let c of line) {
            if (c === '"') { quote = !quote; }
            else if (c === delimiter && !quote) { res.push(curr.trim().replace(/^"|"$/g,'')); curr=''; }
            else { curr += c; }
        }
        res.push(curr.trim().replace(/^"|"$/g,''));
        return res;
    },

    sanitizeInput(str) {
        let s = String(str || '').trim().replace(/^"|"$/g, '');
        return /^[=+\-@\t\r]/.test(s) ? "'"+s : s;
    },

    categorizeExpense(description) {
        if (!description) return 'other';
        const d = description.toLowerCase();
        if (d.includes('coop') || d.includes('conad') || d.includes('lidl') || d.includes('esselunga')) return 'shopping';
        if (d.includes('mcdonald') || d.includes('glovo') || d.includes('just eat') || d.includes('ristorante')) return 'food';
        if (d.includes('benzina') || d.includes('q8') || d.includes('uber') || d.includes('trenitalia')) return 'transport';
        if (d.includes('netflix') || d.includes('spotify') || d.includes('cinema')) return 'entertainment';
        return 'other';
    },

    async parseExcel(file, bankType) {
        return new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (e) => {
                const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array', cellDates:true});
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''});
                const csv = json.map(row => row.join(';')).join('\n');
                resolve(this.parseCSV(csv, bankType));
            };
            r.readAsArrayBuffer(file);
        });
    }
};

window.ExpenseImport = ExpenseImport;
console.log('✅ ExpenseImport: Smart Date Fix Active');