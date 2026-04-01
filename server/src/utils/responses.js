export function sendSuccess(res, payload, options = {}) {
  const { statusCode = 200, meta } = options;

  res.status(statusCode).json({
    data: payload,
    meta: {
      requestId: res.getHeader("x-request-id"),
      ...meta
    }
  });
}
