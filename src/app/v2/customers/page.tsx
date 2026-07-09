"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRank, type CustomerRecord } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Kpis, Kpi, VStack, Empty, Chip, Modal, Field, Banner, RankBadge } from "@/components/v2/ui";
import { Search, Plus, FileDown, FileUp } from "lucide-react";
import { printDoc, tableHtml, kpisHtml } from "@/lib/v2/pdf";
import { toCsv, downloadCsv, parseCsv } from "@/lib/v2/csv";

const RANK_LABEL: Record<CustomerRank, string> = { regular: "Regular", silver: "Silver", gold: "Gold", vip: "VIP" };

function normalize(s: string) {
  return s.toLowerCase().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

// ===== CSV取込 =====
type ImportField = "name" | "nickname" | "phone" | "pledgeNo" | "dateOfBirth" | "notes" | "none";
const IMPORT_FIELD_LABEL: Record<ImportField, string> = {
  name: "名前", nickname: "ポーカーネーム", phone: "電話", pledgeNo: "誓約書番号", dateOfBirth: "誕生日", notes: "メモ", none: "(取込まない)",
};
const IMPORT_FIELD_KEYS: ImportField[] = ["name", "nickname", "phone", "pledgeNo", "dateOfBirth", "notes", "none"];

function guessMapping(header: string): ImportField {
  const h = header.trim();
  if (/名前|氏名|本名/.test(h)) return "name";
  if (/ポーカー|ニック|呼び名/.test(h)) return "nickname";
  if (/電話|TEL|tel/.test(h)) return "phone";
  if (/誓約/.test(h)) return "pledgeNo";
  if (/誕生|生年月日/.test(h)) return "dateOfBirth";
  if (/メモ|備考/.test(h)) return "notes";
  return "none";
}

const CSV_HEADERS = ["名前", "ポーカーネーム", "電話", "誓約書番号", "ランク", "誕生日", "来店回数", "累計利用", "チップ残高", "ポイント", "メモ"];

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = usePersisted(customerStore);
  const [q, setQ] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importRows, setImportRows] = useState<string[][] | null>(null);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importMapping, setImportMapping] = useState<ImportField[]>([]);
  const [duplicateAction, setDuplicateAction] = useState<"update" | "skip">("update");
  const [importResult, setImportResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  const monthPrefix = new Date().toISOString().slice(0, 7).replace("-", "/");
  const norm = normalize(q.trim());
  const rows = norm
    ? customers.filter(c => normalize(c.name).includes(norm) || normalize(c.nickname).includes(norm) || c.phone.includes(q) || (c.pledgeNo ?? "").includes(q))
    : customers;

  function exportCsv() {
    const csv = toCsv(CSV_HEADERS, customers.map(c => [
      c.name, c.nickname, c.phone, c.pledgeNo ?? "", RANK_LABEL[c.rank], c.dateOfBirth ?? "",
      c.totalVisits, c.totalSpent, c.chipBalance, c.pointBalance, c.notes ?? "",
    ]));
    downloadCsv(`顧客リスト_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCsv(text).filter(r => r.some(cell => cell.trim() !== ""));
      if (parsed.length === 0) return;
      const headers = parsed[0];
      setImportHeaders(headers);
      setImportMapping(headers.map(guessMapping));
      setImportRows(parsed.slice(1));
      setImportResult(null);
      setDuplicateAction("update");
    };
    reader.readAsText(file, "utf-8");
  }

  function runImport() {
    if (!importRows) return;
    const nameIdx = importMapping.indexOf("name");
    if (nameIdx === -1) return;
    const nicknameIdx = importMapping.indexOf("nickname");
    const phoneIdx = importMapping.indexOf("phone");
    const pledgeIdx = importMapping.indexOf("pledgeNo");
    const dobIdx = importMapping.indexOf("dateOfBirth");
    const notesIdx = importMapping.indexOf("notes");

    let added = 0, updated = 0, skipped = 0;
    setCustomers(prev => {
      const next = [...prev];
      for (const row of importRows) {
        const name = (row[nameIdx] ?? "").trim();
        if (!name) { skipped++; continue; }
        const phone = phoneIdx !== -1 ? (row[phoneIdx] ?? "").trim() : "";
        const existingIdx = phone ? next.findIndex(c => c.phone && c.phone === phone) : -1;

        if (existingIdx !== -1) {
          if (duplicateAction === "skip") { skipped++; continue; }
          const existing = next[existingIdx];
          next[existingIdx] = {
            ...existing,
            name,
            nickname: nicknameIdx !== -1 ? (row[nicknameIdx] ?? "").trim() : existing.nickname,
            pledgeNo: pledgeIdx !== -1 ? ((row[pledgeIdx] ?? "").trim() || undefined) : existing.pledgeNo,
            dateOfBirth: dobIdx !== -1 ? ((row[dobIdx] ?? "").trim() || undefined) : existing.dateOfBirth,
            notes: notesIdx !== -1 ? ((row[notesIdx] ?? "").trim() || undefined) : existing.notes,
          };
          updated++;
        } else {
          const c: CustomerRecord = {
            id: Math.random().toString(36).slice(2, 10),
            name,
            nickname: nicknameIdx !== -1 ? (row[nicknameIdx] ?? "").trim() : "",
            rank: "regular",
            phone,
            pledgeNo: pledgeIdx !== -1 ? ((row[pledgeIdx] ?? "").trim() || undefined) : undefined,
            dateOfBirth: dobIdx !== -1 ? ((row[dobIdx] ?? "").trim() || undefined) : undefined,
            notes: notesIdx !== -1 ? ((row[notesIdx] ?? "").trim() || undefined) : undefined,
            totalVisits: 0, totalSpent: 0, chipBalance: 0, pointBalance: 0,
            prizeCount: 0,
            createdAt: new Date().toISOString(),
          };
          next.push(c);
          added++;
        }
      }
      return next;
    });
    setImportResult({ added, updated, skipped });
    setImportRows(null);
  }

  function closeImportModal() {
    setImportRows(null);
    setImportHeaders([]);
    setImportMapping([]);
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="顧客"
        sub={`${customers.length}名`}
        action={
          <>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={onPickFile} />
            <Btn onClick={() => fileInputRef.current?.click()}><FileUp size={14} /> CSV取込</Btn>
            <Btn onClick={exportCsv}><FileDown size={14} /> CSV出力</Btn>
            <Btn onClick={() => {
              const body = kpisHtml([
                { label: "登録顧客", value: `${customers.length}名` },
                { label: "VIP", value: `${customers.filter(c => c.rank === "vip").length}名` },
                { label: "GOLD", value: `${customers.filter(c => c.rank === "gold").length}名` },
                { label: "出力日", value: new Date().toLocaleDateString("ja-JP") },
              ]) + tableHtml(
                ["ポーカーネーム", "本名", "ランク", "電話", "誓約書番号", "来店", "累計利用", "最終来店"],
                rows.map(c => [c.nickname || "—", c.name, RANK_LABEL[c.rank], c.phone || "—", c.pledgeNo || "未記載", String(c.totalVisits), `¥${c.totalSpent.toLocaleString()}`, c.lastVisit ?? "—"]),
                { numCols: [5, 6] },
              );
              printDoc({ title: "顧客リスト", body, storeName: "てんぽみえるくん", landscape: true });
            }}><FileDown size={14}/> PDF</Btn>
            <Btn variant="primary"><Link href="/v2/customers/new"><Plus size={14} /> 登録</Link></Btn>
          </>
        }
      />

      {importResult && (
        <Banner variant="info">
          CSV取込結果: <strong>{importResult.added}件追加</strong> / <strong>{importResult.updated}件更新</strong> / <strong>{importResult.skipped}件スキップ</strong>
          <Btn variant="ghost" size="xs" onClick={() => setImportResult(null)} style={{ marginLeft: "auto" }}>閉じる</Btn>
        </Banner>
      )}

      <Kpis>
        <Kpi label="登録顧客" value={customers.length} />
        <Kpi label="VIP" value={customers.filter(c => c.rank === "vip").length} />
        <Kpi label="GOLD" value={customers.filter(c => c.rank === "gold").length} />
        <Kpi label="今月来店" value={customers.filter(c => (c.lastVisit ?? "") >= monthPrefix).length} />
      </Kpis>

      <div className="v2-toolbar">
        <div className="v2-toolbar__search">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・ポーカーネーム・電話・誓約書番号" style={{ paddingLeft: 30 }} />
        </div>
        <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>{rows.length}件</span>
      </div>

      <div className="v2-panel">
        <div className="v2-table-wrap">
          <table className="v2-table v2-table-clickable">
            <thead>
              <tr>
                <th>名前</th>
                <th>ランク</th>
                <th>電話</th>
                <th className="v2-num-cell">来店</th>
                <th className="v2-num-cell">累計利用</th>
                <th className="v2-num-cell">チップ</th>
                <th className="v2-num-cell">ポイント</th>
                <th>最終来店</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={8}><Empty>該当する顧客がいません</Empty></td></tr>
              ) : rows.map(c => (
                <tr key={c.id} onClick={() => router.push(`/v2/customers/${c.id}`)}>
                  <td style={{ maxWidth: 220 }}>
                    <div className="v2-row" style={{ gap: 6, alignItems: "center" }}>
                      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }} title={c.nickname || c.name}>{c.nickname || c.name}</span>
                      {!c.pledgeNo && <Chip variant="warn">誓約書未</Chip>}
                    </div>
                    {c.nickname && <div className="v2-mute" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.name}>{c.name}</div>}
                  </td>
                  <td>{c.rank === "regular" ? <span className="v2-mute" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>{RANK_LABEL[c.rank]}</span> : <RankBadge rank={c.rank} />}</td>
                  <td className="v2-sub">{c.phone || "—"}</td>
                  <td className="v2-num-cell">{c.totalVisits}</td>
                  <td className="v2-num-cell">¥{c.totalSpent.toLocaleString()}</td>
                  <td className="v2-num-cell">{c.chipBalance.toLocaleString()}</td>
                  <td className="v2-num-cell">{c.pointBalance.toLocaleString()}</td>
                  <td className="v2-sub">{c.lastVisit ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!importRows}
        onClose={closeImportModal}
        title="CSV取込プレビュー"
        size="lg"
        footer={
          <>
            <Btn onClick={closeImportModal}>キャンセル</Btn>
            <Btn variant="primary" onClick={runImport} disabled={!importMapping.includes("name")}>この内容で取込む</Btn>
          </>
        }
      >
        {importRows && (
          <VStack gap={16}>
            <div className="v2-mute" style={{ fontSize: 12 }}>
              各列がどの項目に対応するかを選択してください。名前が空の行はスキップされます。
            </div>

            <div className="v2-table-wrap">
              <table className="v2-table">
                <thead>
                  <tr>
                    {importHeaders.map((h, i) => (
                      <th key={i}>
                        <div style={{ marginBottom: 4 }}>{h || `列${i + 1}`}</div>
                        <select
                          value={importMapping[i]}
                          onChange={(e) => {
                            const v = e.target.value as ImportField;
                            setImportMapping(prev => prev.map((m, idx) => idx === i ? v : m));
                          }}
                        >
                          {IMPORT_FIELD_KEYS.map(k => <option key={k} value={k}>{IMPORT_FIELD_LABEL[k]}</option>)}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(0, 3).map((row, ri) => (
                    <tr key={ri}>
                      {importHeaders.map((_, ci) => <td key={ci} className="v2-sub">{row[ci] ?? ""}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="v2-mute" style={{ fontSize: 11 }}>先頭3行のプレビュー(全{importRows.length}行を取込みます)</div>

            {!importMapping.includes("name") && (
              <Banner variant="danger">「名前」に対応する列を選択してください。</Banner>
            )}

            <Field label="電話番号が既存顧客と一致する行の扱い">
              <div className="v2-form-grid">
                <Btn variant={duplicateAction === "update" ? "primary" : undefined} onClick={() => setDuplicateAction("update")}>既存顧客を更新</Btn>
                <Btn variant={duplicateAction === "skip" ? "primary" : undefined} onClick={() => setDuplicateAction("skip")}>スキップ</Btn>
              </div>
            </Field>
          </VStack>
        )}
      </Modal>
    </VStack>
  );
}
