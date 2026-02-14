/**
 * Google Calendar Importer (.ics parser)
 * Utility per leggere file iCalendar esportati da Google e convertirli
 * nel formato compatibile con Agenda Pro.
 * * FIX: Gestione eventi "Tutto il giorno" (che venivano nascosti).
 * * FIX V2: Corretto bug durata eventi tutto il giorno (evita durata 24h+).
 * * UPDATE: Durata default ripristinata a 60 minuti (1 ora).
 */

const GoogleImporter = {

    /**
     * Legge un file .ics e restituisce un array di Task
     * @param {File} file - Il file selezionato dall'input
     * @returns {Promise<Array>} Lista di task formattati
     */
    async parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const tasks = this._processICS(content);
                    resolve(tasks);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    },

    /**
     * Logica interna di parsing stringa ICS
     */
    _processICS(content) {
        const tasks = [];
        // Regex migliorata per catturare blocchi evento anche con spaziature strane
        const events = content.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];

        events.forEach(eventBlock => {
            try {
                // Estrazione Campi Base
                const summary = this._extractField(eventBlock, 'SUMMARY');
                let dtStart = this._extractField(eventBlock, 'DTSTART');
                let dtEnd = this._extractField(eventBlock, 'DTEND');
                const description = this._extractField(eventBlock, 'DESCRIPTION');
                const location = this._extractField(eventBlock, 'LOCATION');

                if (!summary || !dtStart) return; // Skip se dati essenziali mancanti

                // --- GESTIONE ALL-DAY EVENTS ---
                // Se la data non contiene 'T', è un evento tutto il giorno (YYYYMMDD)
                let isAllDay = false;
                if (!dtStart.includes('T')) {
                    isAllDay = true;
                    dtStart += 'T090000'; // Forziamo inizio alle 09:00
                    
                    // CRITICO: Se è tutto il giorno, IGNORIAMO la data di fine originale del file .ics
                    // (che spesso è il giorno successivo) per evitare durate di 24h.
                    // Impostiamo dtEnd a null per forzare il calcolo automatico di 60 min qui sotto.
                    dtEnd = null; 
                }

                // Conversione Date
                const startDateObj = this._parseICSDate(dtStart);
                let endDateObj = dtEnd ? this._parseICSDate(dtEnd) : null;

                if (!startDateObj) return;

                // Se manca la fine (o l'abbiamo annullata per all-day), default a +60 min (1 ora)
                if (!endDateObj) {
                    endDateObj = new Date(startDateObj.getTime() + 60 * 60000);
                }

                // Calcolo durata in minuti
                let diffMs = endDateObj - startDateObj;
                let duration = Math.round(diffMs / 60000);

                // Correzione per eventi Runna/Strava che a volte hanno durate strane o negative nel parsing
                // O se per qualche motivo la durata è 0. Fallback a 60 minuti.
                if (duration <= 0) duration = 60;

                // Formattazione per Agenda Pro: YYYY-MM-DDTHH:mm:00
                const localIsoStart = this._toLocalIsoString(startDateObj);

                const localIsoEnd = this._toLocalIsoString(endDateObj);
                // Determina priorità basata su parole chiave
                let priority = 'medium';
                const lowerSum = summary.toLowerCase();
                if (lowerSum.includes('urgente') || summary.includes('!')) priority = 'high';
                if (lowerSum.includes('relax') || lowerSum.includes('pausa') || lowerSum.includes('camminata')) priority = 'low';
                
                // Tag "G-Cal" o "Runna" nella descrizione per riconoscerli
                let finalDesc = description ? description.replace(/\\n/g, '\n').replace(/\\,/g, ',') : '';
                if (isAllDay) finalDesc = `[G-Cal] ` + finalDesc;

                tasks.push({
                    title: summary,
                    date: localIsoStart,
                    endDate: localIsoEnd,
                    duration: duration,
                    location: location ? location.replace(/\\,/g, ',') : '',
                    description: finalDesc,
                    priority: priority,
                    completed: false
                });

            } catch (e) {
                console.warn('Errore parsing evento singolo', e);
            }
        });

        return tasks;
    },

    /**
     * Estrae il valore di un campo ICS gestendo multiline folding
     */
    _extractField(block, key) {
        // Regex che cerca KEY:VALORE e gestisce le righe spezzate da spazi (folding)
        // Gestisce anche parametri opzionali es: DTSTART;VALUE=DATE:2023...
        const regex = new RegExp(`^${key}(?:;.*?)?:(.*(?:\\r?\\n\\s.*)*)`, 'm');
        const match = block.match(regex);
        if (match && match[1]) {
            return match[1].replace(/\r?\n\s/g, '').trim(); // Rimuove folding
        }
        return null;
    },

    /**
     * Converte date ICS (es: 20230202T140000Z) in Oggetto Date JS
     */
    _parseICSDate(icsDateString) {
        // Formato YYYYMMDDTHHmmssZ o YYYYMMDD
        const match = icsDateString.match(/(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/);
        if (!match) return null;

        const [, year, month, day, h, m, s, z] = match;
        
        // Nota: iCalendar usa mesi 1-12, Date usa 0-11
        if (z === 'Z') {
            // È UTC
            return new Date(Date.UTC(year, month - 1, day, h || 0, m || 0, s || 0));
        } else {
            // È Locale o Floating
            return new Date(year, month - 1, day, h || 0, m || 0, s || 0);
        }
    },

    /**
     * Helper per creare stringa "YYYY-MM-DDTHH:mm:ss" locale
     */
    _toLocalIsoString(date) {
        const pad = (n) => String(n).padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = '00';
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
};

window.GoogleImporter = GoogleImporter;