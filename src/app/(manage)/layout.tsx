import { Sidebar } from "@/components/manage/sidebar";
import { Header } from "@/components/manage/header";
import { AppStoreProvider } from "@/lib/store/app-store";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-main)" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto px-8 py-7">
            <div className="max-w-[1400px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AppStoreProvider>
  );
}
