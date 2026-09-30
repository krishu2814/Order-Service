/**
 * Standard Application Error Hierarchy
 * Provides uniform operational error types across microservices.
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = "INTERNAL_SERVER_ERROR", details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = "Bad request", errorCode = "BAD_REQUEST", details = null) {
    super(message, 400, errorCode, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", errorCode = "UNAUTHORIZED", details = null) {
    super(message, 401, errorCode, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden resource", errorCode = "FORBIDDEN", details = null) {
    super(message, 403, errorCode, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = "Resource not found", errorCode = "NOT_FOUND", details = null) {
    super(message, 404, errorCode, details);
  }
}

class ConflictError extends AppError {
  constructor(message = "Resource conflict", errorCode = "CONFLICT", details = null) {
    super(message, 409, errorCode, details);
  }
}

class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null, errorCode = "VALIDATION_ERROR") {
    super(message, 422, errorCode, details);
  }
}

class InternalServerError extends AppError {
  constructor(message = "Internal server error", errorCode = "INTERNAL_SERVER_ERROR", details = null) {
    super(message, 500, errorCode, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = "Service unavailable", errorCode = "SERVICE_UNAVAILABLE", details = null) {
    super(message, 503, errorCode, details);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
};
