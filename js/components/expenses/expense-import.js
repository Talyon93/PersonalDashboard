/**
 * Expense Import Module - UNIVERSAL SMART SCANNER V2.3 🧠
 * Fixes: Ignora righe di "Saldo Iniziale/Finale" che non sono transazioni reali.
 */

const ExpenseImport = {
    // Keywords for column detection (Multilanguage IT/EN)
    keywords: {
        // REMOVED 'valuta' to prevent detecting "Valuta" (Currency) column as Date
        date: ['data', 'date', 'giorno', 'time', 'dt'], 
        amount: ['importo', 'amount', 'euro', 'eur', 'uscite', 'debit', 'costo', 'price', 'prezzo'],
        description: ['descrizione', 'description', 'causale', 'merchant', 'dettagli', 'payee', 'controparte', 'testo', 'prodotto', 'negozio', 'counterparty'],
        category: ['categoria', 'category', 'cat'],
        outflow: ['uscite', 'debit', 'withdraw', 'spesa', 'out'],
        inflow: ['entrate', 'credit', 'deposit', 'in']
    },

    async processFile(file) {
        console.log(`🧠 Smart Analyzing V2.3: ${file.name}`);
        try {
            let expenses = [];
            
            if (file.name.toLowerCase().endsWith('.csv')) {
                const text = await file.text();
                expenses = this.parseUniversalCSV(text);
            } else {
                if (typeof XLSX === 'undefined') throw new Error('Excel library missing (XLSX)');
                expenses = await this.parseExcel(file);
            }

            console.log(`✅ Importazione completata: ${expenses.length} transazioni.`);
            
            if (expenses.length === 0) {
                alert("⚠️ Nessuna transazione trovata. Verifica l'intestazione del file (Data, Importo, Descrizione).");
            }
            
            return expenses;
        } catch (error) {
            console.error('❌ Import Error:', error);
            alert(`Errore importazione: ${error.message}`);
            return [];
        }
    },

    parseUniversalCSV(text) {
        const lines = text.trim().split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];

        // 1. Detect Delimiter
        const delimiter = this.detectDelimiter(lines.slice(0, 5));
        
        // 2. Map Columns
        const mapping = this.detectColumns(lines, delimiter);
        if (!mapping.found) throw new Error("Intestazione non riconosciuta. Cerca colonne: Data, Importo/Uscite, Descrizione.");

        // 3. Pre-scan for heuristics
        const isAllPositive = this.checkIfAllPositive(lines, mapping, delimiter);

        const expenses = [];
        
        for (let i = mapping.headerIndex + 1; i < lines.length; i++) {
            const row = this.splitCSVLine(lines[i], delimiter);
            if (row.length <= Math.max(mapping.cols.date, mapping.cols.amount)) continue;

            const rawDate = row[mapping.cols.date];
            const rawDesc = mapping.cols.desc > -1 ? row[mapping.cols.desc] : 'Importazione';
            
            // --- FIX V2.3: SALTA RIGHE DI SALDO ---
            if (this.isBalanceRow(rawDesc)) {
                console.log(`⏩ Ignorata riga di saldo: "${rawDesc}"`);
                continue;
            }

            // Handle Separate Columns (Inflow vs Outflow)
            let rawAmount = row[mapping.cols.amount];
            let isInflow = false;

            if ((!rawAmount || rawAmount.trim() === '') && mapping.cols.inflow > -1) {
                rawAmount = row[mapping.cols.inflow];
                isInflow = true;
            }

            // Parse Number
            let amount = this.parseSmartNumber(rawAmount);
            if (isNaN(amount) || amount === 0) continue;

            let type = 'expense';

            // --- TYPE DETECTION LOGIC ---
            if (isInflow) {
                type = 'income';
                amount = Math.abs(amount);
            } 
            else if (mapping.isOutflowCol) {
                type = 'expense';
                amount = Math.abs(amount);
            }
            else {
                if (amount > 0) {
                    if (isAllPositive && mapping.cols.category > -1) {
                        type = 'expense'; // Heuristic: App export with categories
                    } else {
                        type = 'income'; // Standard banking
                    }
                } else {
                    type = 'expense';
                    amount = Math.abs(amount);
                }
            }

            // Category Extraction
            let category = 'other';
            if (mapping.cols.category > -1) {
                category = this.normalizeCategory(row[mapping.cols.category]);
            } else {
                category = this.categorizeExpense(rawDesc);
            }

            // Date Parsing
            const date = this.parseDateSmart(rawDate);
            if (!date) continue; 

            expenses.push({
                id: Date.now() + Math.random() + i,
                date: date,
                description: this.sanitizeInput(rawDesc),
                amount: amount,
                type: type,
                category: category,
                tags: ['#import']
            });
        }

        return expenses;
    },

    // --- NUOVA FUNZIONE: Controlla se è una riga di saldo ---
    isBalanceRow(desc) {
        if (!desc) return false;
        const d = desc.toLowerCase().trim();
        // Filtra stringhe comuni di riepilogo
        return d.startsWith('saldo iniziale') || 
               d.startsWith('saldo finale') || 
               d.includes('saldo al') ||
               d.includes('totale operaz') ||
               d === 'saldo contabile';
    },

    detectDelimiter(sampleLines) {
        const joined = sampleLines.join('\n');
        const semis = (joined.match(/;/g) || []).length;
        const commas = (joined.match(/,/g) || []).length;
        return semis > commas ? ';' : ',';
    },

    detectColumns(lines, delimiter) {
        let bestScore = 0;
        let bestMapping = { found: false, headerIndex: -1, cols: {} };

        for (let i = 0; i < Math.min(lines.length, 20); i++) {
            const row = this.splitCSVLine(lines[i], delimiter).map(c => c.toLowerCase().trim());
            let map = { date: -1, amount: -1, desc: -1, inflow: -1, category: -1 };
            let score = 0;
            let isOutflow = false;

            row.forEach((cell, idx) => {
                if (!cell) return;

                if (this.keywords.date.some(k => cell.includes(k))) {
                    if (map.date === -1) { 
                        map.date = idx; score += 3; 
                    }
                }
                else if (this.keywords.description.some(k => cell.includes(k))) {
                    map.desc = idx; score += 2;
                }
                else if (this.keywords.category.some(k => cell === k || cell.includes(k))) {
                    map.category = idx; score += 2;
                }
                else if (this.keywords.outflow.some(k => cell === k || cell.includes(k))) {
                    map.amount = idx; isOutflow = true; score += 3;
                }
                else if (this.keywords.inflow.some(k => cell === k || cell.includes(k))) {
                    map.inflow = idx;
                }
                else if (map.amount === -1 && this.keywords.amount.some(k => cell === k || cell.includes(k))) {
                    map.amount = idx; score += 2;
                }
            });

            if (map.date > -1 && (map.amount > -1 || map.inflow > -1)) {
                if (score > bestScore) {
                    bestScore = score;
                    bestMapping = { found: true, headerIndex: i, cols: map, isOutflowCol: isOutflow };
                }
            }
        }
        return bestMapping;
    },

    checkIfAllPositive(lines, mapping, delimiter) {
        let positiveCount = 0;
        let negativeCount = 0;
        const col = mapping.cols.amount;
        
        for (let i = mapping.headerIndex + 1; i < Math.min(lines.length, mapping.headerIndex + 11); i++) {
            const row = this.splitCSVLine(lines[i], delimiter);
            if (!row[col]) continue;
            const val = this.parseSmartNumber(row[col]);
            if (val > 0) positiveCount++;
            if (val < 0) negativeCount++;
        }
        
        return positiveCount > 0 && negativeCount === 0;
    },

    // --- PARSING UTILS ---

    parseSmartNumber(str) {
        if (!str) return 0;
        let clean = str.replace(/[^\d.,-]/g, '').trim(); 
        const lastComma = clean.lastIndexOf(',');
        const lastDot = clean.lastIndexOf('.');

        if (lastComma > lastDot) {
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            clean = clean.replace(/,/g, '');
        }
        return parseFloat(clean) || 0;
    },

    parseDateSmart(dateStr) {
        if (!dateStr) return null;
        let clean = dateStr.trim().split(' ')[0].split('T')[0];
        clean = clean.replace(/\./g, '/').replace(/-/g, '/');

        const parts = clean.split('/');
        if (parts.length !== 3) return null;

        let d, m, y;
        const n1 = parseInt(parts[0]);
        const n2 = parseInt(parts[1]);
        const n3 = parseInt(parts[2]);

        if (n1 > 31) { y = n1; m = n2; d = n3; }      
        else if (n3 > 31) { y = n3; m = n2; d = n1; } 
        else { return null; } 

        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    },

    splitCSVLine(line, delimiter) {
        const res = [];
        let curr = '', quote = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') { quote = !quote; }
            else if (c === delimiter && !quote) { 
                res.push(curr.trim().replace(/^"|"$/g,'')); curr=''; 
            } else { curr += c; }
        }
        res.push(curr.trim().replace(/^"|"$/g,''));
        return res;
    },

    categorizeExpense(description) {
        if (!description) return 'other';
        const d = description.toLowerCase();
        if (d.includes('coop') || d.includes('conad') || d.includes('lidl') || d.includes('esselunga')) return 'shopping';
        if (d.includes('mcdonald') || d.includes('glovo') || d.includes('deliveroo') || d.includes('just eat')) return 'food';
        if (d.includes('benzina') || d.includes('q8') || d.includes('eni')) return 'transport';
        if (d.includes('netflix') || d.includes('spotify') || d.includes('cinema')) return 'entertainment';
        return 'other';
    },

    normalizeCategory(catStr) {
        if (!catStr) return 'other';
        const c = catStr.toLowerCase();
        if (c.includes('cibo') || c.includes('ristora')) return 'food';
        if (c.includes('spesa') || c.includes('supermerc')) return 'shopping';
        if (c.includes('trasport') || c.includes('viaggi')) return 'transport';
        if (c.includes('svago') || c.includes('intratten')) return 'entertainment';
        return 'other'; 
    },

    sanitizeInput(str) {
        let s = String(str || '').trim().replace(/^"|"$/g, '');
        return /^[=+\-@\t\r]/.test(s) ? "'"+s : s;
    },

    async parseExcel(file) {
        return new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (e) => {
                const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array', cellDates:true});
                const ws = wb.Sheets[wb.SheetNames[0]];
                const csv = XLSX.utils.sheet_to_csv(ws, {FS: ';'});
                resolve(this.parseUniversalCSV(csv));
            };
            r.readAsArrayBuffer(file);
        });
    }
};

window.ExpenseImport = ExpenseImport;
console.log('✅ ExpenseImport V2.3: Ignore Balance Rows');