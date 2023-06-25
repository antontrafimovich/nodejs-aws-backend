import { productsRepo, stocksRepo } from "../app";

export const handler = async (event: any) => {
  try {
    const promises = event.Records.map(async (record: any) => {
      const product = JSON.parse(record.body);

      return Promise.all([
        productsRepo.put(product),
        stocksRepo.put({ productId: product.id, count: product.count }),
      ]);
    });

    await Promise.all(promises);
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: err instanceof Error ? err.message : err,
    };
  }

  for (const record of event.Records) {
    const product = JSON.parse(record.body);
    productsRepo.put(product);
    stocksRepo.put({ productId: product.id, count: product.count });
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "ok",
  };
};
