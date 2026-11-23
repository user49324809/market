import { render, screen } from '@testing-library/react';
import { beforeEach, test, vi } from 'vitest';
import { getMarketListings } from '../services/api';
import { MarketPage } from './MarketPage';
import { createOrder, getMarketListings, payOrder } from '../services/api';

vi.mock('../services/api', () => ({
  getMarketListings: vi.fn(),
}));

const mockedGetMarketListings = vi.mocked(getMarketListings);

beforeEach(() => {
  mockedGetMarketListings.mockReset();
  mockedCreateOrder.mockReset();
  mockedPayOrder.mockReset();
});

test('shows loading state while market is pending', () => {
  mockedGetMarketListings.mockReturnValue(new Promise(() => undefined));
  render(<MarketPage />);
  expect(screen.getByText('Рынок загружается…')).toBeInTheDocument();
});

test('shows intentional empty state for an empty market', async () => {
  mockedGetMarketListings.mockResolvedValue([]);
  render(<MarketPage />);
  expect(
    await screen.findByText('Сегодня на рынке нет активных предложений'),
  ).toBeInTheDocument();
});

test('shows readable market error on rejected request', async () => {
  mockedGetMarketListings.mockRejectedValue(new Error('offline'));
  render(<MarketPage />);
  expect(await screen.findByText('Не удалось загрузить рынок')).toBeInTheDocument();
});

test('renders a live-shaped market listing', async () => {
  mockedGetMarketListings.mockResolvedValue([
    {
      id: 1,
      seller: 'Петров',
      product: 'Мёд',
      unit: 'jar',
      quantity: 18,
      unitPrice: 300,
      status: 'active',
      warehouse: 'Склад Петрова',
    },
  ]);

  render(<MarketPage />);
  expect(await screen.findByRole('heading', { name: 'Мёд' })).toBeInTheDocument();
});

vi.mock('../services/api', () => ({
  getMarketListings: vi.fn(),
  createOrder: vi.fn(),
  payOrder: vi.fn(),
}));

const mockedGetMarketListings = vi.mocked(getMarketListings);
const mockedCreateOrder = vi.mocked(createOrder);
const mockedPayOrder = vi.mocked(payOrder);

test('notifies app after successful purchase', async () => {
  const onPurchaseComplete = vi.fn();

  mockedGetMarketListings.mockResolvedValue([
    {
      id: 1,
      seller: 'Петров',
      product: 'Мёд',
      unit: 'jar',
      quantity: 20,
      unitPrice: 300,
      status: 'active',
      warehouse: 'Склад Петрова',
    },
  ]);

  mockedCreateOrder.mockResolvedValue({ id: 10 });
  mockedPayOrder.mockResolvedValue({ status: 'paid' });

  render(
    <MarketPage onPurchaseComplete={onPurchaseComplete} />
  );
});
