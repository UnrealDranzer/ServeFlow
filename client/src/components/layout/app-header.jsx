import { LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pathToLabelMap = {
  "/app/dashboard": "Dashboard",
  "/app/orders": "Orders",
  "/app/orders/new": "Manual Order",
  "/app/categories": "Categories",
  "/app/menu-items": "Menu Items",
  "/app/order-sources": "Order Sources",
  "/app/settings": "Settings"
};

export function AppHeader() {
  const location = useLocation();
  const auth = useAuth();

  return (
    <header className="surface-panel flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
          {pathToLabelMap[location.pathname] || "ServeFlow"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="truncate text-xl sm:text-2xl">{auth.business?.name || "Workspace"}</h2>
          <Badge variant="outline">
            {auth.user?.role === "owner" ? "Owner access" : "Staff access"}
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
        <div className="rounded-full bg-accent px-3 py-2 text-xs text-accent-foreground sm:px-4 sm:text-sm">
          {auth.user?.name || "Team member"}
        </div>
        <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={auth.logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
