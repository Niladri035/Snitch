import api from '../../../services/api.js';

export async function createProduct(formData) {
  const response = await api.post('/products', formData);
  return response.data;
}

export async function getSellerProduct() {
  const response = await api.get('/products/seller');
  return response.data;
}

export async function getAllProduct() {
  const response = await api.get('/products');
  return response.data;
}

export async function deleteProduct(id) {
  const response = await api.delete(`/products/${id}`);
  return response.data;
}

export async function updateInventory(id, inventory) {
  const response = await api.patch(`/products/${id}/inventory`, { inventory });
  return response.data;
}