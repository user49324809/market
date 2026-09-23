# Mini ERP Market Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first React + TypeScript market screen for Mini ERP using the existing Express API for live listings and the active villager balance.

**Architecture:** Add an isolated Vite client under `client/` and leave the existing Express/PostgreSQL backend intact. Use relative `/api` requests through a Vite dev proxy to `http://localhost:3000`, local React state, focused components, and a small typed service layer. FRONTEND-001 is read-only from the player's point of view; purchase stays for FRONTEND-002.

**Tech Stack:** React, TypeScript, Vite, Vitest, React Testing Library, plain CSS.

**Spec:** `docs/superpowers/specs/2026-09-22-market-frontend-design.md`

## Global Constraints

- Frontend lives under `client/`; do not convert the repository to a monorepo.
- Use React + TypeScript + Vite and plain CSS; no UI framework.
- FRONTEND-001 consumes only `GET /api/market/listings` and `GET /api/villagers/:id/balance`.
- Active player is villager ID `1`, isolated in one config file.
- No Redux/Zustand/React Query yet.
- Never expose `.env`, database credentials, or backend secrets in the client.
- Backend remains authoritative for price, payment, stock, and balance.
- Do not implement Warehouse, Cases/Tasks, Profile, auth, saves, dialogue, map, horror anomalies, purchase/payment UI, or Tauri here.
- Visual direction: green primary, warm gold/yellow accents, light cards, restrained game flavor, desktop-first and responsive.

## Review Focus

- Backend unavailable: balance and market show readable errors instead of crashing.
- Empty market: an empty array shows an intentional empty state.
- Non-OK HTTP responses: API helpers reject consistently.
- Long labels and large prices/balances wrap without overflow.
- Frontend uses relative `/api` URLs and the Vite proxy so no CORS backend change is needed.

---

### Task 1: Scaffold the React client and test harness

**Files:**
- Create: `client/` Vite React TypeScript app
- Modify: `client/vite.config.ts`, `client/package.json`, `.gitignore`
- Test: `client/src/App.test.tsx`

**Interfaces:**
- Consumes: Express at `http://localhost:3000`.
- Produces: runnable/testable Vite app and `/api` proxy.

- [ ] **Step 1: Scaffold and install test dependencies**

```bash
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configure scripts and Vite proxy**

Add scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Use this `client/vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

Create `client/src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Write a failing smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Mini ERP Market title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /mini erp market/i })).toBeInTheDocument();
});
```

Run `npm test`; expect FAIL against the Vite starter.

- [ ] **Step 4: Add the minimal app and verify**

```tsx
export default function App() {
  return <main><h1>Mini ERP Market</h1></main>;
}
```

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Update package hygiene**

Root `.gitignore` must include:

```gitignore
.env
node_modules/
client/node_modules/
client/dist/
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore client
git commit -m "feat: scaffold market frontend"
```

---

### Task 2: Add typed API services and active-player config

**Files:**
- Create: `client/src/config/player.ts`
- Create: `client/src/types/market.ts`
- Create: `client/src/types/villager.ts`
- Create: `client/src/services/api.ts`
- Test: `client/src/services/api.test.ts`

**Interfaces:**
- Produces: `ACTIVE_VILLAGER_ID`, `MarketListing`, `VillagerBalance`, `getMarketListings()`, `getVillagerBalance(id)`.

- [ ] **Step 1: Define config and payload types**

```ts
// config/player.ts
export const ACTIVE_VILLAGER_ID = 1;
```

```ts
// types/market.ts
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

```ts
// types/villager.ts
export interface VillagerBalance {
  id: number;
  name: string;
  balance: number;
}
```

- [ ] **Step 2: Write failing service tests**

Tests must verify:

```ts
expect(fetchSpy).toHaveBeenCalledWith('/api/market/listings');
expect(fetchSpy).toHaveBeenCalledWith('/api/villagers/1/balance');
await expect(getMarketListings()).rejects.toThrow('Request failed with status 500');
```

Mock `globalThis.fetch` with `vi.spyOn` and `Response` objects.

- [ ] **Step 3: Implement API service**

```ts
import type { MarketListing } from '../types/market';
import type { VillagerBalance } from '../types/villager';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const getMarketListings = () =>
  getJson<MarketListing[]>('/api/market/listings');

export const getVillagerBalance = (id: number) =>
  getJson<VillagerBalance>(`/api/villagers/${id}/balance`);
```

- [ ] **Step 4: Verify and commit**

```bash
npm test -- src/services/api.test.ts
git add client/src/config client/src/types client/src/services
git commit -m "feat: add market frontend api layer"
```

---

### Task 3: Build the shell and live balance

**Files:**
- Create: `client/src/components/AppShell.tsx`
- Create: `client/src/components/Header.tsx`
- Create: `client/src/components/BalanceWidget.tsx`
- Create: `client/src/components/BottomNav.tsx`
- Test: `BalanceWidget.test.tsx`, `BottomNav.test.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: `ACTIVE_VILLAGER_ID`, `getVillagerBalance(id)`.
- Produces: global frame with Header, live balance, main area, and four-item bottom nav.

- [ ] **Step 1: Write BalanceWidget tests**

Cover loading, success (`Глаша`, `4400`) and rejected API (`Баланс временно недоступен`). Mock `getVillagerBalance`.

- [ ] **Step 2: Implement BalanceWidget**

```tsx
import { useEffect, useState } from 'react';
import { getVillagerBalance } from '../services/api';
import type { VillagerBalance } from '../types/villager';

export function BalanceWidget({ villagerId }: { villagerId: number }) {
  const [data, setData] = useState<VillagerBalance | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getVillagerBalance(villagerId)
      .then((value) => active && setData(value))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, [villagerId]);

  if (error) return <div className="balance-widget">Баланс временно недоступен</div>;
  if (!data) return <div className="balance-widget">Загрузка баланса…</div>;

  return (
    <div className="balance-widget" aria-label="Баланс игрока">
      <span>{data.name}</span>
      <strong>{data.balance.toLocaleString('ru-RU')} ₽</strong>
    </div>
  );
}
```

- [ ] **Step 3: Implement Header/AppShell/BottomNav**

Header title is `Mini ERP Market`; nav labels are `Рынок`, `Склад`, `Дела`, `Профиль`; only `Рынок` receives `aria-current="page"`.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- src/components/BalanceWidget.test.tsx src/components/BottomNav.test.tsx
git add client/src/components client/src/App.tsx
git commit -m "feat: add market app shell"
```

---

### Task 4: Render live market listings and list states

**Files:**
- Create: `client/src/components/ListingCard.tsx`
- Create: `client/src/pages/MarketPage.tsx`
- Test: `ListingCard.test.tsx`, `MarketPage.test.tsx`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: `getMarketListings()` and `MarketListing`.
- Produces: live cards plus loading, empty and error states.

- [ ] **Step 1: Test ListingCard**

Use a fixture with long product and warehouse names plus price `123456`. Assert seller, product, warehouse, formatted price, quantity/unit, and disabled `Купить` button are visible.

- [ ] **Step 2: Implement ListingCard**

```tsx
import type { MarketListing } from '../types/market';

export function ListingCard({ listing }: { listing: MarketListing }) {
  return (
    <article className="listing-card">
      <div className="listing-card__meta">
        <span>{listing.seller}</span>
        <span>{listing.status}</span>
      </div>
      <h3>{listing.product}</h3>
      <p>{listing.warehouse}</p>
      <div className="listing-card__value-row">
        <strong>{listing.unitPrice.toLocaleString('ru-RU')} ₽</strong>
        <span>{listing.quantity} {listing.unit}</span>
      </div>
      <button type="button" disabled>Купить</button>
    </article>
  );
}
```

- [ ] **Step 3: Test MarketPage states**

Mock `getMarketListings` and assert exact states:

```text
Рынок загружается…
Сегодня на рынке нет активных предложений
Не удалось загрузить рынок
```

For success, return the real-shaped Петров/Мёд fixture and assert `Мёд` is rendered.

- [ ] **Step 4: Implement MarketPage**

Use `useEffect` + local state. Render listing cards on success, deliberate empty state for `[]`, and readable error copy on rejection. The page heading is `Рынок`, with sublabel `Торговая площадь`.

- [ ] **Step 5: Wire App and verify**

```tsx
import { AppShell } from './components/AppShell';
import { MarketPage } from './pages/MarketPage';

export default function App() {
  return <AppShell><MarketPage /></AppShell>;
}
```

Run:

```bash
npm test -- src/components/ListingCard.test.tsx src/pages/MarketPage.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src
git commit -m "feat: render market listings from api"
```

---

### Task 5: Apply the approved green/gold game-dashboard visual system

**Files:**
- Modify: `client/src/index.css`, `client/src/main.tsx`
- Delete generated `App.css`/starter assets if unused.

**Interfaces:**
- Consumes: class names from Tasks 3-4.
- Produces: the approved light-card, green/gold, desktop-first interface.

- [ ] **Step 1: Add visual tokens**

```css
:root {
  --green-900: #193f34;
  --green-700: #2f6755;
  --green-100: #dfece5;
  --gold-500: #d2a33b;
  --paper: #fffdf8;
  --muted: #6f7f79;
  --line: #d7e0da;
  --shadow: 0 18px 45px rgba(25, 63, 52, 0.08);
}
```

Style `.app-shell`, `.app-header`, `.balance-widget`, `.listing-grid`, `.listing-card`, `.bottom-nav`, and `.market-state`. Use `grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))` and `overflow-wrap: anywhere` for long content.

- [ ] **Step 2: Add responsive rule**

At `max-width: 640px`, remove outer frame margin/radius, stack Header vertically, make BalanceWidget full width, and keep four nav items readable.

- [ ] **Step 3: Keep `main.tsx` minimal**

It should import only React root, `./index.css`, and `App`.

- [ ] **Step 4: Verify tests/build and manually inspect long labels**

```bash
npm test
npm run build
```

Resize browser below 640px and use devtools to temporarily test long product/warehouse text; no overflow is acceptable.

- [ ] **Step 5: Commit**

```bash
git add client
git commit -m "style: apply market game interface"
```

---

### Task 6: FRONTEND-001 acceptance and backend regression

**Files:** Modify only if a check exposes a defect in Tasks 1-5.

**Interfaces:**
- Produces: verified first frontend without changing backend contracts.

- [ ] **Step 1: Start backend and frontend**

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
cd client
npm run dev
```

- [ ] **Step 2: Verify live UI**

Confirm real server data appears: title, current villager + balance, market cards, and bottom nav. Browser console/network must show no CORS error and no database credentials.

- [ ] **Step 3: Verify backend-down behavior**

Stop Express, refresh Vite, and confirm:

```text
Баланс временно недоступен
Не удалось загрузить рынок
```

Restart Express.

- [ ] **Step 4: Run automated checks**

```bash
cd client
npm test
npm run build
cd ..
node --check src/app.js
node --check src/db.js
```

Expected: all PASS.

- [ ] **Step 5: Smoke-test existing API**

Confirm these still respond:

```text
GET /api/villagers
GET /api/market/listings
GET /api/villagers/1/balance
```

- [ ] **Step 6: Verify archive hygiene**

Shared ZIP must exclude:

```text
.env
node_modules/
client/node_modules/
client/dist/
```

- [ ] **Step 7: Commit only if acceptance required a code fix**

```bash
git add client .gitignore
git commit -m "fix: complete market frontend acceptance"
```

Do not create an empty commit if no fixes were needed.

## Self-Review Result

- Spec coverage: all FRONTEND-001 acceptance criteria map to Tasks 1-6.
- Placeholder scan: no TBD/TODO or unspecified implementation actions remain.
- Type consistency: `MarketListing`, `VillagerBalance`, `getMarketListings`, and `getVillagerBalance` are consistent across tasks.
- Review Focus coverage: backend failure, empty data, non-OK responses, long content, and proxy/CORS separation all have explicit tests/checks.
- Scope: purchase interaction remains FRONTEND-002.
