# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PersonalDashboard** is a web-based personal management dashboard (agenda, goals, expenses, diet tracking) built with vanilla JavaScript + Tailwind CSS, backed by Supabase (PostgreSQL + Auth), and packaged for Android via Capacitor. The `www/` directory is the web root; `android/` contains Capacitor-generated Android build files.

## Development

There is no build step for the web app — open `www/index.html` directly in a browser, or serve with any static server. The app requires a live Supabase connection (credentials in `www/js/config.js`).

**Android build:**
```bash
npm run build          # no-op currently
npx cap sync android   # sync web assets to Android project
npx cap open android   # open in Android Studio
```

No test suite exists (`npm test` exits with error by design).

## Architecture

### Startup & Module System

**Entry point**: `www/js/app-init.js` — runs a 6-phase initialization (auth check → load modules → render sidebar → load settings → preload data → render dashboard). All other code is loaded before it in `index.html`.

**Module system** (`www/js/module-manager.js`): Optional features (Expenses, Goals, Diet) can be toggled by the user. Module state is persisted to Supabase (JSONB column). The sidebar navigation is dynamically built based on active modules.

### Data Flow

```
Supabase DB ←→ CachedCRUD (www/js/cached-crud.js)
                    ↓ wraps
             DataCache (www/js/data-cache.js)   ← memory + localStorage, TTL-based
                    ↓ on mutation
             EventBus (www/js/event-bus.js)      ← pub/sub for cross-component updates
                    ↓
             Dashboard widgets re-render
```

- **CRUD modules**: `www/js/modules/task-crud.js`, `goal-crud.js`, `note-crud.js` and `www/js/components/expenses/expense-crud.js`
- **Cache keys**: prefixed `app_cache_*` in localStorage; TTL ~1 min for data, ~5 min for config
- **Dashboard layout**: persisted to localStorage as `dashboard_config_v2`

### Component Pattern

Every component is a plain object with `init()` and `render()` methods:
```js
const ComponentName = {
    init() { /* setup, event listeners */ },
    render() { /* generate and inject HTML */ }
};
```

Components register widgets (objects with `{ id, title, size, render }`) that the dashboard grid picks up. The dashboard is a 4-column drag-and-drop grid (2-column on mobile).

### Key Files

| File | Role |
|---|---|
| `www/js/app-init.js` | 6-phase startup orchestrator |
| `www/js/module-manager.js` | Plugin enable/disable system |
| `www/js/navigation.js` | Dynamic sidebar + SPA routing |
| `www/js/event-bus.js` | Cross-component event system |
| `www/js/data-cache.js` | Two-tier cache (memory + localStorage) |
| `www/js/cached-crud.js` | Cache-aware wrappers for all DB ops |
| `www/js/components/dashboard.js` | Drag-drop widget grid |
| `www/js/components/agenda/agenda.js` | Main agenda (largest: ~57KB) |
| `www/js/components/expenses/expenses-main.js` | Expense module orchestrator |
| `www/js/components/statistics.js` | Analytics/charts (Chart.js) |

### Routing

Single-page app with hash-based routing. `navigation.js` maps route names to component render calls. Routes: `dashboard`, `agenda`, `goals`, `expenses`, `expenses-settings`, `statistics`, `diet`, `settings`, `modules`.

### Supabase Integration

Config in `www/js/config.js` (public anon key — safe for frontend, relies on Row Level Security). Client initialized in `www/js/supabase-config.js`. All DB access goes through `CachedCRUD` wrappers to maintain cache coherency.

### Responsive / Mobile

Tailwind breakpoints (`md:`) handle desktop vs mobile layout. Capacitor wraps the web app for Android. Recent commits have focused heavily on mobile layout optimization for each module.
