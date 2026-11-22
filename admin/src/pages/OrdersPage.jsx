import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, ClipboardListIcon, SearchIcon } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import { orderApi } from "../lib/api.js";
import { useToast } from "../lib/toast.js";
import {
  formatCurrency,
  formatDate,
  getErrorMessage,
  getOrderStatusBadge,
} from "../lib/utils.js";

const PAGE_SIZE = 12;

function OrdersPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [search, status, page]
  );

  const ordersQuery = useQuery({
    queryKey: ["orders", params],
    queryFn: () => orderApi.getAll(params),
  });

  const statusMutation = useMutation({
    mutationFn: orderApi.updateStatus,
    onMutate: ({ orderId }) => setPendingOrderId(orderId),
    onSuccess: () => {
      notify("Order status updated.", "success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => notify(getErrorMessage(error, "Unable to update the order status."), "error"),
    onSettled: () => setPendingOrderId(null),
  });

  const { orders = [], total = 0, pages = 1 } = ordersQuery.data || {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
        <p className="muted mt-1 text-sm">Track purchases and update fulfilment status.</p>
      </header>

      <section className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <SearchIcon className="size-4 text-base-content/50" aria-hidden="true" />
          <span className="sr-only">Search orders by customer</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by customer name…"
          />
        </label>
        <select
          className="select select-bordered w-full sm:w-48"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by order status"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
        <span className="text-sm text-base-content/70">{total} order(s)</span>
      </section>

      <section className="surface overflow-hidden">
        {ordersQuery.isLoading ? (
          <LoadingState label="Loading orders…" />
        ) : ordersQuery.isError ? (
          <ErrorState
            message={getErrorMessage(ordersQuery.error, "Unable to load orders.")}
            onRetry={ordersQuery.refetch}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title="No orders found"
            description={search || status ? "Try a different search or filter." : "Orders appear here after a customer checks out."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="text-right">Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const quantity = (order.orderItems || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
                  const isPending = pendingOrderId === order._id;
                  const isPaid = order.paymentResult?.status === "succeeded";

                  return (
                    <tr key={order._id}>
                      <td className="font-medium tabular-nums">
                        #{String(order._id).slice(-8).toUpperCase()}
                      </td>
                      <td>
                        <div className="font-medium">{order.shippingAddress?.fullName || "—"}</div>
                        <div className="text-xs text-base-content/70">
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium tabular-nums">{quantity} item(s)</div>
                        <div className="max-w-44 truncate text-xs text-base-content/70">
                          {order.orderItems?.[0]?.name || "—"}
                        </div>
                      </td>
                      <td className="text-right font-semibold tabular-nums">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-sm">
                          {isPaid && <CheckCircle2Icon className="size-4 text-success" aria-hidden="true" />}
                          {isPaid ? "Verified" : "Awaiting payment"}
                        </div>
                        <div className="text-xs text-base-content/70">
                          {order.paymentResult?.provider === "pesapal" ? "PesaPal" : "Not recorded"}
                        </div>
                        {order.paymentResult?.inventoryIssue && (
                          <div className="text-xs text-error">Inventory review needed</div>
                        )}
                      </td>
                      <td>
                        {isPaid ? (
                          <select
                            className="select select-bordered select-sm"
                            value={order.status}
                            disabled={isPending}
                            aria-label={`Status for order ${order._id}`}
                            onChange={(event) =>
                              statusMutation.mutate({ orderId: order._id, status: event.target.value })
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        ) : (
                          <span className={`badge badge-sm ${getOrderStatusBadge("pending")}`}>
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="text-sm text-base-content/70">{formatDate(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span className="text-sm muted">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page >= pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}

      <p className="text-center text-xs text-base-content/60">
        Only confirmed payments can be shipped or delivered.
      </p>
    </div>
  );
}

export default OrdersPage;
