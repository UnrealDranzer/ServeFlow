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
    label: "Home",
    shortLabel: "Home",
    icon: BarChart3,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/orders",
    label: "Orders",
    shortLabel: "Orders",
    icon: ListOrdered,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/orders/new",
    label: "New Order",
    shortLabel: "New",
    icon: LayoutGrid,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/categories",
    label: "Categories",
    shortLabel: "Menu",
    icon: Tags,
    roles: ["owner"]
  },
  {
    to: "/app/menu-items",
    label: "Dishes",
    shortLabel: "Dishes",
    icon: Soup,
    roles: ["owner"]
  },
  {
    to: "/app/order-sources",
    label: "Tables / QR",
    shortLabel: "Tables",
    icon: QrCode,
    roles: ["owner"]
  },
  {
    to: "/app/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings2,
    roles: ["owner"]
  }
];

export function AdminNavigation({ mobile = false }) {
  const auth = useAuth();
  const visibleItems = navigationItems.filter((item) => item.roles.includes(auth.user?.role));

  if (mobile) {
    return (
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-white/95 backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-stretch overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex shrink-0 w-[72px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors snap-start",
                    isActive
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground"
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span className="truncate w-full text-center px-1">{item.shortLabel}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className="surface-panel flex h-full flex-col overflow-hidden bg-white">
      <div className="border-b border-border/40 p-6">
        <AppLogo />
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Your Store
          </p>
          <p className="mt-1 font-display text-xl font-bold text-foreground">
            {auth.business?.name || "ServeFlow"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-bold uppercase">
              {auth.user?.role === "owner" ? "Owner" : "Staff"}
            </Badge>
          </div>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
      <div className="border-t border-border/40 p-6 text-[10px] font-medium text-muted-foreground/50">
        &copy; {new Date().getFullYear()} ServeFlow
      </div>
    </div>
  );
}
