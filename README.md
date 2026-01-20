# 📊 Dashboard Personale

Dashboard completa per gestire agenda, obiettivi e spese personali.

## 🚀 Funzionalità

### 📅 Agenda
- ✅ Creazione, modifica ed eliminazione task
- ✅ Priorità (Alta, Media, Bassa) con codici colore
- ✅ Filtri: Tutti, Oggi, Settimana, Prossimi, Completati
- ✅ Checkbox per completamento
- ✅ Evidenziazione task scaduti
- ✅ Ordinamento automatico per data

### 🎯 Obiettivi (Goals)
- ✅ Creazione obiettivi trimestrali
- ✅ Suddivisione in subtask
- ✅ Barra progresso automatica
- ✅ Raggruppamento per trimestre
- ✅ Completamento automatico al 100%

### 💰 Spese (Expenses)
- ✅ Registrazione spese manuali
- ✅ Import CSV da Intesa San Paolo e Revolut
- ✅ Categorie predefinite (Cibo, Trasporti, ecc.)
- ✅ Statistiche mensili
- ✅ Breakdown per categoria
- ✅ Navigazione per mesi
- ✅ Calcolo media giornaliera

### 📊 Dashboard
- ✅ Vista d'insieme con statistiche
- ✅ Task urgenti in evidenza
- ✅ Progresso obiettivi
- ✅ Riepilogo spese recenti
- ✅ Azioni rapide

## 📁 Struttura del Progetto

```
personal-dashboard/
├── index.html              # Pagina principale
├── css/
│   └── styles.css         # Stili personalizzati
├── js/
│   ├── app.js            # Controller principale
│   ├── utils/
│   │   ├── storage.js    # Gestione localStorage
│   │   └── helpers.js    # Funzioni di utilità
│   └── components/
│       ├── dashboard.js  # Componente Dashboard
│       ├── agenda.js     # Componente Agenda
│       ├── goals.js      # Componente Obiettivi
│       └── expenses.js   # Componente Spese
└── data/                 # (vuota, per futuri file)
```

## 🎯 Come Usare

### Installazione
1. Scarica tutti i file
2. Apri `index.html` nel browser
3. Inizia ad usare l'app!

### Primo Avvio
L'app è vuota al primo avvio. Puoi:
- Aggiungere dati manualmente dalle varie sezioni
- Usare dati di esempio (vedi sotto)

### Comandi Console
Apri la console del browser (F12) e usa:

```javascript
// Aggiungi dati di esempio per testare
addSampleData()

// Esporta tutti i dati (backup)
exportAllData()

// Importa dati da file JSON
importData()

// Elimina tutti i dati
clearAllData()

// Naviga tra sezioni
showSection('dashboard')
showSection('agenda')
showSection('goals')
showSection('expenses')
```

## 💾 Gestione Dati

### Storage
I dati sono salvati nel **localStorage** del browser:
- ✅ Persistono anche dopo chiusura del browser
- ✅ Non serve server o database
- ⚠️ Limitati al browser specifico
- ⚠️ Cancellando cache si perdono i dati

### Backup
1. Clicca su "📥 Esporta Dati" nella sidebar
2. Salva il file JSON in un posto sicuro
3. Per ripristinare: "📤 Importa Dati"

## 📤 Import CSV Spese

### Formati Supportati

**Intesa San Paolo**
```csv
Data,Descrizione,Importo
01/01/2025,Spesa supermercato,-45.80
02/01/2025,Benzina,-60.00
```

**Revolut**
```csv
Date,Description,Amount
2025-01-01,Groceries,-45.80
2025-01-02,Fuel,-60.00
```

### Come Importare
1. Vai su **Spese**
2. Clicca "📤 Importa CSV"
3. Seleziona la tua banca
4. Carica il file CSV
5. Clicca "Importa"

**Note:**
- Gli importi negativi vengono convertiti in positivi
- Le spese vengono categorizzate come "Altro" di default
- Puoi modificarle manualmente dopo l'import

## 🎨 Personalizzazione

### Categorie Spese
Modifica le categorie in `js/components/expenses.js`:

```javascript
categories: [
    { id: 'food', name: 'Cibo', icon: '🍕' },
    { id: 'transport', name: 'Trasporti', icon: '🚗' },
    // Aggiungi le tue...
]
```

### Colori e Stili
Modifica `css/styles.css` per personalizzare colori, font e layout.

### Priorità Task
Modifica i colori delle priorità in `css/styles.css`:
```css
.priority-high { border-left: 4px solid #ef4444; }
.priority-medium { border-left: 4px solid #f59e0b; }
.priority-low { border-left: 4px solid #10b981; }
```

## 🔮 Prossimi Step (Roadmap)

### Fase 2 - Backend
- [ ] Node.js + Express backend
- [ ] PostgreSQL database
- [ ] API REST
- [ ] Deploy su Render/Railway

### Fase 3 - Funzionalità Avanzate
- [ ] Bot Telegram per notifiche
- [ ] Email reminder
- [ ] Grafici spese (Chart.js)
- [ ] Export PDF report mensili
- [ ] Ricorrenze automatiche (task ripetitivi)

### Fase 4 - Online
- [ ] Autenticazione utenti
- [ ] Sync multi-dispositivo
- [ ] PWA (app installabile)
- [ ] Dark mode

## 🛠️ Stack Tecnologico

- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Styling:** Tailwind CSS (via CDN)
- **Storage:** localStorage
- **Icons:** Emoji nativi

**Perché questa scelta?**
- Zero dipendenze esterne (oltre Tailwind)
- Funziona offline
- Velocissimo
- Facile da deployare
- Pronto per evoluzione a stack completo

## 🐛 Troubleshooting

**I dati non si salvano:**
- Verifica che localStorage sia abilitato
- Controlla la console per errori
- Prova in modalità incognito

**L'import CSV non funziona:**
- Verifica il formato del CSV
- Controlla che le colonne siano separate da virgole
- Assicurati di selezionare la banca corretta

**Le statistiche non si aggiornano:**
- Ricarica la pagina (Ctrl+R)
- Controlla la console per errori
- Prova a esportare e reimportare i dati

## 📝 Note per Sviluppatori

### Aggiungere Nuovo Componente
1. Crea file in `js/components/nome.js`
2. Implementa pattern:
```javascript
const NomeComponente = {
    init() { this.render(); },
    render() { /* ... */ }
};
```
3. Aggiungi script in `index.html`
4. Aggiungi sezione in `index.html`
5. Integra in `app.js`

### Estendere StorageManager
Per aggiungere nuovi tipi di dati, modifica `js/utils/storage.js`:
```javascript
getDefaultData() {
    return {
        tasks: [],
        goals: [],
        expenses: [],
        nuovoTipo: []  // Aggiungi qui
    };
}
```

## 📄 Licenza

Progetto personale - Uso libero

## 👤 Autore

Creato con ❤️ per organizzare la vita!

---

**Buon utilizzo! 🚀**

Per domande o suggerimenti, apri una issue su GitHub o contattami.
