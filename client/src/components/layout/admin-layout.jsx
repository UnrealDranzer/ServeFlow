import { Outlet } from "react-router-dom";
import { AdminNavigation } from "@/components/layout/admin-navigation";
import { AppHeader } from "@/components/layout/app-header";

export function AdminLayout() {
  return (
    <div className="min-h-screen">
      <div className="page-edge grid min-h-screen gap-4 py-3 sm:gap-6 sm:py-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:py-6">
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:h-[calc(100vh-3rem)]">
          <AdminNavigation />
        </aside>
        <main className="min-w-0 space-y-4 sm:space-y-6">
          <div className="sticky top-3 z-20 lg:hidden">
            <AdminNavigation mobile />
          </div>
          <AppHeader />
          <div className="surface-panel min-h-[calc(100vh-9rem)] p-4 sm:p-5 lg:min-h-[calc(100vh-11rem)] lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
