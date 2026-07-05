const BASE = '/api/wishlist';

export async function fetchWishlist() {
  const res = await fetch(BASE, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch wishlist');
  }
  return res.json();
}

export async function toggleWishlistItem(productId) {
  const res = await fetch(`${BASE}/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to toggle wishlist');
  }
  return res.json();
}
