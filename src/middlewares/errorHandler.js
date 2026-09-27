module.exports = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error(err.message);
  }
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
};