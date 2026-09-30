const express = require('express');
const app = express();
const { PORT } = require('./config/serverConfig');
const {connectDB} = require('./config/database');
const { connectRabbitMQ } = require('./config/rabbitmq');
const initOrderConsumers = require('./consumer/order-consumer');
const apiRoutes = require('./routes/index.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('./middleware/correlation-middleware'));

app.use('/api', apiRoutes);

// Global Error & 404 Handlers
app.use(require('./middleware/not-found-handler'));
app.use(require('./middleware/error-handler'));

const setUpAndStartServer = async () => {

    await connectDB();
    await connectRabbitMQ();
    await initOrderConsumers();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

setUpAndStartServer();
