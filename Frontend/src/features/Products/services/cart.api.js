import axios from 'axios';

const BASE = '/api/cart';
const cartApiInstance = axios.create({
  baseURL: BASE,
  withCredentials: true
});

export async function fetchCart() {
  const res = await fetch(BASE, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch cart');
  }
  return res.json();
}

export async function addToCart({ productId, color, size, quantity }) {
  const res = await fetch(`${BASE}/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, color, size, quantity })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to add item to cart');
  }
  return res.json();
}

export async function updateCartQuantity({ itemId, quantity }) {
  const res = await fetch(`${BASE}/update-quantity`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId, quantity })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update quantity');
  }
  return res.json();
}

export async function removeFromCart(itemId) {
  const res = await fetch(`${BASE}/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to remove item');
  }
  return res.json();
}

export async function clearCart() {
  const res = await fetch(`${BASE}/clear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to clear cart');
  }
  return res.json();
}

export async function toggleSelect(itemId) {
  const res = await fetch(`${BASE}/toggle-select`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to toggle select');
  }
  return res.json();
}

export async function toggleSave(itemId) {
  const res = await fetch(`${BASE}/toggle-save`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to toggle save');
  }
  return res.json();
}

export async function fetchCartSummary() {
  const res = await fetch(`${BASE}/summary`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch cart summary');
  }
  return res.json();
}

export const createCartOrder = async (amount, currency = "INR") => {
  const response = await cartApiInstance.post("/payment/create/order", { amount, currency });
  return response.data;
}

