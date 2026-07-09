"use client";

import { createPersistedStore } from "@/lib/persist/store";
import { customerStore, pointRuleStore, type PointRuleRecord } from "@/lib/store/domain-stores";

// =================================================================
// ポイント付与ログ
// =================================================================
export type PointLogSource = "visit" | "spend";
export interface PointLogEntry {
  id: string;
  customerId: string;
  source: PointLogSource;
  points: number;
  ruleId: string;
  ruleName: string;
  note?: string;
  createdAt: string; // ISO
}
export const pointLogStore = createPersistedStore<PointLogEntry[]>("v2_point_log_v1", []);

function makeLogId() {
  return `pl${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** 全角数字・記号を半角に変換してから数値化する (UI入力の全角対応) */
export function toHalfWidthNumber(input: string): number {
  const halfWidth = input.replace(/[０-９．－]/g, (ch) => {
    if (ch === "．") return ".";
    if (ch === "－") return "-";
    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
  });
  const n = parseFloat(halfWidth);
  return Number.isFinite(n) ? n : 0;
}

/** 有効な「来店」ルール一覧 (優先度順) */
export function getActiveVisitRules(rules: PointRuleRecord[]): PointRuleRecord[] {
  return rules.filter(r => r.isActive && r.kind === "visit").sort((a, b) => b.priority - a.priority);
}

/** 有効な「利用額」ルール一覧 (優先度順) */
export function getActiveSpendRules(rules: PointRuleRecord[]): PointRuleRecord[] {
  return rules.filter(r => r.isActive && r.kind === "spend" && (r.spendUnit ?? 0) > 0).sort((a, b) => b.priority - a.priority);
}

/** 利用額から付与ポイントを計算 (円ごとに切り捨て) */
export function calcSpendPoints(rule: PointRuleRecord, amount: number): number {
  if (!rule.spendUnit || rule.spendUnit <= 0 || amount <= 0) return 0;
  return Math.floor(amount / rule.spendUnit) * rule.points;
}

function appendLog(entry: PointLogEntry) {
  pointLogStore.set(prev => [entry, ...prev]);
}

function addPointsToCustomer(customerId: string, points: number) {
  if (points === 0) return;
  customerStore.set(prev => prev.map(c => c.id === customerId ? { ...c, pointBalance: c.pointBalance + points } : c));
}

/**
 * 来店ポイントを付与する。
 * 有効な「来店」ルールをすべて合算して付与し、ルールごとにログを1件ずつ記録する。
 * 戻り値: 付与した合計pt (0の場合は有効ルールなし)
 */
export function grantVisitPoints(customerId: string, note?: string): number {
  const rules = getActiveVisitRules(pointRuleStore.get());
  if (rules.length === 0) return 0;
  let total = 0;
  const now = new Date().toISOString();
  rules.forEach(rule => {
    if (rule.points === 0) return;
    total += rule.points;
    appendLog({
      id: makeLogId(), customerId, source: "visit",
      points: rule.points, ruleId: rule.id, ruleName: rule.name,
      note, createdAt: now,
    });
  });
  addPointsToCustomer(customerId, total);
  return total;
}

/**
 * 購入(利用額)ポイントを付与する。
 * 有効な「利用額」ルールをすべて合算して付与し、ルールごとにログを1件ずつ記録する。
 * 戻り値: 付与した合計pt (0の場合は有効ルールなし、または金額不足)
 */
export function grantSpendPoints(customerId: string, amount: number, note?: string): number {
  if (amount <= 0) return 0;
  const rules = getActiveSpendRules(pointRuleStore.get());
  if (rules.length === 0) return 0;
  let total = 0;
  const now = new Date().toISOString();
  rules.forEach(rule => {
    const pts = calcSpendPoints(rule, amount);
    if (pts === 0) return;
    total += pts;
    appendLog({
      id: makeLogId(), customerId, source: "spend",
      points: pts, ruleId: rule.id, ruleName: rule.name,
      note, createdAt: now,
    });
  });
  addPointsToCustomer(customerId, total);
  return total;
}
