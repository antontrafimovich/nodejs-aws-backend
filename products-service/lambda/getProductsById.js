const products = require('./products.json')

exports.handler = async (event) => {
    const { productId } = event.pathParameters;

    const product = products.find(product => product.id === productId)

    if (!product) {
        return {
            statusCode: 404,
            headers: { "Content-Type": "text/plain" },
            body: `Product with id ${productId} doesn't exist`
        }
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    };
}