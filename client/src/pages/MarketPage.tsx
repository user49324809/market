import { useEffect, useRef, useState } from 'react';
import { ListingCard } from '../components/ListingCard';
import { createOrder, getMarketListings, payOrder } from '../services/api';
import { ACTIVE_VILLAGER_ID } from '../config/player';
import type { MarketListing } from '../types/market';

interface MarketPageProps {
  onPurchaseComplete?: () => void;
}

export function MarketPage({
  onPurchaseComplete,
}: MarketPageProps) {
  const [listings, setListings] = useState<MarketListing[] | null>(null);
  const [error, setError] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const purchasePending = useRef(false);
  const [pendingListingId, setPendingListingId] =
  useState<number | null>(null);

  useEffect(() => {
    let active = true;

    getMarketListings()
      .then((value) => {
        if (active) setListings(value);
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleBuy(listingId: number) {
    // Запрещаем запуск второй покупки,
    // пока не завершилась первая
    if (purchasePending.current) {
      return;
    }

    purchasePending.current = true;
    setPendingListingId(listingId);
    setPurchaseError(null);

    try {
      const order = await createOrder(
        listingId,
        ACTIVE_VILLAGER_ID,
        1
      );
      } catch {
      setPurchaseError(
        'Не удалось завершить покупку. Проверьте состояние заказа перед повторной попыткой.'
      );
    } await payOrder(order.id);

      // Баланс обновляем сразу после успешной оплаты
      onPurchaseComplete?.();

      const updatedListings = await getMarketListings();
      setListings(updatedListings);
    } finally {
      // Снимаем блокировку даже при ошибке
      purchasePending.current = false;
      setPendingListingId(null);
    }
  }

  return (
    <section className="market-page" aria-labelledby="market-title">
      <div className="market-page__heading">
        <div>
          <span className="market-page__eyebrow">Торговая площадь</span>
          <h2 id="market-title">Рынок</h2>
        </div>
        <p>
          Проверяйте предложения жителей, остатки и цены. Позже здесь появятся
          первые несоответствия, которые нельзя будет объяснить обычной ошибкой.
        </p>
      </div>

      {error && <div className="market-state market-state--error">Не удалось загрузить рынок</div>}

      {!error && listings === null && (
        <div className="market-state">Рынок загружается…</div>
      )}

      {!error && listings?.length === 0 && (
        <div className="market-state">Сегодня на рынке нет активных предложений</div>
      )}

      {purchaseError && (
        <div role="alert" className="market-state market-state--error">
          {purchaseError}
        </div>
      )}

      {!error && listings && listings.length > 0 && (
      <div className="listing-grid">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isProcessing={pendingListingId === listing.id}
            purchaseLocked={pendingListingId !== null}
            onBuy={() => handleBuy(listing.id)}
          />
        ))}
      </div>
    )}
    </section>
  );
}
