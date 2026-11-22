import assert from "node:assert/strict";
import test from "node:test";
import { calculateOrderTotals } from "./order-pricing.js";

test("calculates shipping, tax, and total using integer cents", () => {
  const totals = calculateOrderTotals([
    { price: 25.99, quantity: 2 },
    { price: 8.5, quantity: 1 },
  ]);

  assert.deepEqual(totals, {
    subtotalCents: 6048,
    shippingCents: 1000,
    taxCents: 484,
    totalCents: 7532,
    subtotal: 60.48,
    shipping: 10,
    tax: 4.84,
    total: 75.32,
  });
});

test("rounds the summed cart subtotal to cents before calculating tax", () => {
  const totals = calculateOrderTotals([{ price: 0.335, quantity: 2 }]);

  assert.equal(totals.subtotalCents, 67);
  assert.equal(totals.taxCents, 5);
  assert.equal(totals.totalCents, 1072);
});

test("rejects invalid quantities and prices", () => {
  assert.throws(() => calculateOrderTotals([{ price: 10, quantity: 0 }]));
  assert.throws(() => calculateOrderTotals([{ price: Number.NaN, quantity: 1 }]));
});
