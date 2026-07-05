import express from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import {
  createOrder,
  getSellerOrders,
  getBuyerOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/order.controller.js';

const orderRouter = express.Router();

/* All order routes require authentication */
orderRouter.use(authenticate);

/* Buyer: create order after payment */
orderRouter.post('/', createOrder);

/* Buyer: get their own orders */
orderRouter.get('/buyer', getBuyerOrders);

/* Seller: get all orders */
orderRouter.get('/seller', requireRole('seller'), getSellerOrders);

/* Any authenticated user: get single order by ID */
orderRouter.get('/:id', getOrderById);

/* Seller only: update order status / tracking */
orderRouter.patch('/:id/status', requireRole('seller'), updateOrderStatus);

export default orderRouter;
