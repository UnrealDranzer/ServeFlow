import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";

export async function ensureActiveAccount(req, res, next) {
  try {
    if (!req.auth) {
      throw ApiError.unauthorized("Authentication required.");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.auth.userId,
        businessId: req.auth.businessId,
        isActive: true,
        business: {
          is: {
            isActive: true
          }
        }
      },
      select: {
        id: true
      }
    });

    if (!user) {
      throw ApiError.unauthorized("Your account is no longer active.");
    }

    next();
  } catch (error) {
    next(error);
  }
}
