"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useStoreSettings } from "@/lib/store/settings";

export function TopbarStorePill() {
  const router = useRouter();
  const settings = useStoreSettings();
  const name = settings.storeName || "店舗未設定";
  const mark = name.trim().charAt(0) || "?";

  return (
    <button
      className="v2-store-pill"
      title="店舗設定を開く"
      onClick={() => router.push("/k4z8qm3x/settings")}
    >
      <span className="v2-store-pill__mark">{mark}</span>
      <span>{name}</span>
      <ChevronDown size={12} style={{ color: "var(--v2-text-mute)" }} />
    </button>
  );
}
