"use client";

import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, Field, VStack, HStack, Chip, Empty, FilterChips, SectionLabel } from "@/components/v2/ui";
import { Pin, Pencil, Trash2, Check, Search, X } from "lucide-react";

// ===== 型定義 =====
type HandoverCategory = "業務連絡" | "顧客対応" | "設備" | "その他";
const CATEGORIES: HandoverCategory[] = ["業務連絡", "顧客対応", "設備", "その他"];

interface AckEntry {
  staffId: string;
  staffName: string;
  ackAt: string; // ISO
}

interface HandoverEntry {
  id: string;
  body: string;
  authorName: string;
  important: boolean;
  category: HandoverCategory;
  createdAt: string; // ISO
  updatedAt?: string; // ISO (編集時)
  acks: AckEntry[];
}

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24時間以内のみ編集・削除可

function canEdit(entry: HandoverEntry): boolean {
  return Date.now() - new Date(entry.createdAt).getTime() < EDIT_WINDOW_MS;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const dateStr = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  if (sameDay(d, today)) return `本日 (${dateStr})`;
  if (sameDay(d, y)) return `昨日 (${dateStr})`;
  return `${dateStr}(${weekday})`;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeHM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const EMPTY_FORM = { body: "", authorName: "", important: false, category: "業務連絡" as HandoverCategory };

export default function HandoverPage() {
  const [staff] = usePersisted(staffStore);
  const activeStaff = useMemo(() => staff.filter((s) => s.status === "active"), [staff]);

  const [entries, setEntries] = usePersistedState<HandoverEntry[]>("v2_handover_v1", []);

  // ===== 投稿フォーム =====
  const [form, setForm] = useState(EMPTY_FORM);
  const [authorMode, setAuthorMode] = useState<"select" | "manual">("select");

  // ===== 編集状態 =====
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  // ===== 検索・フィルタ =====
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<HandoverCategory | "all">("all");

  // ===== 確認者選択 (各カードごとに選択中の従業員) =====
  const [ackSelect, setAckSelect] = useState<Record<string, string>>({});

  function post() {
    const body = form.body.trim();
    const authorName = form.authorName.trim();
    if (!body || !authorName) return;
    const entry: HandoverEntry = {
      id: `ho${Date.now()}`,
      body,
      authorName,
      important: form.important,
      category: form.category,
      createdAt: new Date().toISOString(),
      acks: [],
    };
    setEntries((prev) => [entry, ...prev]);
    setForm(EMPTY_FORM);
  }

  function startEdit(entry: HandoverEntry) {
    setEditingId(entry.id);
    setEditBody(entry.body);
  }
  function saveEdit(id: string) {
    const body = editBody.trim();
    if (!body) return;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, body, updatedAt: new Date().toISOString() } : e)));
    setEditingId(null);
    setEditBody("");
  }
  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
  }
  function remove(id: string) {
    if (!confirm("この申し送りを削除しますか？")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function ack(entryId: string) {
    const staffId = ackSelect[entryId];
    if (!staffId) return;
    const s = activeStaff.find((s) => s.id === staffId);
    if (!s) return;
    const name = staffFullName(s);
    setEntries((prev) =>
      prev.map((e) => {
        if (e.id !== entryId) return e;
        if (e.acks.some((a) => a.staffId === staffId)) return e;
        return { ...e, acks: [...e.acks, { staffId, staffName: name, ackAt: new Date().toISOString() }] };
      })
    );
    setAckSelect((prev) => ({ ...prev, [entryId]: "" }));
  }
  function unack(entryId: string, staffId: string) {
    setEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, acks: e.acks.filter((a) => a.staffId !== staffId) } : e))
    );
  }

  // ===== フィルタ済み一覧 =====
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (q && !e.body.toLowerCase().includes(q) && !e.authorName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, query, categoryFilter]);

  // ===== 日付グループ (新しい順) =====
  const groups = useMemo(() => {
    const map = new Map<string, HandoverEntry[]>();
    for (const e of filtered) {
      const key = dateKey(e.createdAt);
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return sortedKeys.map((key) => {
      const items = [...(map.get(key) ?? [])].sort((a, b) => {
        if (a.important !== b.important) return a.important ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      return { key, label: dateLabel(items[0].createdAt), items };
    });
  }, [filtered]);

  // ===== 未確認件数サマリ =====
  const unconfirmedCount = useMemo(() => {
    if (activeStaff.length === 0) return 0;
    return entries.filter((e) => activeStaff.some((s) => !e.acks.some((a) => a.staffId === s.id))).length;
  }, [entries, activeStaff]);

  return (
    <VStack gap={16}>
      <PageHeader title="業務引き継ぎ" sub="スタッフ間の申し送り事項を共有・確認します" />

      <Panel>
        <HStack gap={10}>
          {unconfirmedCount > 0 ? (
            <Chip variant="warn">未確認の申し送り {unconfirmedCount}件</Chip>
          ) : (
            <Chip variant="success">すべて確認済み</Chip>
          )}
          <span className="v2-mute" style={{ fontSize: 12 }}>
            在籍スタッフ {activeStaff.length}名を基準に判定
          </span>
        </HStack>
      </Panel>

      <Panel title="申し送りを投稿">
        <VStack gap={12}>
          <Field label="本文" required>
            <textarea
              rows={3}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="例: 3卓のディーラーコールが遅れがちなので巡回頻度を上げてください"
            />
          </Field>
          <HStack gap={12} style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
            <Field label="記入者" required>
              <HStack gap={6}>
                {authorMode === "select" ? (
                  <select
                    value={form.authorName}
                    onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                    style={{ minWidth: 160 }}
                  >
                    <option value="">選択してください</option>
                    {activeStaff.map((s) => (
                      <option key={s.id} value={staffFullName(s)}>{staffFullName(s)}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={form.authorName}
                    onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                    placeholder="記入者名を入力"
                    style={{ minWidth: 160 }}
                  />
                )}
                <Btn
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setAuthorMode((m) => (m === "select" ? "manual" : "select"));
                    setForm((f) => ({ ...f, authorName: "" }));
                  }}
                >
                  {authorMode === "select" ? "手入力に切替" : "選択に戻す"}
                </Btn>
              </HStack>
            </Field>
            <Field label="カテゴリ">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as HandoverCategory }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, paddingBottom: 8 }}>
              <input
                type="checkbox"
                checked={form.important}
                onChange={(e) => setForm((f) => ({ ...f, important: e.target.checked }))}
              />
              重要 (ピン留め)
            </label>
            <Btn variant="primary" onClick={post} disabled={!form.body.trim() || !form.authorName.trim()}>
              投稿する
            </Btn>
          </HStack>
        </VStack>
      </Panel>

      <div className="v2-toolbar">
        <div className="v2-toolbar__search">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="本文・記入者で検索" style={{ paddingLeft: 30 }} />
        </div>
        <FilterChips
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as HandoverCategory | "all")}
          items={[{ value: "all", label: "全て" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
        />
        <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>{filtered.length}件</span>
      </div>

      {groups.length === 0 ? (
        <Panel><Empty>該当する申し送りはありません</Empty></Panel>
      ) : (
        <VStack gap={20}>
          {groups.map((g) => (
            <div key={g.key}>
              <SectionLabel>{g.label}</SectionLabel>
              <VStack gap={10}>
                {g.items.map((entry) => {
                  const allAcked = activeStaff.length > 0 && activeStaff.every((s) => entry.acks.some((a) => a.staffId === s.id));
                  const editable = canEdit(entry);
                  const unackedStaff = activeStaff.filter((s) => !entry.acks.some((a) => a.staffId === s.id));
                  return (
                    <Panel
                      key={entry.id}
                      title={
                        <HStack gap={8}>
                          {entry.important && <Pin size={14} style={{ color: "var(--v2-warn)" }} />}
                          <Chip>{entry.category}</Chip>
                          {entry.important && <Chip variant="warn">重要</Chip>}
                          {allAcked && <Chip variant="success">全員確認済み</Chip>}
                        </HStack>
                      }
                      action={
                        <HStack gap={6}>
                          <span className="v2-mute" style={{ fontSize: 12 }}>
                            {entry.authorName} ・ {timeHM(entry.createdAt)}
                            {entry.updatedAt && "（編集済）"}
                          </span>
                          {editable && editingId !== entry.id && (
                            <>
                              <Btn size="xs" variant="ghost" onClick={() => startEdit(entry)}><Pencil size={12} /></Btn>
                              <Btn size="xs" variant="danger" onClick={() => remove(entry.id)}><Trash2 size={12} /></Btn>
                            </>
                          )}
                        </HStack>
                      }
                    >
                      <VStack gap={10}>
                        {editingId === entry.id ? (
                          <VStack gap={8}>
                            <textarea rows={3} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                            <HStack gap={8}>
                              <Btn size="sm" variant="primary" onClick={() => saveEdit(entry.id)}>保存</Btn>
                              <Btn size="sm" onClick={cancelEdit}>キャンセル</Btn>
                            </HStack>
                          </VStack>
                        ) : (
                          <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>{entry.body}</div>
                        )}

                        {!editable && (
                          <div className="v2-mute" style={{ fontSize: 11 }}>
                            記入から24時間経過したため編集・削除はロックされています
                          </div>
                        )}

                        <div style={{ borderTop: "1px solid var(--v2-border)", paddingTop: 10 }}>
                          <HStack gap={8} style={{ flexWrap: "wrap", marginBottom: entry.acks.length > 0 ? 8 : 0 }}>
                            {entry.acks.map((a) => (
                              <Chip key={a.staffId} variant="success">
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <Check size={11} />
                                  {a.staffName} ({timeHM(a.ackAt)})
                                  <button
                                    onClick={() => unack(entry.id, a.staffId)}
                                    aria-label="確認を取り消す"
                                    style={{ border: 0, background: "transparent", cursor: "pointer", padding: 0, marginLeft: 2, lineHeight: 0, color: "inherit", display: "inline-flex" }}
                                    title="確認を取り消す"
                                  >
                                    <X size={11} />
                                  </button>
                                </span>
                              </Chip>
                            ))}
                          </HStack>
                          {unackedStaff.length > 0 ? (
                            <HStack gap={6}>
                              <select
                                value={ackSelect[entry.id] ?? ""}
                                onChange={(e) => setAckSelect((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                                style={{ minWidth: 140 }}
                              >
                                <option value="">確認者を選択</option>
                                {unackedStaff.map((s) => (
                                  <option key={s.id} value={s.id}>{staffFullName(s)}</option>
                                ))}
                              </select>
                              <Btn size="sm" onClick={() => ack(entry.id)} disabled={!ackSelect[entry.id]}>
                                確認済みにする
                              </Btn>
                            </HStack>
                          ) : (
                            activeStaff.length === 0 && (
                              <span className="v2-mute" style={{ fontSize: 12 }}>在籍スタッフが登録されていません</span>
                            )
                          )}
                        </div>
                      </VStack>
                    </Panel>
                  );
                })}
              </VStack>
            </div>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
