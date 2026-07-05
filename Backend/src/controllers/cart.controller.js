import mongoose from 'mongoose';
import cartModel from '../models/cart.model.js';
import productModel from '../models/product.model.js';
import {createOrder} from '../services/payment.service.js';
import { config } from '../config/config.js';
/* ─────────────────────────────────────────────────────────────
   GET /api/cart
   Fetch the authenticated user's cart populated with product details
───────────────────────────────────────────────────────────── */
export async function getCart(req, res) {
  try {
    const userId = req.user.id;
    let cart = await cartModel.findOne({ user: userId }).populate('items.product');
    
    if (!cart) {
      cart = await cartModel.create({ user: userId, items: [] });
    }
    
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/cart/add
   Add a specific product color + size variant to the cart.
   Validates variant availability and stock limit.
───────────────────────────────────────────────────────────── */
export async function addToCart(req, res) {
  try {
    const userId = req.user.id;
    const { productId, color, size, quantity = 1 } = req.body;

    if (!productId || !color || !size) {
      return res.status(400).json({ message: 'productId, color, and size are required fields' });
    }

    // Check if product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Verify stock availability
    const inventory = product.inventory || [];
    const variant = inventory.find(
      v => v.color.toLowerCase() === color.toLowerCase() && v.size.toLowerCase() === size.toLowerCase()
    );

    if (!variant) {
      return res.status(400).json({ message: `Variant ${color} / ${size} does not exist for this product` });
    }

    if (variant.stock <= 0) {
      return res.status(400).json({ message: 'This variant is currently out of stock' });
    }

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new cartModel({ user: userId, items: [] });
    }

    // Check if the item already exists in the cart
    const existingIndex = cart.items.findIndex(
      item =>
        item.product.toString() === productId &&
        item.color.toLowerCase() === color.toLowerCase() &&
        item.size.toLowerCase() === size.toLowerCase()
    );

    const totalQtyReq = existingIndex > -1 ? cart.items[existingIndex].quantity + quantity : quantity;
    if (totalQtyReq > variant.stock) {
      return res.status(400).json({
        message: `Only ${variant.stock} units available in stock. You requested ${totalQtyReq} units total.`
      });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity = totalQtyReq;
    } else {
      cart.items.push({ product: productId, color, size, quantity });
    }

    await cart.save();
    const updatedCart = await cartModel.findOne({ user: userId }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   PUT /api/cart/update-quantity
   Update quantity of an existing item in the cart.
   Checks inventory limits as well.
───────────────────────────────────────────────────────────── */
export async function updateCartItemQuantity(req, res) {
  try {
    const userId = req.user.id;
    const { itemId, quantity } = req.body;

    if (!itemId || quantity === undefined) {
      return res.status(400).json({ message: 'itemId and quantity are required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1. Use remove to delete.' });
    }

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Verify stock limits
    const product = await productModel.findById(item.product);
    if (product) {
      const variant = (product.inventory || []).find(
        v => v.color.toLowerCase() === item.color.toLowerCase() && v.size.toLowerCase() === item.size.toLowerCase()
      );
      if (variant && quantity > variant.stock) {
        return res.status(400).json({
          message: `Only ${variant.stock} units available in stock. Cannot update to ${quantity}.`
        });
      }
    }

    item.quantity = quantity;
    await cart.save();
    
    const updatedCart = await cartModel.findOne({ user: userId }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/cart/remove
   Remove a single item from the cart
───────────────────────────────────────────────────────────── */
export async function removeFromCart(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    await cart.save();

    const updatedCart = await cartModel.findOne({ user: userId }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/cart/clear
   Clear all items in the cart
───────────────────────────────────────────────────────────── */
export async function clearCart(req, res) {
  try {
    const userId = req.user.id;
    let cart = await cartModel.findOne({ user: userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    } else {
      cart = await cartModel.create({ user: userId, items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   PUT /api/cart/toggle-select
   Toggle check/uncheck status of a cart item
───────────────────────────────────────────────────────────── */
export async function toggleSelectItem(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.selected = !item.selected;
    await cart.save();

    const updatedCart = await cartModel.findOne({ user: userId }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   PUT /api/cart/toggle-save
   Move item between active cart and Save for Later
───────────────────────────────────────────────────────────── */
export async function toggleSaveItem(req, res) {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ message: 'itemId is required' });
    }

    const cart = await cartModel.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.saved = !item.saved;
    await cart.save();

    const updatedCart = await cartModel.findOne({ user: userId }).populate('items.product');
    res.json(updatedCart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/cart/summary
   Retrieves user cart summary using MongoDB aggregation pipeline
   ───────────────────────────────────────────────────────────── */
export async function getCartSummary(req, res) {
  try {
    const userId = req.user.id;
    const summary = await cartModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $unwind: { path: '$items' } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'items.product'
        }
      },
      { $unwind: { path: '$items.product' } },
      {
        $addFields: {
          itemPrice: {
            $multiply: [
              '$items.quantity',
              '$items.product.price.amount'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$_id',
          total: { $sum: '$itemPrice' },
          items: { $push: '$items' }
        }
      }
    ]);

    if (!summary || summary.length === 0) {
      return res.json({ _id: null, total: 0, items: [] });
    }

    res.json(summary[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, message: "Amount is required, bestie!" });
    }
    const order = await createOrder(amount, currency || "INR");
    res.status(200).json({
      message: "Order created successfully",
      success: true,
      key_id: config.RAZORPAY_KEY_ID,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
