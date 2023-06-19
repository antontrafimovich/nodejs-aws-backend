import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Stock } from "../model/Stock";

export const dbStockItemToResponseItem = (
  dbItem: Record<string, AttributeValue> | undefined
): Stock | null => {
  if (!dbItem) {
    return null;
  }

  return {
    productId: dbItem["product_id"]["S"] as string,
    count: Number(dbItem["count"]["N"]),
  };
};
