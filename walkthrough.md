# Reworked Frontend Walkthrough

This document outlines the changes made to replace the old Create React App frontend with a modern, high-fidelity React + Vite operations command center.

## Changes Accomplished

We successfully overhauled the frontend in [frontend](file:///d:/AidFlow/frontend):

### 1. Project Scaffolding & Dependencies
- Deleted all old files (except `design.md`).
- Initialized a React + Vite project in the current directory using JavaScript templates.
- Configured [vite.config.js](file:///d:/AidFlow/frontend/vite.config.js) to:
  - Run the dev server on port `3000`.
  - Proxy all `/api` requests to the local backend on `http://localhost:5000`.
- Configured [index.html](file:///d:/AidFlow/frontend/index.html) to load external styles (Leaflet CSS) and custom fonts (Geist, DM Sans, DM Mono) directly from Google Fonts.
- Installed required production dependencies: `react-router-dom`, `leaflet`, `react-leaflet`, `framer-motion`, `lucide-react`, `axios`, `jwt-decode`, and `recharts`.

### 2. Premium CSS Design Tokens
- Replaced the styling system in [index.css](file:///d:/AidFlow/frontend/src/index.css) with vanilla CSS variables and classes including:
  - Layered atmosphere stacks on `body` (Grid overlay, Void base `#060816`, radial map highlight).
  - Glassmorphism 2.0 cards (`.card`, `.ai-card` with AI-accent border glows).
  - Sacred Blue (human action) vs. Purple (AI output) color parameters.
  - Core severity scale colors and telemetry pulse marker keyframes.
  - Animated SVG flow patterns on optimal leaflet route paths.

### 3. State & Shared Components
- **[AuthContext.jsx](file:///d:/AidFlow/frontend/src/context/AuthContext.jsx)**: Handles login, registration, localStorage session storage, user roles, and auto-injection of JWT headers.
- **[MapContainer.jsx](file:///d:/AidFlow/frontend/src/components/MapContainer.jsx)**: Custom wrapper for Leaflet rendering:
  - Dark-theme CartoDB tiles.
  - Pulse ring disaster zone circles.
  - Telemetry vehicle nodes (rotating bearing pointers and active/idle pulse tags).
  - Dashed flow animation lines representing dispatched paths.

### 4. Role-Based Command Dashboards
- **[AdminDashboard.jsx](file:///d:/AidFlow/frontend/src/components/AdminDashboard.jsx)**: Full mission command view. Features an incident console with critical entries pinned at the top, AI recommendation panels with confidence meters, live telemetry trend sparklines, alert feeds (tabs for Critical, Routing, Inventory, AI), and active dispatch controls (Approve, Reroute, Complete).
- **[ManagerDashboard.jsx](file:///d:/AidFlow/frontend/src/components/ManagerDashboard.jsx)**: Stock telemetry dashboard. Features critical threshold warnings, donation approval queues, and resource additions forms.
- **[VolunteerDashboard.jsx](file:///d:/AidFlow/frontend/src/components/VolunteerDashboard.jsx)**: Mobile-optimized gesture drawer. Features full map views, log donation overlays, and task lists.
- **[CitizenDashboard.jsx](file:///d:/AidFlow/frontend/src/components/CitizenDashboard.jsx)**: Simplified assistance request panel. Features pulsing SOS buttons, assistance catalogs, and status tracking boards.

- **[App.jsx](file:///d:/AidFlow/frontend/src/App.jsx)**: Sets up router switchboard and wraps the application dashboards in custom Protected Route wrappers verifying user permissions on load.

---

## Verification & Build Results

We executed the production build using Vite compiler tools to ensure absolute correctness and validation:

```bash
npm run build
```

**Compilation Output:**
```
vite v8.0.16 building client environment for production...
transforming...✓ 1849 modules transformed.
rendering chunks...
computing gzip size...
dist/assets/logo-CSZYnv8V.svg     0.28 kB │ gzip:   0.21 kB
dist/index.html                   1.15 kB │ gzip:   0.62 kB
dist/assets/index-DN31hYxh.css    6.83 kB │ gzip:   2.17 kB
dist/assets/index-PZkmt9eB.js   508.74 kB │ gzip: 150.15 kB

✓ built in 454ms
```
The application compiles perfectly in **454ms** with **zero errors**.

---

## Instructions for Running Locally

1. **Start the Backend server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Start the Frontend development server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
