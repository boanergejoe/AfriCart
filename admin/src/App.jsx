import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";

import PageLoader from "./components/PageLoader.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import { adminApi } from "./lib/api.js";
import { useAdminAuth } from "./lib/adminAuth.js";

const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const ProductsPage = lazy(() => import("./pages/ProductsPage.jsx"));
const OrdersPage = lazy(() => import("./pages/OrdersPage.jsx"));
const CustomersPage = lazy(() => import("./pages/CustomersPage.jsx"));
const AccessDeniedPage = lazy(() => import("./pages/AccessDeniedPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

function AdminArea() {
  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["adminAccess"],
    queryFn: adminApi.checkAccess,
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !data?.allowed) {
    return <AccessDeniedPage error={error} onRetry={refetch} />;
  }
  return <DashboardLayout />;
}

function RequireAuth() {
  const { isAuthenticated } = useAdminAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <AdminArea />;
}

function App() {
  const { isAuthenticated } = useAdminAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />

        <Route path="/" element={<RequireAuth />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
