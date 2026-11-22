import { Suspense } from "react";
import { Outlet } from "react-router";
import Navbar from "../components/Navbar.jsx";
import PageLoader from "../components/PageLoader.jsx";
import Sidebar from "../components/Sidebar.jsx";

function DashboardLayout() {
  return (
    <div className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex min-h-screen flex-col bg-base-200/60">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-content"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={<PageLoader compact />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Sidebar />
    </div>
  );
}

export default DashboardLayout;
