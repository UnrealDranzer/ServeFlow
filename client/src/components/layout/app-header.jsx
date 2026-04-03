import { LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pathToLabelMap = {
  "/app/dashboard": "Home",
  "/app/orders": "Orders",
  "/app/orders/new": "New Order",
  "/app/categories": "Categories",
  "/app/menu-items": "Dishes",
  "/app/order-sources": "Tables & QR",
  "/app/settings": "Settings"
};

export function AppHeader() {
  const location = useLocation();
  const auth = useAuth();

  return (
    <header className="surface-panel flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground sm:text-xs">
          {pathToLabelMap[location.pathname] || "ServeFlow"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 sm:mt-2 sm:gap-3">
          <h2 className="truncate text-lg sm:text-2xl">{auth.business?.name || "Your Store"}</h2>
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {auth.user?.role === "owner" ? "Owner" : "Staff"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 lg:justify-end">
        <div className="rounded-full border border-accent/35 bg-accent/18 px-3 py-1.5 text-xs font-medium text-foreground sm:px-4 sm:py-2 sm:text-sm">
          {auth.user?.name || "Team member"}
        </div>
        <Button variant="outline" size="sm" onClick={auth.logout} className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">
          <LogOut className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
