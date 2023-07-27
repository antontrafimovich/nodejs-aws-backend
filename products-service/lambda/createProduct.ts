import { v4 as uuidv4 } from "uuid";

import { productsRepo, stocksRepo } from "../app";
import { Product } from "../model/Product";
import { getRandomPhotoUrl } from "../shared";

type CreateProductRequestItem = Product & { count: number };

const validateInputProduct = (item: Record<string, any>): void => {
  if (!item.title) {
    throw new Error("Product title can't be empty");
  }
};

export const handler = async (event: any) => {
  console.log(`POST /products ${event.body}`);

  let item: CreateProductRequestItem;

  try {
    item = JSON.parse(event.body);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  try {
    validateInputProduct(item);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: (err as Error).message,
    };
  }

  let photoUrl;

  try {
    photoUrl = await getRandomPhotoUrl();
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: typeof err === "string" ? err : (err as Error).message,
    };
  }

  const newProduct: Product = {
    title: item.title,
    description: item.description ?? "",
    price: item.price ?? 0,
    id: uuidv4(),
    image: photoUrl,
  };

  try {
    await productsRepo.put(newProduct);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  try {
    await stocksRepo.put({ productId: newProduct.id, count: item.count ?? 0 });
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err.message,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProduct),
  };
};
