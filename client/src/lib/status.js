export const orderStatusMeta = {
  new: {
    label: "New",
    classes: "bg-amber-100 text-amber-900 border-amber-200"
  },
  accepted: {
    label: "Accepted",
    classes: "bg-sky-100 text-sky-900 border-sky-200"
  },
  preparing: {
    label: "Preparing",
    classes: "bg-orange-100 text-orange-900 border-orange-200"
  },
  ready: {
    label: "Ready",
    classes: "bg-emerald-100 text-emerald-900 border-emerald-200"
  },
  served: {
    label: "Served",
    classes: "bg-lime-100 text-lime-900 border-lime-200"
  },
  paid: {
    label: "Paid",
    classes: "bg-secondary/15 text-secondary border-secondary/20"
  },
  cancelled: {
    label: "Cancelled",
    classes: "bg-rose-100 text-rose-900 border-rose-200"
  }
};

export const sourceTypeMeta = {
  table: "Table",
  counter: "Counter",
  takeaway: "Takeaway",
  parcel: "Parcel"
};
