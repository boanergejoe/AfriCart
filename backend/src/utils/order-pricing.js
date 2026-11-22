export const SHIPPING_CENTS = 1000;
export const TAX_PERCENT = 8;

export function calculateOrderTotals(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("An order must contain at least one item.");
  }

  const subtotal = items.reduce((sum, item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("Order items must have valid prices and quantities.");
    }

    return sum + price * quantity;
  }, 0);

  const subtotalCents = Math.round(subtotal * 100);
  const taxCents = Math.round((subtotalCents * TAX_PERCENT) / 100);
  const totalCents = subtotalCents + SHIPPING_CENTS + taxCents;

  return {
    subtotalCents,
    shippingCents: SHIPPING_CENTS,
    taxCents,
    totalCents,
    subtotal: subtotalCents / 100,
    shipping: SHIPPING_CENTS / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
  };
}
