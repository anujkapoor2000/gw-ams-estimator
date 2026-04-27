# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server (localhost:5173)
npm run build      # Production build → dist/
npm run preview    # Serve the production build locally
npm run lint       # ESLint on src/ — zero-warnings policy (fails on any warning)
```

There is no test suite. Linting is the only automated check.

## Architecture

This is a **fully client-side, single-page React estimator tool** with no backend, no API calls, and no state management library. Everything lives in three source files:

- **`src/App.jsx`** (~1500+ lines) — the entire application: all state, all calculation logic, all JSX, all inline styles, and tab navigation.
- **`src/exportUtils.js`** — PDF (jsPDF + autotable) and PPTX (PptxGenJS) export handlers. Libraries are loaded lazily from CDN only when the user triggers an export.
- **`src/main.jsx`** — React 18 root mount, nothing else.

### State & Data Flow

All state is React `useState` in `App.jsx`. No context, no reducers. The shape:

| State | Description |
|---|---|
| `activeTab` | Current tab: `overview`, `estimation`, `roadmap`, `sla`, `ai`, `kt` |
| `selectedModules` | Array of active Guidewire modules (PC, CC, BC, Digital - Jutro) |
| `selectedIntegrations` | Array of active integration names |
| `teamRate`, `sprintsPerYear`, `spPerSprint`, `ktMonths`, `calMonths`, `currency` | Commercial sliders/selectors |
| `exporting` | Boolean flag while PDF/PPTX is being generated |

### Calculation Pipeline

Pure computation flows top-down in render — no `useMemo`, no derived state. Key functions:

- `calcAnnualEffort()` → aggregates L2/L3 incident hours per selected module + enhancement buffer
- `calcFTE()` → divides annual hours by `FTE_HRS` (1760 hrs/year)
- `applyAIGain()` → applies efficiency multipliers: Y1=8%, Y2=18%, Y3=28%
- `getModKey()` → maps full module name to short key used in `BASE_INCIDENTS`/`EFFORT_HRS` constants

### Hardcoded Data Constants (in `App.jsx`)

All baseline data is hardcoded — there is no external data source:

```js
BASE_INCIDENTS = { L2: { PC, CC, BC, Digital }, L3: { ... } }  // Incident volumes
EFFORT_HRS     = { L2: { P1, P2, P3, P4 }, L3: { ... } }       // Hrs per priority
AI_GAINS       = { Y1: 0.08, Y2: 0.18, Y3: 0.28 }
FTE_HRS        = 1760
```

### Inline UI Components

Small render helpers are defined as inline functions inside `App.jsx` (not separate files):

`Section`, `Badge`, `KPI`, `DataTable`, `Slider` — all return JSX with inline styles.

### Color / Branding System

All colors are defined in a constant `C` at the top of `App.jsx`. Use these — do not introduce new hex values:

```js
const C = {
  blue: "#003087", red: "#E4002B", navy: "#001A4E",
  lightBlue: "#0057A8", gray: "#F4F6FA", darkGray: "#2D3748",
  mid: "#64748B", green: "#0A7C59", amber: "#D97706",
  teal: "#0891B2", purple: "#6D28D9"
};
```

### Export Utilities

`exportUtils.js` exports `exportToPDF(state)` and `exportToPPTX(state)`. Both functions:
1. Dynamically inject `<script>` tags to load libraries from CDN
2. Wait for them to attach to `window`
3. Generate and trigger download

When modifying exports, be aware that all computed values must be passed in as arguments — the export functions have no access to React state directly.

### Deployment

Deployed to Vercel. `vercel.json` sets the build command to `npm run build`, output dir to `dist`, and adds a catch-all rewrite for SPA routing. The Vite base is `./` (relative), allowing deployment to subdirectory paths.
