const products = require('./products.json')

exports.handler = async (event) => {
    if (!products) {
        return {
            statusCode: 404,
            headers: { "Content-Type": "text/plain" },
            body: "Products haven't been found"
        }
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products)
    };
}