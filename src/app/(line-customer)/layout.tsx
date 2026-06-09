import Image from "next/image";
import "./line.css";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ln" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="ln-topbar">
        <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} />
        <span>マイページ</span>
      </header>
      <main style={{ flex: 1 }} className="ln-safe">{children}</main>
    </div>
  );
}
