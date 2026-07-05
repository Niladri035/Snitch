import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as cartApi from '../services/cart.api.js';

export const getCartThunk = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await cartApi.fetchCart();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addToCartThunk = createAsyncThunk(
  'cart/add',
  async ({ productId, color, size, quantity }, { rejectWithValue }) => {
    try {
      return await cartApi.addToCart({ productId, color, size, quantity });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateQuantityThunk = createAsyncThunk(
  'cart/updateQuantity',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      return await cartApi.updateCartQuantity({ itemId, quantity });
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeFromCartThunk = createAsyncThunk(
  'cart/remove',
  async (itemId, { rejectWithValue }) => {
    try {
      return await cartApi.removeFromCart(itemId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const clearCartThunk = createAsyncThunk(
  'cart/clear',
  async (_, { rejectWithValue }) => {
    try {
      return await cartApi.clearCart();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleSelectThunk = createAsyncThunk(
  'cart/toggleSelect',
  async (itemId, { rejectWithValue }) => {
    try {
      return await cartApi.toggleSelect(itemId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleSaveThunk = createAsyncThunk(
  'cart/toggleSave',
  async (itemId, { rejectWithValue }) => {
    try {
      return await cartApi.toggleSave(itemId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch Cart
    builder
      .addCase(getCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(getCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add To Cart
    builder
      .addCase(addToCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(addToCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Quantity
    builder
      .addCase(updateQuantityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuantityThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(updateQuantityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Remove from Cart
    builder
      .addCase(removeFromCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(removeFromCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Clear Cart
    builder
      .addCase(clearCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle Select
    builder
      .addCase(toggleSelectThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleSelectThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(toggleSelectThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle Save (Save for Later)
    builder
      .addCase(toggleSaveThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleSaveThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
      })
      .addCase(toggleSaveThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
