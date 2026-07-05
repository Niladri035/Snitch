import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from Backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../../../../Documents/Snitch_The _e-ecommerce/Backend/.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/snitch";

console.log("Connecting to MongoDB at:", MONGO_URI);

// Define Schemas inline to avoid import issues
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    contact: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller"], default: "buyer" }
});

const inventoryVariantSchema = new mongoose.Schema({
    color: { type: String, required: true, trim: true },
    hex: { type: String, default: null, trim: true },
    size: { type: String, required: true },
    stock: { type: Number, required: true, default: 0 },
    imageIndexes: { type: [Number], default: [] },
    imageIndex: { type: Number, default: null }
});

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    brand: { type: String, default: "Snitch", trim: true },
    category: { type: String, default: null },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    price: {
        amount: { type: Number, required: true },
        currency: { type: String, default: "INR" }
    },
    discountPrice: { type: Number, default: null },
    images: [{
        uri: { type: String, required: true },
        alt: { type: String, required: true }
    }],
    inventory: { type: [inventoryVariantSchema], default: [] },
    tags: { type: [String], default: [] },
    published: { type: Boolean, default: true }
});

const User = mongoose.model("user", userSchema);
const Product = mongoose.model("product", productSchema);

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected successfully to DB.");

        // 1. Create Seller "Nil"
        const sellerEmail = "nil@snitch.com";
        const plainPassword = "Nil_0987654321@";
        
        let nilUser = await User.findOne({ email: sellerEmail });
        if (nilUser) {
            console.log("Seller 'Nil' already exists.");
        } else {
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            nilUser = await User.create({
                email: sellerEmail,
                fullname: "Nil",
                password: hashedPassword,
                role: "seller"
            });
            console.log("Seller 'Nil' created successfully with email:", sellerEmail);
        }

        const sellerId = nilUser._id;

        // Clean out older test products with these categories to keep DB tidy (optional)
        // await Product.deleteMany({ seller: sellerId });

        // Define mock images list
        const productsToSeed = [
            // --- Trousers & Pants ---
            {
                title: "Classic Slim Fit Chinos",
                description: "Premium cotton-stretch slim fit chino trousers, perfect for office and casual styling. Breathable weave for all-day comfort.",
                brand: "Snitch",
                category: "Trousers & Pants",
                price: { amount: 1299, currency: "INR" },
                discountPrice: 2499,
                tags: ["chinos", "trousers", "formal", "slim-fit"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600", alt: "Beige Chinos Front" },
                    { uri: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=60", alt: "Beige Chinos Side" },
                    { uri: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80", alt: "Beige Chinos Back" },
                    { uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600", alt: "Black Trousers Front" },
                    { uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80", alt: "Black Trousers Side" }
                ],
                inventory: [
                    // Beige
                    { color: "Beige", hex: "#F5F5DC", size: "S", stock: 35, imageIndexes: [0, 1, 2], imageIndex: 0 },
                    { color: "Beige", hex: "#F5F5DC", size: "M", stock: 50, imageIndexes: [0, 1, 2], imageIndex: 0 },
                    { color: "Beige", hex: "#F5F5DC", size: "L", stock: 40, imageIndexes: [0, 1, 2], imageIndex: 0 },
                    // Black
                    { color: "Black", hex: "#000000", size: "M", stock: 25, imageIndexes: [3, 4], imageIndex: 3 },
                    { color: "Black", hex: "#000000", size: "L", stock: 30, imageIndexes: [3, 4], imageIndex: 3 }
                ]
            },
            {
                title: "Relaxed Fit Pleated Trousers",
                description: "Modern relaxed pleated trousers styled with an elastic waistband and structured drape. Elevates your streetwear credentials.",
                brand: "DNMX",
                category: "Trousers & Pants",
                price: { amount: 1499, currency: "INR" },
                discountPrice: 2999,
                tags: ["pleated", "relaxed", "pants", "streetwear"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600", alt: "Charcoal Pleated Front" },
                    { uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80", alt: "Charcoal Pleated Detail" },
                    { uri: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600", alt: "Khaki Pleated Front" },
                    { uri: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80", alt: "Khaki Pleated Detail" }
                ],
                inventory: [
                    { color: "Charcoal", hex: "#36454F", size: "M", stock: 20, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Charcoal", hex: "#36454F", size: "L", stock: 25, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Khaki", hex: "#F0E68C", size: "M", stock: 15, imageIndexes: [2, 3], imageIndex: 2 },
                    { color: "Khaki", hex: "#F0E68C", size: "L", stock: 20, imageIndexes: [2, 3], imageIndex: 2 }
                ]
            },

            // --- Kurtas & Shirts ---
            {
                title: "Mandarin Collar Linen Shirt",
                description: "Super light and airy linen-cotton blend shirt. Styled with a clean mandarin band collar and curved hemline.",
                brand: "Snitch",
                category: "Kurtas & Shirts",
                price: { amount: 999, currency: "INR" },
                discountPrice: 1999,
                tags: ["linen", "shirt", "mandarin", "summer"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600", alt: "White Linen Shirt" },
                    { uri: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80", alt: "White Linen Detail" },
                    { uri: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600", alt: "Blue Denim Shirt" },
                    { uri: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80", alt: "Blue Denim Detail" }
                ],
                inventory: [
                    { color: "White", hex: "#ffffff", size: "M", stock: 40, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "White", hex: "#ffffff", size: "L", stock: 45, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Blue", hex: "#0000ff", size: "M", stock: 30, imageIndexes: [2, 3], imageIndex: 2 },
                    { color: "Blue", hex: "#0000ff", size: "L", stock: 35, imageIndexes: [2, 3], imageIndex: 2 }
                ]
            },
            {
                title: "Cotton Short Kurta",
                description: "Handloomed pure cotton short kurta featuring subtle self-weave patterns. Matches perfectly with jeans and sliders.",
                brand: "Snitch",
                category: "Kurtas & Shirts",
                price: { amount: 899, currency: "INR" },
                discountPrice: 1599,
                tags: ["kurta", "ethnic", "cotton", "casual"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600", alt: "Mustard Kurta Front" },
                    { uri: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600", alt: "Olive Kurta Front" }
                ],
                inventory: [
                    { color: "Mustard", hex: "#FFDB58", size: "M", stock: 35, imageIndexes: [0], imageIndex: 0 },
                    { color: "Mustard", hex: "#FFDB58", size: "L", stock: 40, imageIndexes: [0], imageIndex: 0 },
                    { color: "Olive", hex: "#808000", size: "M", stock: 25, imageIndexes: [1], imageIndex: 1 },
                    { color: "Olive", hex: "#808000", size: "L", stock: 30, imageIndexes: [1], imageIndex: 1 }
                ]
            },

            // --- Jeans ---
            {
                title: "Retro Baggy Fit Jeans",
                description: "90s inspired ultra-relaxed baggy fit denim jeans. Heavyweight cotton structure for a genuine authentic vintage silhouette.",
                brand: "ZARA",
                category: "Jeans",
                price: { amount: 1799, currency: "INR" },
                discountPrice: 3499,
                tags: ["baggy", "denim", "retro", "vintage"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", alt: "Light Blue Denim Front" },
                    { uri: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80", alt: "Light Blue Denim Side" },
                    { uri: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600", alt: "Dark Blue Denim Front" },
                    { uri: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80", alt: "Dark Blue Denim Side" }
                ],
                inventory: [
                    { color: "Light Blue", hex: "#ADD8E6", size: "M", stock: 30, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Light Blue", hex: "#ADD8E6", size: "L", stock: 40, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Dark Blue", hex: "#00008b", size: "M", stock: 25, imageIndexes: [2, 3], imageIndex: 2 },
                    { color: "Dark Blue", hex: "#00008b", size: "L", stock: 35, imageIndexes: [2, 3], imageIndex: 2 }
                ]
            },
            {
                title: "Distressed Tapered Denim",
                description: "Stretchy tapered distressed jeans styled with paint splatter detailing and raw cut edge ankle cuffs.",
                brand: "Snitch",
                category: "Jeans",
                price: { amount: 1599, currency: "INR" },
                discountPrice: 2799,
                tags: ["distressed", "tapered", "denim", "stretch"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600", alt: "Vintage Black Front" },
                    { uri: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600", alt: "Ice Blue Front" }
                ],
                inventory: [
                    { color: "Vintage Black", hex: "#1c1c1c", size: "M", stock: 25, imageIndexes: [0], imageIndex: 0 },
                    { color: "Vintage Black", hex: "#1c1c1c", size: "L", stock: 30, imageIndexes: [0], imageIndex: 0 },
                    { color: "Ice Blue", hex: "#AFEEEE", size: "M", stock: 20, imageIndexes: [1], imageIndex: 1 },
                    { color: "Ice Blue", hex: "#AFEEEE", size: "L", stock: 25, imageIndexes: [1], imageIndex: 1 }
                ]
            },

            // --- Sari ---
            {
                title: "Burgundy Kanjeevaram Silk Sari",
                description: "Exquisite handwoven gold-bordered silk sari. Traditional craftsmanship woven with premium silk threads for wedding and festive occasions.",
                brand: "EthnicSnitch",
                category: "Sari",
                price: { amount: 3499, currency: "INR" },
                discountPrice: 6999,
                tags: ["sari", "kanjeevaram", "silk", "festive"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600", alt: "Burgundy Sari Detail" },
                    { uri: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600", alt: "Gold Pallu Detail" }
                ],
                inventory: [
                    { color: "Burgundy", hex: "#800020", size: "Free Size", stock: 15, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            {
                title: "Designer Georgette Sari",
                description: "Lightweight georgette sari styled with dainty floral embroidery and a modern sequinned designer blouse piece.",
                brand: "Zara Festive",
                category: "Sari",
                price: { amount: 2199, currency: "INR" },
                discountPrice: 4299,
                tags: ["georgette", "designer", "sari", "floral"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600", alt: "Emerald Green Sari" },
                    { uri: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600", alt: "Sari Detail" }
                ],
                inventory: [
                    { color: "Emerald Green", hex: "#50C878", size: "Free Size", stock: 25, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },

            // --- Kurti & Legins ---
            {
                title: "Anarkali Kurti & Knit Leggings Set",
                description: "Anarkali styled long cotton kurti paired with matching high-stretch knit leggings. Perfect mix of ethnic look and daily wear comfort.",
                brand: "Snitch Women",
                category: "Kurti & Legins",
                price: { amount: 1399, currency: "INR" },
                discountPrice: 2499,
                tags: ["kurti", "anarkali", "leggings", "set"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600", alt: "Peach Anarkali Set" },
                    { uri: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600", alt: "Off White Anarkali Detail" }
                ],
                inventory: [
                    { color: "Peach", hex: "#FFDAB9", size: "S", stock: 20, imageIndexes: [0], imageIndex: 0 },
                    { color: "Peach", hex: "#FFDAB9", size: "M", stock: 35, imageIndexes: [0], imageIndex: 0 },
                    { color: "Off White", hex: "#F5F5F0", size: "M", stock: 25, imageIndexes: [1], imageIndex: 1 },
                    { color: "Off White", hex: "#F5F5F0", size: "L", stock: 30, imageIndexes: [1], imageIndex: 1 }
                ]
            },
            {
                title: "Straight Fit Printed Kurti",
                description: "Jaipuri block-printed straight fit cotton kurti. Detailed neck embroidery and structured fit.",
                brand: "EthnicSnitch",
                category: "Kurti & Legins",
                price: { amount: 799, currency: "INR" },
                discountPrice: 1499,
                tags: ["kurti", "printed", "jaipuri", "cotton"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600", alt: "Indigo Blue Kurti" },
                    { uri: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600", alt: "Rose Pink Kurti" }
                ],
                inventory: [
                    { color: "Indigo Blue", hex: "#4B0082", size: "M", stock: 30, imageIndexes: [0], imageIndex: 0 },
                    { color: "Indigo Blue", hex: "#4B0082", size: "L", stock: 35, imageIndexes: [0], imageIndex: 0 },
                    { color: "Rose Pink", hex: "#FFC0CB", size: "M", stock: 20, imageIndexes: [1], imageIndex: 1 },
                    { color: "Rose Pink", hex: "#FFC0CB", size: "L", stock: 25, imageIndexes: [1], imageIndex: 1 }
                ]
            },

            // --- Lady Shirt ---
            {
                title: "Oversized Satin Button-Down",
                description: "Silky premium satin oversized shirt featuring a drape collar, dropped shoulders, and wide cuffs. Feels luxury, looks sleek.",
                brand: "ZARA",
                category: "Lady Shirt",
                price: { amount: 1199, currency: "INR" },
                discountPrice: 2299,
                tags: ["satin", "oversized", "shirt", "button-down"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600", alt: "Champagne Satin Front" },
                    { uri: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600&q=80", alt: "Champagne Satin Back" },
                    { uri: "https://images.unsplash.com/photo-1534126511673-b6899657816a?w=600", alt: "Crimson Satin Front" }
                ],
                inventory: [
                    { color: "Champagne", hex: "#F0E6D2", size: "S", stock: 20, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Champagne", hex: "#F0E6D2", size: "M", stock: 30, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Crimson", hex: "#DC143C", size: "M", stock: 25, imageIndexes: [2], imageIndex: 2 }
                ]
            },
            {
                title: "Puff Sleeve Crop Blouse",
                description: "Sweetheart neck crop shirt designed with exaggerated puff sleeves and smocked tie back. Pairs beautifully with high rise denim.",
                brand: "Snitch Women",
                category: "Lady Shirt",
                price: { amount: 899, currency: "INR" },
                discountPrice: 1799,
                tags: ["puff-sleeve", "crop", "blouse", "sweetheart"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1534126511673-b6899657816a?w=600", alt: "Lilac Crop Blouse" },
                    { uri: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600", alt: "Classic White Crop" }
                ],
                inventory: [
                    { color: "Lilac", hex: "#C8A2C8", size: "S", stock: 15, imageIndexes: [0], imageIndex: 0 },
                    { color: "Lilac", hex: "#C8A2C8", size: "M", stock: 25, imageIndexes: [0], imageIndex: 0 },
                    { color: "Classic White", hex: "#ffffff", size: "S", stock: 20, imageIndexes: [1], imageIndex: 1 },
                    { color: "Classic White", hex: "#ffffff", size: "M", stock: 25, imageIndexes: [1], imageIndex: 1 }
                ]
            },

            // --- Lady pants ---
            {
                title: "High-Waisted Wide Leg Trousers",
                description: "Sophisticated high rise wide leg trouser pants featuring tailored front pleats. Perfect power styling for modern wardrobes.",
                brand: "ZARA",
                category: "Lady pants",
                price: { amount: 1699, currency: "INR" },
                discountPrice: 3299,
                tags: ["high-waisted", "wide-leg", "tailored", "trousers"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600", alt: "Tan Wide Leg Front" },
                    { uri: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600", alt: "Sage Green Wide Leg" }
                ],
                inventory: [
                    { color: "Tan", hex: "#D2B48C", size: "S", stock: 25, imageIndexes: [0], imageIndex: 0 },
                    { color: "Tan", hex: "#D2B48C", size: "M", stock: 35, imageIndexes: [0], imageIndex: 0 },
                    { color: "Sage Green", hex: "#8FBC8F", size: "S", stock: 15, imageIndexes: [1], imageIndex: 1 },
                    { color: "Sage Green", hex: "#8FBC8F", size: "M", stock: 20, imageIndexes: [1], imageIndex: 1 }
                ]
            },
            {
                title: "Utility cargo pants",
                description: "Heavy twill utility cargo pants detailed with flap pocket panels, knee darts, and an adjustable toggle hem.",
                brand: "Snitch Women",
                category: "Lady pants",
                price: { amount: 1499, currency: "INR" },
                discountPrice: 2799,
                tags: ["cargo", "utility", "pants", "twill"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600", alt: "Olive Cargo Pants" },
                    { uri: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600", alt: "Coal Black Cargo" }
                ],
                inventory: [
                    { color: "Olive", hex: "#556B2F", size: "S", stock: 20, imageIndexes: [0], imageIndex: 0 },
                    { color: "Olive", hex: "#556B2F", size: "M", stock: 30, imageIndexes: [0], imageIndex: 0 },
                    { color: "Coal Black", hex: "#222222", size: "S", stock: 15, imageIndexes: [1], imageIndex: 1 },
                    { color: "Coal Black", hex: "#222222", size: "M", stock: 25, imageIndexes: [1], imageIndex: 1 }
                ]
            }
        ];

        // Insert products in bulk
        for (const item of productsToSeed) {
            // Check if product with this title and category already exists for seller to prevent duplicates
            const existing = await Product.findOne({ title: item.title, category: item.category, seller: sellerId });
            if (existing) {
                console.log(`Product "${item.title}" in category "${item.category}" already exists.`);
            } else {
                await Product.create({
                    ...item,
                    seller: sellerId,
                    published: true
                });
                console.log(`Added product: "${item.title}" [Category: ${item.category}]`);
            }
        }

        console.log("Database seeding completed successfully!");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from database.");
    }
}

run();
