import api from '../../../services/api.js';

export async function fetchWishlist() {
  const res = await api.get('/wishlist');
  return res.data;
}

export async function toggleWishlistItem(productId) {
  const res = await api.post('/wishlist/toggle', { productId });
  return res.data;
}
