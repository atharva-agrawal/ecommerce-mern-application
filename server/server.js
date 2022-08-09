const app = require('./app');
const dotenv = require('dotenv');
const databaseConnection = require('./config/database');

//Config
dotenv.config({path: 'server/config/config.env'});

//connecting to database
databaseConnection()

app.listen(process.env.PORT, () => {
    console.log(`Server is working on http://localhost:${process.env.PORT}`);
});