/**
 * Expense Import Module - Import da CSV e Excel
 */

const ExpenseImport = {
    /**
     * Processa un file (CSV o Excel)
     */
    async processFile(file, bankType) {
        const fileName = file.name.toLowerCase();

        try {
            let expenses = [];

            if (fileName.endsWith('.csv')) {
                const text = await file.text();
                expenses = this.parseCSVByBank(text, bankType);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                if (typeof XLSX === 'undefined') {
                    throw new Error('Libreria Excel non caricata');
                }
                expenses = await this.parseExcelByBank(file, bankType);
            } else {
                throw new Error('Formato file non supportato');
            }

            return expenses;
        } catch (error) {
            console.error('Errore import:', error);
            throw error;
        }
    },

    /**
     * Parse CSV based on bank type
     */
    parseCSVByBank(csvText, bankType) {
        const lines = csvText.trim().split('\n');
        const expenses = [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseCSVLine(line);
            let expense = null;

            if (bankType === 'intesa') {
                expense = {
                    id: Date.now() + Math.random() + i,
                    date: this.parseDate(values[0]),
                    description: values[1] || 'Spesa',
                    amount: Math.abs(parseFloat(values[2])),
                    category: 'other'
                };
            } else if (bankType === 'revolut') {
                const amount = parseFloat(values[5] || 0);
                const state = values[8] || '';

                if (state !== 'COMPLETATO' && state !== 'COMPLETED') continue;
                if (amount >= 0) continue;

                expense = {
                    id: Date.now() + Math.random() + i,
                    date: this.parseDate(values[3] || values[2]),
                    description: values[4] || 'Spesa',
                    amount: Math.abs(amount),
                    category: this.categorizeExpense(values[4] || '')
                };
            } else {
                expense = {
                    id: Date.now() + Math.random() + i,
                    date: this.parseDate(values[0]),
                    description: values[1] || 'Spesa',
                    amount: Math.abs(parseFloat(values[2])),
                    category: 'other'
                };
            }

            if (expense && expense.amount > 0 && !isNaN(expense.amount)) {
                expenses.push(expense);
            }
        }

        return expenses;
    },

    /**
     * Parse CSV line respecting quotes
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current.trim());
        return result;
    },

    /**
     * Parse Excel file based on bank type
     */
    async parseExcelByBank(file, bankType) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {
                        type: 'array',
                        cellDates: true,
                        cellNF: false,
                        cellText: false
                    });

                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const expenses = [];

                    if (bankType === 'intesa') {
                        let headerRow = -1;

                        // Find header row
                        for (let row = 1; row <= 30; row++) {
                            const cellA = worksheet[`A${row}`];
                            const cellB = worksheet[`B${row}`];
                            const cellH = worksheet[`H${row}`];

                            if (cellA && cellB && cellH) {
                                const valA = cellA.v || '';
                                const valB = cellB.v || '';
                                const valH = cellH.v || '';

                                if (valA === 'Data' && valB === 'Operazione' && valH === 'Importo') {
                                    headerRow = row;
                                    break;
                                }
                            }
                        }

                        if (headerRow === -1) {
                            throw new Error('Header non trovato nel file Intesa');
                        }

                        // Process data rows
                        let rowNum = headerRow + 1;
                        while (true) {
                            const cellDate = worksheet[`A${rowNum}`];
                            const cellDesc = worksheet[`B${rowNum}`];
                            const cellAmount = worksheet[`H${rowNum}`];

                            if (!cellDate || !cellDate.v) break;

                            const dateValue = cellDate.v;
                            const description = cellDesc && cellDesc.v ? String(cellDesc.v).trim() : 'Spesa';
                            const amount = cellAmount && cellAmount.v ? parseFloat(cellAmount.v) : 0;

                            if (amount >= 0) {
                                rowNum++;
                                continue;
                            }

                            let parsedDate;
                            if (dateValue instanceof Date) {
                                const year = dateValue.getFullYear();
                                const month = String(dateValue.getMonth() + 1).padStart(2, '0');
                                const day = String(dateValue.getDate()).padStart(2, '0');
                                parsedDate = `${year}-${month}-${day}`;
                            } else {
                                parsedDate = this.parseDate(dateValue);
                            }

                            const expense = {
                                id: Date.now() + Math.random(),
                                date: parsedDate,
                                description: description,
                                amount: Math.abs(amount),
                                category: this.categorizeExpense(description),
                                createdAt: new Date().toISOString()
                            };

                            expenses.push(expense);
                            rowNum++;
                        }
                    }

                    resolve(expenses);
                } catch (error) {
                    console.error('Error parsing Excel:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Errore lettura file'));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Auto-categorize expense based on description
     */
    categorizeExpense(description) {
        const desc = description.toLowerCase().trim();

        // Check user-defined mappings first
        const mappings = MerchantMappings.getAll();
        for (const [merchant, mapping] of Object.entries(mappings)) {
            if (desc.includes(merchant.toLowerCase())) {
                return mapping.category;
            }
        }

        // Food
        if (desc.includes('bistrot') || desc.includes('restaurant') || desc.includes('pizz') ||
            desc.includes('cafe') || desc.includes('bar') || desc.includes('ristorante') ||
            desc.includes('deliveroo') || desc.includes('just eat') || desc.includes('glovo') ||
            desc.includes('uber eats') || desc.includes('kfc') || desc.includes('mcdonald') ||
            desc.includes('burger') || desc.includes('sushi') || desc.includes('muraglia')) {
            return 'food';
        }

        // Shopping
        if (desc.includes('coop') || desc.includes('basko') || desc.includes('esselunga') ||
            desc.includes('conad') || desc.includes('carrefour') || desc.includes('lidl') ||
            desc.includes('supermercato') || desc.includes('ikea') || desc.includes('shunfa')) {
            return 'shopping';
        }

        // Entertainment
        if (desc.includes('cinema') || desc.includes('netflix') || desc.includes('spotify') ||
            desc.includes('tiktok') || desc.includes('amazon prime') || desc.includes('funside')) {
            return 'entertainment';
        }

        // Transport
        if (desc.includes('trenitalia') || desc.includes('italo') || desc.includes('amt') ||
            desc.includes('uber') || desc.includes('taxi') || desc.includes('carburante') ||
            desc.includes('benzina') || desc.includes('diesel')) {
            return 'transport';
        }

        return 'other';
    },

    /**
     * Parse date from various formats
     */
    parseDate(dateStr) {
        if (dateStr instanceof Date) {
            const year = dateStr.getFullYear();
            const month = String(dateStr.getMonth() + 1).padStart(2, '0');
            const day = String(dateStr.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        const str = String(dateStr).trim();

        const formats = [
            { regex: /^(\d{4})-(\d{2})-(\d{2})\s+\d{2}:\d{2}:\d{2}$/, type: 'YYYY-MM-DD HH:MM:SS' },
            { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, type: 'M/D/YY' },
            { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, type: 'M/D/YYYY' },
            { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, type: 'DD/MM/YYYY' },
            { regex: /^(\d{4})-(\d{2})-(\d{2})$/, type: 'YYYY-MM-DD' },
            { regex: /^(\d{2})-(\d{2})-(\d{4})$/, type: 'DD-MM-YYYY' }
        ];

        for (const format of formats) {
            const match = str.match(format.regex);
            if (match) {
                if (format.type === 'YYYY-MM-DD HH:MM:SS') {
                    return `${match[1]}-${match[2]}-${match[3]}`;
                } else if (format.type === 'M/D/YY') {
                    const month = match[1].padStart(2, '0');
                    const day = match[2].padStart(2, '0');
                    let year = parseInt(match[3]);
                    year = year < 100 ? 2000 + year : year;
                    return `${year}-${month}-${day}`;
                } else if (format.type === 'M/D/YYYY') {
                    const month = match[1].padStart(2, '0');
                    const day = match[2].padStart(2, '0');
                    const year = match[3];
                    return `${year}-${month}-${day}`;
                } else if (format.type === 'DD/MM/YYYY' || format.type === 'DD-MM-YYYY') {
                    return `${match[3]}-${match[2]}-${match[1]}`;
                } else if (format.type === 'YYYY-MM-DD') {
                    return str;
                }
            }
        }

        console.warn('⚠️ Data non riconosciuta, uso oggi:', dateStr);
        return new Date().toISOString().split('T')[0];
    }
};

// Export globale
window.ExpenseImport = ExpenseImport;
console.log('✅ ExpenseImport module loaded');
