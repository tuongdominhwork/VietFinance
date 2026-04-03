# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with HMR
npm run build      # Build for production
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

No test framework is configured — there is no test runner or test files.

## Architecture

**VietFinance** is a React 19 + Vite 8 SPA for a Vietnamese banking/fintech platform. It uses JavaScript (JSX), not TypeScript.

**Routing:** React Router DOM v7 with `BrowserRouter` in `App.jsx`. Routes are defined there and point to page components in `src/pages/`.

**Component structure:**
- `src/pages/` — page-level route targets (e.g. `landingPage.jsx`)
- `src/components/` — shared/reusable components (e.g. `navBar.jsx`)
- `src/assets/` — images (`hero.png`, `logo.png`)
- `src/index.css` — global styles
- `src/App.jsx` — root component, router setup
- `src/main.jsx` — entry point, mounts `<App />` into `#root`

**ESLint config** uses ESLint v9 flat config format. Unused vars are allowed if prefixed with uppercase or `_`. The `dist/` directory is excluded from linting.

**Build tool:** Vite with `@vitejs/plugin-react` using the Oxc compiler (faster than Babel/SWC).

The project is in early development — most components are placeholders.
