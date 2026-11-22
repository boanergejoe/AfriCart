import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
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
  const { isError, isLoading } = useQuery({
    queryKey: ["adminAccess"],
    queryFn: adminApi.checkAccess,
    retry: false,
    staleTime: Infinity,
  });

  if (isLoading) return <PageLoader />;
  if (isError) return <AccessDeniedPage />;
  return <DashboardLayout />;
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

        <Route
          path="/"
          element={isAuthenticated ? <AdminArea /> : <Navigate to="/login" replace />}
        >
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
