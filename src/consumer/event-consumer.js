const { getChannel } = require("../config/rabbitmq");

const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "ecommerce_events";
const DLX_EXCHANGE = process.env.DLX_EXCHANGE_NAME || "ecommerce_dlx";
const DEFAULT_MAX_RETRIES = 3;

/**
 * Starts a robust RabbitMQ consumer backed by:
 * 1. Dedicated Dead Letter Queue (DLQ)
 * 2. Exponential Backoff Retry policy with dedicated TTL delay queues
 *
 * @param {string} queueName - Name of the primary queue
 * @param {string} routingKey - Routing key to bind on main exchange
 * @param {Function} handler - Async callback processing parsed event payload
 * @param {number} [maxRetries=3] - Maximum retry attempts before routing to DLQ
 */
const startConsumer = async (
  queueName,
  routingKey,
  handler,
  maxRetries = DEFAULT_MAX_RETRIES,
) => {
  const channel = getChannel();
  const dlqName = `${queueName}_dlq`;
  const dlqRoutingKey = `${queueName}.dead`;

  // 1. Assert Main and Dead-Letter Exchanges
  await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
  await channel.assertExchange(DLX_EXCHANGE, "topic", { durable: true });

  // 2. Assert Dedicated Dead Letter Queue (DLQ)
  await channel.assertQueue(dlqName, { durable: true });
  await channel.bindQueue(dlqName, DLX_EXCHANGE, dlqRoutingKey);

  // 3. Assert Primary Queue with Dead-Letter configuration
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": DLX_EXCHANGE,
      "x-dead-letter-routing-key": dlqRoutingKey,
    },
  });

  // 4. Pre-declare all retry delay queues (1s, 2s, 4s...) to ensure immutable invariant definitions
  for (let i = 1; i <= maxRetries; i++) {
    const delayMs = Math.pow(2, i - 1) * 1000;
    const retryQueueName = `${queueName}_retry_${delayMs}ms`;
    await channel.assertQueue(retryQueueName, {
      durable: true,
      arguments: {
        "x-message-ttl": delayMs,
        "x-dead-letter-exchange": EXCHANGE_NAME,
        "x-dead-letter-routing-key": routingKey,
      },
    });
  }

  // 5. Bind Primary Queue to Main Topic Exchange
  await channel.bindQueue(queueName, EXCHANGE_NAME, routingKey);

  // 6. Fair dispatch (prefetch 1)
  await channel.prefetch(1);

  console.log(
    `[Order Consumer] Listening on ${queueName} (${routingKey}) [DLQ: ${dlqName}, Max Retries: ${maxRetries}]`,
  );

  // 7. Start Message Consumer
  await channel.consume(
    queueName,
    async (message) => {
      if (!message) return;

      const headers = message.properties.headers || {};
      const retryCount = Number(headers["x-retry-count"] || 0);

      let data = null;
      try {
        data = JSON.parse(message.content.toString());
      } catch (e) {
        data = {};
      }

      const correlationId =
        message.properties.correlationId ||
        headers["x-correlation-id"] ||
        data?.correlationId ||
        "corr_unknown";

      data.correlationId = data.correlationId || correlationId;

      try {
        // Execute domain handler
        await handler(data, message);

        // Acknowledge successfully processed message
        channel.ack(message);

        console.log(`[${correlationId}] [Order Consumer] Successfully processed ${routingKey} on ${queueName}`);
      } catch (error) {
        console.error(
          `[${correlationId}] [Order Consumer Error] Error processing ${routingKey} on ${queueName}: ${error.message}`,
        );

        if (retryCount < maxRetries) {
          const nextRetry = retryCount + 1;
          const delayMs = Math.pow(2, nextRetry - 1) * 1000;
          const retryQueueName = `${queueName}_retry_${delayMs}ms`;

          try {
            // Publish message to dedicated retry delay queue
            channel.sendToQueue(retryQueueName, message.content, {
              persistent: true,
              contentType: "application/json",
              correlationId,
              headers: {
                ...headers,
                "x-correlation-id": correlationId,
                "x-retry-count": nextRetry,
                "x-original-queue": queueName,
                "x-error-message": error.message,
                "x-retry-timestamp": new Date().toISOString(),
              },
            });

            console.warn(
              `[${correlationId}] [Order Retry ${nextRetry}/${maxRetries}] Message in ${queueName} scheduled for retry in ${delayMs}ms via ${retryQueueName}`,
            );

            channel.ack(message);
          } catch (retryErr) {
            console.error(
              `[${correlationId}] [Order Retry Failure] Could not schedule retry for ${queueName}:`,
              retryErr.message,
            );
            routeToDLQ(channel, message, queueName, dlqRoutingKey, error, retryCount, correlationId);
            channel.ack(message);
          }
        } else {
          // Retries exhausted -> route to DLQ
          routeToDLQ(channel, message, queueName, dlqRoutingKey, error, retryCount, correlationId);
          channel.ack(message);
        }
      }
    },
    { noAck: false },
  );
};

/**
 * Publishes failed message to DLX stamped with failure audit metadata.
 */
function routeToDLQ(channel, message, queueName, dlqRoutingKey, error, retryCount, correlationId) {
  const headers = message.properties.headers || {};
  const corrId = correlationId || message.properties.correlationId || headers["x-correlation-id"] || "corr_unknown";

  channel.publish(
    DLX_EXCHANGE,
    dlqRoutingKey,
    message.content,
    {
      persistent: true,
      contentType: "application/json",
      correlationId: corrId,
      headers: {
        ...headers,
        "x-correlation-id": corrId,
        "x-retry-count": retryCount,
        "x-original-queue": queueName,
        "x-error-message": error.message,
        "x-error-stack": error.stack || "",
        "x-dead-lettered-at": new Date().toISOString(),
      },
    },
  );

  console.error(
    `[${corrId}] [Order DLQ ALERT] Retries exhausted for message in ${queueName}. Routed to ${queueName}_dlq with routing key ${dlqRoutingKey}`,
  );
}

module.exports = {
  startConsumer,
};
