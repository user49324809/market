import { useEffect, useState } from 'react';
import { ListingCard } from '../components/ListingCard';
import { getMarketListings } from '../services/api';
import type { MarketListing } from '../types/market';

export function MarketPage() {
  const [listings, setListings] = useState<MarketListing[] | null>(null);
  const [error, setError] = useState(false);

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

      {!error && listings && listings.length > 0 && (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard listing={listing} key={listing.id} />
          ))}
        </div>
      )}
    </section>
  );
}
