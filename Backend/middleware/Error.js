const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err, reqs, resp, next) => {
  (err.statusCode = err.statuscode || 500),
    (err.message = err.message || "internal Server Error");

  // mongodb Error Hnadling
  if (err.name === "CastError") {
    const message = `Resource Not found , Invalid : ${err.path} `;

    err = new ErrorHandler(message, 400);
  }

  resp.status(err.statusCode).json({
    sucess: false,
    error: err.message,
  });
};
