aws --region eu-north-1 dynamodb batch-write-item \
    --request-items file://seed.json \
    --return-consumed-capacity INDEXES \
    --return-item-collection-metrics SIZE