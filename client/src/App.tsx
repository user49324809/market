import { useState } from 'react';
import { AppShell } from './components/AppShell';
import { MarketPage } from './pages/MarketPage';

export default function App() {
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  return (
    <AppShell balanceRefreshKey={balanceRefreshKey}>
      <MarketPage
        onPurchaseComplete={() => {
          setBalanceRefreshKey((value) => value + 1);
        }}
      />
    </AppShell>
  );
}
