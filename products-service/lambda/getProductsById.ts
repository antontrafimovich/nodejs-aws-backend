
import products from './products.json'
import { Product } from '../model/Product';

export const handler = async (event: any) => {
    const { productId } = event.pathParameters;

    const product = (products as Product[]).find(product => product.id === productId)

    if (!product) {
        return {
            statusCode: 404,
            headers: { "Content-Type": "text/plain" },
            body: `Product with id ${productId} doesn't exist`
        }
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    };
}