import axios from "axios";


const productApiInstance = axios.create({
    baseURL: "/api/products",
    withCredentials:true
});

export async function createProduct(formData){
    const response = await productApiInstance.post("/",formData);
    return response.data;
}
export async function getSellerProduct(){
    const response = await productApiInstance.get("/seller");
    return response.data;
}

export async function getAllProduct(){
    const response = await productApiInstance.get("/");
    return response.data;
}

export async function deleteProduct(id) {
    const response = await productApiInstance.delete(`/${id}`);
    return response.data;
}

export async function updateInventory(id, inventory) {
    const response = await productApiInstance.patch(`/${id}/inventory`, { inventory });
    return response.data;
}