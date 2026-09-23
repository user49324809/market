import { useEffect, useState } from 'react';
import { getVillagerBalance } from '../services/api';
import type { VillagerBalance } from '../types/villager';

interface BalanceWidgetProps {
  villagerId: number;
}

export function BalanceWidget({ villagerId }: BalanceWidgetProps) {
  const [data, setData] = useState<VillagerBalance | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    setData(null);
    setError(false);

    getVillagerBalance(villagerId)
      .then((value) => {
        if (active) setData(value);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [villagerId]);

  if (error) {
    return (
      <div className="balance-widget balance-widget--error">
        Баланс временно недоступен
      </div>
    );
  }

  if (!data) {
    return <div className="balance-widget">Загрузка баланса…</div>;
  }

  return (
    <div className="balance-widget" aria-label="Баланс игрока">
      <span className="balance-widget__identity">{data.name}</span>
      <strong className="balance-widget__amount">
        {data.balance.toLocaleString('ru-RU')} ₽
      </strong>
    </div>
  );
}
