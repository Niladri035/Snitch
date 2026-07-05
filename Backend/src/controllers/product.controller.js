import productModel from "../models/product.model.js";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { uploadFile } from "../services/storage.service.js";


/* ─────────────────────────────────────────────────────────────
   POST /api/products
   Create a new product (seller only).
   Accepts multipart/form-data — images as files, inventory as JSON string.
───────────────────────────────────────────────────────────── */
export async function createProduct(req, res) {
    try {
        const {
            title,
            description,
            priceAmount,
            priceCurrency,
            discountPrice,
            category,
            brand,
            tags,
            published
        } = req.body;

        const sellerId = req.user.id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one product image is required" });
        }

        const images = await Promise.all(req.files.map(async (file) => {
            const uploadResult = await uploadFile({
                buffer: file.buffer,
                fileName: file.originalname,
            });
            return {
                uri: uploadResult.url,
                alt: file.originalname
            };
        }));

        /* ── Parse inventory ── */
        let inventory = [];
        if (req.body.inventory) {
            try {
                inventory = JSON.parse(req.body.inventory);
            } catch {
                return res.status(400).json({ message: "Invalid inventory JSON" });
            }
        }

        /* ── Parse tags ── */
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
            } catch {
                parsedTags = [];
            }
        }

        /* ── Parse discountPrice ── */
        const parsedDiscountPrice = discountPrice ? Number(discountPrice) : null;

        /* ── Parse published ── */
        const isPublished = published === undefined ? true : (published === "false" || published === false) ? false : true;

        const product = await productModel.create({
            title,
            description,
            brand: brand || "Snitch",
            category: category || null,
            price: {
                amount: priceAmount,
                currency: priceCurrency || "INR"
            },
            discountPrice: parsedDiscountPrice,
            images,
            seller: sellerId,
            inventory,
            tags: parsedTags,
            published: isPublished
        });

        return res.status(201).json({
            message: "Product Created Successfully",
            success: true,
            product
        });
    } catch (error) {
        console.error("Error in createProduct controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
}


/* ─────────────────────────────────────────────────────────────
   GET /api/products/seller
   Get the logged-in seller's products (including drafts).
───────────────────────────────────────────────────────────── */
export async function getSellerProduct(req, res) {
    try {
        const sellerId = req.user.id;
        const products = await productModel
            .find({ seller: sellerId })
            .populate("seller", "fullname email");
        return res.status(200).json({
            message: "Seller Products fetched successfully",
            success: true,
            products
        });
    } catch (error) {
        console.error("Error in getSellerProduct controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
}


/* ─────────────────────────────────────────────────────────────
   GET /api/products
   Public — buyers only see published products that have stock.
───────────────────────────────────────────────────────────── */
export async function getAllProduct(req, res) {
    try {
        const { category, brand, minPrice, maxPrice, search } = req.query;

        const filter = {
            published: true,
            $or: [
                { inventory: { $size: 0 } },
                { "inventory.stock": { $gt: 0 } }
            ]
        };

        if (category) filter.category = category;
        if (brand) filter.brand = { $regex: brand, $options: "i" };
        if (minPrice || maxPrice) {
            filter["price.amount"] = {};
            if (minPrice) filter["price.amount"].$gte = Number(minPrice);
            if (maxPrice) filter["price.amount"].$lte = Number(maxPrice);
        }
        if (search) {
            filter.$and = [
                {
                    $or: [
                        { title: { $regex: search, $options: "i" } },
                        { description: { $regex: search, $options: "i" } },
                        { tags: { $in: [new RegExp(search, "i")] } },
                        { brand: { $regex: search, $options: "i" } }
                    ]
                }
            ];
        }

        const products = await productModel
            .find(filter)
            .populate("seller", "fullname email");

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            products
        });
    } catch (error) {
        console.error("Error in getAllProduct controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
}


/* ─────────────────────────────────────────────────────────────
   DELETE /api/products/:id
   Delete a product (seller must own it).
───────────────────────────────────────────────────────────── */
export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.seller.toString() !== sellerId) {
            return res.status(403).json({ message: "You are not authorised to delete this product" });
        }

        await productModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Product deleted successfully",
            success: true
        });
    } catch (error) {
        console.error("Error in deleteProduct controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
}


/* ─────────────────────────────────────────────────────────────
   PATCH /api/products/:id/inventory
   Replace full inventory for a product (seller must own it).
───────────────────────────────────────────────────────────── */
export async function updateInventory(req, res) {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;
        const { inventory } = req.body;

        if (!Array.isArray(inventory)) {
            return res.status(400).json({ message: "inventory must be an array" });
        }

        const product = await productModel.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (product.seller.toString() !== sellerId) {
            return res.status(403).json({ message: "You are not authorised to update this product" });
        }

        product.inventory = inventory;
        await product.save();

        return res.status(200).json({
            message: "Inventory updated successfully",
            success: true,
            product
        });
    } catch (error) {
        console.error("Error in updateInventory controller:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || error
        });
    }
}


/* ─────────────────────────────────────────────────────────────
   PATCH /api/products/:id
   Update product metadata (title, description, price, category,
   brand, tags, discountPrice, published). Seller must own it.
───────────────────────────────────────────────────────────── */
export async function updateProduct(req, res) {
    try {
        const { id } = req.params;
        const sellerId = req.user.id;

        const product = await productModel.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        if (product.seller.toString() !== sellerId)
            return res.status(403).json({ message: "You are not authorised to update this product" });

        const allowed = ["title", "description", "brand", "category", "discountPrice", "tags", "published"];
        allowed.forEach(key => {
            if (req.body[key] !== undefined) product[key] = req.body[key];
        });

        if (req.body.priceAmount !== undefined)  product.price.amount   = Number(req.body.priceAmount);
        if (req.body.priceCurrency !== undefined) product.price.currency = req.body.priceCurrency;

        await product.save();

        return res.status(200).json({
            message: "Product updated successfully",
            success: true,
            product
        });
    } catch (error) {
        console.error("Error in updateProduct controller:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}


export async function seedMockProducts(req, res) {
    try {
        const sellerEmail = "nil@snitch.com";
        const plainPassword = "Nil_0987654321@";
        
        let nilUser = await userModel.findOne({ email: sellerEmail });
        if (!nilUser) {
            nilUser = await userModel.create({
                email: sellerEmail,
                fullname: "Nil",
                password: plainPassword,
                role: "seller"
            });
            console.log("Seller 'Nil' created successfully with email:", sellerEmail);
        } else {
            nilUser.password = plainPassword;
            await nilUser.save();
            console.log("Seller 'Nil' password updated/verified.");
        }

        const sellerId = nilUser._id;

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
                    { color: "Beige", hex: "#F5F5DC", size: "S", stock: 35, imageIndexes: [0, 1, 2], imageIndex: 0 },
                    { color: "Beige", hex: "#F5F5DC", size: "M", stock: 50, imageIndexes: [0, 1, 2], imageIndex: 0 },
                    { color: "Beige", hex: "#F5F5DC", size: "L", stock: 40, imageIndexes: [0, 1, 2], imageIndex: 0 },
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
                tags: ["kurta", "printed", "jaipuri", "cotton"],
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
                title: "Utility Twill Cargo Pants",
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
            },
            // --- Summer Collection (Gen-Z) ---
            {
                title: "Gen-Z Retro Ribbed Crop Top",
                description: "Heavy ribbed knit crop top designed with modern sporty trim lines and retro shoulder straps. Breathable, ultra-cool comfort for hot summer drops.",
                brand: "Zara Sport",
                category: "Summer Collection",
                price: { amount: 899, currency: "INR" },
                discountPrice: 1799,
                tags: ["gen-z", "summer", "crop", "ribbed", "sporty"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600", alt: "Sporty Black Front" },
                    { uri: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600", alt: "Ribbed Detail View" }
                ],
                inventory: [
                    { color: "Sporty Black", hex: "#121212", size: "S", stock: 35, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Sporty Black", hex: "#121212", size: "M", stock: 40, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            // --- Old Fashion ---
            {
                title: "Vintage Distressed Leather Bomber",
                description: "Retro bomber jacket tailored in heavy hand-distressed cowhide leather. Dropped shoulders, ribbed collar, and authentic vintage brass zippers.",
                brand: "Levi's Vintage",
                category: "Old Fashion",
                price: { amount: 5499, currency: "INR" },
                discountPrice: 9999,
                tags: ["vintage", "leather", "old-fashion", "retro", "bomber"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600", alt: "Vintage Brown Leather Front" },
                    { uri: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600", alt: "Bomber Fit Model" }
                ],
                inventory: [
                    { color: "Vintage Brown", hex: "#5C4033", size: "M", stock: 20, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Vintage Brown", hex: "#5C4033", size: "L", stock: 25, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            // --- Boys & Girls ---
            {
                title: "Oversized Streetwear Colorblock Hoodie",
                description: "Gender-neutral heavy-weight fleece hoodie featuring a raw colorblock design, kangaroo pockets, and utility hood pulls. High key cozy.",
                brand: "Snitch Street",
                category: "Boys & Girls",
                price: { amount: 1899, currency: "INR" },
                discountPrice: 3499,
                tags: ["streetwear", "hoodie", "boys", "girls", "colorblock"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600", alt: "Charcoal Colorblock Front" },
                    { uri: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600", alt: "Fleece Hood Detail" }
                ],
                inventory: [
                    { color: "Charcoal Blue", hex: "#333b4d", size: "M", stock: 30, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Charcoal Blue", hex: "#333b4d", size: "L", stock: 35, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            // --- Oldaged ---
            {
                title: "Classic Cable-Knit Wool Cardigan",
                description: "Traditional soft cable knit wool cardigan with horn buttons and deep front pockets. Offers timeless style and ultimate insulation.",
                brand: "Marks & Spencer",
                category: "Oldaged",
                price: { amount: 2799, currency: "INR" },
                discountPrice: 4999,
                tags: ["classic", "cardigan", "wool", "oldaged", "comfort"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=600", alt: "Oatmeal Cream Knit" },
                    { uri: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600", alt: "Comfy Wool Model View" }
                ],
                inventory: [
                    { color: "Oatmeal Cream", hex: "#F5F5DC", size: "M", stock: 15, imageIndexes: [0, 1], imageIndex: 0 },
                    { color: "Oatmeal Cream", hex: "#F5F5DC", size: "L", stock: 20, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            // --- Gadgets ---
            {
                title: "Aura Premium Smart Watch Series 5",
                description: "Advanced health tracker and smartwatch featuring an always-on micro-LED display, sleep analysis, and luxury metal band. Tech meets aesthetic.",
                brand: "Samsung Aura",
                category: "Gadgets",
                price: { amount: 4899, currency: "INR" },
                discountPrice: 8999,
                tags: ["smartwatch", "gadgets", "wearable", "tech"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", alt: "Titanium watch front" },
                    { uri: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600", alt: "Watch detail dial" }
                ],
                inventory: [
                    { color: "Titanium Gray", hex: "#808080", size: "Free Size", stock: 50, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            {
                title: "Oryx Smart Ring Active",
                description: "Ultralight titanium health tracking smart ring. Measures heart rate, blood oxygen, sleep quality, and active metrics. Sleek, minimal design.",
                brand: "Oryx Tech",
                category: "Gadgets",
                price: { amount: 3199, currency: "INR" },
                discountPrice: 5999,
                tags: ["smartring", "gadgets", "wearable", "health"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600", alt: "Matte Black Ring" },
                    { uri: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600", alt: "Smart Ring Fitting" }
                ],
                inventory: [
                    { color: "Matte Black", hex: "#212121", size: "Free Size", stock: 35, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            // --- Grooming ---
            {
                title: "Precision Beard & Hair Grooming Shaver Set",
                description: "Deluxe water-resistant cordless trimmer featuring self-sharpening ceramic blades and multiple size attachments. Perfect styling fr.",
                brand: "Philips Premium",
                category: "Grooming",
                price: { amount: 1599, currency: "INR" },
                discountPrice: 2999,
                tags: ["grooming", "beard", "shaver", "accessories", "trimmer"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600", alt: "Cordless Shaver Unit" },
                    { uri: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600", alt: "Barber Grooming Detail" }
                ],
                inventory: [
                    { color: "Chrome Silver", hex: "#C0C0C0", size: "Free Size", stock: 45, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            {
                title: "Organic Argan Beard & Styling Oil",
                description: "Infused with pure argan, jojoba, and almond oils to soften, tame, and style your beard. Smells clean and looks premium.",
                brand: "Groomed Men",
                category: "Grooming",
                price: { amount: 499, currency: "INR" },
                discountPrice: 899,
                tags: ["grooming", "oil", "beard", "hair", "styling"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600", alt: "Argan Oil Bottle" },
                    { uri: "https://images.unsplash.com/photo-1617897903246-719242758050?w=600", alt: "Sleek Serum Detail" }
                ],
                inventory: [
                    { color: "Amber Gold", hex: "#FFBF00", size: "Free Size", stock: 60, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            },
            // --- Kids ---
            {
                title: "Unisex Soft-Knit Kid's Romper",
                description: "Ultra-soft cotton romper crafted with baby-safe organic fibers, snap closures for easy dressing, and a comfortable stretch design.",
                brand: "Snitch Kids",
                category: "Kids",
                price: { amount: 699, currency: "INR" },
                discountPrice: 1299,
                tags: ["kids", "romper", "soft-knit", "unisex", "baby"],
                images: [
                    { uri: "https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600", alt: "Romper Front View" },
                    { uri: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600", alt: "Comfortable Soft Knit Romper" }
                ],
                inventory: [
                    { color: "Pastel Sage", hex: "#9FA997", size: "Free Size", stock: 30, imageIndexes: [0, 1], imageIndex: 0 }
                ]
            }
        ];

        // Wipe old products for Nil to ensure clean seed
        await productModel.deleteMany({ seller: sellerId });

        let addedCount = 0;
        for (const item of productsToSeed) {
            await productModel.create({
                ...item,
                seller: sellerId,
                published: true
            });
            addedCount++;
        }

        return res.status(200).json({
            success: true,
            message: `DB seeding completed successfully! Verified seller 'Nil'. Added ${addedCount} mock products.`,
            seller: { email: sellerEmail, fullname: "Nil", role: "seller" }
        });
    } catch (error) {
        console.error("Error in seedMockProducts controller:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to seed mock products",
            error: error.message
        });
    }
}