"use client";

import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, User, Phone, ShieldCheck, PartyPopper } from "lucide-react";
import { customerStore, type CustomerRecord } from "@/lib/store/domain-stores";

// ===========================================================
// 会員登録ページ (LINE誘導・店頭タブレット)
// 顧客自身が入力 → customerStore に新規 CustomerRecord を追加
// opaqueルート: /g8k2mv (既存の /u3j5ny 系と同じ命名慣習)
// ===========================================================

type Step = 1 | 2 | 3;

const AGREEMENTS = [
  "当店はアミューズメントカジノであり、現金・金品を賭ける行為は一切行いません。",
  "チップ・ポイントはゲームプレイのみに使用し、換金・売買はできません。",
  "利用規約およびフロアスタッフの案内に従い、店内では節度あるふるまいをお約束します。",
] as const;

function toHalfWidthDigitsAndHyphen(input: string): string {
  return input
    .replace(/[０-９－ー]/g, (ch) => {
      if (ch === "－" || ch === "ー") return "-";
      return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
    })
    .replace(/[^0-9-]/g, "");
}

function makeCustomerId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function CustomerSelfRegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [agree1, setAgree1] = useState(false);
  const [agree2, setAgree2] = useState(false);
  const [agree3, setAgree3] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nicknameDupe, setNicknameDupe] = useState(false);
  const [done, setDone] = useState(false);
  const [memberNo, setMemberNo] = useState("");

  function validateStep1(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "お名前を入力してください";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStep2(): boolean {
    const next: Record<string, string> = {};
    if (phone && !/^[0-9-]+$/.test(phone)) next.phone = "電話番号は数字とハイフンのみで入力してください";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (step === 1) {
      if (!validateStep1()) return;
      // ポーカーネーム重複チェック(ブロックはしない、注意表示のみ)
      const list = customerStore.get();
      const nick = nickname.trim();
      setNicknameDupe(!!nick && list.some((c) => c.nickname && c.nickname === nick));
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }
  }

  function goBack() {
    setErrors({});
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  function handlePhoneChange(v: string) {
    setPhone(toHalfWidthDigitsAndHyphen(v));
  }

  function submit() {
    if (!agree1 || !agree2 || !agree3) {
      setErrors({ agree: "3つの同意事項すべてにチェックが必要です" });
      return;
    }
    const id = makeCustomerId();
    const c: CustomerRecord = {
      id,
      name: name.trim(),
      nickname: nickname.trim(),
      rank: "regular",
      phone: phone.trim(),
      dateOfBirth: dateOfBirth || undefined,
      totalVisits: 0,
      totalSpent: 0,
      chipBalance: 0,
      pointBalance: 0,
      prizeCount: 0,
      createdAt: new Date().toISOString(),
    };
    customerStore.set((prev) => [c, ...prev]);
    setMemberNo(id.slice(0, 6).toUpperCase());
    setDone(true);
  }

  if (done) {
    return (
      <div className="ln-page">
        <div className="ln-stack">
          <div className="ln-card ln-card-lg" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--ln-accent-soft)",
                color: "var(--ln-accent-text)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <PartyPopper size={26} />
            </div>
            <p className="ln-h2" style={{ marginBottom: 4 }}>登録ありがとうございます</p>
            <p className="ln-mute" style={{ fontSize: 12, marginTop: 0, marginBottom: 18 }}>
              会員登録が完了しました
            </p>

            <div
              style={{
                background: "var(--ln-bg-alt)",
                borderRadius: "var(--ln-radius-sm)",
                padding: "14px 12px",
                marginBottom: 4,
              }}
            >
              <p className="ln-mute" style={{ fontSize: 11, margin: 0, marginBottom: 4 }}>会員番号</p>
              <p
                className="ln-num"
                style={{ fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: "0.04em", color: "var(--ln-accent-text)" }}
              >
                {memberNo}
              </p>
            </div>
          </div>

          <div className="ln-card" style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>この画面をスタッフにお見せください</p>
          </div>

          <p className="ln-demo-note" style={{ marginTop: 4 }}>
            ※ ご自身のスマートフォンから登録された場合、店舗への反映はシステム連携の準備中です。店頭の端末からの登録は即時反映されます。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ln-page">
      <div className="ln-stack">
        {/* ステップインジケーター */}
        <div className="ln-row" style={{ justifyContent: "center", gap: 6 }}>
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              style={{
                width: s === step ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: s <= step ? "var(--ln-accent)" : "var(--ln-border)",
                transition: "all 0.15s var(--ln-ease)",
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="ln-card">
            <div className="ln-card-head">
              <span className="ln-card-label">
                <span className="ln-row" style={{ gap: 6 }}>
                  <User size={14} />
                  STEP 1 / 3
                </span>
              </span>
            </div>
            <p className="ln-h2" style={{ marginBottom: 4 }}>お名前を教えてください</p>
            <p className="ln-mute" style={{ fontSize: 12, marginTop: 0, marginBottom: 16 }}>
              本名は店舗のみが確認します
            </p>

            <div className="ln-stack-sm">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  お名前(本名) <span style={{ color: "var(--ln-danger)" }}>必須</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="田中 太郎"
                  autoComplete="name"
                />
                {errors.name && (
                  <p style={{ fontSize: 12, color: "var(--ln-danger-text)", margin: "4px 0 0" }}>{errors.name}</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  ポーカーネーム
                </label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="タロウ"
                />
                <p className="ln-mute" style={{ fontSize: 11, margin: "4px 0 0" }}>
                  店内で他のお客様に表示される呼び名です
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ln-card">
            <div className="ln-card-head">
              <span className="ln-card-label">
                <span className="ln-row" style={{ gap: 6 }}>
                  <Phone size={14} />
                  STEP 2 / 3
                </span>
              </span>
            </div>
            <p className="ln-h2" style={{ marginBottom: 4 }}>連絡先を教えてください</p>
            <p className="ln-mute" style={{ fontSize: 12, marginTop: 0, marginBottom: 16 }}>
              電話番号・誕生日は未入力でも登録できます
            </p>

            <div className="ln-stack-sm">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  電話番号
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="090-1234-5678"
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p style={{ fontSize: 12, color: "var(--ln-danger-text)", margin: "4px 0 0" }}>{errors.phone}</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>
                  誕生日
                </label>
                <input
                  type="date"
                  inputMode="none"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ln-card">
            <div className="ln-card-head">
              <span className="ln-card-label">
                <span className="ln-row" style={{ gap: 6 }}>
                  <ShieldCheck size={14} />
                  STEP 3 / 3
                </span>
              </span>
            </div>
            <p className="ln-h2" style={{ marginBottom: 4 }}>利用規約への同意</p>
            <p className="ln-mute" style={{ fontSize: 12, marginTop: 0, marginBottom: 16 }}>
              アミューズメントカジノのルールをご確認ください
            </p>

            {nicknameDupe && (
              <div
                className="ln-row"
                style={{
                  background: "var(--ln-warn-soft)",
                  color: "var(--ln-warn-text)",
                  borderRadius: "var(--ln-radius-sm)",
                  padding: "10px 12px",
                  fontSize: 12,
                  marginBottom: 12,
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span>同じポーカーネームの会員が既に登録されています。そのまま登録する場合はスタッフに一声かけてください。</span>
              </div>
            )}

            <div className="ln-stack-sm">
              <AgreeCheckbox checked={agree1} onChange={setAgree1} label={AGREEMENTS[0]} />
              <AgreeCheckbox checked={agree2} onChange={setAgree2} label={AGREEMENTS[1]} />
              <AgreeCheckbox checked={agree3} onChange={setAgree3} label={AGREEMENTS[2]} />
            </div>

            {errors.agree && (
              <p style={{ fontSize: 12, color: "var(--ln-danger-text)", margin: "10px 0 0" }}>{errors.agree}</p>
            )}
          </div>
        )}

        {/* ナビゲーション */}
        <div className="ln-row" style={{ gap: 8 }}>
          {step > 1 && (
            <button type="button" className="ln-btn" onClick={goBack} style={{ flex: "0 0 auto" }}>
              <ChevronLeft size={16} />
              戻る
            </button>
          )}
          {step < 3 && (
            <button type="button" className="ln-btn ln-btn--primary ln-btn--full" onClick={goNext}>
              次へ
              <ChevronRight size={16} />
            </button>
          )}
          {step === 3 && (
            <button type="button" className="ln-btn ln-btn--primary ln-btn--full" onClick={submit}>
              <CheckCircle2 size={16} />
              登録する
            </button>
          )}
        </div>

        <p className="ln-demo-note">
          ※ ご自身のスマートフォンから登録された場合、店舗への反映はシステム連携の準備中です。店頭の端末からの登録は即時反映されます。
        </p>
      </div>
    </div>
  );
}

function AgreeCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className="ln-row"
      style={{
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 12px",
        borderRadius: "var(--ln-radius-sm)",
        border: "1px solid var(--ln-border)",
        background: checked ? "var(--ln-accent-soft)" : "var(--ln-card)",
        cursor: "pointer",
        minHeight: 44,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 20, height: 20, minHeight: 0, flexShrink: 0, marginTop: 1 }}
      />
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--ln-text-sub)" }}>{label}</span>
    </label>
  );
}
