import orderModel, { TRACKING_STATUSES } from '../models/order.model.js';
import productModel from '../models/product.model.js';

/* ─────────────────────────────────────────────────────────────
   POST /api/orders
   Buyer calls this immediately after a successful Razorpay payment.
───────────────────────────────────────────────────────────── */
export const createOrder = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const {
      items,
      shippingAddress,
      totalAmount,
      currency,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }
    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'razorpay_order_id is required.' });
    }

    /* Enrich each item with the seller id from the product document */
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const product = await productModel.findById(item.productId).lean();
        return {
          product: item.productId,
          title: item.title || product?.title || 'Product',
          color: item.color || '',
          size: item.size || '',
          quantity: item.quantity,
          price: item.price,
          currency: item.currency || currency || 'INR',
          image: item.image || product?.images?.[0]?.uri || '',
          seller: product?.seller || null,
        };
      })
    );

    /* Compute estimated delivery ~5 days from now */
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const order = await orderModel.create({
      buyer: buyerId,
      items: enrichedItems,
      shippingAddress: shippingAddress || {},
      totalAmount: totalAmount || 0,
      currency: currency || 'INR',
      razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id || '',
      razorpay_signature: razorpay_signature || '',
      status: 'confirmed',
      estimatedDelivery,
      trackingEvents: [{
        status: 'confirmed',
        note: 'Payment received. Order confirmed.',
        timestamp: new Date(),
      }],
    });

    const populated = await order.populate([
      { path: 'buyer', select: 'fullname email contact' },
      { path: 'items.product', select: 'title images price' },
      { path: 'items.seller', select: 'fullname email' },
    ]);

    return res.status(201).json({ success: true, order: populated });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/orders/seller
   Seller fetches only orders that contain their own products.
───────────────────────────────────────────────────────────── */
export const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Only return orders that have at least one item belonging to this seller
    const orders = await orderModel
      .find({ 'items.seller': sellerId })
      .populate({ path: 'buyer', select: 'fullname email contact' })
      .populate({ path: 'items.product', select: 'title images price' })
      .populate({ path: 'items.seller', select: 'fullname email' })
      .populate({ path: 'trackingEvents.updatedBy', select: 'fullname email' })
      .sort({ createdAt: -1 })
      .lean();

    // Filter each order's items to only show THIS seller's items
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter(item =>
        item.seller && item.seller._id?.toString() === sellerId.toString()
      ),
    }));

    return res.status(200).json({ success: true, orders: filteredOrders });
  } catch (err) {
    console.error('getSellerOrders error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/* ─────────────────────────────────────────────────────────────
   GET /api/orders/buyer
   Buyer fetches their own order history.
───────────────────────────────────────────────────────────── */
export const getBuyerOrders = async (req, res) => {
  try {
    const buyerId = req.user.id;

    const orders = await orderModel
      .find({ buyer: buyerId })
      .populate({ path: 'items.product', select: 'title images price' })
      .populate({ path: 'items.seller', select: 'fullname email' })
      .populate({ path: 'trackingEvents.updatedBy', select: 'fullname' })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('getBuyerOrders error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   GET /api/orders/:id
   Get a single order by ID (buyer can only get their own;
   seller can get any).
───────────────────────────────────────────────────────────── */
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await orderModel
      .findById(id)
      .populate({ path: 'buyer', select: 'fullname email contact' })
      .populate({ path: 'items.product', select: 'title images price' })
      .populate({ path: 'items.seller', select: 'fullname email' })
      .populate({ path: 'trackingEvents.updatedBy', select: 'fullname' })
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    /* Buyers can only see their own orders */
    if (req.user.role !== 'seller' && order.buyer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/orders/:id/status
   Seller updates the order status and optionally sets tracking
   number, courier partner, estimated delivery, and a note.
   Only sellers can call this.
───────────────────────────────────────────────────────────── */
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, trackingNumber, courierPartner, estimatedDelivery } = req.body;

    const allowed = [...TRACKING_STATUSES, 'cancelled', 'returned'];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowed.join(', ')}`,
      });
    }

    const order = await orderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    /* Push a tracking event */
    order.trackingEvents.push({
      status,
      note: note || '',
      updatedBy: req.user.id,
      timestamp: new Date(),
    });

    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierPartner) order.courierPartner = courierPartner;
    if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

    await order.save();

    const populated = await order.populate([
      { path: 'buyer', select: 'fullname email contact' },
      { path: 'items.product', select: 'title images price' },
      { path: 'items.seller', select: 'fullname email' },
      { path: 'trackingEvents.updatedBy', select: 'fullname' },
    ]);

    return res.status(200).json({ success: true, order: populated });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
