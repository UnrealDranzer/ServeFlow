import { fromPrismaSourceType } from "../../utils/enums.js";

export function toOrderSourceDto(orderSource) {
  return {
    id: orderSource.id,
    name: orderSource.name,
    slug: orderSource.slug,
    sourceType: fromPrismaSourceType(orderSource.sourceType),
    qrUrl: orderSource.qrUrl,
    isActive: orderSource.isActive,
    createdAt: orderSource.createdAt.toISOString(),
    updatedAt: orderSource.updatedAt.toISOString()
  };
}
