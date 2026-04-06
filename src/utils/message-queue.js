const amqp = require('amqplib');
const { RABBITMQ_URL } = require('../utils/message-queue');

let connection = null;
let channel = null;

/**
 * Connect to RabbitMQ
 */
const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log('✅ RabbitMQ Connected');

    } catch (error) {
        console.error('RabbitMQ Connection Failed:', error.message);
        throw error;
    }
};

/**
 * Publish Event (Producer)
 */
const publishEvent = async (queue, data) => {
    if (!channel) {
        throw new Error('RabbitMQ not connected!');
    }

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
    );

    console.log(`Event sent to ${queue}:`, data);
};

/**
 * Get Channel (Consumer use)
 */
const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ not connected!');
    }
    return channel;
};

module.exports = {
    connectRabbitMQ,
    publishEvent,
    getChannel
};
