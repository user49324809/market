# Mini ERP Market Frontend — Design Spec

Date: 2026-09-22
Status: Approved by user on 2026-09-22

## Goal

Create the first real frontend for Mini ERP as a React + TypeScript client that visually follows the approved market mockup and consumes the existing Express/PostgreSQL API. The first milestone should make the project feel like a game interface rather than an API demo, while keeping scope narrow enough to avoid destabilizing the working backend.

## Product Intent

The Market screen is the player's first diegetic ERP/game surface. It should feel like a clean commercial management product with a light game layer: readable, calm, tactile, and capable of becoming unsettling later when data anomalies and horror elements appear.

The interface should support the existing market loop without inventing parallel state or hard-coded business logic in the client.

## Technical Approach

Add a separate frontend application under `client/` using:

- React
- TypeScript
- Vite
- plain CSS or CSS modules for the first pass; no additional UI framework unless needed later

Keep the existing Express backend and SQL files in place. Do not restructure the repository into a monorepo yet.

Target structure:

```text
mini_erp_sellers/
  src/                  # existing Express backend
  server/sql/           # existing migrations/seeds
  client/               # new React + TypeScript app
    src/
      components/
      pages/
      services/
      types/
      App.tsx
      main.tsx
```

## First Screen

The first implemented screen is the Market page.

Primary layout:

1. Header
   - product/game title: `Mini ERP Market`
   - current villager identity
   - current balance

2. Main market area
   - market title/section heading
   - one or more listing cards
   - each card shows seller, product, unit, price, available quantity, and warehouse context
   - primary action to begin a purchase

3. Bottom navigation
   - Market — active
   - Warehouse — visible but not implemented yet
   - Cases/Tasks — visible but not implemented yet
   - Profile — visible but not implemented yet

The first version should preserve the approved visual direction: green primary tone, warm gold/yellow accents, light cards, restrained game-like details, and strong readability.

## Component Breakdown

Initial components:

- `AppShell`
  - global page frame
  - owns header/main/bottom navigation layout

- `Header`
  - title
  - current villager name
  - `BalanceWidget`

- `BalanceWidget`
  - displays current balance from API
  - loading/error state

- `MarketPage`
  - loads listings
  - owns list-level loading/error/empty states

- `ListingCard`
  - seller
  - product
  - unit
  - price
  - quantity available
  - warehouse
  - purchase action placeholder for the next frontend ticket

- `BottomNav`
  - renders the four top-level destinations
  - only Market is functional in FRONTEND-001

## API Integration

The frontend must use existing backend endpoints as the source of truth:

```text
GET  /api/market/listings
GET  /api/villagers/:id/balance
POST /api/orders
POST /api/orders/:id/pay
```

FRONTEND-001 only needs the two GET endpoints.

The first current-player assumption is intentionally simple: villager ID `1` is the active player for the first slice. This should be isolated in one config/state location so it can be replaced later by profile/save-game selection.

## Data Types

Frontend types should mirror the API payloads rather than database rows.

Example listing type:

```ts
export interface MarketListing {
  id: number;
  seller: string;
  product: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  status: string;
  warehouse: string;
}
```

Example balance type:

```ts
export interface VillagerBalance {
  id: number;
  name: string;
  balance: number;
}
```

## State and Error Handling

For the first frontend slice, local React state is sufficient. Do not add Redux, Zustand, React Query, or another state library yet.

Each API-backed area must support:

- loading
- success
- empty data where relevant
- recoverable error message

No business calculation such as price totals or balances should be trusted from hard-coded client state when the server already provides or owns that data.

## Styling Direction

Visual goals:

- modern commercial dashboard foundation
- light cards with clear hierarchy
- green as the main interaction/brand color
- gold/yellow accents for money/value/status emphasis
- rounded but not toy-like UI
- small game flavor through labels, icons, microcopy, and spatial composition rather than fantasy ornament
- desktop-first layout that remains reasonably responsive

The first pass should prioritize faithful structure and hierarchy over polished animation.

## Security / Data Integrity

- no `.env` secrets in the frontend bundle
- frontend must not receive database credentials
- frontend only calls HTTP API routes
- price, payment, stock and balance authority remain on the backend
- the client must not calculate or overwrite authoritative order totals

## Non-Goals for FRONTEND-001

Do not implement yet:

- Warehouse screen
- Cases/Tasks screen
- Profile system
- authentication
- save-game system
- conversations/dialogues
- map navigation
- horror anomalies
- purchase modal and payment flow
- animations beyond basic interaction feedback
- desktop packaging/Tauri

These remain later tickets.

## Acceptance Criteria

FRONTEND-001 is complete when:

1. `client/` exists as a React + TypeScript Vite app.
2. The app runs locally without changing the working backend structure.
3. Market page renders in the approved visual direction.
4. Listing data comes from `GET /api/market/listings`.
5. Current villager balance comes from `GET /api/villagers/1/balance`.
6. Loading and error states are visible and understandable.
7. Bottom navigation is present with Market active.
8. No `.env`, database password, or backend secret is exposed in client code.
9. Existing backend routes continue to work.

## Next Ticket After FRONTEND-001

FRONTEND-002 will add the purchase interaction using the existing order/payment API:

```text
ListingCard → create order → confirm purchase → pay order → refresh balance/listing
```

That ticket will turn the static market screen into the first complete player-visible transaction loop.
