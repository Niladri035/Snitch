import {body,validationResult} from "express-validator";


function validateRequest(req,res,next){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    next();
}






export const validateRegisterUser = [
    body("email")
    .isEmail().withMessage("Invalid email"),
    body("contact")
    .notEmpty().withMessage("Contact is required")
    .matches(/^\d{10}$/).withMessage("Contact must be 10 digits"),
    body("password")
    .isLength({min:6}).withMessage("Password must be at least 6 characters"),
    body("fullname")
    .notEmpty().withMessage("Fullname is required")
    .isLength({min:3}).withMessage("Fullname must be at least 3 characters"),
   body("isSeller")
    .isBoolean().withMessage("isSeller must be a boolean"),
    validateRequest
];

export const validateLoginUser = [
    body("email")
    .isEmail().withMessage("Invalid email"),
    body("password")
    .isLength({min:6}).withMessage("Password must be at least 6 characters"),
    validateRequest
];