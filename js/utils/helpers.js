/**
 * Helper Functions - Updated to use SettingsManager
 * VERSION: FIXED - Added missing functions (isToday, downloadFile)
 */

const Helpers = {
    /**
     * Get month name from index
     */
    getMonthName(monthIndex) {
        const months = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        return months[monthIndex];
    },

    /**
     * Check if a date is today
     */
    isToday(date) {
        const d = new Date(date);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    },

    /**
     * Format custom month name based on user settings
     */
    formatCustomMonthName(date = new Date()) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            date = new Date();
        }

        const { startDate, endDate } = this.getCustomMonthRange(date);
        
        const formatShortDate = (d) => {
            const day = d.getDate();
            const month = d.toLocaleDateString('it-IT', { month: 'short' });
            return `${day} ${month}`;
        };
        
        return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
    },

    /**
     * Get custom month range based on user settings
     */
    getCustomMonthRange(date = new Date()) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            date = new Date();
        }
        
        const monthStartDay = window.SettingsManager?.get('firstDayOfMonth') || 25;
        
        const year = date.getFullYear();
        const month = date.getMonth();
        const currentDay = date.getDate();

        let startDate, endDate;

        if (currentDay >= monthStartDay) {
            startDate = new Date(year, month, monthStartDay, 0, 0, 0);
            endDate = new Date(year, month + 1, monthStartDay - 1, 23, 59, 59);
        } else {
            startDate = new Date(year, month - 1, monthStartDay, 0, 0, 0);
            endDate = new Date(year, month, monthStartDay - 1, 23, 59, 59);
        }

        return { startDate, endDate };
    },

    /**
     * Format date based on user settings
     */
    formatDate(date, format = 'full') {
        if (!date) return '';
        const d = new Date(date);
        
        const dateFormat = window.SettingsManager?.get('dateFormat') || 'DD/MM/YYYY';
        
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        if (format === 'time') return `${hours}:${minutes}`;

        if (format === 'short') {
            if (dateFormat === 'DD/MM/YYYY') return `${day}/${month}/${year}`;
            if (dateFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
            if (dateFormat === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
        }

        if (format === 'full') {
            const dayName = d.toLocaleDateString('it-IT', { weekday: 'long' });
            const monthName = d.toLocaleDateString('it-IT', { month: 'long' });
            return `${dayName} ${day} ${monthName} ${year}`;
        }

        return d.toLocaleDateString('it-IT');
    },

    /**
     * Format currency based on user settings
     */
    formatCurrency(amount) {
        const currencySymbol = window.SettingsManager?.get('currencySymbol') || '€';
        return `${amount.toFixed(2)} ${currencySymbol}`;
    },

    /**
     * Get quarter from date
     */
    getQuarter(date) {
        const month = date.getMonth() + 1;
        return Math.ceil(month / 3);
    },

    /**
     * Check if date is overdue
     */
    isOverdue(dateStr) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        return date < now;
    },

    /**
     * Calculate percentage
     */
    calculatePercentage(value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Download content as file
     */
    downloadFile(content, fileName, contentType) {
        const a = document.createElement("a");
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const colors = {
            success: 'from-green-500 to-emerald-600',
            error: 'from-red-500 to-red-600',
            info: 'from-blue-500 to-cyan-600',
            warning: 'from-yellow-500 to-orange-600'
        };

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-4 bg-gradient-to-r ${colors[type]} text-white rounded-xl shadow-2xl z-50 animate-slideUp font-semibold flex items-center gap-3`;
        toast.innerHTML = `
            <span class="text-2xl">${icons[type]}</span>
            <span>${message}</span>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity 0.3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Export globale
window.Helpers = Helpers;
console.log('✅ Helpers module loaded (with isToday and downloadFile)');