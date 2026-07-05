import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
    name: "product",
    initialState: {
        sellerProduct: [],
        products: [],
        loading: false,
        error: null
    },
    reducers: {
        setSellerProduct: (state, action) => {
            state.sellerProduct = action.payload;
        },
        appendProduct: (state, action) => {
            state.sellerProduct.push(action.payload);
        },
        removeProduct: (state, action) => {
            state.sellerProduct = state.sellerProduct.filter(p => p._id !== action.payload);
        },
        updateProductInventory: (state, action) => {
            const { id, inventory } = action.payload;
            const idx = state.sellerProduct.findIndex(p => p._id === id);
            if (idx !== -1) {
                state.sellerProduct[idx].inventory = inventory;
                // Recalculate totalStock for the UI
                state.sellerProduct[idx].totalStock = inventory.reduce(
                    (sum, v) => sum + (v.stock || 0), 0
                );
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setProducts: (state, action) => {
            state.products = action.payload;    
        }
    }
});

export const {
    setSellerProduct,
    appendProduct,
    removeProduct,
    updateProductInventory,
    setLoading,
    setError,
    setProducts
} = productSlice.actions;

export default productSlice.reducer;
