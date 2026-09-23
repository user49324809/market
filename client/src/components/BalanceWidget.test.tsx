import { render, screen } from '@testing-library/react';
import { beforeEach, test, vi } from 'vitest';
import { getVillagerBalance } from '../services/api';
import { BalanceWidget } from './BalanceWidget';

vi.mock('../services/api', () => ({
  getVillagerBalance: vi.fn(),
}));

const mockedGetVillagerBalance = vi.mocked(getVillagerBalance);

beforeEach(() => {
  mockedGetVillagerBalance.mockReset();
});

test('shows loading while balance is pending', () => {
  mockedGetVillagerBalance.mockReturnValue(new Promise(() => undefined));
  render(<BalanceWidget villagerId={1} />);
  expect(screen.getByText('Загрузка баланса…')).toBeInTheDocument();
});

test('shows villager name and balance after loading', async () => {
  mockedGetVillagerBalance.mockResolvedValue({ id: 1, name: 'Глаша', balance: 4400 });
  render(<BalanceWidget villagerId={1} />);

  expect(await screen.findByText('Глаша')).toBeInTheDocument();
  expect(screen.getByText(/4[\s\u00a0]?400 ₽/)).toBeInTheDocument();
});

test('shows a readable error when balance request fails', async () => {
  mockedGetVillagerBalance.mockRejectedValue(new Error('offline'));
  render(<BalanceWidget villagerId={1} />);

  expect(await screen.findByText('Баланс временно недоступен')).toBeInTheDocument();
});
