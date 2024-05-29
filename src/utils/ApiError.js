// Define a custom error class named ApiError that extends the built-in Error class
class ApiError extends Error {
  // Constructor function to initialize an ApiError instance
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    // Call the parent class constructor with the provided message
    super(message);

    // Set properties specific to ApiError
    this.statusCode = statusCode; // HTTP status code associated with the error
    this.data = null; // Additional data associated with the error (optional)
    this.message = message; // Error message
    this.success = false; // Flag indicating whether the operation was successful
    this.errors = errors; // Array of error details (optional)

    // If a stack trace is provided, set the stack property; otherwise, capture a stack trace
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Export the ApiError class for use in other modules
export default ApiError;
