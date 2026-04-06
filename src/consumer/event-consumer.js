const { getChannel } = require('../config/rabbitmq');

const startConsumer = async (queue, handler) => {
    const channel = getChannel();

    await channel.assertQueue(queue, { durable: true });

    console.log(`Listening on ${queue}`);

    channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
            const data = JSON.parse(msg.content.toString());

            await handler(data); // business logic

            channel.ack(msg);

        } catch (error) {
            console.error(`Error processing ${queue}:`, error.message);

            // Drop message (or use DLQ later)
            channel.nack(msg, false, false);
        }
    });
};

module.exports = { startConsumer };
