"use client";

import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { customerStore, staffStore } from "@/lib/store/domain-stores";
import { staffFullName } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Pencil, Search, Ban, Eye, EyeOff } from "lucide-react";

// ===== 卓データ (v2_tables_v2 は tables ページが管理する生ストア。ここでは id/name のみ参照) =====
interface TableRef { id: string; name: string }

// ===== 型定義 =====
type IncidentKind = "クレーム" | "トラブル" | "備品破損" | "事故" | "その他";
const KIND_OPTIONS: IncidentKind[] = ["クレーム", "トラブル", "備品破損", "事故", "その他"];

type IncidentSeverity = "低" | "中" | "高";
const SEVERITY_OPTIONS: IncidentSeverity[] = ["低", "中", "高"];
const SEVERITY_VARIANT: Record<IncidentSeverity, "danger" | "warn" | undefined> = {
  "高": "danger", "中": "warn", "低": undefined,
};

type IncidentStatus = "対応中" | "解決済み";

interface IncidentRecord {
  id: string;
  occurredAt: string; // datetime-local 文字列
  kind: IncidentKind;
  severity: IncidentSeverity;
  customerId?: string;
  customerName?: string; // 記録時点のポーカーネームを保持(顧客が後で変更/削除されても表示できるように)
  tableId?: string;
  tableName?: string;
  staffName: string; // 対応者 (選択 or 手入力)
  body: string; // 内容
  resultText: string; // 対応・結果
  status: IncidentStatus;
  voided: boolean; // 取消フラグ(誤登録用、削除の代わり)
  createdAt: string;
  updatedAt?: string;
}

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function displayDateTime(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = {
  occurredAt: toDateTimeLocal(new Date()),
  kind: "クレーム" as IncidentKind,
  severity: "中" as IncidentSeverity,
  customerId: "",
  tableId: "",
  staffId: "",
  staffName: "",
  body: "",
  resultText: "",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = usePersistedState<IncidentRecord[]>("v2_incidents_v1", []);
  const [customers, setCustomers] = usePersisted(customerStore);
  const [tables] = usePersistedState<TableRef[]>("v2_tables_v2", []);
  const [staff] = usePersisted(staffStore);
  const activeStaff = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IncidentRecord | null>(null);
  const [d, setD] = useState(emptyForm);
  const [staffMode, setStaffMode] = useState<"select" | "manual">(activeStaff.length > 0 ? "select" : "manual");
  const [noteToCustomer, setNoteToCustomer] = useState(false);

  // ===== 検索・フィルタ =====
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<IncidentKind | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [showVoided, setShowVoided] = useState(false);

  const sorted = useMemo(
    () => [...incidents].sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()),
    [incidents]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sorted.filter((i) => {
      if (!showVoided && i.voided) return false;
      if (kindFilter !== "all" && i.kind !== kindFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (q) {
        const hay = `${i.body} ${i.resultText} ${i.customerName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sorted, query, kindFilter, statusFilter, showVoided]);

  const openCount = useMemo(() => incidents.filter((i) => !i.voided && i.status === "対応中").length, [incidents]);

  function openCreate() {
    setD({ ...emptyForm, occurredAt: toDateTimeLocal(new Date()) });
    setStaffMode(activeStaff.length > 0 ? "select" : "manual");
    setNoteToCustomer(false);
    setEditing(null);
    setOpen(true);
  }

  function openEdit(i: IncidentRecord) {
    setD({
      occurredAt: i.occurredAt,
      kind: i.kind,
      severity: i.severity,
      customerId: i.customerId ?? "",
      tableId: i.tableId ?? "",
      staffId: "",
      staffName: i.staffName,
      body: i.body,
      resultText: i.resultText,
    });
    setStaffMode("manual");
    setNoteToCustomer(false);
    setEditing(i);
    setOpen(true);
  }

  function save() {
    if (!d.body.trim()) return;
    const staffName = staffMode === "select"
      ? (activeStaff.find((s) => s.id === d.staffId) ? staffFullName(activeStaff.find((s) => s.id === d.staffId)!) : "")
      : d.staffName.trim();
    if (!staffName) return;

    const customer = d.customerId ? customers.find((c) => c.id === d.customerId) : undefined;
    const table = d.tableId ? tables.find((t) => t.id === d.tableId) : undefined;

    if (editing) {
      setIncidents((prev) => prev.map((i) => i.id === editing.id ? {
        ...i,
        occurredAt: d.occurredAt,
        kind: d.kind,
        severity: d.severity,
        customerId: customer?.id,
        customerName: customer ? (customer.nickname || customer.name) : (d.customerId ? i.customerName : undefined),
        tableId: table?.id,
        tableName: table?.name,
        staffName,
        body: d.body,
        resultText: d.resultText,
        updatedAt: new Date().toISOString(),
      } : i));
    } else {
      const rec: IncidentRecord = {
        id: `inc${Date.now()}`,
        occurredAt: d.occurredAt,
        kind: d.kind,
        severity: d.severity,
        customerId: customer?.id,
        customerName: customer ? (customer.nickname || customer.name) : undefined,
        tableId: table?.id,
        tableName: table?.name,
        staffName,
        body: d.body,
        resultText: d.resultText,
        status: "対応中",
        voided: false,
        createdAt: new Date().toISOString(),
      };
      setIncidents((prev) => [rec, ...prev]);

      // 顧客の注意メモへの転記
      if (noteToCustomer && customer) {
        const dateLabel = displayDateTime(d.occurredAt);
        const addition = `[${dateLabel}] ${d.kind}: ${d.body}`;
        setCustomers((prev) => prev.map((c) => c.id === customer.id
          ? { ...c, cautionText: c.cautionText ? `${c.cautionText}\n${addition}` : addition }
          : c));
      }
    }
    setOpen(false);
    setEditing(null);
    setD(emptyForm);
  }

  function toggleStatus(id: string) {
    setIncidents((prev) => prev.map((i) => i.id === id
      ? { ...i, status: i.status === "対応中" ? "解決済み" : "対応中", updatedAt: new Date().toISOString() }
      : i));
  }

  function voidRecord(id: string) {
    if (!confirm("この記録を取消しますか？(誤登録の訂正用。監査性のため削除はできません)")) return;
    setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, voided: true, updatedAt: new Date().toISOString() } : i));
  }

  function unvoidRecord(id: string) {
    if (!confirm("取消を解除しますか？")) return;
    setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, voided: false, updatedAt: new Date().toISOString() } : i));
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="インシデント記録簿"
        sub={`${filtered.length}件表示 / 全${incidents.length}件・対応中 ${openCount}件`}
        action={<Btn variant="primary" onClick={openCreate}><Plus size={14} /> 記録を追加</Btn>}
      />

      <div className="v2-toolbar">
        <div className="v2-toolbar__search">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="内容・顧客名で検索"
            style={{ paddingLeft: 30 }}
          />
        </div>
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as IncidentKind | "all")}>
          <option value="all">種別: すべて</option>
          {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | "all")}>
          <option value="all">状態: すべて</option>
          <option value="対応中">対応中</option>
          <option value="解決済み">解決済み</option>
        </select>
        <Btn variant="ghost" size="sm" onClick={() => setShowVoided((v) => !v)}>
          {showVoided ? <Eye size={13} /> : <EyeOff size={13} />} 取消済みを{showVoided ? "隠す" : "表示"}
        </Btn>
        <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>{filtered.length}件</span>
      </div>

      <Panel>
        {filtered.length === 0 ? <Empty>該当する記録がありません</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>発生日時</th><th>種別</th><th>深刻度</th><th>顧客</th><th>卓</th><th>対応者</th><th>内容</th><th>状態</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} style={i.voided ? { opacity: 0.5 } : undefined}>
                    <td className="v2-sub" style={{ whiteSpace: "nowrap" }}>{displayDateTime(i.occurredAt)}</td>
                    <td><Chip>{i.kind}</Chip></td>
                    <td><Chip variant={SEVERITY_VARIANT[i.severity]}>{i.severity}</Chip></td>
                    <td>{i.customerName ?? <span className="v2-mute">-</span>}</td>
                    <td>{i.tableName ?? <span className="v2-mute">-</span>}</td>
                    <td className="v2-sub">{i.staffName}</td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={i.voided ? { textDecoration: "line-through" } : undefined}>{i.body}</div>
                      {i.resultText && <div className="v2-mute" style={{ fontSize: 11, marginTop: 2 }}>対応: {i.resultText}</div>}
                      {i.voided && <div style={{ fontSize: 11, color: "var(--v2-danger)", marginTop: 2 }}>取消済み</div>}
                    </td>
                    <td>
                      {i.voided ? (
                        <span className="v2-mute" style={{ fontSize: 12 }}>-</span>
                      ) : (
                        <Btn variant="ghost" size="xs" onClick={() => toggleStatus(i.id)} style={{ padding: 0 }}>
                          <Chip variant={i.status === "対応中" ? "warn" : "success"}>{i.status}</Chip>
                        </Btn>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <Btn size="xs" onClick={() => openEdit(i)}><Pencil size={11} /></Btn>{" "}
                      {i.voided ? (
                        <Btn size="xs" onClick={() => unvoidRecord(i.id)}>取消解除</Btn>
                      ) : (
                        <Btn size="xs" variant="danger" onClick={() => voidRecord(i.id)}><Ban size={11} /> 取消</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? "記録の編集" : "インシデント記録"}
        footer={<><Btn onClick={() => { setOpen(false); setEditing(null); }}>キャンセル</Btn><Btn variant="primary" onClick={save}>{editing ? "保存" : "登録"}</Btn></>}
      >
        <VStack gap={16}>
          <div className="v2-form-grid">
            <Field label="発生日時" required>
              <input type="datetime-local" value={d.occurredAt} onChange={(e) => setD({ ...d, occurredAt: e.target.value })} />
            </Field>
            <Field label="種別" required>
              <select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as IncidentKind })}>
                {KIND_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="深刻度" required>
              <select value={d.severity} onChange={(e) => setD({ ...d, severity: e.target.value as IncidentSeverity })}>
                {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="関係卓">
              <select value={d.tableId} onChange={(e) => setD({ ...d, tableId: e.target.value })}>
                <option value="">(なし)</option>
                {tables.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>

          <Field label="関係顧客">
            <select value={d.customerId} onChange={(e) => setD({ ...d, customerId: e.target.value })}>
              <option value="">(なし)</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.nickname || c.name}</option>)}
            </select>
          </Field>

          {!editing && d.customerId && (
            <label className="v2-row" style={{ gap: 6 }}>
              <input type="checkbox" checked={noteToCustomer} onChange={(e) => setNoteToCustomer(e.target.checked)} style={{ width: 14, height: 14 }} />
              顧客の注意メモにも記録する
            </label>
          )}

          <Field label="対応者" required>
            <VStack gap={6}>
              <div className="v2-row" style={{ gap: 12 }}>
                <label className="v2-row" style={{ gap: 4 }}>
                  <input type="radio" checked={staffMode === "select"} onChange={() => setStaffMode("select")} disabled={activeStaff.length === 0} /> 在籍スタッフから選択
                </label>
                <label className="v2-row" style={{ gap: 4 }}>
                  <input type="radio" checked={staffMode === "manual"} onChange={() => setStaffMode("manual")} /> 手入力
                </label>
              </div>
              {staffMode === "select" ? (
                <select value={d.staffId} onChange={(e) => setD({ ...d, staffId: e.target.value })}>
                  <option value="">選択してください</option>
                  {activeStaff.map((s) => <option key={s.id} value={s.id}>{staffFullName(s)}</option>)}
                </select>
              ) : (
                <input value={d.staffName} onChange={(e) => setD({ ...d, staffName: e.target.value })} placeholder="対応者名を入力" />
              )}
            </VStack>
          </Field>

          <Field label="内容" required>
            <textarea rows={3} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} placeholder="発生した事象の詳細" />
          </Field>
          <Field label="対応・結果">
            <textarea rows={2} value={d.resultText} onChange={(e) => setD({ ...d, resultText: e.target.value })} placeholder="どう対応したか、結果はどうなったか" />
          </Field>
        </VStack>
      </Modal>
    </VStack>
  );
}
