# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PersonalDashboard** is a web-based personal management dashboard (agenda, goals, expenses, diet tracking) built with vanilla JavaScript + Tailwind CSS, backed by Supabase (PostgreSQL + Auth), and packaged for Android via Capacitor. The `www/` directory is the web root; `android/` contains Capacitor-generated Android build files.

## Development

There is no build step for the web app — open `www/index.html` directly in a browser, or serve with any static server. The app requires a live Supabase connection (credentials in `www/js/config.js`).

**Android build:**
```bash
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
| `www/js/agenda-bridge.js` | Registry for external events shown in agenda |
| `www/js/components/dashboard.js` | Drag-drop widget grid |
| `www/js/components/agenda/agenda.js` | Agenda controller — state, CRUD, navigation |
| `www/js/components/agenda/agenda_view.js` | All agenda render functions (day/week/month/year/list) |
| `www/js/components/expenses/expenses-main.js` | Expense module orchestrator |
| `www/js/components/statistics.js` | Analytics/charts (Chart.js) |

### Routing

Single-page app with hash-based routing. `navigation.js` maps route names to component render calls. Routes: `dashboard`, `agenda`, `goals`, `expenses`, `expenses-settings`, `statistics`, `diet`, `settings`, `modules`.

### Auth

Supabase Auth with email/password and Google OAuth. `www/js/supabase-config.js` initializes the client and exposes `window.getUser()`, `window.requireAuth()`, `window.logout()`. Auth uses `getSession()` (not `getUser()`) for reliability after OAuth redirects. Password reset flow is handled entirely in `login.html` via `onAuthStateChange` detecting the `PASSWORD_RECOVERY` event.

### Supabase Integration

Config in `www/js/config.js` (public anon key — safe for frontend, relies on Row Level Security). On Netlify, the key is injected at build time via environment variables (see `netlify.toml`). All DB access goes through `CachedCRUD` wrappers to maintain cache coherency.

### AgendaBridge — External Events in Agenda

`www/js/agenda-bridge.js` is a registry that lets any module inject read-only events into the agenda views. Loaded before all agenda scripts.

**Normalized event format:**
```js
{
  id: 'ext_expenses_123',   // unique, prefixed with module id
  _isExternal: true,
  moduleId: 'expenses',
  moduleLabel: 'Spese',
  date: 'YYYY-MM-DD',
  time: 'HH:MM' | null,    // null → shown in all-day strip; with time → shown in grid
  title: string,
  subtitle: string,         // e.g. '€ 45.00 · Cibo'
  color: '#f59e0b',
  icon: '💰',
  onNavigate: string|undefined, // optional JS expression to run when user taps the action button
}
```

**`onNavigate`**: optional field on an event. If present, the info popup shows "Apri dettaglio →" and evaluates the expression directly (no section change). If absent, the popup shows "Vai a [Module] →" and calls `window.showSection(moduleId)`. Use this to open a self-contained modal without leaving the agenda — e.g. `ExpenseModals.showDetail('123')` or `Diet.openModal(2, 'lunch')`.

**To register a new module:**
```js
AgendaBridge.register({
    id: 'goals',
    label: 'Obiettivi',
    color: '#8b5cf6',
    icon: '🎯',
    getEvents: (from, to) => Goals.getAgendaEvents(from, to)
});
```

Place the registration at the bottom of the module's file, after `window.ModuleManager` registration. The module must implement `getAgendaEvents(fromStr, toStr)` returning a promise of normalized events.

**Visibility settings** are stored in localStorage as `agenda_display_settings` (per-module boolean). The user controls these via the ⚙ button in the agenda header.

**Agenda rendering**: `_loadExternalEvents()` runs at the start of every `updateView()`, computes the date range for the current view, and calls `AgendaBridge.getEvents()`. External events are passed as a 5th parameter to all `AgendaViews.render*()` functions.

- **Day view**: untimed events → all-day badge strip; timed events → inline in the hour grid
- **Week view**: untimed events → badge strip above each day column (clickable); timed events → inline in the hour grid
- **List view**: external events interleaved with tasks per day, sorted by time
- **Month view**: colored dots per module on days that have external events

All external event badges/blocks call `AgendaBridge.showEventInfo(ev.id)` on click. Events are cached in `AgendaBridge._cache` (Map) at fetch time for fast lookup in the popup.

### Responsive / Mobile

Tailwind breakpoints (`md:`) handle desktop vs mobile layout. Capacitor wraps the web app for Android. All major views have separate Desktop and Mobile render functions (e.g. `renderDayDesktop` / `renderDayMobile`).
