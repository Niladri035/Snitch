import { body, validationResult } from "express-validator";
import { CATEGORIES } from "../models/product.model.js";

function validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
}

export const createProductValidator = [
    body("title").notEmpty().withMessage("Title is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("priceAmount").notEmpty().withMessage("Price is required").isNumeric().withMessage("Price must be a number"),
    body("priceCurrency").notEmpty().withMessage("Currency is required").isIn(["INR", "USD", "EUR", "GBP", "JPY"]).withMessage("Invalid currency"),
    body("discountPrice").optional().isNumeric().withMessage("Discount price must be a number"),
    body("category").optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("brand").optional().isString().trim(),
    validateRequest
];

export const updateProductValidator = [
    body("priceAmount").optional().isNumeric().withMessage("Price must be a number"),
    body("priceCurrency").optional().isIn(["INR", "USD", "EUR", "GBP", "JPY"]).withMessage("Invalid currency"),
    body("discountPrice").optional().isNumeric().withMessage("Discount price must be a number"),
    body("category").optional().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(", ")}`),
    body("published").optional().isBoolean().withMessage("Published must be true or false"),
    validateRequest
];