// Small display helpers shared across pages.

export const formatMoney = (cents) =>
  (cents / 100).toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export const formatDate = (iso) =>
  new Date(iso).toLocaleString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
