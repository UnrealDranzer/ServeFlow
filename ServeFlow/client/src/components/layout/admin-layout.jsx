import { Outlet } from "react-router-dom";
import { AdminNavigation } from "@/components/layout/admin-navigation";
import { AppHeader } from "@/components/layout/app-header";

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <div className="page-edge grid min-h-screen gap-6 py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:py-6">
        <aside className="hidden lg:block">
          <AdminNavigation />
        </aside>
        <main className="space-y-6">
          <div className="lg:hidden">
            <AdminNavigation />
          </div>
          <AppHeader />
          <div className="surface-panel min-h-[calc(100vh-11rem)] p-5 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
