import { useUser } from "@clerk/react";
import { ShoppingBagIcon } from "lucide-react";
import { Link, useLocation } from "react-router";
import { NAVIGATION } from "../lib/navigation.js";
import ImageWithFallback from "./ImageWithFallback.jsx";

function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useUser();

  return (
    <aside className="drawer-side z-40">
      <label htmlFor="admin-drawer" aria-label="Close navigation menu" className="drawer-overlay" />

      <div className="flex min-h-full w-72 flex-col border-r border-base-300 bg-base-100">
        <div className="flex items-center gap-3 border-b border-base-200 px-5 py-5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-content">
            <ShoppingBagIcon className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">AfriCart</p>
            <p className="text-xs text-base-content/60">Admin console</p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex-1 px-3 py-5">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-base-content/50">
            Management
          </p>
          <ul className="menu w-full gap-1 p-0">
            {NAVIGATION.map((item) => {
              const { name, path } = item;
              const Icon = item.icon;
              const isActive = pathname === path || pathname.startsWith(`${path}/`);

              return (
                <li key={path}>
                  <Link
                    to={path}
                    aria-current={isActive ? "page" : undefined}
                    className={`gap-3 rounded-xl ${isActive ? "bg-primary text-primary-content" : ""}`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span>{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3 border-t border-base-200 px-5 py-4">
          <ImageWithFallback
            src={user?.imageUrl}
            alt={user?.fullName || user?.primaryEmailAddress?.emailAddress || "Admin"}
            rounded
            className="size-10 shrink-0 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.fullName || "Administrator"}</p>
            <p className="truncate text-xs text-base-content/60">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
