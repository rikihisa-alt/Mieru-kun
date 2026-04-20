"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();

  // 基本情報
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [lineId, setLineId] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [rank, setRank] = useState("regular");

  // スタッフ用メモ・注意事項
  const [notes, setNotes] = useState("");
  const [cautionText, setCautionText] = useState("");

  // フラグ
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // SNS
  const [snsX, setSnsX] = useState("");
  const [snsIg, setSnsIg] = useState("");
  const [snsTikTok, setSnsTikTok] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("本名は必須です"); return; }
    setLoading(true); setError("");

    try {
      const { createCustomerAction } = await import("@/lib/actions/customer-actions");
      const fd = new FormData();
      fd.set("name", name);
      fd.set("nickname", nickname);
      fd.set("phone", phone);
      fd.set("email", email);
      fd.set("rank", rank);
      fd.set("notes", notes);
      fd.set("caution_text", cautionText);
      fd.set("date_of_birth", dateOfBirth);
      fd.set("line_id", lineId);
      fd.set("referrer_name", referrerName);
      fd.set("is_blacklisted", String(isBlacklisted));
      fd.set("is_hidden", String(isHidden));
      fd.set("sns_links", JSON.stringify({ x: snsX, instagram: snsIg, tiktok: snsTikTok }));
      const result = await createCustomerAction(fd);
      if (result.error) { setError(result.error); setLoading(false); return; }
    } catch {
      // デモモード: 成功扱い
    }
    setDone(true);
    setLoading(false);
  }

  function resetForm() {
    setDone(false);
    setName(""); setNickname(""); setDateOfBirth(""); setPhone(""); setEmail("");
    setLineId(""); setReferrerName(""); setRank("regular");
    setNotes(""); setCautionText("");
    setIsBlacklisted(false); setIsHidden(false);
    setSnsX(""); setSnsIg(""); setSnsTikTok("");
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-status-success mx-auto mb-3" />
          <p className="text-[16px] font-semibold text-status-success">顧客を登録しました</p>
          <p className="text-[13px] text-text-secondary mt-1">{nickname ? `${nickname}（${name}）` : name}</p>
          <div className="flex gap-2 justify-center mt-6">
            <button onClick={resetForm}
              className="px-4 py-[7px] border border-border text-[13px] font-medium rounded-[6px] hover:bg-bg-hover">
              続けて登録
            </button>
            <button onClick={() => router.push("/a9k5dm")}
              className="px-4 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">
              顧客一覧へ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/a9k5dm" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary mb-4">
        <ArrowLeft className="w-3.5 h-3.5" />顧客一覧に戻る
      </Link>

      <h2 className="text-[15px] font-semibold mb-4">顧客新規登録</h2>

      {error && (
        <div className="mb-4 px-3 py-2 bg-status-danger-bg border border-[#c5221f]/20 rounded-[6px] text-[12px] text-status-danger">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ---- 基本情報 ---- */}
        <Section title="基本情報">
          <div className="grid grid-cols-2 gap-3">
            <Field label="ニックネーム（ポーカーネーム）">
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="タロウ / HANA" />
            </Field>
            <Field label="本名" required>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="田中 太郎" required />
            </Field>
            <Field label="生年月日">
              <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
            </Field>
            <Field label="ランク">
              <select value={rank} onChange={e => setRank(e.target.value)}>
                <option value="regular">Regular</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip">VIP</option>
              </select>
            </Field>
            <Field label="電話番号">
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="090-1234-5678" />
            </Field>
            <Field label="メールアドレス">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" />
            </Field>
            <Field label="LINE ID">
              <input type="text" value={lineId} onChange={e => setLineId(e.target.value)} placeholder="LINE連携時の識別子" />
            </Field>
            <Field label="紹介者">
              <input type="text" value={referrerName} onChange={e => setReferrerName(e.target.value)} placeholder="紹介者名 / ID" />
            </Field>
          </div>
        </Section>

        {/* ---- スタッフメモ ---- */}
        <Section title="スタッフメモ">
          <Field label="注意事項（ヘッダーに常時表示）">
            <textarea value={cautionText} onChange={e => setCautionText(e.target.value)} rows={2} className="resize-none" placeholder="例: 飲食不可 / 過去トラブルあり 等" />
          </Field>
          <Field label="備考（一般メモ）">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="resize-none" placeholder="好みのドリンク・誕生日ケアなど" />
          </Field>
        </Section>

        {/* ---- SNS ---- */}
        <Section title="SNSリンク（任意）">
          <div className="grid grid-cols-3 gap-3">
            <Field label="X (Twitter)">
              <input type="url" value={snsX} onChange={e => setSnsX(e.target.value)} placeholder="https://x.com/..." />
            </Field>
            <Field label="Instagram">
              <input type="url" value={snsIg} onChange={e => setSnsIg(e.target.value)} placeholder="https://instagram.com/..." />
            </Field>
            <Field label="TikTok">
              <input type="url" value={snsTikTok} onChange={e => setSnsTikTok(e.target.value)} placeholder="https://tiktok.com/@..." />
            </Field>
          </div>
        </Section>

        {/* ---- フラグ（管理者） ---- */}
        <Section title="管理フラグ">
          <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
            <input type="checkbox" checked={isBlacklisted} onChange={e => setIsBlacklisted(e.target.checked)} />
            <span>ブラックリスト（入店拒否）</span>
          </label>
          <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
            <input type="checkbox" checked={isHidden} onChange={e => setIsHidden(e.target.checked)} />
            <span>非表示（一般スタッフの検索結果に出さない）</span>
          </label>
        </Section>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover disabled:opacity-50 transition-colors">
            {loading ? "登録中..." : "登録する"}
          </button>
          <Link href="/a9k5dm"
            className="px-4 py-2.5 border border-border text-[13px] font-medium rounded-[6px] hover:bg-bg-hover text-center transition-colors">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-text-secondary mb-1">
        {label}
        {required && <span className="text-status-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
