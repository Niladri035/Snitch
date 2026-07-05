import {Router} from "express";
import {validateRegisterUser,validateLoginUser} from "../validator/auth.validator.js";
import {register,login, googleAuth} from "../controllers/auth.controller.js";
import  passport from "passport";


const router = Router();


router.post("/register",validateRegisterUser,register);
router.post("/login",validateLoginUser,login);
router.get("/google",passport.authenticate("google",{
    scope:["email","profile"]
}));
router.get("/google/callback",
    passport.authenticate("google",{session: false}),
    googleAuth
);




export default router;