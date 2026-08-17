function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log full error server-side for debugging
  console.error(`🔥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Determine user-facing message
  let userMessage;
  if (statusCode >= 500) {
    // Never expose internal details for server errors
    userMessage = 'Something went wrong. Please try again later.';
  } else {
    // 4xx errors are intentional validation — safe to show message
    userMessage = err.message || 'Invalid request.';
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    // Only include stack trace in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = { errorHandler };
