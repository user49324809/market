import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface AppShellProps {
  children: ReactNode;
  balanceRefreshKey?: number;
}

export function AppShell({
  children,
  balanceRefreshKey = 0,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Header balanceRefreshKey={balanceRefreshKey} />
      <main className="app-main">{children}</main>
      <BottomNav />
    </div>
  );
}
