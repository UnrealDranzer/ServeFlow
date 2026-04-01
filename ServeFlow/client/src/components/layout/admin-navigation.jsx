import { NavLink } from "react-router-dom";
import {
  BarChart3,
  LayoutGrid,
  ListOrdered,
  QrCode,
  Settings2,
  Soup,
  Tags
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/use-auth";

const navigationItems = [
  {
    to: "/app/dashboard",
    label: "Dashboard",
    icon: BarChart3,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/orders",
    label: "Orders",
    icon: ListOrdered,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/orders/new",
    label: "New Manual Order",
    icon: LayoutGrid,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/categories",
    label: "Categories",
    icon: Tags,
    roles: ["owner"]
  },
  {
    to: "/app/menu-items",
    label: "Menu Items",
    icon: Soup,
    roles: ["owner"]
  },
  {
    to: "/app/order-sources",
    label: "Order Sources",
    icon: QrCode,
    roles: ["owner"]
  },
  {
    to: "/app/settings",
    label: "Settings",
    icon: Settings2,
    roles: ["owner"]
  }
];

export function AdminNavigation() {
  const auth = useAuth();
  const visibleItems = navigationItems.filter((item) => item.roles.includes(auth.user?.role));

  return (
    <div className="surface-panel flex h-full flex-col overflow-hidden">
      <div className="border-b border-border/80 p-5">
        <AppLogo />
      </div>
      <div className="space-y-5 p-5">
        <div className="rounded-[24px] bg-secondary px-4 py-5 text-secondary-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary-foreground/70">
            Active Business
          </p>
          <p className="mt-3 font-display text-3xl leading-tight">
            {auth.business?.name || "ServeFlow"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="outline" className="border-white/20 bg-white/10 text-secondary-foreground">
              {auth.user?.role === "owner" ? "Owner" : "Staff"}
            </Badge>
            <span className="text-xs text-secondary-foreground/70">{auth.business?.slug}</span>
          </div>
        </div>
        <nav className="space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-border/80 px-5 py-4 text-xs text-muted-foreground">
        Protected routes stay tenant-scoped and role-aware by default.
      </div>
    </div>
  );
}
