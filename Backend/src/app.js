import express from "express";
import helmet from "helmet";
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

/* ── 1. Security headers via Helmet (must come BEFORE routes & CORS) ── */
app.use(helmet({
    // 1. XSS — Content-Security-Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc:  ["'self'"],
            scriptSrc:   ["'self'", "https://checkout.razorpay.com", "https://cdn.razorpay.com"],
            styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc:     ["'self'", "https://fonts.gstatic.com"],
            imgSrc:      ["'self'", "data:", "https://ik.imagekit.io", "https://lh3.googleusercontent.com"],
            connectSrc:  ["'self'", "https://snitch-s12s.onrender.com", "https://api.razorpay.com"],
            frameSrc:    ["https://api.razorpay.com", "https://checkout.razorpay.com"],
            objectSrc:   ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    // 2. Clickjacking — X-Frame-Options
    frameguard: { action: "sameorigin" },
    // 3. MIME Sniffing — X-Content-Type-Options
    noSniff: true,
    // 4. SSL Stripping / MitM — Strict-Transport-Security (HSTS)
    hsts: {
        maxAge: 31536000,       // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    },
    // 5. Stack Fingerprinting — removes X-Powered-By
    hidePoweredBy: true,
    // 6. DNS Leakage — X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },
    // 7. Referrer Leakage — Referrer-Policy
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // 8. Spectre / Memory Attack — Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    // 9. Cross-Origin Data Theft — Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow our frontend to fetch
    // 11. Cross-Origin Embedding — Cross-Origin-Embedder-Policy (relaxed for Razorpay iframes)
    crossOriginEmbedderPolicy: false,
    // 12. IE Legacy XSS — X-XSS-Protection: 0 (disables the buggy built-in filter)
    xssFilter: true,
    // 13. Flash / Plugin Attacks — X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    // 14. IE File Download XSS — X-Download-Options
    ieNoOpen: true,
}));

/* ── 2. CORS ── */
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