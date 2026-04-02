export const businessTypeOptions = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "bakery", label: "Bakery" },
  { value: "tea_shop", label: "Tea Shop" },
  { value: "fast_food", label: "Fast Food" },
  { value: "canteen", label: "Canteen" },
  { value: "other", label: "Other" }
];

export const registrationBusinessTypeOptions = businessTypeOptions.filter(
  (option) => option.value !== "other"
);
