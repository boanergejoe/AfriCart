export const capitalizeText = (text) => {
  if (!text) return text ?? "";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const apiHost = (() => {
  try {
    return new URL(import.meta.env.VITE_API_URL || "").host || "the API";
  } catch {
    return "the API";
  }
})();

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const candidate =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error?.message === "Network Error"
      ? `Cannot reach the API at ${apiHost}. Check your connection and try again.`
      : fallback);

  const message = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
  return message.length > 240 ? `${message.slice(0, 237)}…` : message;
};

export const getOrderStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "badge-success";
    case "shipped":
      return "badge-info";
    case "pending":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
};

export const getStockStatusBadge = (stock) => {
  const quantity = Number(stock);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { text: "Out of Stock", class: "badge-error" };
  }
  if (quantity < 20) return { text: "Low Stock", class: "badge-warning" };
  return { text: "In Stock", class: "badge-success" };
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatCurrency = (amount) => {
  const value = Number(amount);
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "$0.00";
};
