const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  //wrong mongodb _id error
  if(err.name === 'CastError'){
    const message = `Resource Not Found! \nInvalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //mongoose duplicate key error
  if(err.code === 11000){
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({ success: false, errorStack: err.stack, message: err.message });
};
