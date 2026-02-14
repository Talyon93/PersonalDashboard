/**
 * Expense Modals Coordinator (Facade Pattern)
 * Central point of entry for all expense-related modals.
 * Delegates logic to specialized UI modules.
 */

const ExpenseModals = {
    // === DELEGHE AI NUOVI MODULI ===
    
    // Importazione
    showImport: () => window.ExpenseImportUI.show(),
    handleFileSelect: (input) => window.ExpenseImportUI.handleFileSelect(input),
    
    // Categorie
    showCategories: () => window.ExpenseCategoryUI.show(),
    handleAddCategory: () => window.ExpenseCategoryUI.add(),
    handleDeleteCategory: (id) => window.ExpenseCategoryUI.delete(id),
    
    // Form CRUD (Add/Edit)
    showAdd: (type) => window.ExpenseFormUI.showAdd(type),
    handleAdd: (e, type) => window.ExpenseFormUI.submitAdd(e, type),
    showDetail: (id) => window.ExpenseFormUI.showDetail(id),
    
    // --- UTILITIES CONDIVISE ---
    
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('animate-fadeIn');
            modal.classList.add('animate-fadeOut'); // Opzionale se hai CSS fadeOut
            setTimeout(() => modal.remove(), 200); // Rimuove dopo animazione
        }
    }
};

window.ExpenseModals = ExpenseModals;
// Alias per compatibilità con eventuali chiamate legacy
window.Expenses_showCategoriesModal = () => ExpenseModals.showCategories();

console.log('✅ ExpenseModals Orchestrator Loaded');