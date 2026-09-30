const { NotFoundError } = require("../utils/errors/app-error");

const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
};

module.exports = notFoundHandler;
