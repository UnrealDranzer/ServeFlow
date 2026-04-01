import { ApiError } from "../utils/api-error.js";

export function authorizeRoles(...allowedRoles) {
  if (allowedRoles.length === 0) {
    throw new Error("authorizeRoles requires at least one allowed role.");
  }

  return (req, res, next) => {
    if (!req.auth) {
      next(ApiError.unauthorized("Authentication required."));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(ApiError.forbidden("You do not have permission to perform this action."));
      return;
    }

    next();
  };
}

export const requireOwner = authorizeRoles("OWNER");
