# Frontend Specification v2 (Skill-Aligned) — AMA Video Streaming Platform

## 1) Review Outcome
Yes—this v2 explicitly follows the frontend-design skill and keeps your technical constraints intact.

What changed versus v1:
- Added a clear aesthetic direction with an intentional visual identity.
- Added distinctive typography, color, motion, and composition rules.
- Added an unforgettable moment interaction for brand differentiation.
- Kept architecture fixed to Next.js 16 + React 19 + Tailwind, Server Components by default, Client Components only for interactivity.

---

## 2) Design Intent (Skill-Driven)

### Product Purpose
A media-first control surface for live and upcoming events where users can quickly decide what to watch now, what to queue next, and what insights are available.

### Target Aesthetic Direction
Cinematic Broadcast Noir
- Tone: premium, dramatic, event-night atmosphere.
- Composition: asymmetric two-column stage, layered cards, controlled glow, deep negative space.
- Interaction personality: decisive and focused, with subtle energetic motion (not playful).

### Differentiation Hook (Memorable Element)
Pulse-Line Countdown Hero: the live hero card features a synchronized pulse line under the countdown that accelerates as start time approaches, creating urgency without clutter.

---

## 3) Existing Stack Review (Current Repo)

### Backend/API (observed)
- FastAPI application and routers (src/main.py, src/api/videos.py, src/api/analytics.py)
- Current endpoints available to frontend:
  - GET /api/videos
  - POST /api/videos/upload
  - GET /api/videos/{video_id}
  - POST /api/videos/{video_id}/index
  - GET /api/videos/{video_id}/insights
  - GET /api/videos/{video_id}/transcript
  - DELETE /api/videos/{video_id}
  - GET /api/analytics/videos
  - GET /api/analytics/insights
  - POST /api/analytics/sync
  - GET /api/analytics/front-door

### Cloud/Infra (observed)
- Azure Blob Storage, Video Indexer, Synapse Analytics, Front Door
- IaC templates exist in both:
  - infrastructure/bicep/
  - infrastructure/terraform/

### Frontend Implication
Backend is API-first and cleanly separable, so frontend can be introduced as a dedicated app without changing backend business logic.

---

## 4) Technical Architecture (Unchanged Core)

- Framework: Next.js 16 (App Router)
- UI runtime: React 19
- Styling: Tailwind CSS
- Rendering strategy:
  - Server Components by default for data-heavy initial views and SEO.
  - Client Components only for browser-driven state and interaction.
- API boundary principle:
  - Frontend handles rendering/orchestration.
  - Backend remains source of truth for workflow/state transitions and analytics logic.

---

## 5) Information Architecture

## 5.1 Routes
- / Live Events Dashboard
- /events/[id] Watch/Event Detail
- /library Video Library and operations
- /analytics Insights and operational metrics

## 5.2 Primary User Flows
1. Discover live event on hero → open watch page
2. Scan scheduled events → set intent for next watch
3. Browse upcoming rail → open item details
4. From library, trigger indexing and inspect transcript/insights

---

## 6) Layout + Composition Specifications

## 6.1 Dashboard (/) Composition
Desktop grid:
- Left (≈ 2fr): Hero Live Card, Live Chat block, wide upcoming rail
- Right (≈ 1fr): Scheduled list + compact upcoming stack

Responsive collapse:
- Tablet: single column, preserve visual priority order
- Mobile order:
  1) Hero Live Card
  2) Scheduled Events
  3) Live Chat
  4) Upcoming rails

## 6.2 Spacing Rhythm
- Vertical section rhythm: large, medium, compact cadence (not uniform)
- Hero-to-chat gap intentionally tighter than chat-to-upcoming gap to reinforce hierarchy
- Card corner radii consistent across modules

---

## 7) Visual System (Skill-Aligned)

## 7.1 Typography (Distinctive, Non-Generic)
Use a two-family system:
- Display: Bebas Neue (event titles, hero labels, section impact text)
- Body/UI: Manrope (metadata, lists, controls, descriptive text)

Rules:
- Hero title: uppercase, high tracking control, tight line-height
- Metadata: lower visual weight, consistent alignment baselines
- Numeric timers: tabular-friendly style where possible

## 7.2 Color + Surface Language
Dark-first cinematic palette via CSS variables:
- --bg-0: near-black blue
- --bg-1: deep slate
- --surface-0: elevated charcoal glass
- --accent-live: electric magenta-red for live state
- --accent-signal: cool cyan for informational contrasts
- --text-strong / --text-muted

Usage rules:
- Accent is sparse and meaningful (live status, CTA, active timer)
- Surfaces use layered transparency + border highlights (no flat slabs)
- Avoid rainbow gradients; keep palette disciplined

## 7.3 Motion Language
- Entry: staggered reveal by section (hero → schedule → chat → rails)
- Hover: subtle lift and border luminance shift on cards
- Countdown pulse-line: low-amplitude animation that intensifies near start
- Respect reduced motion preferences

## 7.4 Texture + Depth
- Use soft grain overlay and vignette framing to create atmosphere
- Shadow style: broad, low-opacity cinematic depth (not hard drop-shadows)

---

## 8) Component Architecture

Recommended structure:

text
web/
  app/
    page.tsx
    events/[id]/page.tsx
    library/page.tsx
    analytics/page.tsx
    layout.tsx
    globals.css
  components/
    server/
      dashboard-shell.tsx
      scheduled-events-list.tsx
      upcoming-rail.tsx
      analytics-overview.tsx
    client/
      countdown-pulse.tsx
      live-chat-panel.tsx
      upload-form.tsx
      video-player.tsx
      carousel-controls.tsx
  lib/
    api/videos.ts
    api/analytics.ts
    schemas/video.ts
    schemas/analytics.ts

Server Components:
- dashboard shell
- scheduled list (initial fetch)
- upcoming rail initial render
- analytics overview

Client Components:
- countdown pulse + timer
- chat interaction panel
- upload/index/delete actions
- player controls + transcript tab interactions

---

## 9) Screen Specifications

## 9.1 Home (/)
Required states per section:
- loading skeleton
- empty state
- error state with retry action

Hero behavior:
- Upcoming event: shows timer + pulse-line + Starts in format
- Live event: shows live badge + high-emphasis watch CTA

Scheduled list:
- Sorted nearest first
- Compact row anatomy: status dot/badge, title, relative time

Upcoming rails:
- Wide cards in primary rail
- Compact cards in side stack

## 9.2 Event Detail (/events/[id])
- Media player as primary visual anchor
- Metadata strip: title/status/scheduled time
- Tabs for transcript and insights when available
- Related content cards below

## 9.3 Library (/library)
- Video index with status filters: uploaded/indexing/indexed/failed
- Item actions: open/index/delete
- Pending and error messaging for write operations

## 9.4 Analytics (/analytics)
- Summary cards from /api/analytics/insights
- Keywords/topics modules
- Operational panel for front-door configuration snapshot

---

## 10) API Integration Rules

- Use typed wrappers in lib/api/*; avoid inline fetch calls in UI components.
- Use server fetch for first paint, client mutation for user actions.
- Keep transformation logic minimal and local to adapters (lib/schemas/*).
- Do not replicate backend business decisions in frontend.

---

## 11) Accessibility, Performance, and SEO

Accessibility:
- Keyboard reachable controls for rail navigation
- Strong focus indicators on dark surfaces
- Contrast-safe text over image/gradient backgrounds
- Reduced-motion fallback for all non-essential animation

Performance:
- Server-rendered initial dashboard shell
- Code-split chat/player heavy modules
- Use image optimization and responsive asset sizes

SEO:
- SSR for dashboard/event pages
- Semantic heading hierarchy and metadata per route

---

## 12) Environment + Security

Frontend variables:
- NEXT_PUBLIC_API_BASE_URL
- Optional internal API base for server-only route handlers

Security constraints:
- Never expose secrets client-side
- Auth/session strategy should use secure HTTP-only flows
- Restrict backend CORS to deployed frontend domains

---

## 13) Phased Delivery Plan

### Phase 1 — Visual Foundation
- Bootstrap web/ Next.js app
- Implement typography + palette tokens + card primitives
- Ship static dashboard reflecting exact layout hierarchy

### Phase 2 — Data Integration
- Wire videos and analytics APIs
- Introduce section-level loading/empty/error states

### Phase 3 — Interactive Behaviors
- Countdown pulse-line component
- Upload/index/delete flows
- Watch page transcript/insights interaction

### Phase 4 — Quality Hardening
- Accessibility audit pass
- Performance optimization pass
- Observability and error telemetry hooks

---

## 14) Acceptance Criteria

1. Visual language is unmistakably cinematic and consistent across pages.
2. Dashboard hierarchy matches concept: hero, scheduled, chat, upcoming.
3. Server Components are default; client code appears only in interaction zones.
4. API layer is isolated, typed, and decoupled from presentational components.
5. Every major section has loading, empty, and error states.
6. Mobile/tablet behavior preserves content priority and readability.
7. Countdown pulse-line interaction is implemented as the signature experience.

---

## 15) Immediate Build Start (Recommended)

Start with / dashboard as the first vertical slice:
- Build dashboard-shell (server)
- Build countdown-pulse (client)
- Integrate GET /api/videos for live/scheduled/upcoming segmentation
- Validate responsive behavior before expanding to other routes
