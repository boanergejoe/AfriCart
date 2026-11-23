import assert from "node:assert/strict";
import test from "node:test";
import { cartMatchesOrder, normalizePesapalTransaction } from "./pesapal-payment.js";

const expected = {
  merchantReference: "AFRI-123",
  amountCents: 12345,
  currency: "USD",
};

test("confirms only a completed PesaPal transaction with matching reference, amount, and currency", () => {
  const status = normalizePesapalTransaction(
    {
      merchant_reference: "AFRI-123",
      status_code: 1,
      amount: 123.45,
      currency: "USD",
    },
    expected
  );

  assert.equal(status, "succeeded");
});

test("rejects completed transactions with a mismatched reference, amount, or currency", () => {
  const completedTransaction = {
    merchant_reference: "AFRI-123",
    status_code: 1,
    amount: 123.45,
    currency: "USD",
  };

  assert.throws(() =>
    normalizePesapalTransaction(
      { ...completedTransaction, merchant_reference: "OTHER" },
      expected
    )
  );
  assert.throws(() =>
    normalizePesapalTransaction({ ...completedTransaction, amount: 1 }, expected)
  );
  assert.throws(() =>
    normalizePesapalTransaction({ ...completedTransaction, currency: "KES" }, expected)
  );
});

test("keeps incomplete transactions pending unless PesaPal reports a terminal status", () => {
  const status = normalizePesapalTransaction(
    { merchant_reference: "AFRI-123", status_code: 0 },
    expected
  );

  assert.equal(status, "pending");
  assert.equal(
    normalizePesapalTransaction(
      {
        merchant_reference: "AFRI-123",
        status_code: 0,
        payment_status_description: "Pending",
      },
      expected
    ),
    "pending"
  );
  assert.equal(
    normalizePesapalTransaction(
      {
        merchant_reference: "AFRI-123",
        status_code: 0,
        payment_status_description: "Invalid",
      },
      expected
    ),
    "invalid"
  );
  assert.equal(
    normalizePesapalTransaction(
      {
        merchant_reference: "AFRI-123",
        status_code: 0,
        payment_status_description: "INVALID",
        error: { code: "payment_details_not_found", message: "Pending Payment" },
      },
      expected
    ),
    "pending"
  );
});

test("clears a cart only when product identities and quantities still match the order", () => {
  const orderItems = [
    { product: "product-a", quantity: 2 },
    { product: "product-b", quantity: 1 },
  ];

  assert.equal(
    cartMatchesOrder(
      [
        { product: { _id: "product-b" }, quantity: 1 },
        { product: { _id: "product-a" }, quantity: 2 },
      ],
      orderItems
    ),
    true
  );
  assert.equal(
    cartMatchesOrder([{ product: "product-a", quantity: 1 }], orderItems),
    false
  );
});
