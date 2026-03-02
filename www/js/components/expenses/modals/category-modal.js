/**
 * Expense Category Modal - Gestione Categorie Personalizzate
 */
const ExpenseCategoryUI = {
    show() {
        const modal = document.createElement('div');
        modal.id = 'categoriesModal';
        modal.className = 'modal fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fadeIn sm:p-4';
        
        modal.innerHTML = `
            <div class="bg-[#1a222f] border border-slate-700/50 rounded-t-2xl sm:rounded-[2rem] shadow-2xl p-5 sm:p-8 w-full sm:max-w-xl border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
                <div class="flex justify-between items-start mb-4 sm:mb-6">
                    <div class="flex items-center gap-2 sm:gap-3">
                        <span class="text-xl sm:text-2xl">📂</span>
                        <div>
                            <h3 class="text-xl sm:text-2xl font-black text-white">Categorie</h3>
                            <p class="text-slate-400 text-xs sm:text-sm font-medium">Personalizza i tuoi flussi</p>
                        </div>
                    </div>
                    <button onclick="ExpenseModals.close('categoriesModal')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-white">✕</button>
                </div>
                
                <div class="bg-[#111827]/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-700/30 mb-4 sm:mb-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 sm:mb-4">Nuova Categoria</p>
                    <div class="flex gap-2 sm:gap-3">
                        <input type="text" id="newCatIcon" value="🍕" class="w-11 h-11 sm:w-14 sm:h-14 bg-[#1a222f] border border-slate-700 rounded-lg sm:rounded-xl text-center text-xl sm:text-2xl focus:outline-none focus:border-indigo-500 cursor-pointer">
                        <input type="text" id="newCatName" placeholder="Nome categoria..." class="flex-1 bg-[#1a222f] border border-slate-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                        <button onclick="ExpenseCategoryUI.add()" class="bg-[#5c56f0] hover:bg-[#4a44d1] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95">+</button>
                    </div>
                </div>

                <div class="space-y-2 sm:space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar" id="categoriesListContainer">
                    ${this.renderList()}
                </div>

                <div class="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-800">
                    <button onclick="ExpenseModals.close('categoriesModal')" class="w-full py-3 sm:py-4 bg-[#242f3f] text-slate-200 rounded-xl sm:rounded-2xl hover:bg-slate-700 transition font-black uppercase tracking-widest text-xs">Chiudi</button>
                </div>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    renderList() {
        const allCategories = Categories.getAll();
        return allCategories.map(cat => `
            <div class="group flex items-center justify-between p-3 sm:p-4 bg-[#1f2937]/50 rounded-xl sm:rounded-2xl border border-slate-700/20 hover:border-slate-600/40 transition-all">
                <div class="flex items-center gap-3 sm:gap-4">
                    <div class="w-10 h-10 sm:w-12 sm:h-12 bg-[#111827] rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-inner">${cat.icon}</div>
                    <div>
                        <span class="block font-bold text-sm sm:text-base text-slate-100">${cat.name}</span>
                        <span class="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">${cat.id}</span>
                    </div>
                </div>
                ${!Categories.isDefault(cat.id) ? `
                    <button onclick="ExpenseCategoryUI.delete('${cat.id}')" class="p-2 text-slate-500 hover:text-red-400 transition-all">🗑️</button>
                ` : '<span class="text-[8px] font-black text-slate-700 px-2 tracking-tighter">SISTEMA</span>'}
            </div>
        `).join('');
    },

    async add() {
        const icon = document.getElementById('newCatIcon').value.trim() || '📦';
        const name = document.getElementById('newCatName').value.trim();

        if (!name) return Helpers.showToast('Inserisci un nome!', 'error');

        try {
            await Categories.add(icon, name);
            document.getElementById('newCatName').value = '';
            document.getElementById('categoriesListContainer').innerHTML = this.renderList();
            Helpers.showToast('Categoria creata!', 'success');
            if (window.Expenses) window.Expenses.render();
        } catch (e) { Helpers.showToast(e.message, 'error'); }
    },

    async delete(id) {
        if (!confirm('Vuoi davvero eliminare questa categoria?')) return;
        try {
            await Categories.delete(id);
            document.getElementById('categoriesListContainer').innerHTML = this.renderList();
            if (window.Expenses) window.Expenses.render();
            Helpers.showToast('Categoria rimossa', 'success');
        } catch (e) { Helpers.showToast(e.message, 'error'); }
    }
};
window.ExpenseCategoryUI = ExpenseCategoryUI;