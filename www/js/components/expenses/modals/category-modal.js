/**
 * Expense Category Modal - Gestione Categorie Personalizzate
 */
const ExpenseCategoryUI = {
    show() {
        const modal = document.createElement('div');
        modal.id = 'categoriesModal';
        modal.className = 'modal fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn p-4';
        
        modal.innerHTML = `
            <div class="bg-[#1a222f] border border-slate-700/50 rounded-[2rem] shadow-2xl p-8 w-full max-w-xl border-slate-800">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl">📂</span>
                        <div>
                            <h3 class="text-2xl font-black text-white">Categorie</h3>
                            <p class="text-slate-400 text-sm font-medium">Personalizza i tuoi flussi</p>
                        </div>
                    </div>
                    <button onclick="ExpenseModals.close('categoriesModal')" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:text-white">✕</button>
                </div>
                
                <div class="bg-[#111827]/50 p-6 rounded-2xl border border-slate-700/30 mb-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">Nuova Categoria</p>
                    <div class="flex gap-3">
                        <input type="text" id="newCatIcon" value="🍕" class="w-14 h-14 bg-[#1a222f] border border-slate-700 rounded-xl text-center text-2xl focus:outline-none focus:border-indigo-500 cursor-pointer">
                        <input type="text" id="newCatName" placeholder="Nome categoria..." class="flex-1 bg-[#1a222f] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500">
                        <button onclick="ExpenseCategoryUI.add()" class="bg-[#5c56f0] hover:bg-[#4a44d1] text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">Aggiungi</button>
                    </div>
                </div>

                <div class="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar" id="categoriesListContainer">
                    ${this.renderList()}
                </div>

                <div class="mt-8 pt-6 border-t border-slate-800">
                    <button onclick="ExpenseModals.close('categoriesModal')" class="w-full py-4 bg-[#242f3f] text-slate-200 rounded-2xl hover:bg-slate-700 transition font-black uppercase tracking-widest text-xs">Chiudi</button>
                </div>
            </div>
        `;
        document.getElementById('modalsContainer').appendChild(modal);
    },

    renderList() {
        const allCategories = Categories.getAll();
        return allCategories.map(cat => `
            <div class="group flex items-center justify-between p-4 bg-[#1f2937]/50 rounded-2xl border border-slate-700/20 hover:border-slate-600/40 transition-all">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-[#111827] rounded-xl flex items-center justify-center text-xl shadow-inner">${cat.icon}</div>
                    <div>
                        <span class="block font-bold text-slate-100">${cat.name}</span>
                        <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">${cat.id}</span>
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