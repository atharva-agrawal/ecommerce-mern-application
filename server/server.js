const app = require("./app");
const dotenv = require("dotenv");
const databaseConnection = require("./config/database");

//uncaught error
process.on("uncaughtException", (err) => {
    console.log(`Error: ${err.message}`);
    console.log(`Shutting down the server due to Uncaught Error`);
  
    server.close(() => {
      process.exit(1);
    });
  });

//Config
dotenv.config({ path: "server/config/config.env" });

//connecting to database
databaseConnection();

const server = app.listen(process.env.PORT, () => {
  console.log(`Server is working on http://localhost:${process.env.PORT}`);
});

//unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`Shutting down the server due to Unhandled Promise Rejection`);

  server.close(() => {
    process.exit(1);
  });
});


