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
    icon: BarChart3,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/orders",
    label: "Orders List",
    icon: ListOrdered,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/orders/new",
    label: "Take Order",
    icon: LayoutGrid,
    roles: ["owner", "staff"]
  },
  {
    to: "/app/categories",
    label: "Menu Sections",
    icon: Tags,
    roles: ["owner"]
  },
  {
    to: "/app/menu-items",
    label: "Dishes",
    icon: Soup,
    roles: ["owner"]
  },
  {
    to: "/app/order-sources",
    label: "Tables / QR",
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

export function AdminNavigation({ mobile = false }) {
  const auth = useAuth();
  const visibleItems = navigationItems.filter((item) => item.roles.includes(auth.user?.role));

  if (mobile) {
    return (
      <div className="surface-panel overflow-hidden bg-white/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
              Active Store
            </p>
            <p className="truncate font-display text-lg font-bold text-foreground">
              {auth.business?.name || "ServeFlow"}
            </p>
          </div>
          <Badge variant="secondary" className="rounded-md px-2 py-1 text-[10px] font-bold uppercase">
            {auth.user?.role === "owner" ? "Admin" : "Staff"}
          </Badge>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex min-w-fit items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/65 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
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
            Active Store
          </p>
          <p className="mt-1 font-display text-xl font-bold text-foreground">
            {auth.business?.name || "ServeFlow"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-bold uppercase">
              {auth.user?.role === "owner" ? "Admin" : "Staff"}
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
