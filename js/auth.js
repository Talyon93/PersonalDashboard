// auth.js - Sistema di autenticazione per la dashboard

// Flag di sviluppo - imposta a true per testing locale
const DEV_MODE = true;

// Classe per gestire l'autenticazione
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Carica l'utente corrente se esiste
        const userId = localStorage.getItem('currentUser');
        if (userId) {
            this.currentUser = this.getUserById(userId);
        }

        // In dev mode, crea un utente di test se non esiste
        if (DEV_MODE && !this.currentUser) {
            this.createDevUser();
        }
    }

    // Crea utente di sviluppo per testing
    createDevUser() {
        const devUser = {
            id: 'dev-user-1',
            email: 'dev@local.com',
            password: 'dev123', // In produzione sarebbe un hash
            createdAt: new Date().toISOString(),
            name: 'Dev User'
        };

        const users = this.getAllUsers();
        users[devUser.id] = devUser;
        localStorage.setItem('users', JSON.stringify(users));
        
        console.log('Dev user created:', devUser.email);
    }

    // Ottieni tutti gli utenti
    getAllUsers() {
        const usersData = localStorage.getItem('users');
        return usersData ? JSON.parse(usersData) : {};
    }

    // Ottieni utente per ID
    getUserById(userId) {
        const users = this.getAllUsers();
        return users[userId] || null;
    }

    // Ottieni utente per email
    getUserByEmail(email) {
        const users = this.getAllUsers();
        return Object.values(users).find(u => u.email === email);
    }

    // Genera ID univoco per nuovo utente
    generateUserId() {
        return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Registra nuovo utente
    register(email, password, name = '') {
        // Verifica se l'email esiste già
        if (this.getUserByEmail(email)) {
            return {
                success: false,
                error: 'Email già registrata'
            };
        }

        // Validazione email base
        if (!email || !email.includes('@')) {
            return {
                success: false,
                error: 'Email non valida'
            };
        }

        // Validazione password
        if (!password || password.length < 4) {
            return {
                success: false,
                error: 'Password troppo corta (minimo 4 caratteri)'
            };
        }

        // Crea nuovo utente
        const userId = this.generateUserId();
        const newUser = {
            id: userId,
            email: email.toLowerCase().trim(),
            password: password, // In produzione: hashPassword(password)
            name: name.trim(),
            createdAt: new Date().toISOString()
        };

        // Salva utente
        const users = this.getAllUsers();
        users[userId] = newUser;
        localStorage.setItem('users', JSON.stringify(users));

        // Inizializza dati vuoti per il nuovo utente
        this.initializeUserData(userId);

        console.log('User registered:', email);

        return {
            success: true,
            user: this.sanitizeUser(newUser)
        };
    }

    // Login
    login(email, password) {
        const user = this.getUserByEmail(email.toLowerCase().trim());

        if (!user) {
            return {
                success: false,
                error: 'Email non trovata'
            };
        }

        // In produzione: comparePassword(password, user.password)
        if (user.password !== password) {
            return {
                success: false,
                error: 'Password errata'
            };
        }

        // Imposta utente corrente
        this.currentUser = user;
        localStorage.setItem('currentUser', user.id);

        console.log('User logged in:', email);

        return {
            success: true,
            user: this.sanitizeUser(user)
        };
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        console.log('User logged out');
    }

    // Verifica se l'utente è loggato
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Ottieni utente corrente
    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    }

    // Rimuovi informazioni sensibili dall'oggetto utente
    sanitizeUser(user) {
        if (!user) return null;
        const { password, ...safeUser } = user;
        return safeUser;
    }

    // Inizializza dati vuoti per nuovo utente
    initializeUserData(userId) {
        // Expenses vuoto
        localStorage.setItem(`expenses-${userId}`, JSON.stringify([]));
        
        // Settings di default
        const defaultSettings = {
            currency: '€',
            monthStartDay: 25,
            budget: 700,
            theme: 'light'
        };
        localStorage.setItem(`settings-${userId}`, JSON.stringify(defaultSettings));
        
        console.log('Initialized data for user:', userId);
    }

    // Helper per ottenere chiave localStorage specifica per utente
    getUserKey(key) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        return `${key}-${this.currentUser.id}`;
    }

    // Ottieni expenses dell'utente corrente
    getUserExpenses() {
        if (!this.currentUser) return [];
        const key = this.getUserKey('expenses');
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    // Salva expenses dell'utente corrente
    saveUserExpenses(expenses) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        const key = this.getUserKey('expenses');
        localStorage.setItem(key, JSON.stringify(expenses));
    }

    // Ottieni settings dell'utente corrente
    getUserSettings() {
        if (!this.currentUser) return null;
        const key = this.getUserKey('settings');
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Salva settings dell'utente corrente
    saveUserSettings(settings) {
        if (!this.currentUser) {
            throw new Error('No user logged in');
        }
        const key = this.getUserKey('settings');
        localStorage.setItem(key, JSON.stringify(settings));
    }
}

// Istanza globale del manager di autenticazione
const authManager = new AuthManager();

// Helper function per proteggere le pagine
function requireAuth() {
    if (!authManager.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Export per uso in altri file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthManager, authManager, requireAuth };
}
