import type { MarketListing } from '../types/market';

const statusLabels: Record<string, string> = {
  active: 'В продаже',
  sold_out: 'Продано',
  cancelled: 'Снято',
};

const unitLabels: Record<string, string> = {
  jar: 'бан.',
  kg: 'кг',
  g: 'г',
  pcs: 'шт.',
};
interface ListingCardProps {
  listing: MarketListing;
  onBuy: () => void;
}

export function ListingCard({ listing, onBuy }: ListingCardProps) {
  const unit = unitLabels[listing.unit] ?? listing.unit;

  return (
    <article className="listing-card">
      <div className="listing-card__meta">
        <span className="listing-card__seller">{listing.seller}</span>
        <span className="listing-card__status">
          {statusLabels[listing.status] ?? listing.status}
        </span>
      </div>

      <div className="listing-card__product-mark" aria-hidden="true">
        {listing.product.slice(0, 1).toUpperCase()}
      </div>

      <h3>{listing.product}</h3>
      <p className="listing-card__warehouse">{listing.warehouse}</p>

      <div className="listing-card__value-row">
        <strong>{listing.unitPrice.toLocaleString('ru-RU')} ₽</strong>
        <span>
          Осталось: {listing.quantity} {unit}
        </span>
      </div>

      <button
        type="button"
        onClick={onBuy}
        disabled={listing.status !== 'active' || listing.quantity <= 0}
      >
        Купить
      </button>
    </article>
  );
}
