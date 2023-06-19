#!/bin/bash

# aws --region eu-north-1 dynamodb batch-write-item \
#     --request-items file://products.json \
#     --return-consumed-capacity INDEXES \
#     --return-item-collection-metrics SIZE

aws --region eu-north-1 dynamodb batch-write-item \
    --request-items file://stocks.json \
    --return-consumed-capacity INDEXES \
    --return-item-collection-metrics SIZE