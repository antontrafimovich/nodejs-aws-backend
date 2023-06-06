import products from "./products.json";

export const handler = async (event: any) => {
  if (!products) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "text/plain" },
      body: "Products haven't been found",
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(products),
  };
};
