import { Sidebar } from "@/components/manage/sidebar";
import { Header } from "@/components/manage/header";
import { SidebarProvider } from "@/components/manage/sidebar-context";
import { AppStoreProvider } from "@/lib/store/app-store";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-main)" }}>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto px-3 sm:px-5 md:px-6 lg:px-8 py-4 md:py-6 lg:py-7"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0) + 16px)" }}>
              <div className="max-w-[1400px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AppStoreProvider>
  );
}
