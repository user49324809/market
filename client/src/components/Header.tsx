import { ACTIVE_VILLAGER_ID } from '../config/player';
import { BalanceWidget } from './BalanceWidget';

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__eyebrow">Управление поселением</span>
        <h1>Mini ERP Market</h1>
      </div>
      <BalanceWidget villagerId={ACTIVE_VILLAGER_ID} />
    </header>
  );
}
