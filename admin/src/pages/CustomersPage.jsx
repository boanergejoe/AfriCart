import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, UsersIcon } from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import ImageWithFallback from "../components/ImageWithFallback.jsx";
import { customerApi } from "../lib/api.js";
import { formatDate, getErrorMessage } from "../lib/utils.js";

const PAGE_SIZE = 12;

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({ search: search.trim() || undefined, page, limit: PAGE_SIZE }),
    [search, page]
  );

  const customersQuery = useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerApi.getAll(params),
  });

  const { customers = [], total = 0, pages = 1 } = customersQuery.data || {};

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customers</h1>
        <p className="muted mt-1 text-sm">{total} registered customer(s).</p>
      </header>

      <section className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <SearchIcon className="size-4 text-base-content/50" aria-hidden="true" />
          <span className="sr-only">Search customers</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
          />
        </label>
      </section>

      <section className="surface overflow-hidden">
        {customersQuery.isLoading ? (
          <LoadingState label="Loading customers…" />
        ) : customersQuery.isError ? (
          <ErrorState
            message={getErrorMessage(customersQuery.error, "Unable to load customers.")}
            onRetry={customersQuery.refetch}
          />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No customers found"
            description={search ? "Try a different search term." : "Customers appear here once they sign up."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th className="text-center">Addresses</th>
                  <th className="text-center">Wishlist</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src={customer.imageUrl}
                          alt={customer.name || "Customer"}
                          rounded
                          className="size-10 shrink-0 object-cover"
                        />
                        <span className="font-medium">{customer.name || "—"}</span>
                      </div>
                    </td>
                    <td className="text-sm text-base-content/80">{customer.email}</td>
                    <td className="text-center tabular-nums">{customer.addresses?.length || 0}</td>
                    <td className="text-center tabular-nums">{customer.wishlist?.length || 0}</td>
                    <td className="text-sm text-base-content/70">{formatDate(customer.createdAt)}</td>
                  </tr>
                ))}
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
    </div>
  );
}

export default CustomersPage;
