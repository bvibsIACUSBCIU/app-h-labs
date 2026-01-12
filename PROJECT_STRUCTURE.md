# Project Structure: H Labs Ecosystem OS

## Core Folders
- `components/`: Global UI components (Terminal Header, Ticker Tape, etc.)
- `dashboard/`: Main dashboard views and sub-components.
  - `WarDash/`: Specific widgets for the War Room terminal.
- `landing/`: (Optional) Landing page components.

## Foundation
- `App.tsx`: Main application router and state management.
- `index.tsx`: Application entry point.
- `index.html`: Base HTML template.
- `vite.config.ts`: Vite configuration.
- `tsconfig.json`: TypeScript configuration.
- `types.ts`: Global TypeScript interfaces.
- `i18n.ts`: Internationalization (i18n) setup for EN/ZH.
- `constants.ts`: Static data and mock/initial data for UI.

## Build & Deploy
- `package.json`: Project dependencies and scripts.
- `wrangler.toml`: Cloudflare Workers/Pages configuration.
- `_redirects`: Single Page Application (SPA) redirect rules.
