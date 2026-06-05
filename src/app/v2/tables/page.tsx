"use client";

import { useState } from "react";
import { usePersistedState } from "@/lib/persist/store";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Trash2 } from "lucide-react";

interface TableDef {
  id: string;
  name: string;
  type: "トナメ" | "リング" | "サイド" | "BJ" | "バカラ";
  maxSeats: number;
  occupied: string[]; // names per seat (or "" for empty)
  dealer?: string;
}

export default function TablesPage() {
  const [tables, setTables] = usePersistedState<TableDef[]>("v2_tables_v1", []);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<TableDef, "id" | "occupied">>({ name: "", type: "トナメ", maxSeats: 6, dealer: "" });

  function add() {
    if (!draft.name.trim()) return;
    setTables(prev => [...prev, { id: `t${Date.now()}`, ...draft, occupied: Array(draft.maxSeats).fill("") }]);
    setOpen(false);
    setDraft({ name: "", type: "トナメ", maxSeats: 6, dealer: "" });
  }
  function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    setTables(prev => prev.filter(t => t.id !== id));
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="卓"
        sub={`${tables.length}卓 (稼働 ${tables.filter(t => t.occupied.some(n => n)).length})`}
        action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> 卓を追加</Btn>}
      />

      {tables.length === 0 ? (
        <Panel><Empty>卓が登録されていません</Empty></Panel>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {tables.map(t => {
            const used = t.occupied.filter(n => n).length;
            return (
              <Panel
                key={t.id}
                title={<div className="v2-row" style={{ gap: 8 }}>{t.name} <Chip>{t.type}</Chip></div>}
                action={<Btn size="xs" variant="danger" onClick={() => remove(t.id)}><Trash2 size={11} /></Btn>}
              >
                <VStack gap={8}>
                  <div className="v2-mute" style={{ fontSize: 12 }}>
                    {used} / {t.maxSeats}席{t.dealer && ` · D: ${t.dealer}`}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 }}>
                    {t.occupied.map((name, i) => (
                      <div key={i} className="v2-row" style={{
                        gap: 6, padding: "6px 8px",
                        border: "1px solid var(--v2-border)", borderRadius: 3,
                        background: name ? "var(--v2-bg-alt)" : "var(--v2-bg)",
                        fontSize: 12,
                      }}>
                        <span className="v2-mute" style={{ width: 14 }}>{i + 1}</span>
                        <span className="v2-truncate" style={{ flex: 1 }}>{name || "—"}</span>
                      </div>
                    ))}
                  </div>
                </VStack>
              </Panel>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="卓を追加"
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={add}>追加</Btn></>}
      >
        <VStack gap={16}>
          <Field label="卓名" required><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="A-1 / テーブル1 など" /></Field>
          <Field label="種別">
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TableDef["type"] })}>
              <option>トナメ</option><option>リング</option><option>サイド</option><option>BJ</option><option>バカラ</option>
            </select>
          </Field>
          <Field label="席数"><input type="number" min={2} max={12} value={draft.maxSeats} onChange={(e) => setDraft({ ...draft, maxSeats: parseInt(e.target.value) || 6 })} /></Field>
          <Field label="ディーラー (任意)"><input value={draft.dealer ?? ""} onChange={(e) => setDraft({ ...draft, dealer: e.target.value })} /></Field>
        </VStack>
      </Modal>
    </VStack>
  );
}
