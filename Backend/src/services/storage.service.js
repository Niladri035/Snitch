import ImageKit from "@imagekit/nodejs";
import { config } from "../config/config.js";


const client = new ImageKit({
    publicKey:config.IMAGEKIT_PUBLIC_KEY,
    privateKey:config.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint:config.IMAGEKIT_URL_ENDPOINT
});


export async function uploadFile({buffer,fileName,folder = "Snitch"}){
    const result = await client.files.upload({
        file:buffer.toString("base64"),
        fileName,
        folder
    })
    return result;
}