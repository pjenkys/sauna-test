# Testing Infrastructure Architecture (TEST_INFRA.md)

**Project**: Czech Sauna & Wellness Platform (`sauna_database`)  
**Scope**: 4-Tier Opaque-Box Automated Test Suite  
**Runtime**: Node.js v24.19.0 (`node:sqlite` DatabaseSync), TypeScript, Vitest, Supertest  
**Environment**: Windows PowerShell Hardened (`npm.cmd` / `npx.cmd`)  

---

## 1. Overview & Testing Philosophy

The test suite for the Czech Sauna & Wellness Platform is designed strictly as an **independent, requirement-driven, opaque-box test suite**. It evaluates observable external behavior, interface contracts, REST API responses, and database state invariants rather than internal implementation details.

### Core Testing Pillars:
1. **Zero Test Pollution & High Velocity**: Every test run or suite can initialize an isolated, lightning-fast in-memory database (`DatabaseSync(':memory:')`) that executes all 25 DDL tables, indexes, and full seed fixtures in **under 20 milliseconds**.
2. **Deterministic & Portless API Testing**: Express application routing is exercised directly using `supertest(app)` without binding a TCP network port (`app.listen()`), completely preventing Windows firewall prompts and port-in-use collisions.
3. **Pure JavaScript / Node Built-in Compatibility**: Runs without any native C++ compilers (`cl.exe`, `gcc`) on Windows by relying on Node's native `node:sqlite` and pure JS dependencies (`bcryptjs`, `jsonwebtoken`).
4. **Progressive Testability**: Features are modularly tested from pure domain logic (Unit) to schema & API contracts (Integration) to end-to-end multi-step flows (E2E User Journeys).

---

## 2. 4-Tier Test Architecture

```
+-------------------------------------------------------------------------+
|                  TIER 4: End-to-End Persona Journeys                    |
|      5 Real-World Scenarios: Commuter, Reviewer, Contributor,           |
|                     Operator B2B, Roadtripper                           |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|             TIER 3: Pairwise Cross-Feature Combinations                 |
|       10 Orthogonal Triplet Interactions (MultiSport x Cooling x        |
|                       Operating Policy x Category)                      |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|             TIER 2: Boundary & Corner Cases (Edge Resilience)           |
|      Zero-state query relaxations, 0.00 km GPS, micro-distances (m/km), |
|        0-review state transitions, IČO Modulo-11, SQL injection        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    TIER 1: Core Feature Coverage                        |
|        MultiSport rules, Cooling filters, Sauna types, Haversine geo,   |
|        Map markers, Auth & JWT, 5-criteria reviews, Favorites lists,    |
|                Suggestions moderation, B2B claims, Affiliates           |
+-------------------------------------------------------------------------+
```

### Tier Breakdown:
- **Tier 1 (Feature Coverage - 55+ Scenarios)**: Validates each of the 11 functional domain features in isolation against acceptance criteria.
- **Tier 2 (Boundary & Corner Cases)**: Probes algorithmic and numeric limits: zero distances, antipodal coordinates, zero-state suggestions, 0-to-1 review atomic updates, invalid IČO check-digits.
- **Tier 3 (Pairwise Cross-Feature Combinations)**: 10 structured combinations testing orthogonal feature dimensions simultaneously (e.g., MultiSport 90m + Natural River Cooling + Nudist Policy).
- **Tier 4 (Persona User Journeys)**: 5 realistic persona-driven end-to-end user workflows:
  1. *Petr (Prague Commuter)*: Geolocation -> 90m free MS -> Plunge pool -> Add to Oblíbené.
  2. *Lenka (Ceremonial Connoisseur)*: Map filter -> Ceremony hall -> 5-criteria review -> Atomic average rating update.
  3. *David (Community Contributor)*: Search zero-state -> Submit new sauna proposal (status='pending') -> Admin approval -> Searchable in catalog.
  4. *Ing. Marek (Sauna Operator)*: Detail page claim -> Modulo-11 IČO validation -> Admin verification -> Partner status without rating skew.
  5. *Alena (Roadtripper / Geolocation Denied)*: Permission denied fallback -> Krkonoše region selection -> Mountain sauna -> Affiliate product referral.

---

## 3. Directory Layout

```
tests/
├── setup.ts                      # In-memory DatabaseSync test harness (<20ms setup, schema + seed)
├── fixtures/
│   ├── catalogs.json             # Reference catalogs (countries, regions, cities, amenities, products)
│   └── venues.json               # Reference 26 authentic Czech saunas dataset
├── unit/                         # Tier 1 & 2 pure domain logic unit tests
│   ├── haversine.test.ts         # Distance calculation & formatting (Prague-Brno, zero, micro, antipodal)
│   ├── multisportFee.test.ts     # MultiSport rules, overtime blocks, discounts, copays
│   ├── icoValidator.test.ts      # Czech 8-digit IČO Modulo-11 algorithmic verification
│   └── zeroStateRelaxer.test.ts  # Filter relaxation suggestions for zero search results
├── integration/                  # Tier 1, 2 & 3 Express + SQLite integration tests
│   ├── filterMatrix.test.ts      # Compound queries: MultiSport + plunge pool + Finnish + policies
│   ├── reviewsRecalc.test.ts     # Review creation, 5-criteria breakdown & atomic rating recalculation
│   ├── authWorkflow.test.ts      # User registration, duplicate rejection, bcrypt hash, JWT login
│   ├── favoritesList.test.ts     # Add/remove Oblíbené, multiple lists, count synchronicity
│   ├── suggestions.test.ts       # Community proposal submission, pending state, moderator approval
│   ├── claimsB2B.test.ts         # Operator profile claim, IČO check, admin verification, rating unskewed
│   └── pairwise.test.ts          # All 10 Tier 3 pairwise cross-feature combinations
└── e2e/                          # Tier 4 Full Persona User Journeys
    ├── commuterJourney.test.ts   # Journey 1: Geolocation + MultiSport 90m + Favorite
    ├── reviewerJourney.test.ts   # Journey 2: Map popup + 5-criteria review + stat update
    ├── communityJourney.test.ts  # Journey 3: Zero-state + Community proposal + Approval
    ├── operatorJourney.test.ts   # Journey 4: B2B claim + Verification + Rating unskewed
    └── roadtripperJourney.test.ts# Journey 5: Fallback city picker + Affiliate click tracking
```

---

## 4. Test Tooling Stack

| Package | Role | Rationale |
|---|---|---|
| `vitest` (`^2.1.0` or latest) | Test Runner | First-class TypeScript support, lightning fast in-process worker threads. |
| `supertest` (`^7.0.0`) | HTTP API Testing | Binds directly to Express `app` without opening TCP network ports. |
| `node:sqlite` (`DatabaseSync`) | Database Engine | Built-in Node.js v24 C++ native SQLite, sub-15ms setup, zero compilation. |
| `bcryptjs` | Password Hashing | Pure JS implementation avoiding native node-gyp build steps on Windows. |
| `jsonwebtoken` | Token Security | Standard JWT generation and verification for session testing. |

---

## 5. Execution Commands (Windows PowerShell Hardened)

All commands are runnable on Windows via `npm.cmd` or `npx.cmd`:

```powershell
# Run the complete test suite (Tiers 1-4)
npx.cmd vitest run

# Run specific tiers
npx.cmd vitest run tests/unit
npx.cmd vitest run tests/integration
npx.cmd vitest run tests/e2e

# Run with coverage report
npx.cmd vitest run --coverage

# Run in watch mode for development
npx.cmd vitest
```

---

## 6. Acceptance Criteria Traceability

| Acceptance Criteria ID | Covered In Tests | Verification Strategy |
|---|---|---|
| **AC 1.1: Multi-Filter Search** | `filterMatrix.test.ts`, `pairwise.test.ts` | MultiSport (unlimited / 90m / discount) + cooling + sauna types. |
| **AC 1.2: Zero-State Relaxation** | `zeroStateRelaxer.test.ts`, `filterMatrix.test.ts` | Suggests relaxing cooling/region when 0 matches found. |
| **AC 2.1: Geolocation & Distance** | `haversine.test.ts`, `commuterJourney.test.ts` | Haversine distance accuracy, top 1-3 nearest sorting. |
| **AC 2.2: Interactive Map Markers** | `filterMatrix.test.ts`, `reviewerJourney.test.ts` | Full 26 markers, category pins, promoted badges. |
| **AC 3.1: Complete Sauna Details** | `commuterJourney.test.ts`, `pairwise.test.ts` | Opening hours, pricing, MultiSport rules, cooling. |
| **AC 3.2: Auth & 5-Criteria Reviews** | `authWorkflow.test.ts`, `reviewsRecalc.test.ts` | Bcrypt passwords, JWT, 5-criteria ratings + tips. |
| **AC 3.3: Atomic Rating Recalc** | `reviewsRecalc.test.ts`, `reviewerJourney.test.ts` | Atomically updates `rating_overall` and `review_count`. |
| **AC 3.4: Oblíbené Lists** | `favoritesList.test.ts`, `commuterJourney.test.ts` | Add/remove favorites, sync `favorite_count`. |
| **AC 3.5: Community Proposals** | `suggestions.test.ts`, `communityJourney.test.ts` | Status='pending', moderator approval workflow. |
| **AC 4.1: B2B Operator Claims** | `claimsB2B.test.ts`, `operatorJourney.test.ts` | IČO Modulo-11 validation, admin verification. |
| **AC 4.2: Promoted Badge Transparency** | `claimsB2B.test.ts`, `pairwise.test.ts` | Promoted tag displayed without corrupting rating. |
| **AC 5.1: Automated Test Suite** | All test files in `tests/` | Complete 4-tier automated suite executed in CI. |
