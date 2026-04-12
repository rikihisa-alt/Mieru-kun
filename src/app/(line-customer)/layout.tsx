export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-30 bg-bg-white border-b border-border">
        <div className="flex items-center px-4 h-12">
          <span className="text-[13px] font-bold text-text-primary">マイページ</span>
        </div>
      </header>
      <main className="flex-1 px-4 py-3 max-w-md mx-auto w-full">{children}</main>
    </div>
  );
}
