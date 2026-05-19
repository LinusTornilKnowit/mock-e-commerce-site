import { useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../types';
import { fetchCart, updateCartItem, removeFromCart, clearCart } from '../api';

interface UseCartResult {
  cart: CartItem[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPrice: number;
  refresh: () => void;
  updateItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useCart(): UseCartResult {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchCart()
      .then(setCart)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateItem = async (productId: number, quantity: number) => {
    try {
      setError(null);
      await updateCartItem(productId, quantity);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const removeItem = async (productId: number) => {
    try {
      setError(null);
      await removeFromCart(productId);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    }
  };

  const clearAll = async () => {
    try {
      setError(null);
      await clearCart();
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to clear cart');
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  return { cart, loading, error, totalItems, totalPrice, refresh, updateItem, removeItem, clearAll };
}

