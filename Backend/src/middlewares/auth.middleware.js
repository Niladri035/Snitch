import jwt from "jsonwebtoken"
import {config} from "../config/config.js"


/* ── Verify JWT and attach req.user ── */
export const authenticate = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized — please log in" });
        }
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;   // { id, role }
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

/* Alias kept so old imports don't break */
export const authenticateSeller = authenticate;

/* ── Role guard — call after authenticate ── */
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({
            message: `Access denied — only ${roles.join(' / ')} accounts can perform this action`
        });
    }
    next();
}
