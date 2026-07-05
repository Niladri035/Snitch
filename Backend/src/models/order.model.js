import mongoose from 'mongoose';

/* ── Delivery tracking statuses (ordered pipeline) ── */
export const TRACKING_STATUSES = [
  'pending',        // Just placed, awaiting seller confirmation
  'confirmed',      // Seller confirmed the order
  'processing',     // Being packed / prepared
  'shipped',        // Handed to courier
  'out_for_delivery', // Last-mile delivery
  'delivered',      // Successfully delivered
];

/* Non-pipeline statuses */
export const TERMINAL_STATUSES = ['cancelled', 'failed', 'returned'];

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'product',
    required: true
  },
  title: { type: String, required: true },
  color: { type: String, default: '' },
  size: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  image: { type: String, default: '' },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }
}, { _id: true });

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, default: '' },
  pincode: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  type: { type: String, default: 'HOME' }
}, { _id: false });

/* Each time the seller moves the status, a new event is pushed here */
const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: addressSchema,
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  /* Razorpay credentials */
  razorpay_order_id: { type: String, required: true },
  razorpay_payment_id: { type: String, default: '' },
  razorpay_signature: { type: String, default: '' },
  /* Current delivery status */
  status: {
    type: String,
    enum: [...TRACKING_STATUSES, ...TERMINAL_STATUSES, 'paid'],
    default: 'confirmed'
  },
  /* Full audit trail of status changes */
  trackingEvents: [trackingEventSchema],
  /* Optional: tracking number from courier */
  trackingNumber: { type: String, default: '' },
  /* Optional: courier partner name */
  courierPartner: { type: String, default: '' },
  /* Estimated delivery date (seller can set) */
  estimatedDelivery: { type: Date, default: null },
}, { timestamps: true });

const orderModel = mongoose.model('order', orderSchema);
export default orderModel;

