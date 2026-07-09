"use client";

import { useMemo, useState } from "react";
import { usePersistedState } from "@/lib/persist/store";
import { PageHeader, Btn, Panel, Field, Modal, Tabs, Empty, VStack, HStack, Chip } from "@/components/v2/ui";
import { Plus, Trash2, Pencil, Copy, Check, X, Upload } from "lucide-react";

// ============= 型定義 =============
type Medium = "X" | "オープンチャット" | "POP";
const MEDIA: Medium[] = ["X", "オープンチャット", "POP"];

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;
type Weekday = typeof WEEKDAYS[number];

interface SchedulePost {
  id: string;
  weekday: Weekday;
  medium: Medium;
  title: string;
  body: string;
}

interface TemplatePost {
  id: string;
  medium: Medium;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
}

interface StockImage {
  id: string;
  title: string;
  dataUrl: string;
  size: number;
  createdAt: string;
}

interface PostLog {
  key: string; // `${dateStr}_${scheduleId}`
  dateStr: string; // YYYY-MM-DD
  weekday: Weekday;
  medium: Medium;
  title: string;
  postedAt: string;
}

const MAX_IMAGE_BYTES = 300 * 1024; // 約300KB
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 約4MB (ブラウザ保存目安)

const JS_DAY_TO_WEEKDAY: Weekday[] = ["日", "月", "火", "水", "木", "金", "土"];

function todayWeekday(): Weekday {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()];
}
function todayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fillVars(body: string): string {
  const d = new Date();
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  const wd = todayWeekday();
  return body.replaceAll("{日付}", dateStr).replaceAll("{曜日}", wd);
}
function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}
function mediumChipVariant(m: Medium): "success" | "warn" | undefined {
  if (m === "X") return undefined;
  if (m === "オープンチャット") return "success";
  return "warn";
}

const INIT_SCHEDULE: SchedulePost[] = [];
const INIT_TEMPLATES: TemplatePost[] = [];
const INIT_IMAGES: StockImage[] = [];
const INIT_LOGS: PostLog[] = [];

const EMPTY_SCHEDULE_FORM: Omit<SchedulePost, "id"> = { weekday: "月", medium: "X", title: "", body: "" };
const EMPTY_TEMPLATE_FORM: Omit<TemplatePost, "id" | "createdAt"> = { medium: "X", title: "", body: "", tags: [] };

export default function SnsPage() {
  const [tab, setTab] = useState("schedule");

  const [schedule, setSchedule] = usePersistedState<SchedulePost[]>("v2_sns_schedule_v1", INIT_SCHEDULE);
  const [templates, setTemplates] = usePersistedState<TemplatePost[]>("v2_sns_templates_v1", INIT_TEMPLATES);
  const [images, setImages] = usePersistedState<StockImage[]>("v2_sns_images_v1", INIT_IMAGES);
  const [logs, setLogs] = usePersistedState<PostLog[]>("v2_sns_logs_v1", INIT_LOGS);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(prev => (prev === key ? null : prev)), 1800);
    }).catch(() => {
      alert("コピーに失敗しました");
    });
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="SNS運用管理"
        sub="X・LINEオープンチャット・店内POPの発信を一元管理します（半自動運用：テンプレをコピーして各媒体へ投稿してください）"
      />
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "schedule", label: "週間予定" },
          { value: "templates", label: "テンプレ集" },
          { value: "images", label: "画像ストック" },
          { value: "logs", label: "投稿記録" },
        ]}
      />

      {tab === "schedule" && (
        <ScheduleTab
          schedule={schedule} setSchedule={setSchedule}
          logs={logs} setLogs={setLogs}
          copiedKey={copiedKey} copyText={copyText}
        />
      )}
      {tab === "templates" && (
        <TemplatesTab
          templates={templates} setTemplates={setTemplates}
          copiedKey={copiedKey} copyText={copyText}
        />
      )}
      {tab === "images" && (
        <ImagesTab images={images} setImages={setImages} />
      )}
      {tab === "logs" && (
        <LogsTab logs={logs} />
      )}
    </VStack>
  );
}

// ============= タブ1: 週間予定 =============
function ScheduleTab({ schedule, setSchedule, logs, setLogs, copiedKey, copyText }: {
  schedule: SchedulePost[];
  setSchedule: (next: SchedulePost[] | ((prev: SchedulePost[]) => SchedulePost[])) => void;
  logs: PostLog[];
  setLogs: (next: PostLog[] | ((prev: PostLog[]) => PostLog[])) => void;
  copiedKey: string | null;
  copyText: (key: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [targetWeekday, setTargetWeekday] = useState<Weekday>("月");
  const [d, setD] = useState<Omit<SchedulePost, "id">>(EMPTY_SCHEDULE_FORM);

  const today = todayWeekday();
  const dateStr = todayDateStr();

  const byWeekday = useMemo(() => {
    const map = new Map<Weekday, SchedulePost[]>();
    for (const wd of WEEKDAYS) map.set(wd, []);
    for (const s of schedule) map.get(s.weekday)?.push(s);
    return map;
  }, [schedule]);

  const todayPosts = byWeekday.get(today) ?? [];
  const postedKeysToday = useMemo(() => new Set(logs.filter(l => l.dateStr === dateStr).map(l => l.key)), [logs, dateStr]);

  function openAdd(weekday: Weekday) {
    setEditingId(null);
    setTargetWeekday(weekday);
    setD({ ...EMPTY_SCHEDULE_FORM, weekday });
    setOpen(true);
  }
  function openEdit(s: SchedulePost) {
    setEditingId(s.id);
    setTargetWeekday(s.weekday);
    setD({ weekday: s.weekday, medium: s.medium, title: s.title, body: s.body });
    setOpen(true);
  }
  function save() {
    if (!d.title.trim() || !d.body.trim()) return;
    if (editingId) {
      setSchedule(prev => prev.map(s => s.id === editingId ? { ...s, ...d } : s));
    } else {
      setSchedule(prev => [...prev, { id: `sch${Date.now()}`, ...d }]);
    }
    setOpen(false);
    setEditingId(null);
    setD(EMPTY_SCHEDULE_FORM);
  }
  function remove(id: string) {
    if (confirm("削除しますか？")) setSchedule(prev => prev.filter(s => s.id !== id));
  }

  function markPosted(s: SchedulePost) {
    const key = `${dateStr}_${s.id}`;
    setLogs(prev => {
      if (prev.some(l => l.key === key)) return prev.filter(l => l.key !== key); // トグル解除
      return [{ key, dateStr, weekday: s.weekday, medium: s.medium, title: s.title, postedAt: new Date().toISOString() }, ...prev];
    });
  }

  return (
    <VStack gap={16}>
      {/* 今日の投稿 */}
      <Panel title={`今日の投稿（${today}曜日）`}>
        {todayPosts.length === 0 ? (
          <Empty>今日({today}曜日)の投稿予定はまだ登録されていません</Empty>
        ) : (
          <VStack gap={12}>
            {todayPosts.map(s => {
              const key = `${dateStr}_${s.id}`;
              const posted = postedKeysToday.has(key);
              const filled = fillVars(s.body);
              return (
                <div key={s.id} style={{ border: "1px solid var(--v2-border)", borderRadius: 12, padding: 16, background: posted ? "var(--v2-success-bg)" : "var(--v2-bg-alt)" }}>
                  <HStack gap={10} style={{ marginBottom: 8, flexWrap: "wrap" }}>
                    <Chip variant={mediumChipVariant(s.medium)}>{s.medium}</Chip>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</span>
                    {posted && <Chip variant="success"><Check size={11} /> 投稿済み</Chip>}
                  </HStack>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.7, color: "var(--v2-text)", background: "var(--v2-bg)", border: "1px solid var(--v2-border)", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                    {filled}
                  </div>
                  <HStack gap={8}>
                    <Btn variant="primary" onClick={() => copyText(`today_${key}`, filled)}>
                      {copiedKey === `today_${key}` ? <><Check size={14} /> コピーしました</> : <><Copy size={14} /> 本文をコピー</>}
                    </Btn>
                    <Btn variant={posted ? "default" : "ghost"} onClick={() => markPosted(s)}>
                      <Check size={14} /> {posted ? "投稿済み解除" : "投稿済みにする"}
                    </Btn>
                  </HStack>
                </div>
              );
            })}
          </VStack>
        )}
      </Panel>

      {/* 曜日別カード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {WEEKDAYS.map(wd => {
          const posts = byWeekday.get(wd) ?? [];
          const isToday = wd === today;
          return (
            <div key={wd} style={isToday ? { borderRadius: 12, boxShadow: "0 0 0 2px var(--v2-accent)" } : undefined}>
            <Panel
              title={<HStack gap={8}>{wd}曜日{isToday && <Chip variant="success">今日</Chip>}</HStack>}
              action={<Btn size="xs" onClick={() => openAdd(wd)}><Plus size={12} /> 追加</Btn>}
            >
              {posts.length === 0 ? (
                <div className="v2-mute" style={{ fontSize: 12.5, padding: "8px 0" }}>予定なし</div>
              ) : (
                <VStack gap={8}>
                  {posts.map(s => (
                    <div key={s.id} style={{ border: "1px solid var(--v2-border)", borderRadius: 8, padding: 10 }}>
                      <HStack gap={6} style={{ marginBottom: 4 }}>
                        <Chip variant={mediumChipVariant(s.medium)}>{s.medium}</Chip>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</span>
                      </HStack>
                      <div className="v2-mute" style={{ fontSize: 12, whiteSpace: "pre-wrap", marginBottom: 8, maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.body}
                      </div>
                      <HStack gap={6}>
                        <Btn size="xs" onClick={() => openEdit(s)}><Pencil size={11} /></Btn>
                        <Btn size="xs" variant="danger" onClick={() => remove(s.id)}><Trash2 size={11} /></Btn>
                      </HStack>
                    </div>
                  ))}
                </VStack>
              )}
            </Panel>
            </div>
          );
        })}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "投稿予定の編集" : `${targetWeekday}曜日の投稿予定を追加`}
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={save}>保存</Btn></>}
      >
        <VStack gap={12}>
          <Field label="曜日" required>
            <select value={d.weekday} onChange={(e) => setD({ ...d, weekday: e.target.value as Weekday })}>
              {WEEKDAYS.map(wd => <option key={wd} value={wd}>{wd}曜日</option>)}
            </select>
          </Field>
          <Field label="媒体" required>
            <select value={d.medium} onChange={(e) => setD({ ...d, medium: e.target.value as Medium })}>
              {MEDIA.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="タイトル" required><input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="例: 週末イベント告知" /></Field>
          <Field label="テンプレ本文" required hint="{日付} {曜日} はコピー時に当日の値に差し替わります">
            <textarea rows={6} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} placeholder={"例: 【{日付}(${曜日})限定】\n本日は..."} />
          </Field>
        </VStack>
      </Modal>
    </VStack>
  );
}

// ============= タブ2: テンプレ集 =============
function TemplatesTab({ templates, setTemplates, copiedKey, copyText }: {
  templates: TemplatePost[];
  setTemplates: (next: TemplatePost[] | ((prev: TemplatePost[]) => TemplatePost[])) => void;
  copiedKey: string | null;
  copyText: (key: string, text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [d, setD] = useState<Omit<TemplatePost, "id" | "createdAt">>(EMPTY_TEMPLATE_FORM);
  const [tagInput, setTagInput] = useState("");
  const [mediumFilter, setMediumFilter] = useState<Medium | "all">("all");

  const filtered = useMemo(
    () => mediumFilter === "all" ? templates : templates.filter(t => t.medium === mediumFilter),
    [templates, mediumFilter]
  );

  function openAdd() {
    setEditingId(null);
    setD(EMPTY_TEMPLATE_FORM);
    setTagInput("");
    setOpen(true);
  }
  function openEdit(t: TemplatePost) {
    setEditingId(t.id);
    setD({ medium: t.medium, title: t.title, body: t.body, tags: t.tags });
    setTagInput(t.tags.join(", "));
    setOpen(true);
  }
  function save() {
    if (!d.title.trim() || !d.body.trim()) return;
    const tags = tagInput.split(/[,、]/).map(t => t.trim()).filter(Boolean);
    const payload = { ...d, tags };
    if (editingId) {
      setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t));
    } else {
      setTemplates(prev => [{ id: `tpl${Date.now()}`, createdAt: new Date().toISOString(), ...payload }, ...prev]);
    }
    setOpen(false);
    setEditingId(null);
    setD(EMPTY_TEMPLATE_FORM);
    setTagInput("");
  }
  function remove(id: string) {
    if (confirm("削除しますか？")) setTemplates(prev => prev.filter(t => t.id !== id));
  }

  return (
    <VStack gap={16}>
      <Panel
        title="テンプレ一覧"
        action={
          <HStack gap={8}>
            <select value={mediumFilter} onChange={(e) => setMediumFilter(e.target.value as Medium | "all")} style={{ height: 30 }}>
              <option value="all">すべての媒体</option>
              {MEDIA.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <Btn variant="primary" onClick={openAdd}><Plus size={14} /> テンプレ追加</Btn>
          </HStack>
        }
      >
        {filtered.length === 0 ? <Empty>テンプレがありません</Empty> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {filtered.map(t => {
              const filled = fillVars(t.body);
              return (
                <div key={t.id} style={{ border: "1px solid var(--v2-border)", borderRadius: 10, padding: 14 }}>
                  <HStack gap={8} style={{ marginBottom: 6, flexWrap: "wrap" }}>
                    <Chip variant={mediumChipVariant(t.medium)}>{t.medium}</Chip>
                    <span style={{ fontWeight: 700 }}>{t.title}</span>
                  </HStack>
                  {t.tags.length > 0 && (
                    <HStack gap={6} style={{ marginBottom: 8, flexWrap: "wrap" }}>
                      {t.tags.map(tag => <Chip key={tag}>{tag}</Chip>)}
                    </HStack>
                  )}
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.6, color: "var(--v2-text-sub)", background: "var(--v2-bg-alt)", borderRadius: 8, padding: 10, marginBottom: 10, maxHeight: 120, overflow: "auto" }}>
                    {t.body}
                  </div>
                  <HStack gap={6}>
                    <Btn size="sm" variant="primary" onClick={() => copyText(`tpl_${t.id}`, filled)}>
                      {copiedKey === `tpl_${t.id}` ? <><Check size={13} /> コピーしました</> : <><Copy size={13} /> コピー</>}
                    </Btn>
                    <Btn size="sm" onClick={() => openEdit(t)}><Pencil size={12} /></Btn>
                    <Btn size="sm" variant="danger" onClick={() => remove(t.id)}><Trash2 size={12} /></Btn>
                  </HStack>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "テンプレ編集" : "テンプレ追加"}
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={save}>保存</Btn></>}
      >
        <VStack gap={12}>
          <Field label="媒体" required>
            <select value={d.medium} onChange={(e) => setD({ ...d, medium: e.target.value as Medium })}>
              {MEDIA.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="タイトル" required><input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
          <Field label="本文" required hint="{日付} {曜日} はコピー時に当日の値に差し替わります">
            <textarea rows={6} value={d.body} onChange={(e) => setD({ ...d, body: e.target.value })} />
          </Field>
          <Field label="タグ" hint="カンマ区切りで複数入力可（例: イベント告知, キャンペーン）">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="イベント告知, 日常, キャンペーン" />
          </Field>
        </VStack>
      </Modal>
    </VStack>
  );
}

// ============= タブ3: 画像ストック =============
function ImagesTab({ images, setImages }: {
  images: StockImage[];
  setImages: (next: StockImage[] | ((prev: StockImage[]) => StockImage[])) => void;
}) {
  const [preview, setPreview] = useState<StockImage | null>(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  const totalBytes = useMemo(() => images.reduce((sum, img) => sum + img.size, 0), [images]);

  function handleFile(file: File) {
    if (file.size > MAX_IMAGE_BYTES) {
      alert(`画像サイズが大きすぎます（${formatBytes(file.size)}）。1枚あたり約300KBまでにできるよう圧縮してから再度アップロードしてください。`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const title = pendingTitle.trim() || file.name.replace(/\.[^.]+$/, "");
      setImages(prev => [{ id: `img${Date.now()}`, title, dataUrl, size: file.size, createdAt: new Date().toISOString() }, ...prev]);
      setPendingTitle("");
      setUploading(false);
    };
    reader.onerror = () => {
      alert("画像の読み込みに失敗しました");
      setUploading(false);
    };
    setUploading(true);
    reader.readAsDataURL(file);
  }

  function remove(id: string) {
    if (confirm("この画像を削除しますか？")) setImages(prev => prev.filter(img => img.id !== id));
  }

  return (
    <VStack gap={16}>
      <Panel title="画像アップロード">
        <VStack gap={12}>
          <Field label="タイトル（任意・未入力時はファイル名）">
            <input value={pendingTitle} onChange={(e) => setPendingTitle(e.target.value)} placeholder="例: 週末イベントPOP" />
          </Field>
          <div>
            <label className="v2-btn v2-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Upload size={14} /> {uploading ? "読み込み中..." : "画像を選択"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div style={{ fontSize: 12, color: "var(--v2-text-mute)", lineHeight: 1.7 }}>
            画像はブラウザ内(localStorage)に保存されるため、合計で約4MBまでを目安にしてください。1枚あたり約300KBを超える場合は圧縮してからアップロードしてください。<br />
            現在の合計サイズ: <strong style={{ color: totalBytes > MAX_TOTAL_BYTES * 0.8 ? "var(--v2-danger)" : "var(--v2-text-sub)" }}>{formatBytes(totalBytes)}</strong> / 目安 {formatBytes(MAX_TOTAL_BYTES)}（{images.length}枚）
          </div>
        </VStack>
      </Panel>

      <Panel title="画像一覧">
        {images.length === 0 ? <Empty>画像がありません</Empty> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {images.map(img => (
              <div key={img.id} style={{ border: "1px solid var(--v2-border)", borderRadius: 10, overflow: "hidden" }}>
                <button
                  onClick={() => setPreview(img)}
                  style={{ display: "block", width: "100%", height: 120, padding: 0, border: 0, background: "var(--v2-bg-alt)", cursor: "pointer" }}
                  aria-label={`${img.title}を拡大表示`}
                >
                  <img src={img.dataUrl} alt={img.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={img.title}>{img.title}</div>
                  <div className="v2-mute" style={{ fontSize: 11, marginBottom: 6 }}>{formatBytes(img.size)}</div>
                  <Btn size="xs" variant="danger" onClick={() => remove(img.id)}><Trash2 size={11} /> 削除</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {preview && (
        <div className="v2-overlay" onClick={() => setPreview(null)}>
          <div style={{ maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
            <HStack gap={8} style={{ alignSelf: "flex-end" }}>
              <Btn size="sm" onClick={() => setPreview(null)}><X size={14} /> 閉じる</Btn>
            </HStack>
            <img src={preview.dataUrl} alt={preview.title} style={{ maxWidth: "100%", maxHeight: "75vh", borderRadius: 8, objectFit: "contain" }} />
            <div style={{ color: "#fff", fontSize: 13 }}>{preview.title}（{formatBytes(preview.size)}）</div>
          </div>
        </div>
      )}
    </VStack>
  );
}

// ============= タブ4: 投稿記録 =============
function LogsTab({ logs }: { logs: PostLog[] }) {
  const sorted = useMemo(() => [...logs].sort((a, b) => b.postedAt.localeCompare(a.postedAt)), [logs]);

  const summary = useMemo(() => {
    const counts = new Map<Weekday, number>();
    for (const wd of WEEKDAYS) counts.set(wd, 0);
    for (const l of logs) counts.set(l.weekday, (counts.get(l.weekday) ?? 0) + 1);
    return counts;
  }, [logs]);

  return (
    <VStack gap={16}>
      <Panel title="曜日別 投稿実績サマリ">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: 10 }}>
          {WEEKDAYS.map(wd => (
            <div key={wd} style={{ border: "1px solid var(--v2-border)", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
              <div className="v2-mute" style={{ fontSize: 11 }}>{wd}曜日</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--v2-num)" }}>{summary.get(wd) ?? 0}</div>
              <div className="v2-mute" style={{ fontSize: 10.5 }}>件</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={`投稿履歴（${sorted.length}件）`}>
        {sorted.length === 0 ? <Empty>投稿記録がありません</Empty> : (
          <table className="v2-table">
            <thead>
              <tr><th>日付</th><th>曜日</th><th>媒体</th><th>タイトル</th></tr>
            </thead>
            <tbody>
              {sorted.map(l => (
                <tr key={l.key}>
                  <td>{l.dateStr}</td>
                  <td>{l.weekday}曜日</td>
                  <td><Chip variant={mediumChipVariant(l.medium)}>{l.medium}</Chip></td>
                  <td>{l.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
