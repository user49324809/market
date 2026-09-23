import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('./services/api', () => ({
  getVillagerBalance: vi.fn().mockResolvedValue({
    id: 1,
    name: 'Глаша',
    balance: 4400,
  }),
  getMarketListings: vi.fn().mockResolvedValue([]),
}));

test('renders Mini ERP Market title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /mini erp market/i })).toBeInTheDocument();
});
