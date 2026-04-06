const express = require('express');
const app = express();
const { PORT } = require('./config/serverConfig');
const {connectDB} = require('./config/database');
const { connectRabbitMQ } = require('./config/rabbitmq');
const initOrderConsumers = require('./consumer/order-consumer');
const apiRoutes = require('./routes/index.js');
const OrderService = require('./service/order-service');
const orderService = new OrderService();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

const setUpAndStartServer = async () => {
    
    // CHECKING AXIOS INTEGRATION WITH PRODUCT SERVICE
    // try {
    //     const product = await orderService.getProduct('69c02a3e058418a603fbd880');
    //     console.log('✅ Axios Working:', product);
    // } catch (err) {
    //     console.error('❌ Axios Error:', err.message);
    // }

    await connectDB();
    await connectRabbitMQ();
    await initOrderConsumers();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

setUpAndStartServer();
