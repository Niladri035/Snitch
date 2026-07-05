import wishlistModel from '../models/wishlist.model.js';
import productModel from '../models/product.model.js';

/* ─────────────────────────────────────────────────────────────
   POST /api/wishlist/toggle
   Toggle a product in/out of the user's wishlist
   Requires user authentication
   ───────────────────────────────────────────────────────────── */
export async function toggleWishlist(req, res) {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let wishlist = await wishlistModel.findOne({ user: userId });
    if (!wishlist) {
      wishlist = await wishlistModel.create({ user: userId, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let isWishlisted = false;

    if (index > -1) {
      wishlist.products.splice(index, 1);
      isWishlisted = false;
    } else {
      wishlist.products.push(productId);
      isWishlisted = true;
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: isWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
      isWishlisted,
      wishlist
    });
  } catch (error) {
    console.error('Error in toggleWishlist controller:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/wishlist
   Get the authenticated user's wishlist populated with products
   ───────────────────────────────────────────────────────────── */
export async function getWishlist(req, res) {
  try {
    const userId = req.user.id;
    const wishlist = await wishlistModel
      .findOne({ user: userId })
      .populate({
        path: 'products',
        populate: { path: 'seller', select: 'fullname email' }
      });

    if (!wishlist) {
      return res.status(200).json({ success: true, products: [] });
    }

    // Filter out null values in case any product was deleted
    const validProducts = (wishlist.products || []).filter(p => p !== null);

    return res.status(200).json({
      success: true,
      products: validProducts
    });
  } catch (error) {
    console.error('Error in getWishlist controller:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
