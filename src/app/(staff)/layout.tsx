import { StaffHeader } from "@/components/staff/staff-header";
import { BottomNav } from "@/components/staff/bottom-nav";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StaffHeader />
      <main className="flex-1 pb-20 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
