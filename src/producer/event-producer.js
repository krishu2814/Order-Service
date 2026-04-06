const { getChannel } = require('../config/rabbitmq');

const publishEvent = async (queue, data) => {
    const channel = getChannel();

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(data)),
        { persistent: true }
    );

    console.log(`Event sent to ${queue}`);
};

module.exports = { publishEvent };
