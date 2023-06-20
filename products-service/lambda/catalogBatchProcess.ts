export const handler = async (event: any) => {
    // iterate over all SQS messages
    for (const record of event.Records) {
        const product = JSON.parse(record.body);
        console.log(`Processing product: ${product.title}`);
    }
};