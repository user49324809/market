import { render, screen } from '@testing-library/react';
import { test } from 'vitest';
import { BottomNav } from './BottomNav';

test('renders four destinations with market active', () => {
  render(<BottomNav />);

  expect(screen.getByRole('button', { name: /рынок/i })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: /склад/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /дела/i })).toBeDisabled();
  expect(screen.getByRole('button', { name: /профиль/i })).toBeDisabled();
});
