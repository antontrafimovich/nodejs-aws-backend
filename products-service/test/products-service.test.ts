import { handler as getProducts } from './../lambda/getProductsList.js'

describe("getProducts", () => {
    test("getProducts should return all the products", async () => {
        const productsResult: { statusCode: number, headers: any, body: any } = await getProducts();

        expect(productsResult.statusCode).toBe(200);
        expect(productsResult.headers['Content-Type']).toBeDefined();
        expect(productsResult.headers['Content-Type']).toBe('application/json');

        const products = JSON.parse(productsResult.body);

        expect(Array.isArray(products)).toBeTruthy();
        expect(products.length).toBeGreaterThan(0);
    })
})
