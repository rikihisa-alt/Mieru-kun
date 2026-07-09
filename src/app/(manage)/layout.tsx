import Link from "next/link";
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
            <div style={{ background: "#fbf2e1", color: "#8a5a10", padding: "10px 16px", fontSize: "13px", borderBottom: "1px solid #e8dcc8" }}>
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <span>⚠ こちらは旧管理画面です。最新の機能は新管理画面でご利用いただけます。</span>
                <Link href="/v2" style={{ fontWeight: "bold", color: "#8a5a10", textDecoration: "none", marginLeft: "16px", whiteSpace: "nowrap" }}>新管理画面を開く</Link>
              </div>
            </div>
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
