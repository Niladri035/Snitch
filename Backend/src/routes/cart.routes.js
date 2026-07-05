import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  toggleSelectItem,
  toggleSaveItem,
  getCartSummary,
  createRazorpayOrder
} from '../controllers/cart.controller.js';

const cartRouter = express.Router();

// All routes require user authentication
cartRouter.use(authenticate);

cartRouter.get('/', getCart);
cartRouter.get('/summary', getCartSummary);
cartRouter.post('/add', addToCart);
cartRouter.put('/update-quantity', updateCartItemQuantity);
cartRouter.post('/remove', removeFromCart);
cartRouter.post('/clear', clearCart);
cartRouter.put('/toggle-select', toggleSelectItem);
cartRouter.put('/toggle-save', toggleSaveItem);
cartRouter.post("/payment/create/order", createRazorpayOrder);
export default cartRouter;
