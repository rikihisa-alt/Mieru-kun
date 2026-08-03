"use client";

import type { CustomerRank, CustomerRecord } from "@/lib/store/domain-stores";

// =================================================================
// 会員ランク自動判定 (昇格ルール)
// =================================================================

/** 条件の組み合わせ方: 両方満たす / どちらか満たす */
export type RankRuleCombinator = "and" | "or";

/** 1ランクぶんの昇格条件 */
export interface RankTierRule {
  isActive: boolean;
  minVisits: number;   // 来店回数のしきい値 (0以下は条件なし扱い)
  minSpent: number;     // 累計利用額のしきい値 (0以下は条件なし扱い)
  combinator: RankRuleCombinator; // 来店回数条件・累計利用額条件の組み合わせ方
}

/** silver / gold / vip 昇格ルール一式 (regularは初期ランクのため対象外) */
export interface RankRules {
  silver: RankTierRule;
  gold: RankTierRule;
  vip: RankTierRule;
}

export const RANK_RULES_KEY = "v2_rank_rules_v1";

const DEFAULT_TIER_RULE = (minVisits: number, minSpent: number): RankTierRule => ({
  isActive: true,
  minVisits,
  minSpent,
  combinator: "or",
});

export const DEFAULT_RANK_RULES: RankRules = {
  silver: DEFAULT_TIER_RULE(5, 30000),
  gold: DEFAULT_TIER_RULE(15, 100000),
  vip: DEFAULT_TIER_RULE(30, 300000),
};

/** ランクの序列 (低い→高い) */
export const RANK_ORDER: CustomerRank[] = ["regular", "silver", "gold", "vip"];

function rankIndex(rank: CustomerRank): number {
  const i = RANK_ORDER.indexOf(rank);
  return i === -1 ? 0 : i;
}

/** 個々のティア条件を満たすか判定 */
function meetsTier(customer: Pick<CustomerRecord, "totalVisits" | "totalSpent">, rule: RankTierRule): boolean {
  if (!rule.isActive) return false;
  const hasVisitCond = rule.minVisits > 0;
  const hasSpentCond = rule.minSpent > 0;
  if (!hasVisitCond && !hasSpentCond) return false; // 条件未設定は対象外
  const visitOk = hasVisitCond ? customer.totalVisits >= rule.minVisits : false;
  const spentOk = hasSpentCond ? customer.totalSpent >= rule.minSpent : false;
  if (hasVisitCond && hasSpentCond) {
    return rule.combinator === "and" ? (visitOk && spentOk) : (visitOk || spentOk);
  }
  return visitOk || spentOk;
}

/**
 * 顧客の来店回数・累計利用額から自動判定後のランクを算出する。
 * 上位ランクから条件を満たすか判定し、最初に満たした最上位ランクを返す。
 * 自動判定は「昇格のみ」がデフォルト(downgrade=falseの場合、現ランクより下がらない)。
 */
export function computeRank(
  customer: Pick<CustomerRecord, "rank" | "totalVisits" | "totalSpent">,
  rules: RankRules,
  opts?: { downgrade?: boolean }
): CustomerRank {
  const allowDowngrade = opts?.downgrade ?? false;

  let judged: CustomerRank = "regular";
  if (meetsTier(customer, rules.vip)) judged = "vip";
  else if (meetsTier(customer, rules.gold)) judged = "gold";
  else if (meetsTier(customer, rules.silver)) judged = "silver";

  if (allowDowngrade) return judged;

  // 昇格のみ: 判定結果が現ランクより下なら現ランクを維持
  return rankIndex(judged) > rankIndex(customer.rank) ? judged : customer.rank;
}
