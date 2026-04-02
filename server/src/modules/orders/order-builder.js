import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { toDecimal } from "../../utils/money.js";

export async function buildOrderDraft({ tx = prisma, businessId, items }) {
  if (!items.length) {
    throw ApiError.badRequest("At least one order item is required.");
  }

  const uniqueMenuItemIds = [...new Set(items.map((item) => item.menuItemId))];

  const menuItems = await tx.menuItem.findMany({
    where: {
      businessId,
      id: {
        in: uniqueMenuItemIds
      },
      isAvailable: true,
      category: {
        is: {
          isActive: true
        }
      }
    },
    select: {
      id: true,
      name: true,
      price: true
    }
  });

  if (menuItems.length !== uniqueMenuItemIds.length) {
    throw ApiError.badRequest("One or more menu items are invalid or unavailable.");
  }

  const menuItemMap = new Map(menuItems.map((menuItem) => [menuItem.id, menuItem]));
  let subtotal = new Prisma.Decimal(0);

  const orderItemsData = items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);

    if (!menuItem) {
      throw ApiError.badRequest("One or more menu items are invalid or unavailable.");
    }

    const itemPrice = toDecimal(menuItem.price);
    const lineTotal = itemPrice.mul(item.quantity);
    subtotal = subtotal.add(lineTotal);

    return {
      menuItemId: menuItem.id,
      itemNameSnapshot: menuItem.name,
      itemPriceSnapshot: itemPrice,
      quantity: item.quantity,
      itemNote: item.itemNote || null,
      lineTotal
    };
  });

  return {
    subtotal,
    taxAmount: new Prisma.Decimal(0),
    discountAmount: new Prisma.Decimal(0),
    total: subtotal,
    orderItemsData
  };
}
