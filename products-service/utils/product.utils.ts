import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Product } from "../model/Product";

const getAttributeValueByKey = (key: string): "S" | "N" => {
  if (key === "price") {
    return "N";
  }

  return "S";
};

export const dbProductItemToResponseItem = (
  dbItem: Record<string, AttributeValue> | undefined
): Product | null => {
  if (!dbItem) {
    return null;
  }

  return Object.keys(dbItem).reduce((result, next) => {
    return { ...result, [next]: dbItem[next][getAttributeValueByKey(next)] };
  }, {}) as Product;
};
