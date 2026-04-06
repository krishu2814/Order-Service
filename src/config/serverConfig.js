require('dotenv').config();

module.exports = {
    PORT: process.env.PORT,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    MONGO_URL: process.env.MONGO_URL,
    CART_SERVICE_URL: process.env.CART_SERVICE_URL,
    PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL,
}
