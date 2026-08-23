const { getChannel } = require("../config/rabbitmq");

const EXCHANGE_NAME = "ecommerce_events";

const startConsumer = async (queueName, routingKey, handler) => {
  const channel = getChannel();

  await channel.assertExchange(EXCHANGE_NAME, "topic", {
    durable: true,
  });

  await channel.assertQueue(queueName, {
    durable: true,
  });

  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  await channel.prefetch(1);

  console.log(
    `Consumer listening on ${queueName} with routing key ${routingKey}`,
  );

  await channel.consume(
    queueName,
    async (message) => {
      if (!message) return;

      try {
        const data = JSON.parse(message.content.toString());

        // console.log(`Received ${routingKey}:`, data);

        await handler(data);

        channel.ack(message);

        console.log(`Successfully processed ${routingKey} on ${queueName}`);
      } catch (error) {
        console.error(`Error processing ${routingKey}:`, error.message);

        channel.nack(message, false, false);
      }
    },
    {
      noAck: false,
    },
  );
};

module.exports = {
  startConsumer,
};
