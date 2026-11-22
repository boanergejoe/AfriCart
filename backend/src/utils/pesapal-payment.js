export function normalizePesapalTransaction(transaction, expected) {
  const merchantReference = String(transaction?.merchant_reference || "");
  if (merchantReference !== expected.merchantReference) {
    throw new Error("PesaPal transaction merchant reference does not match the order.");
  }

  const statusCode = Number(transaction.status_code);
  if (statusCode === 1) {
    const amountCents = Math.round(Number(transaction.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents !== expected.amountCents) {
      throw new Error("PesaPal transaction amount does not match the order total.");
    }

    const currency = String(transaction.currency || "").toUpperCase();
    if (currency !== expected.currency) {
      throw new Error("PesaPal transaction currency does not match the order currency.");
    }

    return "succeeded";
  }

  if (statusCode === 2) return "failed";
  if (statusCode === 3) return "reversed";
  if (statusCode === 0) {
    const description = String(transaction.payment_status_description || "").toLowerCase();
    if (description.includes("invalid")) return "invalid";
    if (description.includes("failed")) return "failed";
    return "pending";
  }
  return "pending";
}

function productId(product) {
  return String(product?._id || product);
}

export function cartMatchesOrder(cartItems, orderItems) {
  if (!Array.isArray(cartItems) || !Array.isArray(orderItems) || cartItems.length !== orderItems.length) {
    return false;
  }

  const cartContents = cartItems
    .map((item) => `${productId(item.product)}:${item.quantity}`)
    .sort();
  const orderContents = orderItems
    .map((item) => `${productId(item.product)}:${item.quantity}`)
    .sort();

  return cartContents.every((item, index) => item === orderContents[index]);
}
