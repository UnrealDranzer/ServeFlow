export const businessTypeValues = [
  "restaurant",
  "cafe",
  "tea_shop",
  "bakery",
  "fast_food",
  "other"
];

export const orderModeValues = ["qr", "manual", "both"];
export const userRoleValues = ["owner", "staff"];
export const sourceTypeValues = ["table", "counter", "takeaway", "parcel"];
export const orderTypeValues = ["qr", "manual"];
export const orderStatusValues = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "served",
  "paid",
  "cancelled"
];

const businessTypeToPrismaMap = {
  restaurant: "RESTAURANT",
  cafe: "CAFE",
  tea_shop: "TEA_SHOP",
  bakery: "BAKERY",
  fast_food: "FAST_FOOD",
  other: "OTHER"
};

const orderModeToPrismaMap = {
  qr: "QR",
  manual: "MANUAL",
  both: "BOTH"
};

const userRoleToPrismaMap = {
  owner: "OWNER",
  staff: "STAFF"
};

const sourceTypeToPrismaMap = {
  table: "TABLE",
  counter: "COUNTER",
  takeaway: "TAKEAWAY",
  parcel: "PARCEL"
};

const orderTypeToPrismaMap = {
  qr: "QR",
  manual: "MANUAL"
};

const orderStatusToPrismaMap = {
  new: "NEW",
  accepted: "ACCEPTED",
  preparing: "PREPARING",
  ready: "READY",
  served: "SERVED",
  paid: "PAID",
  cancelled: "CANCELLED"
};

function invertMap(map) {
  return Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key]));
}

const businessTypeFromPrismaMap = invertMap(businessTypeToPrismaMap);
const orderModeFromPrismaMap = invertMap(orderModeToPrismaMap);
const userRoleFromPrismaMap = invertMap(userRoleToPrismaMap);
const sourceTypeFromPrismaMap = invertMap(sourceTypeToPrismaMap);
const orderTypeFromPrismaMap = invertMap(orderTypeToPrismaMap);
const orderStatusFromPrismaMap = invertMap(orderStatusToPrismaMap);

export function toPrismaBusinessType(value) {
  return businessTypeToPrismaMap[value];
}

export function fromPrismaBusinessType(value) {
  return businessTypeFromPrismaMap[value];
}

export function toPrismaOrderMode(value) {
  return orderModeToPrismaMap[value];
}

export function fromPrismaOrderMode(value) {
  return orderModeFromPrismaMap[value];
}

export function toPrismaUserRole(value) {
  return userRoleToPrismaMap[value];
}

export function fromPrismaUserRole(value) {
  return userRoleFromPrismaMap[value];
}

export function toPrismaSourceType(value) {
  return sourceTypeToPrismaMap[value];
}

export function fromPrismaSourceType(value) {
  return sourceTypeFromPrismaMap[value];
}

export function toPrismaOrderType(value) {
  return orderTypeToPrismaMap[value];
}

export function fromPrismaOrderType(value) {
  return orderTypeFromPrismaMap[value];
}

export function toPrismaOrderStatus(value) {
  return orderStatusToPrismaMap[value];
}

export function fromPrismaOrderStatus(value) {
  return orderStatusFromPrismaMap[value];
}
