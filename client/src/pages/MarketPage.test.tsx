import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, test, vi } from 'vitest';
import {
  createOrder,
  getMarketListings,
  payOrder,
} from '../services/api';
import { MarketPage } from './MarketPage';

vi.mock('../services/api', () => ({
  getMarketListings: vi.fn(),
  createOrder: vi.fn(),
  payOrder: vi.fn(),
}));

const mockedGetMarketListings = vi.mocked(getMarketListings);
const mockedCreateOrder = vi.mocked(createOrder);
const mockedPayOrder = vi.mocked(payOrder);

beforeEach(() => {
  mockedGetMarketListings.mockReset();
  mockedCreateOrder.mockReset();
  mockedPayOrder.mockReset();
});

test('shows loading state while market is pending', () => {
  mockedGetMarketListings.mockReturnValue(
    new Promise(() => undefined)
  );

  render(<MarketPage />);

  expect(
    screen.getByText('Рынок загружается…')
  ).toBeInTheDocument();
});

test('shows intentional empty state for an empty market', async () => {
  mockedGetMarketListings.mockResolvedValue([]);

  render(<MarketPage />);

  expect(
    await screen.findByText(
      'Сегодня на рынке нет активных предложений'
    )
  ).toBeInTheDocument();
});

test('shows readable market error on rejected request', async () => {
  mockedGetMarketListings.mockRejectedValue(
    new Error('offline')
  );

  render(<MarketPage />);

  expect(
    await screen.findByText('Не удалось загрузить рынок')
  ).toBeInTheDocument();
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

  expect(
    await screen.findByRole('heading', { name: 'Мёд' })
  ).toBeInTheDocument();
});

test('notifies app after successful purchase', async () => {
  const user = userEvent.setup();
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
    <MarketPage
      onPurchaseComplete={onPurchaseComplete}
    />
  );

  await user.click(
    await screen.findByRole('button', {
      name: 'Купить',
    })
  );

  await waitFor(() => {
    expect(onPurchaseComplete).toHaveBeenCalledTimes(1);
  });
});
