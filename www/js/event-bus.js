/**
 * Event System - Notify components when data changes
 */

const EventBus = {
    listeners: {},

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        console.log(`📡 Subscribed to event: ${event}`);
    },

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    },

    /**
     * Emit an event to all subscribers
     */
    emit(event, data) {
        console.log(`🔔 Event emitted: ${event}`, data);
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (e) {
                console.error(`Error in event listener for ${event}:`, e);
            }
        });
    },

    /**
     * Clear all listeners for an event
     */
    clear(event) {
        if (event) {
            delete this.listeners[event];
        } else {
            this.listeners = {};
        }
    }
};

// Export globale
window.EventBus = EventBus;
console.log('✅ EventBus module loaded');
