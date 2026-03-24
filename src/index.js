const express = require('express');
const app = express();
const { PORT } = require('./config/serverConfig');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const setUpAndStartServer = () => {

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

setUpAndStartServer();
