# 🎨 AidFlow AI v2 — Frontend Design Specification

> **Version:** 2.0 — Command Center Makeover
> **Status:** Active
> **Audience:** Frontend engineers, designers, and product leads

This document is the **single source of truth** for the AidFlow AI visual language, component system, layout architecture, map design, and motion philosophy. It supersedes v1 entirely.

---

## 🧭 Design Vision

AidFlow AI is not a CRUD dashboard. It is a **professional emergency-response command platform** — the kind of interface used in drone operations centers, crisis response rooms, and AI-driven dispatch systems.

### From → To

| Before | After |
|---|---|
| Dark dashboard with glass cards | AI Operations Command Center |
| Traditional admin panel feel | Map-first spatial experience |
| Static data cards | Live telemetry with trends |
| Generic SaaS blue | Human (blue) vs AI (purple) visual split |
| Inter everywhere | Geist Display + DM Mono for precision |
| Badge-based severity | Pulsing, glowing, pinned criticality |

### Core Aesthetic Pillars

- **Mission Control Density** — Every pixel earns its place. Data is rich but never cluttered. The interface must function under adrenaline.
- **Spatial Depth** — Layered backgrounds, glowing map overlays, and translucent panels create physical depth without noise.
- **Human × AI Clarity** — Blue = human action. Purple = AI output. This color split is sacred and consistent across the entire app.
- **Living Interface** — Routes animate. Markers pulse. AI recommendations reveal with a spring. The system always feels *on*.

---

## 🌌 Background & Atmosphere

### Base Background Stack

Replace the flat `#0b1121` with a **layered atmospheric background**:

```css
/* Layer 1 — Void base */
background-color: #060816;

/* Layer 2 — Subtle grid overlay */
background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
background-size: 40px 40px;

/* Layer 3 — Central radial glow (map focus) */
background: radial-gradient(ellipse 80% 60% at 55% 45%, rgba(59,130,246,0.10) 0%, transparent 70%);
```

Apply all three layers stacked on the root `<body>` or layout wrapper. The radial glow is centered toward the map column to draw the eye.

---

## 🎨 Color System

### Brand & Interaction Colors

| Token | Value | Role |
|---|---|---|
| `--primary` | `#3B82F6` | Human actions, CTAs, map routes |
| `--primary-hover` | `#2563EB` | Button hover, active nav |
| `--ai-accent` | `#7C3AED` | All AI output, recommendations, NLP results |
| `--ai-glow` | `rgba(124,58,237,0.35)` | AI card glow, confidence meters |
| `--success` | `#22C55E` | Resolved, delivered, dispatched |
| `--warning` | `#F59E0B` | Pending, low stock, medium severity |
| `--critical` | `#EF4444` | Critical incidents, danger states |
| `--info` | `#06B6D4` | Informational, queued, NLP analyzed |

### The Human × AI Rule

> Blue = human-initiated actions.
> Purple = AI-generated outputs.

This split must be maintained across buttons, borders, badges, and glow effects. Never use `--ai-accent` for user action buttons. Never use `--primary` for AI confidence indicators.

### Severity Scale

| Level | Color | Token |
|---|---|---|
| Info | `#06B6D4` | `--severity-info` |
| Low | `#22C55E` | `--severity-low` |
| Medium | `#F59E0B` | `--severity-medium` |
| High | `#F97316` | `--severity-high` |
| Critical | `#EF4444` | `--severity-critical` |

Critical incidents: pulsing border glow, elevated `z-index`, pinned to top of incident lists.

### Neutral Scale (Dark Mode)

| Role | Token | Value |
|---|---|---|
| App background | `--bg-app` | `#060816` |
| Card surface | `--bg-card` | `rgba(255,255,255,0.04)` |
| Sidebar | `--bg-sidebar` | `#0a1020` |
| Input | `--bg-input` | `#1a2236` |
| Border subtle | `--border-subtle` | `rgba(255,255,255,0.08)` |
| Border mid | `--border-mid` | `rgba(255,255,255,0.12)` |
| Text primary | `--text-main` | `#F1F5F9` |
| Text muted | `--text-muted` | `#94A3B8` |
| Text dim | `--text-dim` | `#475569` |

---

## 🔠 Typography

Retire Inter as the display font. Use a pairing that reads as **precision tooling**, not generic SaaS.

### Font Stack

```css
/* Headings — Tight, technical, modern */
--font-display: 'Geist', 'Inter Tight', sans-serif;

/* Body — Readable at density */
--font-body: 'DM Sans', sans-serif;

/* Monospaced data — Coordinates, IDs, telemetry */
--font-mono: 'DM Mono', 'JetBrains Mono', monospace;
```

### Type Scale

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title | `2rem` | 700 | Geist, tight tracking `-0.03em` |
| Section heading | `1.25rem` | 600 | Geist |
| Card title | `0.9rem` | 600 | Uppercase, `0.08em` tracking |
| Body | `0.875rem` | 400 | DM Sans, `1.6` line height |
| Data value | `1.5rem` | 700 | DM Mono for numbers |
| Badge / label | `0.7rem` | 700 | Uppercase, `0.1em` tracking |
| Timestamp | `0.75rem` | 400 | DM Mono, `--text-dim` |

---

## 📐 Layout Architecture

### Desktop Grid

The **map is the product**. It occupies 60–70% of the viewport at all times.

```
┌────────────────────────────────────────────────────┐
│  Global Command Bar                                │
├──────────┬─────────────────────────────────────────┤
│          │                                         │
│  Nav     │         LIVE DISASTER MAP               │
│  (64px)  │         (60–70% viewport width)         │
│          │                                         │
├──────────┴─────────────────────────────────────────┤
│  AI Insights Panel  │  Resources  │  Incidents     │
└─────────────────────┴─────────────┴────────────────┘
```

**Rules:**
- Map column: `minmax(0, 1fr)` dominant, never shrinks below 55vw on desktop
- Side panels: `320px` fixed, scroll independently
- Command bar: `48px` height, always on top, `z-index: 100`
- AI Insights panel: bottom strip, `220px` height, horizontally scrollable cards

### Responsive Breakpoints

```
Mobile:   < 768px    → Single column, map full-width (300px tall), tabbed panels
Tablet:   768–1280px → Map + one panel column (incident list)
Desktop:  > 1280px   → Full command center layout
```

### Mobile: Volunteer Field View

Mobile experience should feel like **Google Maps + task list**, not a shrunken desktop:

- Fullscreen map with bottom sheet drawer
- Floating action button: "Log Donation" / "Report Incident"
- Swipe-up panel for task list and route details
- No sidebar — use a bottom navigation bar instead

---

## 🧱 Components

### Glassmorphism 2.0

All panels and cards use the upgraded glass style. Reduce blur, reduce opacity — more premium, less "frosted glass app":

```css
.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-radius: 14px;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}
```

### Metric Cards (Upgraded)

Replace static number cards with **trend-aware telemetry panels**:

```
┌────────────────────────────┐
│ ACTIVE INCIDENTS       ↑   │
│                            │
│  12                        │
│  ▲ 18%  last 24h           │
│  ▁▃▅▆▃▇▅▄  (sparkline)    │
└────────────────────────────┘
```

Every metric answers: *Is this improving or worsening?*

Required elements:
- Metric label in `--text-muted` uppercase
- Large value in `--font-mono`
- Trend arrow + percentage + timeframe
- 8-point sparkline (CSS or SVG)
- Live indicator dot (green pulse = fresh data)

### AI Recommendation Card

All AI output uses the purple left-border treatment:

```css
.ai-card {
  border-left: 3px solid var(--ai-accent);
  background: linear-gradient(135deg,
    rgba(124,58,237,0.08) 0%,
    rgba(255,255,255,0.03) 100%);
}
```

**Anatomy:**

```
┌─ 🤖 AI RECOMMENDATION ──────────────────────┐
│                                              │
│  Deploy Unit B-12                            │
│                                              │
│  Reason:                                     │
│  Closest available resource                  │
│  Road network clear · Inventory sufficient   │
│                                              │
│  Confidence  ██████████░  94%               │
│                                              │
│  [Accept]  [Modify]  [Dismiss]               │
└──────────────────────────────────────────────┘
```

Confidence meter: CSS progress bar with `--ai-accent` fill and a glow `box-shadow`.

### AI Confidence Meter

```css
.confidence-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(124,58,237,0.2);
}
.confidence-fill {
  background: var(--ai-accent);
  box-shadow: 0 0 10px var(--ai-glow);
  transition: width 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### NLP Analysis Panel

```
┌─ NLP ANALYSIS ──────────────────────┐
│ "High Flood Risk near Dam"           │
│                                      │
│ Severity   ████████░░  High          │
│ Confidence ██████████  89%           │
│                                      │
│ DETECTED ENTITIES                    │
│ 📍 Kosi Dam  🌊 +3.2m  🏘️ Village 12│
└──────────────────────────────────────┘
```

### Buttons

```css
/* Primary — Human action */
.btn-primary {
  background: linear-gradient(135deg, #2563EB, #3B82F6);
  box-shadow: 0 4px 16px rgba(59,130,246,0.3);
  transition: transform 150ms, box-shadow 150ms;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(59,130,246,0.45);
}

/* AI action */
.btn-ai {
  background: linear-gradient(135deg, #6D28D9, #7C3AED);
  box-shadow: 0 4px 16px rgba(124,58,237,0.3);
}
```

### Notification Center

Timeline-style alert feed with category filtering:

```
🔴 CRITICAL    Unit B-7 route blocked by flood    2m ago
🟣 AI          New routing suggestion available   5m ago
🟡 INVENTORY   Camp 4 water stock below 20%       12m ago
🔵 VOLUNTEER   3 new registrations pending        18m ago
```

Category tabs: Critical · Routing · Inventory · AI · Volunteer

---

## 🗺️ Map Design

### Tile Theme

Abandon default Leaflet tiles. Use a **dark cartography** style:

- Dark navy ocean and terrain base (`#060c1a` water)
- Roads: thin `rgba(255,255,255,0.15)` lines, major roads at `0.35`
- Labels: minimal, `DM Mono`, 10px, `rgba(255,255,255,0.5)`
- Suggested provider: Mapbox Dark or CartoDB Dark Matter tiles

### Disaster Zone Overlays

Replace plain colored circles with **layered zone visualization**:

```
Layer 1: Blurred glow  — large radius, low opacity fill
Layer 2: Solid boundary — crisp 2px border, medium opacity fill
Layer 3: Pulse ring    — animated expanding ring on critical zones
```

Zone colors follow severity scale tokens.

### Vehicle / Unit Markers

Each dispatched unit renders as a **telemetry node**:

```
      ⬆ (heading arrow, rotates with bearing)
    ┌───┐
    │ 🚚 │  ← vehicle icon
    └───┘
   ◎ pulsing ring (active = blue, idle = gray)
  [B-12] status badge
```

CSS for pulse ring:

```css
@keyframes telemetry-pulse {
  0%   { transform: scale(1);   opacity: 0.8; }
  70%  { transform: scale(2.2); opacity: 0;   }
  100% { transform: scale(1);   opacity: 0;   }
}
```

### Route Lines

| Route type | Style |
|---|---|
| Optimal | Bold `#3B82F6`, animated dash offset (movement feel) |
| Alternative | Dashed `#64748B`, 50% opacity |
| Blocked / hazard | Red `#EF4444`, cross-hatch pattern overlay |

Animated dash for optimal route:

```css
@keyframes route-flow {
  from { stroke-dashoffset: 100; }
  to   { stroke-dashoffset: 0;   }
}
```

---

## ✨ Motion System

All animation values are intentional — not decorative.

| Interaction | Duration | Easing | Notes |
|---|---|---|---|
| Data refresh | `200ms` | `ease-out` | Number count-up via JS |
| Map pan / zoom | `400ms` | `cubic-bezier(0.4,0,0.2,1)` | Smooth focus changes |
| AI card reveal | spring | `damping: 20, stiffness: 100` | Confidence bar fills on mount |
| Route draw | `800ms` | `ease-in-out` | Stroke-dashoffset animation |
| Panel slide-in | `300ms` | spring `damping: 25` | Drawers and modals |
| Stagger reveals | `50ms` delay per child | `ease-out` | List and card grids |
| Pulse (critical) | `2s` infinite | `ease-in-out` | Severity-critical markers |

**Rule:** No animation should feel decorative. Each one communicates a state change.

---

## 🔐 Role-Based Variants

| Role | Interface Focus | Visual Signature |
|---|---|---|
| Emergency Admin | Full command center, dispatch controls, AI panel | Blue/purple accent full layout |
| Branch Manager | Inventory charts, stock warnings, transfer requests | Warning-yellow prominence |
| Volunteer | Field task list, donation log, route-to-location | Simplified; map + bottom sheet |
| Affected Citizen | Emergency request button, live tracking, chat | Critical-red CTA, minimal chrome |

---

## 📁 Implementation Notes

- All CSS tokens defined in `src/index.css` under `:root` and `[data-theme="dark"]`
- Geist + DM Sans loaded from `fontsource` or Google Fonts
- DM Mono used for all numeric/telemetry data
- Framer Motion for React transitions; CSS keyframes for map/SVG animations
- Mapbox GL JS or CartoDB Dark Matter tiles for map theme
- Sparklines via lightweight `react-sparklines` or custom `<svg>` paths
- Confidence meters: pure CSS, no chart library needed

---

*Last updated: June 2026 · AidFlow AI Design System v2.0*