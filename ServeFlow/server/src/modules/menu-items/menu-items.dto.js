import { moneyToString } from "../../utils/money.js";

export function toMenuItemDto(menuItem) {
  return {
    id: menuItem.id,
    name: menuItem.name,
    description: menuItem.description,
    price: moneyToString(menuItem.price),
    imageUrl: menuItem.imageUrl,
    isAvailable: menuItem.isAvailable,
    isVeg: menuItem.isVeg,
    sortOrder: menuItem.sortOrder,
    category: menuItem.category
      ? {
          id: menuItem.category.id,
          name: menuItem.category.name
        }
      : null,
    createdAt: menuItem.createdAt.toISOString(),
    updatedAt: menuItem.updatedAt.toISOString()
  };
}
