"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rank, setRank] = useState("regular");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("名前は必須です"); return; }
    setLoading(true); setError("");

    // Server Action呼び出し（Supabase接続時）
    try {
      const { createCustomerAction } = await import("@/lib/actions/customer-actions");
      const fd = new FormData();
      fd.set("name", name); fd.set("phone", phone); fd.set("email", email);
      fd.set("rank", rank); fd.set("notes", notes);
      const result = await createCustomerAction(fd);
      if (result.error) { setError(result.error); setLoading(false); return; }
    } catch {
      // デモモード: 成功扱い
    }
    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-[#d8d3cc] rounded-[8px] p-8 text-center">
          <CheckCircle className="w-12 h-12 text-[#188038] mx-auto mb-3" />
          <p className="text-[16px] font-semibold text-[#188038]">顧客を登録しました</p>
          <p className="text-[13px] text-[#5a6977] mt-1">{name}</p>
          <div className="flex gap-2 justify-center mt-6">
            <button onClick={() => { setDone(false); setName(""); setPhone(""); setEmail(""); setRank("regular"); setNotes(""); }}
              className="px-4 py-[7px] border border-[#d8d3cc] text-[13px] font-medium rounded-[6px] hover:bg-[#f3f0ec]">
              続けて登録
            </button>
            <button onClick={() => router.push("/customers")}
              className="px-4 py-[7px] bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69]">
              顧客一覧へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/customers" className="flex items-center gap-1 text-[12px] text-[#8e9baa] hover:text-[#5a6977] mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />顧客一覧に戻る
      </Link>

      <div className="bg-white border border-[#d8d3cc] rounded-[8px] p-5">
        <h2 className="text-[15px] font-semibold mb-4">顧客新規登録</h2>

        {error && (
          <div className="mb-4 px-3 py-2 bg-[#fce8e6] border border-[#c5221f]/20 rounded-[6px] text-[12px] text-[#c5221f]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1.5">名前 <span className="text-[#c5221f]">*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="田中 太郎" className="text-[13px]" required />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1.5">電話番号</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="090-1234-5678" className="text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1.5">メールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="text-[13px]" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1.5">ランク</label>
            <select value={rank} onChange={e => setRank(e.target.value)} className="text-[13px]">
              <option value="regular">レギュラー</option>
              <option value="silver">シルバー</option>
              <option value="gold">ゴールド</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1.5">メモ</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="text-[13px] resize-none" placeholder="備考を入力..." />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69] disabled:opacity-50 transition-colors">
              {loading ? "登録中..." : "登録する"}
            </button>
            <Link href="/customers"
              className="px-4 py-2.5 border border-[#d8d3cc] text-[13px] font-medium rounded-[6px] hover:bg-[#f3f0ec] text-center transition-colors">
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
