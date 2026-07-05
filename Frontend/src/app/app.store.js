import {configureStore} from "@reduxjs/toolkit";                 
import authReducer from "../features/auth/state/auth.slice.js"
import productReducer from "../features/Products/state/product.slice.js"
import cartReducer from "../features/Products/state/cart.slice.js"


export const store = configureStore({
    reducer: {
        auth: authReducer,
        product: productReducer,
        cart: cartReducer
    }
})