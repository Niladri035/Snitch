import axios from 'axios';

const orderApiInstance = axios.create({
  baseURL: '/api/orders',
  withCredentials: true,
});

/* Buyer: save order after successful Razorpay payment */
export const createOrder = async (payload) => {
  const response = await orderApiInstance.post('/', payload);
  return response.data;
};

/* Buyer: fetch own order history */
export const fetchBuyerOrders = async () => {
  const response = await orderApiInstance.get('/buyer');
  return response.data;
};

/* Seller: fetch all orders */
export const fetchSellerOrders = async () => {
  const response = await orderApiInstance.get('/seller');
  return response.data;
};

/* Any user: fetch a single order by ID */
export const fetchOrderById = async (id) => {
  const response = await orderApiInstance.get(`/${id}`);
  return response.data;
};

/* Seller: update order status */
export const updateOrderStatus = async (id, payload) => {
  const response = await orderApiInstance.patch(`/${id}/status`, payload);
  return response.data;
};
