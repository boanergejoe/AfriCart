import { useQuery } from "@tanstack/react-query";
import {
  DollarSignIcon,
  PackageIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "lucide-react";

import { orderApi, statsApi } from "../lib/api.js";
import {
  capitalizeText,
  formatCurrency,
  formatDate,
  getErrorMessage,
  getOrderStatusBadge,
} from "../lib/utils.js";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";

const STAT_ICONS = {
  "Total Revenue": DollarSignIcon,
  "Total Orders": ShoppingBagIcon,
  "Total Customers": UsersIcon,
  "Total Products": PackageIcon,
};

function DashboardPage() {
  const ordersQuery = useQuery({ queryKey: ["orders", { pageSize: 5 }], queryFn: () => orderApi.getAll({ limit: 5 }) });
  const statsQuery = useQuery({ queryKey: ["dashboardStats"], queryFn: statsApi.getDashboard });

  const recentOrders = ordersQuery.data?.orders || [];
  const stats = statsQuery.data;

  const statsCards = [
    { name: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0) },
    { name: "Total Orders", value: stats?.totalOrders || 0 },
    { name: "Total Customers", value: stats?.totalCustomers || 0 },
    { name: "Total Products", value: stats?.totalProducts || 0 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Store overview</h1>
        <p className="muted mt-1 text-sm">A snapshot of your AfriCart store performance.</p>
      </header>

      {statsQuery.isLoading ? (
        <LoadingState label="Loading store stats…" />
      ) : statsQuery.isError ? (
        <div className="surface p-4">
          <ErrorState
            message={getErrorMessage(statsQuery.error, "Unable to load store statistics.")}
            onRetry={statsQuery.refetch}
          />
        </div>
      ) : (
        <section aria-label="Store statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statsCards.map((stat) => {
            const Icon = STAT_ICONS[stat.name];
            return (
              <article key={stat.name} className="surface flex items-center gap-4 p-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-base-content/60">
                    {stat.name}
                  </p>
                  <p className="mt-1 truncate text-2xl font-bold tabular-nums">{stat.value}</p>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <section className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-base-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Recent orders</h2>
          <span className="badge badge-ghost badge-sm">Latest {recentOrders.length || 0}</span>
        </div>

        {ordersQuery.isLoading ? (
          <LoadingState label="Loading recent orders…" />
        ) : ordersQuery.isError ? (
          <ErrorState
            message={getErrorMessage(ordersQuery.error, "Unable to load recent orders.")}
            onRetry={ordersQuery.refetch}
          />
        ) : recentOrders.length === 0 ? (
          <EmptyState title="No orders yet" description="New purchases will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="font-medium tabular-nums">
                      #{String(order._id).slice(-8).toUpperCase()}
                    </td>
                    <td>
                      <div className="font-medium">{order.shippingAddress?.fullName || "—"}</div>
                      <div className="text-xs text-base-content/70">
                        {order.orderItems?.length || 0} item(s)
                      </div>
                    </td>
                    <td className="max-w-52 truncate text-sm">
                      {order.orderItems?.[0]?.name || "—"}
                      {(order.orderItems?.length || 0) > 1 &&
                        ` +${order.orderItems.length - 1} more`}
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${getOrderStatusBadge(order.status)}`}>
                        {capitalizeText(order.status)}
                      </span>
                    </td>
                    <td className="text-sm text-base-content/70">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;
