"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRecord, type CustomerRank } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Kpis, Kpi, VStack, HStack, Tabs, Chip, Modal } from "@/components/v2/ui";
import { escapeHtml } from "@/lib/v2/pdf";
import { ArrowLeft, QrCode } from "lucide-react";

const STORE_NAME = "てんぽみえるくん";

const RANK_LABEL: Record<CustomerRank, string> = { regular: "Regular", silver: "Silver", gold: "Gold", vip: "VIP" };

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [customers] = usePersisted(customerStore);
  const initial = customers.find(c => c.id === id);

  const [tab, setTab] = useState<"basic" | "history" | "chip" | "memo">("basic");
  const [draft, setDraft] = useState<CustomerRecord | null>(null);
  useEffect(() => { if (initial) setDraft(initial); }, [initial?.id]); // eslint-disable-line

  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (!qrOpen || !initial) return;
    let cancelled = false;
    QRCode.toDataURL(initial.id, { width: 240, margin: 2 })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [qrOpen, initial]);

  function printQrCard() {
    if (!initial || !qrDataUrl) return;
    const w = window.open("", "_blank", "width=480,height=640");
    if (!w) {
      alert("ポップアップがブロックされています。許可してから再実行してください。");
      return;
    }
    const memberNo = initial.id.slice(0, 8).toUpperCase();
    const html = `<!DOCTYPE html>
<html lang="ja"><head>
  <meta charset="utf-8" />
  <title>会員QR - ${escapeHtml(initial.nickname || initial.name)}</title>
  <style>
    @page { size: 91mm 55mm; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, "Hiragino Sans", "Yu Gothic UI", sans-serif; }
    .card {
      width: 91mm; height: 55mm; padding: 6mm;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 2mm;
      border: 0.3mm solid #ccc;
    }
    .store { font-size: 9px; color: #71717a; letter-spacing: 0.04em; }
    .qr { width: 30mm; height: 30mm; }
    .nickname { font-size: 13px; font-weight: 700; }
    .memberno { font-size: 9px; color: #71717a; font-variant-numeric: tabular-nums; }
    @media print { .card { border: none; } }
  </style>
</head><body>
  <div class="card">
    <div class="store">${escapeHtml(STORE_NAME)}</div>
    <img class="qr" src="${qrDataUrl}" />
    <div class="nickname">${escapeHtml(initial.nickname || initial.name)}</div>
    <div class="memberno">会員番号: ${escapeHtml(memberNo)}</div>
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 150); };</script>
</body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  if (!initial) {
    return (
      <VStack gap={16}>
        <Link href="/v2/customers" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
          <ArrowLeft size={12} />一覧へ戻る
        </Link>
        <Panel><div className="v2-mute" style={{ padding: 32, textAlign: "center" }}>該当する顧客が見つかりません</div></Panel>
      </VStack>
    );
  }

  function save() {
    if (!draft) return;
    customerStore.set(prev => prev.map(c => c.id === id ? draft : c));
  }
  function remove() {
    if (!confirm("削除しますか？")) return;
    customerStore.set(prev => prev.filter(c => c.id !== id));
    router.push("/v2/customers");
  }
  function update<K extends keyof CustomerRecord>(key: K, value: CustomerRecord[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  }

  if (!draft) return null;

  return (
    <VStack gap={16}>
      <Link href="/v2/customers" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
        <ArrowLeft size={12} />一覧へ戻る
      </Link>
      <PageHeader
        title={initial.nickname || initial.name}
        sub={initial.nickname ? `本名: ${initial.name}` : `${RANK_LABEL[initial.rank]} · ${initial.phone || "—"}`}
        action={
          <>
            {!initial.pledgeNo && <Chip variant="warn">誓約書未</Chip>}
            <Btn onClick={() => setQrOpen(true)}><QrCode size={14} style={{ marginRight: 4 }} />会員QR</Btn>
            <Btn variant="danger" onClick={remove}>削除</Btn>
            <Btn variant="primary" onClick={save}>保存</Btn>
          </>
        }
      />

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="会員QRコード" footer={
        <>
          <Btn variant="ghost" onClick={() => setQrOpen(false)}>閉じる</Btn>
          <Btn variant="primary" onClick={printQrCard} disabled={!qrDataUrl}>印刷</Btn>
        </>
      }>
        <VStack gap={12}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} width={240} height={240} alt="会員QRコード" style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12, background: "#fff" }} />
            ) : (
              <div style={{ width: 240, height: 240, display: "flex", alignItems: "center", justifyContent: "center" }} className="v2-mute">生成中…</div>
            )}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{initial.nickname || initial.name}</div>
              <div className="v2-mute" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>会員番号: {initial.id.slice(0, 8).toUpperCase()}</div>
            </div>
          </div>
          <div className="v2-mute" style={{ fontSize: 11, lineHeight: 1.6, borderTop: "1px solid var(--v2-border)", paddingTop: 10 }}>
            ※ 入店時のQR読取連携は今後のDB接続後に有効になります。現時点では表示・印刷のみ対応しています。
          </div>
        </VStack>
      </Modal>

      <Kpis>
        <Kpi label="来店" value={initial.totalVisits} sub="回" />
        <Kpi label="累計利用" value={`¥${initial.totalSpent.toLocaleString()}`} />
        <Kpi label="チップ" value={initial.chipBalance.toLocaleString()} />
        <Kpi label="ポイント" value={initial.pointBalance.toLocaleString()} />
      </Kpis>

      <Tabs value={tab} onChange={(v) => setTab(v as typeof tab)} items={[
        { value: "basic", label: "基本情報" },
        { value: "history", label: "来店履歴" },
        { value: "chip", label: "チップ/ポイント" },
        { value: "memo", label: "メモ" },
      ]} />

      {tab === "basic" && (
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="本名"><input value={draft.name} onChange={(e) => update("name", e.target.value)} /></Field>
            <Field label="ポーカーネーム" hint="客同士に見える呼び名(本名は店側のみ)"><input value={draft.nickname} onChange={(e) => update("nickname", e.target.value)} /></Field>
            <Field label="ランク">
              <select value={draft.rank} onChange={(e) => update("rank", e.target.value as CustomerRank)}>
                <option value="regular">Regular</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip">VIP</option>
              </select>
            </Field>
            <Field label="生年月日"><input type="date" value={draft.dateOfBirth ?? ""} onChange={(e) => update("dateOfBirth", e.target.value || undefined)} /></Field>
            <Field label="電話番号"><input value={draft.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
            <Field label="誓約書管理番号" hint="紙の誓約書に振った管理番号を記載">
              <input value={draft.pledgeNo ?? ""} onChange={(e) => update("pledgeNo", e.target.value || undefined)} placeholder="例: P-0001" />
            </Field>
            <Field label="メール"><input value={draft.email ?? ""} onChange={(e) => update("email", e.target.value || undefined)} /></Field>
          </div>
        </Panel>
      )}

      {tab === "history" && (
        <Panel><div className="v2-mute" style={{ padding: 32, textAlign: "center" }}>履歴データなし</div></Panel>
      )}

      {tab === "chip" && (
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="チップ残高"><input type="number" value={draft.chipBalance} onChange={(e) => update("chipBalance", parseInt(e.target.value) || 0)} /></Field>
            <Field label="ポイント残高"><input type="number" value={draft.pointBalance} onChange={(e) => update("pointBalance", parseInt(e.target.value) || 0)} /></Field>
          </div>
        </Panel>
      )}

      {tab === "memo" && (
        <Panel>
          <VStack gap={16}>
            <Field label="備考"><textarea rows={4} value={draft.notes ?? ""} onChange={(e) => update("notes", e.target.value)} /></Field>
            <Field label="注意事項"><textarea rows={2} value={draft.cautionText ?? ""} onChange={(e) => update("cautionText", e.target.value)} /></Field>
            <HStack gap={16}>
              <label className="v2-row" style={{ gap: 6 }}><input type="checkbox" checked={!!draft.isBlacklisted} onChange={(e) => update("isBlacklisted", e.target.checked)} style={{ width: 14, height: 14 }} /> ブラックリスト</label>
              <label className="v2-row" style={{ gap: 6 }}><input type="checkbox" checked={!!draft.isHidden} onChange={(e) => update("isHidden", e.target.checked)} style={{ width: 14, height: 14 }} /> 非表示</label>
            </HStack>
          </VStack>
        </Panel>
      )}
    </VStack>
  );
}
