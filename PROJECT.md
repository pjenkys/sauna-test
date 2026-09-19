# Project: Czech Sauna & Wellness Platform

## Architecture
- **Client**: React 18/19 SPA + Vite + Tailwind CSS + Lucide React + Leaflet (CartoDB Positron / OSM tiles, custom SVG category pins, clustering).
- **Server**: Node.js v24.19.0 + Express.js + TypeScript + REST API.
- **Database Engine**: Built-in native `node:sqlite` (`DatabaseSync`), WAL mode, foreign keys enabled, sub-15ms execution, in-memory for testing, file-based `server/data/sauna.db` for dev/prod.
- **Testing**: Vitest + Supertest with 4-Tier requirement-driven opaque-box testing + Tier 5 white-box coverage hardening + production bootstrap integration testing (19 test files, 173 tests, 100% pass).
- **Platform Execution**: Windows-hardened using `npm.cmd` / `npx.cmd`.

```
+-------------------------------------------------------------+
|               Client (React SPA / Vite / Leaflet)           |
+-------------------------------------------------------------+
                              | HTTP / JSON REST
                              v
+-------------------------------------------------------------+
|                 Server (Express / TypeScript)               |
|   Auth (JWT) | Geo / Haversine | MultiSport | Reviews | B2B |
+-------------------------------------------------------------+
                              | DatabaseSync (C++ native)
                              v
+-------------------------------------------------------------+
|                 SQLite (node:sqlite / WAL mode)             |
|          25 Relational Tables | In-memory for Tests         |
+-------------------------------------------------------------+
```

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Geographic Hierarchy & DB Engine | International-ready hierarchy (Country > Region > City > Venue), 25 relational tables DDL | M1 | R5, Survey |
| F2 | Realistic Czech Seed Dataset | 26 authentic saunas across 11 Czech regions with exact MultiSport rules & amenities | M1 | R5, Survey |
| F3 | Geolocation & Proximity Engine | Haversine formula calculation, 1–3 nearest tips on home page, 14 Czech regional fallback picker | M2, M3 | R1, Survey |
| F4 | MultiSport Rules Engine | 100% free unlimited, time limits (60/90/120m), entry discounts, overtime surcharge calculations | M2, M3 | R2, Survey |
| F5 | Deep Search & Compound Filters | MultiSport + cooling options + sauna types + operating policies with instant response | M2, M3 | R2, Survey |
| F6 | Intelligent Zero-State Engine | Intelligent relaxation recommendations when filters yield 0 results | M2, M3 | R2, Survey |
| F7 | Landing Page Discovery UI | Hero section with visual theme, search bar, nearby recommendations, 4 category rozcestníky | M3 | R1, Survey |
| F8 | Interactive Leaflet Map | Pan/zoom across ČR and regions, category color-coded pins, clustering, rich popup cards | M3 | R2, Survey |
| F9 | Comprehensive Detail Page | Gallery, pricing, opening hours, MultiSport details, cooling & sauna inventory, map snippet | M3 | R1, R2, Survey |
| F10 | User Auth & Profile System | User registration, login, JWT/bcryptjs auth, session check, profile management | M2, M4 | R3, Survey |
| F11 | ČSFD-Style Community Reviews | 1–5 overall stars + 5 criteria breakdown, text comments, tips, atomic recalculation | M4 | R3, Survey |
| F12 | Personal Lists ("Oblíbené", etc.) | Add/remove "Oblíbené", "Chci navštívit", "Navštíveno", profile view | M4 | R3, Survey |
| F13 | Community Database Proposals | Suggest new sauna form, report outdated info, moderation queue (status='pending') | M4 | R3, Survey |
| F14 | Ethical B2B Operator Claims | "Nárokujte si tento profil", Czech IČO validation, operator verification workflow | M5 | R4, Survey |
| F15 | Ceremonies & Rituals Calendar | Calendar of special sauna rituals, masters, and theme nights | M5 | R4, Survey |
| F16 | Partner Links & Transparency | "Doporučeno / Partner" badge without skewing authentic user ratings; affiliate equipment links | M5 | R4, Survey |
| F17 | Automated 4-Tier Test Suite | Tiers 1–4 (55+ feature tests, boundary, pairwise, user journeys) + Tier 5 coverage hardening | E2E Track, M6 | Acceptance, Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Independent 4-Tier opaque-box test suite (Tiers 1–4), test harness, publish TEST_READY.md | none | DONE |
| M1 | Core Database & Seed Dataset | Relational schema DDL (25 tables), node:sqlite wrapper, 26 authentic Czech saunas seed | none | DONE |
| M2 | Backend API & Deep Search Engine | Express app, Haversine geo-engine, MultiSport rules, compound filtering, zero-state, auth | M1 | DONE |
| M3 | Frontend Discovery & Interactive Map | React + Vite + Tailwind, Hero, Geolocation fallback, Multi-filter sidebar, Leaflet map, Detail | M2 | DONE |
| M4 | Community Reviews & User Lists | ČSFD-style 5-criteria reviews, atomic stat recalculation, Favorites lists, suggestion workflow | M2, M3 | DONE |
| M5 | B2B Monetization & Partner Features | Operator profile claim (IČO check), promoted partner styling, ceremony calendar, affiliates | M2, M3 | DONE |
| M6 | Final Milestone: 100% E2E Pass + Tier 5 Hardening | Phase 1: Pass 100% of Tiers 1-4 tests from TEST_READY.md. Phase 2: Tier 5 adversarial hardening | E2E, M1-M5 | DONE |

## Code Layout
```
sauna_database/
├── client/                         # Frontend React 18/19 SPA
│   ├── src/
│   │   ├── components/             # Layout, hero, map, filters, sauna, reviews, b2b
│   │   ├── pages/                  # HomePage, ExplorePage, DetailPage, ProfilePage, SubmitPage, CeremoniesPage
│   │   ├── context/                # LocationContext, AuthContext, FilterContext
│   │   ├── services/               # API client
│   │   └── utils/                  # Haversine, formatting, map icon generators
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── server/                         # Backend Express + TypeScript
│   ├── src/
│   │   ├── db/                     # node:sqlite DatabaseSync wrapper, schema.sql, migrate.ts, seed.ts
│   │   ├── repositories/           # Data access layers (saunas, reviews, users, lists, claims, ceremonies)
│   │   ├── routes/                 # REST API route handlers
│   │   ├── middleware/             # Auth, validation, error handling
│   │   ├── utils/                  # Haversine, password hashing, ICO validation
│   │   ├── app.ts                  # Express application definition
│   │   └── index.ts                # Server bootstrap & listener
│   ├── data/                       # SQLite file storage (sauna.db)
│   ├── package.json
│   └── tsconfig.json
├── shared/                         # Shared TypeScript types & constants
│   ├── types.ts                    # Sauna, Review, MultiSport, Cooling, User types
│   └── constants.ts                # Regions, categories, cooling options, MultiSport rules
├── tests/                          # 4-Tier Test Suite + Adversarial Hardening
│   ├── setup.ts                    # In-memory DB bootstrap and test harness
│   ├── unit/                       # Haversine, MultiSport, ICO validator, Zero-state
│   ├── integration/                # Filter matrix, reviews recalc, auth, lists, claims, pairwise, tier5
│   ├── e2e/                        # Real-world persona user journeys (1 to 5)
│   └── adversarial/                # Adversarial stress tests (SQLi, XSS, limits, concurrency)
├── package.json                    # Workspace root scripts (npm.cmd run ...)
└── README.md                       # Comprehensive launch guide
```

## Interface Contracts
### Client ↔ Server REST API Contracts
- `GET /api/saunas`: Query parameters: `q`, `category`, `benefit_type`, `time_limit`, `cooling`, `sauna_type`, `nudity_policy`, `region_id`, `city_id`, `lat`, `lon`, `radius_km`, `sort`.
  - Response: `{ success: true, data: SaunaSummary[], meta: { count: number, suggestedRelaxations?: string[] } }`
- `GET /api/saunas/:slug`: Response: `{ success: true, data: SaunaDetail }`
- `GET /api/saunas/recommendations`: Query: `lat`, `lon`, `limit=3`. Response: `{ success: true, data: SaunaSummary[] }`
- `GET /api/saunas/map-markers`: Response: `{ success: true, data: MapMarker[] }`
- `POST /api/auth/register`: Body: `{ email, password, display_name }`. Response: `{ success: true, token, user }`
- `POST /api/auth/login`: Body: `{ email, password }`. Response: `{ success: true, token, user }`
- `GET /api/auth/me`: Headers: `Authorization: Bearer <token>`. Response: `{ success: true, user }`
- `POST /api/reviews`: Headers: `Authorization: Bearer <token>`. Body: `{ venue_id, overall_rating, cleanliness, heat_quality, cooling_quality, staff_ceremony, price_value, title, content, tips, visit_date }`. Response: `{ success: true, review }`
- `GET /api/reviews/:venueId`: Response: `{ success: true, data: Review[] }`
- `POST /api/users/me/lists`: Body: `{ venue_id, list_type: 'favorite' | 'want_to_visit' | 'visited' }`
- `DELETE /api/users/me/lists/:venueId?type=...`: Response: `{ success: true }`
- `GET /api/users/me/lists`: Response: `{ success: true, data: { favorite: [], want_to_visit: [], visited: [] } }`
- `POST /api/suggestions`: Body: `{ name, category, city, address, multisport_status, cooling_options, notes, submitter_email }`. Response: `{ success: true, suggestion_id }`
- `POST /api/claims`: Body: `{ venue_id, business_name, ico, applicant_name, applicant_role, business_email, phone }`. Response: `{ success: true, claim_id }`
- `GET /api/ceremonies`: Query: `venue_id`, `from_date`. Response: `{ success: true, data: CeremonyEvent[] }`
- `GET /api/affiliate-products`: Response: `{ success: true, data: AffiliateProduct[] }`
- `POST /api/referrals/click`: Body: `{ venue_id, click_type, destination_url }`. Response: HTTP 204
