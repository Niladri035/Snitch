import { createCartOrder } from "../services/cart.api.js";
import { useState } from "react";
import { useNavigate } from "react-router";


export const useCart = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const handleCreateOrder = async (amount, currency = "INR") => {
        try {
            setLoading(true);
            const response = await createCartOrder(amount, currency);
            console.log("Order created:", response);
            return response;
        } catch (error) {
            console.error("Failed to create order:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };
    return {
        handleCreateOrder,
        loading
    };
}

