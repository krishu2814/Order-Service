const amqp = require("amqplib");
const { RABBITMQ_URL } = require("./serverConfig");

let connection;
let channel;

const EXCHANGE_NAME = "ecommerce_events";

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, "topic", {
            durable: true,
        });
        console.log("RabbitMQ Connected");
    } catch (error) {
        console.error("RabbitMQ connection failed:", error.message);
        throw error;
    }
};

const getChannel = () => {
    if (!channel) {
        throw new Error("RabbitMQ channel not initialized");
    }
    return channel;
};

const publishEvent = async (routingKey, data) => {
    const channel = getChannel();

    if (typeof routingKey !== "string") {
        throw new Error(`Invalid routing key: ${routingKey}`);
    }

    channel.publish(
        EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(data)),
        {
            persistent: true,
            contentType: "application/json",
        }
    );

    console.log(`Event published: ${routingKey}`);
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    publishEvent,
};