import { handler as getProducts } from "./../lambda/getProductsList";
import { handler as getProductsById } from "./../lambda/getProductsById";

describe("getProducts", () => {
  test("getProducts should return all the products", async () => {
    const productsResult: { statusCode: number; headers: any; body: any } =
      await getProducts(null);

    expect(productsResult.statusCode).toBe(200);
    expect(productsResult.headers["Content-Type"]).toBeDefined();
    expect(productsResult.headers["Content-Type"]).toBe("application/json");

    const products = JSON.parse(productsResult.body);

    expect(Array.isArray(products)).toBeTruthy();
    expect(products.length).toBeGreaterThan(0);
  });
});

describe("getProductsById", () => {
  test("should return error if id doesn't exists", async () => {
    const id = "1231231asdf";

    const {
      statusCode,
      headers,
      body,
    }: { statusCode: number; headers: any; body: any } = await getProductsById({
      pathParameters: { productId: id },
    });

    expect(statusCode).toBe(404);
    expect(headers["Content-Type"]).toBeDefined();
    expect(headers["Content-Type"]).toBe("text/plain");

    const message = body;

    expect(typeof message).toBe("string");
    expect(message).toBe(`Product with id ${id} doesn't exist`);
  });

  test("should return product if id exists", async () => {
    const id = "647cfe582d5b34aaa5722eae";

    const {
      statusCode,
      headers,
      body,
    }: { statusCode: number; headers: any; body: any } = await getProductsById({
      pathParameters: { productId: id },
    });

    expect(statusCode).toBe(200);
    expect(headers["Content-Type"]).toBeDefined();
    expect(headers["Content-Type"]).toBe("application/json");

    const product = JSON.parse(body);

    expect(typeof product).toBe("object");
    expect(product.id).toBe(id);
  });
});
