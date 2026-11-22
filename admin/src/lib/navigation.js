import {
  ClipboardListIcon,
  HomeIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "lucide-react";

export const NAVIGATION = [
  { name: "Dashboard", path: "/dashboard", icon: HomeIcon },
  { name: "Products", path: "/products", icon: ShoppingBagIcon },
  { name: "Orders", path: "/orders", icon: ClipboardListIcon },
  { name: "Customers", path: "/customers", icon: UsersIcon },
];

export const getPageTitle = (pathname) =>
  NAVIGATION.find((item) => item.path === pathname)?.name || "AfriCart Admin";
