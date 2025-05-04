const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(status).json({
    error: isDev ? err.message : '서버 오류가 발생했습니다.',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler; 