const amqp = require('amqplib');
const { RABBITMQ_URL } = require('./serverConfig');

let connection = null;
let channel = null;

// Connect to RabbitMQ
const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();

        console.log('✅ RabbitMQ Connected');

    } catch (error) {
        console.error('RabbitMQ Connection Failed:', error.message);
        throw error; // fail fast
    }
};

// Get Channel
const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ not connected!');
    }
    return channel;
};

const publishEvent = async (queue, data) => {
    const ch = getChannel(); // always use same instance

    await ch.assertQueue(queue, { durable: true });

    ch.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(data))
    );

    console.log(`Event sent to ${queue}`);
};

module.exports = {
    connectRabbitMQ,
    getChannel,
    publishEvent
};
