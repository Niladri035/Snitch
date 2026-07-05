import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
    createProduct,
    getSellerProduct,
    getAllProduct,
    deleteProduct,
    updateInventory,
    updateProduct,
    seedMockProducts
} from "../controllers/product.controller.js";
import { createProductValidator, updateProductValidator } from "../validator/product.validator.js";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 5 }
});

/* ── Seeding route ── */
router.get("/seed-mock-products", seedMockProducts);

/* ── Public route — no auth required ── */
router.get("/", getAllProduct);

/* ── Seller-only routes ── */
router.post(
    "/",
    authenticate,
    requireRole("seller"),
    upload.array("images", 10),
    createProductValidator,
    createProduct
);

router.get(
    "/seller",
    authenticate,
    requireRole("seller"),
    getSellerProduct
);

/* ── Delete a product ── */
router.delete(
    "/:id",
    authenticate,
    requireRole("seller"),
    deleteProduct
);

/* ── Update product metadata (title, price, category, brand, tags, published, discountPrice) ── */
router.patch(
    "/:id",
    authenticate,
    requireRole("seller"),
    updateProductValidator,
    updateProduct
);

/* ── Update inventory variants ── */
router.patch(
    "/:id/inventory",
    authenticate,
    requireRole("seller"),
    updateInventory
);

export default router;
