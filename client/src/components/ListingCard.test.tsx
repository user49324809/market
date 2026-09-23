import { render, screen } from '@testing-library/react';
import { test } from 'vitest';
import { ListingCard } from './ListingCard';

const listing = {
  id: 7,
  seller: 'Очень Длинное Имя Продавца',
  product: 'Очень длинное название редкого фермерского товара',
  unit: 'jar',
  quantity: 12345,
  unitPrice: 123456,
  status: 'active',
  warehouse: 'Очень длинное название удалённого складского помещения',
};

test('renders listing content and disabled purchase action', () => {
  render(<ListingCard listing={listing} />);

  expect(screen.getByText(listing.seller)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: listing.product })).toBeInTheDocument();
  expect(screen.getByText(listing.warehouse)).toBeInTheDocument();
  expect(screen.getByText(/123[\s\u00a0]?456 ₽/)).toBeInTheDocument();
  expect(screen.getByText(/12[\s\u00a0]?345 бан\./)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Купить' })).toBeDisabled();
});
