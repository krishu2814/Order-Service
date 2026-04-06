const express = require('express');
const app = express();
const { PORT } = require('./config/serverConfig');
const {connectDB} = require('./config/database');
const { connectRabbitMQ } = require('./config/rabbitmq');
const initOrderConsumers = require('./consumer/order-consumer');
const apiRoutes = require('./routes/index.js');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

const setUpAndStartServer = async () => {

    await connectDB();
    await connectRabbitMQ();
    await initOrderConsumers();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

setUpAndStartServer();
