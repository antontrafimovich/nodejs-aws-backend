const products = require('./products.json')

exports.handler = async (event) => {
    const { productId } = event.pathParameters;

    const product = products.find(product => product.id === productId)

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
    };
}