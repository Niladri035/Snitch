import {Router} from "express";
import {validateRegisterUser,validateLoginUser} from "../validator/auth.validator.js";
import {register,login, googleAuth, getMe, logout} from "../controllers/auth.controller.js";
import passport from "passport";
import { authenticate } from "../middlewares/auth.middleware.js";


const router = Router();


router.post("/register",validateRegisterUser,register);
router.post("/login",validateLoginUser,login);
router.post("/logout",logout);
router.get("/google",passport.authenticate("google",{
    scope:["email","profile"]
}));
router.get("/google/callback",
    passport.authenticate("google",{session: false}),
    googleAuth
);
router.get("/me", authenticate, getMe);




export default router;