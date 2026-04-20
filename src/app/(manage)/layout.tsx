import { Sidebar } from "@/components/manage/sidebar";
import { Header } from "@/components/manage/header";
import { AppStoreProvider } from "@/lib/store/app-store";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppStoreProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AppStoreProvider>
  );
}
