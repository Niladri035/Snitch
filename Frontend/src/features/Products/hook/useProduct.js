import {
    createProduct,
    getSellerProduct,
    getAllProduct,
    deleteProduct,
    updateInventory
} from "../services/product.api.js";
import { useDispatch, useSelector } from "react-redux";
import {
    setSellerProduct,
    appendProduct,
    removeProduct,
    updateProductInventory,
    setProducts,
    setLoading,
    setError
} from "../state/product.slice.js";

export const useProduct = () => {
    const dispatch = useDispatch();
    const { sellerProduct, products, loading, error } = useSelector(state => state.product);

    async function handleCreateProduct(formData) {
        const data = await createProduct(formData);
        // backend returns { product } (singular) on create
        const newProduct = data.product;
        dispatch(appendProduct(newProduct));
        return newProduct;
    }

    async function handleGetSellerProduct() {
        const data = await getSellerProduct();
        dispatch(setSellerProduct(data.products));
        return data.products;
    }

    async function handleGetAllProduct() {
        try {
            dispatch(setLoading(true));
            const data = await getAllProduct();
            dispatch(setProducts(data.products));
            return data.products;
        } catch (err) {
            dispatch(setError(err.response?.data?.message || 'Failed to load products'));
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleDeleteProduct(id) {
        await deleteProduct(id);
        dispatch(removeProduct(id));
    }

    async function handleUpdateInventory(id, inventory) {
        const data = await updateInventory(id, inventory);
        dispatch(updateProductInventory({ id, inventory: data.product?.inventory || inventory }));
        return data.product;
    }

    return {
        handleCreateProduct,
        handleGetSellerProduct,
        handleGetAllProduct,
        handleDeleteProduct,
        handleUpdateInventory,
        sellerProduct,
        products: products || [],
        loading,
        error
    };
};