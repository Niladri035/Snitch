import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI){
    console.log("MongoDB URI is not defined");
    process.exit(1);
}
if(!process.env.JWT_SECRET){
    console.log("JWT Secret is not defined");
    process.exit(1);
}
if(!process.env.GOOGLE_CLIENT_ID){
    console.log("Google Client ID is not defined");
    process.exit(1);
}
if(!process.env.GOOGLE_CLIENT_SECRET){
    console.log("Google Client Secret is not defined");
    process.exit(1);
}
if(!process.env.GOOGLE_CALLBACK_URL){
    console.log("Google Callback URL is not defined");
    process.exit(1);
}
if(!process.env.IMAGEKIT_PRIVATE_KEY){
    console.log("Imagekit Private Key is not defined");
    process.exit(1);
}
if(!process.env.IMAGEKIT_PUBLIC_KEY){
    console.log("Imagekit Public Key is not defined");
    process.exit(1);
}
if(!process.env.IMAGEKIT_URL_ENDPOINT){
    console.log("Imagekit URL Endpoint is not defined");
    process.exit(1);
}
if(!process.env.RAZORPAY_KEY_ID){
    console.log("Razorpay Key ID is not defined");
    process.exit(1);
}
if(!process.env.RAZORPAY_KEY_SECRET){
    console.log("Razorpay Key Secret is not defined");
    process.exit(1);
}
export const config ={
    
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL:process.env.GOOGLE_CALLBACK_URL,
    IMAGEKIT_PUBLIC_KEY:process.env.IMAGEKIT_PUBLIC_KEY,
    IMAGEKIT_PRIVATE_KEY:process.env.IMAGEKIT_PRIVATE_KEY,
    IMAGEKIT_URL_ENDPOINT:process.env.IMAGEKIT_URL_ENDPOINT,
    // AI keys — optional (no crash if missing)
    GEMINI_API_KEY:  process.env.GEMINI_API_KEY  || null,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || null,
    COHERE_API_KEY:  process.env.COHERE_API_KEY  || null,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173"
}

export default config;