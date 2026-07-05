import api from '../../../services/api.js';

/* Buyer: save order after successful Razorpay payment */
export const createOrder = async (payload) => {
  const response = await api.post('/orders', payload);
  return response.data;
};

/* Buyer: fetch own order history */
export const fetchBuyerOrders = async () => {
  const response = await api.get('/orders/buyer');
  return response.data;
};

/* Seller: fetch all orders */
export const fetchSellerOrders = async () => {
  const response = await api.get('/orders/seller');
  return response.data;
};

/* Any user: fetch a single order by ID */
export const fetchOrderById = async (id) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

/* Seller: update order status */
export const updateOrderStatus = async (id, payload) => {
  const response = await api.patch(`/orders/${id}/status`, payload);
  return response.data;
};
