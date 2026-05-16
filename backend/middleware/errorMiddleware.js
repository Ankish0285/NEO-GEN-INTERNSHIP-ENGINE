const errorHandler = (err, req, res, next) => {
  // Default Express response is 200; thrown errors must not stay 200 or clients see misleading status/bodies.
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  errorHandler,
};
