// Define a function asyncHandler that takes a request handler function as an argument
const asyncHandler = (requestHandler) => {
  // Return a new function that takes the usual Express parameters (req, res, next)
  return (req, res, next) => {
    // Resolve the promise returned by the request handler
    // If it rejects, catch the error and pass it to the next middleware (error handler)
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
