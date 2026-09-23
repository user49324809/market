import type { MarketListing } from '../types/market';
import type { VillagerBalance } from '../types/villager';

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const getMarketListings = () =>
  getJson<MarketListing[]>('/api/market/listings');

export const getVillagerBalance = (id: number) =>
  getJson<VillagerBalance>(`/api/villagers/${id}/balance`);

export async function createOrder(
  listingId: number,
  buyerId: number,
  quantity: number
) {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      listingId,
      buyerVillagerId: buyerId,
      quantity,
    }),
  });

  if (!response.ok) {
    throw new Error('Не удалось создать заказ');
  }

  return response.json();
}

export async function payOrder(orderId: number) {
  const response = await fetch(`/api/orders/${orderId}/pay`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Не удалось оплатить заказ');
  }

  return response.json();
}
