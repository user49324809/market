import { afterEach, describe, expect, test, vi } from 'vitest';
import { getMarketListings, getVillagerBalance } from './api';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API service', () => {
  test('loads market listings from the relative api route', async () => {
    const payload = [
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
    ];
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(getMarketListings()).resolves.toEqual(payload);
    expect(fetchSpy).toHaveBeenCalledWith('/api/market/listings');
  });

  test('loads villager balance from the relative api route', async () => {
    const payload = { id: 1, name: 'Глаша', balance: 4400 };
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }));

    await expect(getVillagerBalance(1)).resolves.toEqual(payload);
    expect(fetchSpy).toHaveBeenCalledWith('/api/villagers/1/balance');
  });

  test('rejects non-ok http responses consistently', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    await expect(getMarketListings()).rejects.toThrow('Request failed with status 500');
  });
});
