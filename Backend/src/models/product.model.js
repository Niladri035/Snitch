import mongoose from "mongoose";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"];
const CATEGORIES = [
    "Men", "Women", "Unisex", "Kids", "Accessories", "Footwear", "Bottoms", "Outerwear",
    "Trousers & Pants", "Kurtas & Shirts", "Jeans", "Sari", "Kurti & Legins", "Lady Shirt", "Lady pants",
    "Boys & Girls", "Oldaged", "Gen-Z", "Gadgets", "Grooming", "Summer Collection", "Old Fashion"
];

const inventoryVariantSchema = new mongoose.Schema({
    color: {
        type: String,
        required: true,
        trim: true
    },
    hex: {
        type: String,
        default: null,
        trim: true
    },
    size: {
        type: String,
        required: true,
        enum: SIZES
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, "Stock cannot be negative"]
    },
    /* Array of image indices (0-based) for this color — supports front/back/model */
    imageIndexes: {
        type: [Number],
        default: []
    },
    /* Legacy single index — kept for backward compatibility */
    imageIndex: {
        type: Number,
        default: null
    }
}, { _id: true });

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        default: "Snitch",
        trim: true
    },
    category: {
        type: String,
        enum: CATEGORIES,
        default: null
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    price: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: ["INR", "USD", "EUR", "GBP", "JPY"],
            required: true,
            default: "INR"
        }
    },
    /* Original / MRP price — displayed with strikethrough */
    discountPrice: {
        type: Number,
        default: null
    },
    images: [
        {
            uri: {
                type: String,
                required: true
            },
            alt: {
                type: String,
                required: true
            }
        }
    ],
    inventory: {
        type: [inventoryVariantSchema],
        default: []
    },
    tags: {
        type: [String],
        default: []
    },
    /* Draft/live toggle — buyers only see published products */
    published: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

/* Virtual: total stock across all variants */
productSchema.virtual("totalStock").get(function () {
    if (!Array.isArray(this.inventory)) return 0;
    return this.inventory.reduce((sum, v) => sum + (v.stock || 0), 0);
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export { CATEGORIES };
const productModel = mongoose.model("product", productSchema);
export default productModel;