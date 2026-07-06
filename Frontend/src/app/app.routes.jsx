import { createBrowserRouter } from "react-router";
import Register from "../features/auth/pages/Register";
import Login from "../features/auth/pages/Login";
import CreateProduct from "../features/Products/pages/CreateProduct";
import SellerDashboard from "../features/Products/pages/SellerDashboard";
import Home from "../features/home/pages/Home";
import SellerRoute from "../components/SellerRoute";
import WishlistPage from "../features/home/pages/WishlistPage";
import CollectionsPage from "../features/home/pages/CollectionsPage";
import OrderSuccessPage from "../features/Products/pages/OrderSuccessPage";
import BuyerOrdersPage from "../features/Products/pages/BuyerOrdersPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />
    },
    {
        path: "/wishlist",
        element: <WishlistPage />
    },
    {
        path: "/collections",
        element: <CollectionsPage />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/login",
        element: <Login />
    },

    /* ── Seller-only pages ── */
    {
        path: "/products/create",
        element: (
            <SellerRoute>
                <CreateProduct />
            </SellerRoute>
        )
    },
    {
        path: "/seller",
        children: [
            {
                path: "/seller/dashboard",
                element: (
                    <SellerRoute>
                        <SellerDashboard />
                    </SellerRoute>
                )
            },
            {
                path: "/seller/create",
                element: (
                    <SellerRoute>
                        <CreateProduct />
                    </SellerRoute>
                )
            }
        ]
    },
    {
        path: "/order-success",
        element: <OrderSuccessPage />
    },
    {
        path: "/my-orders",
        element: <BuyerOrdersPage />
    }
]);
