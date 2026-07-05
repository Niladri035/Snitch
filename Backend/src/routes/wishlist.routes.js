import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { getWishlist, toggleWishlist } from '../controllers/wishlist.controller.js';

const wishlistRouter = express.Router();

// Wishlist routes require authentication
wishlistRouter.use(authenticate);

wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/toggle', toggleWishlist);

export default wishlistRouter;
