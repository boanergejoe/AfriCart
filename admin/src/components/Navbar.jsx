import { UserButton } from "@clerk/react";
import { useLocation } from "react-router";
import { PanelLeftIcon } from "lucide-react";
import { getPageTitle } from "../lib/navigation.js";

function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="navbar sticky top-0 z-30 min-h-16 gap-2 border-b border-base-300 bg-base-100/95 px-4 backdrop-blur sm:px-6">
      <label
        htmlFor="admin-drawer"
        className="btn btn-square btn-ghost lg:hidden"
        aria-label="Open navigation menu"
      >
        <PanelLeftIcon className="size-5" />
      </label>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-widest text-base-content/50">
          AfriCart Store
        </p>
        <h1 className="truncate text-lg font-semibold sm:text-xl">{getPageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-medium sm:inline">Administrator</span>
        <UserButton />
      </div>
    </header>
  );
}

export default Navbar;
