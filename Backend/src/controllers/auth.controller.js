import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";



async function sendTokenResponse(user, res, message) {
    const token = jwt.sign({
        id: user._id,
        role: user.role
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    })
    res.cookie("token", token);
    res.status(200).json({
        message,
        Success: true,
        user: {
            id: user._id,
            email: user.email,
            fullname: user.fullname,
            role: user.role
        }
    })


}



export const register = async (req, res) => {
    const { email, contact, password, fullname, isSeller } = req.body;

    try {

        const existingUser = await userModel.findOne({
            $or: [{ email },
            { contact }]
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await userModel.create({
            email,
            contact,
            password,
            fullname,
            role: isSeller ? "seller" : "buyer"
        })


    await sendTokenResponse(user, res, "User registered successfully");     


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }

}

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        await sendTokenResponse(user, res, "User logged in successfully");
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" })
    }
}


export const googleAuth = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect(`${config.FRONTEND_URL}/login?error=google_auth_failed`);
        }

        const email = req.user.emails[0].value;
        const fullname = req.user.displayName || req.user.username || "Google User";
        const { id } = req.user;

        let user = await userModel.findOne({ email });
        if (!user) {
            user = await userModel.create({
                email,
                fullname,
                googleId: id,
            });
        }
        
        const token = jwt.sign({
            id: user._id,
            role: user.role
        }, config.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.cookie("token", token, {
            httpOnly: false, // Set to false so frontend can check/read if necessary
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.redirect(`${config.FRONTEND_URL}/`);
    } catch (error) {
        console.error("Google Auth controller error:", error);
        res.redirect(`${config.FRONTEND_URL}/login?error=server_error`);
    }
}

export const getMe = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                fullname: user.fullname,
                role: user.role
            }
        });
    } catch (error) {
        console.error("GetMe controller error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}