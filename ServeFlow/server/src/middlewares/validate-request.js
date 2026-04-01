import { ApiError } from "../utils/api-error.js";

export function validateRequest(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        const parsedBody = schemas.body.safeParse(req.body);

        if (!parsedBody.success) {
          throw ApiError.badRequest("Invalid request body.", parsedBody.error.flatten());
        }

        req.body = parsedBody.data;
      }

      if (schemas.params) {
        const parsedParams = schemas.params.safeParse(req.params);

        if (!parsedParams.success) {
          throw ApiError.badRequest("Invalid path parameters.", parsedParams.error.flatten());
        }

        req.params = parsedParams.data;
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.safeParse(req.query);

        if (!parsedQuery.success) {
          throw ApiError.badRequest("Invalid query parameters.", parsedQuery.error.flatten());
        }

        req.query = parsedQuery.data;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
