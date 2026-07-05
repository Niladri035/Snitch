import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRouter from "./routes/auth.routes.js";
import passport from "passport";
import {Strategy as GoogleStrategy} from "passport-google-oauth20";
import { config } from "./config/config.js";
import productRouter from "./routes/product.routes.js";
import aiRouter from "./routes/ai.routes.js";
import cartRouter from "./routes/cart.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import orderRouter from "./routes/order.routes.js";


const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Dynamically allow any requesting origin with credentials for ease of hosting on Render/Netlify/Vercel
        if (!origin) return callback(null, true);
        callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));


app.use(passport.initialize());
passport.use(new GoogleStrategy({
    clientID:config.GOOGLE_CLIENT_ID,
    clientSecret:config.GOOGLE_CLIENT_SECRET,
    callbackURL:config.GOOGLE_CALLBACK_URL,
    scope:["email","profile"]
    
}, (accessToken,refreshToken,profile,done)=>{
    return done(null,profile);
}))




app.get("/",(req,res)=>{
    res.status(200).json({message:"Snitch E-Commerce Backend is running"});
});

app.use("/api/auth",authRouter);
app.use("/api/products",productRouter);
app.use("/api/ai",aiRouter);
app.use("/api/cart",cartRouter);
app.use("/api/wishlist",wishlistRouter);
app.use("/api/orders",orderRouter);
export default app;