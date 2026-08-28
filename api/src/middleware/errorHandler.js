function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(message);
  }

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
