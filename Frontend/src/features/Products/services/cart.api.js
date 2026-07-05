import api from '../../../services/api.js';

/* ── helpers: all fetch calls rewritten to use api instance ── */

export async function fetchCart() {
  const res = await api.get('/cart');
  return res.data;
}

export async function addToCart({ productId, color, size, quantity }) {
  const res = await api.post('/cart/add', { productId, color, size, quantity });
  return res.data;
}

export async function updateCartQuantity({ itemId, quantity }) {
  const res = await api.put('/cart/update-quantity', { itemId, quantity });
  return res.data;
}

export async function removeFromCart(itemId) {
  const res = await api.post('/cart/remove', { itemId });
  return res.data;
}

export async function clearCart() {
  const res = await api.post('/cart/clear');
  return res.data;
}

export async function toggleSelect(itemId) {
  const res = await api.put('/cart/toggle-select', { itemId });
  return res.data;
}

export async function toggleSave(itemId) {
  const res = await api.put('/cart/toggle-save', { itemId });
  return res.data;
}

export async function fetchCartSummary() {
  const res = await api.get('/cart/summary');
  return res.data;
}

export async function createCartOrder(amount, currency = 'INR') {
  const res = await api.post('/cart/payment/create/order', { amount, currency });
  return res.data;
}
