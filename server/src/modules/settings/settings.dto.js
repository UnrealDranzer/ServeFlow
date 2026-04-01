export function toSettingsDto(settings) {
  return {
    id: settings.id,
    acceptingOrders: settings.acceptingOrders,
    showImages: settings.showImages,
    showItemDescription: settings.showItemDescription,
    showVegBadge: settings.showVegBadge,
    timezone: settings.timezone,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString()
  };
}
