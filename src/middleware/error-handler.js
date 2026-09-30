const { AppError } = require("../utils/errors/app-error");

/**
 * Uniform Global Error Handling Middleware
 * Normalizes all error types and returns consistent industry-standard error envelopes.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === "CastError") {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400, "INVALID_ID");
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    const message = `Validation failed: ${details.map((d) => d.message).join(", ")}`;
    error = new AppError(message, 422, "VALIDATION_ERROR", details);
  }

  // Handle Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    const message = `Duplicate value entered for ${fields.join(", ")}. Please use another value.`;
    error = new AppError(message, 409, "DUPLICATE_KEY_ERROR", err.keyValue);
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please authenticate again.", 401, "INVALID_TOKEN");
  }
  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired. Please authenticate again.", 401, "TOKEN_EXPIRED");
  }

  // Infer status code from message if not an AppError
  let statusCode = error.statusCode;
  if (!statusCode) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("not found")) {
      statusCode = 404;
    } else if (msg.includes("unauthorized") || msg.includes("token")) {
      statusCode = 401;
    } else if (msg.includes("forbidden") || msg.includes("permission")) {
      statusCode = 403;
    } else if (msg.includes("required") || msg.includes("invalid") || msg.includes("cannot cancel") || msg.includes("must be")) {
      statusCode = 400;
    } else {
      statusCode = 500;
    }
  }

  const errorCode = error.errorCode || (statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED");
  const correlationId = req.correlationId || req.headers?.["x-correlation-id"] || null;

  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} | CorrelationID: ${correlationId} |`, err);
  }

  const responsePayload = {
    success: false,
    message: error.message || "An unexpected error occurred",
    errorCode,
    error: error.details || error.message || "An unexpected error occurred",
    err: error.message || "An unexpected error occurred",
    data: {},
    timestamp: new Date().toISOString(),
  };

  if (correlationId) {
    responsePayload.correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
  }

  if (process.env.NODE_ENV === "development" && error.stack) {
    responsePayload.stack = error.stack;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
