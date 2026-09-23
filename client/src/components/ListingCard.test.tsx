import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ListingCard } from './ListingCard';
import type { MarketListing } from '../types/market';

const listing: MarketListing = {
  id: 1,
  seller: 'Петров',
  product: 'Мёд',
  unit: 'jar',
  quantity: 20,
  unitPrice: 300,
  status: 'active',
  warehouse: 'Основной склад',
};

test('calls onBuy when user clicks buy button', async () => {
  const user = userEvent.setup();
  const onBuy = vi.fn();

  render(<ListingCard listing={listing} onBuy={onBuy} />);

  await user.click(screen.getByRole('button', { name: 'Купить' }));

  expect(onBuy).toHaveBeenCalledTimes(1);
});
