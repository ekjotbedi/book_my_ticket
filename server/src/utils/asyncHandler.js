// Wraps an async Express handler so any thrown/rejected error is forwarded to
// the central error-handling middleware (Express 4 does not do this natively).

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
