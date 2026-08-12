// =====================================================================
// DB行(snake_case, uuid) ↔ アプリ型(camelCase) の相互変換。
// Supabase移行 Phase1 (stores / customers / visits) 用。
// =====================================================================

import type { CustomerRecord, CustomerRank } from "@/lib/store/domain-stores";

// ------------------------------------------------------------------
// 日付変換
//   DB: date型は "YYYY-MM-DD"。app側の lastVisit/lastPrize は "YYYY/MM/DD"。
//   dateOfBirth は app側も <input type="date"> 由来の "YYYY-MM-DD" なので無変換。
// ------------------------------------------------------------------
export function dbDateToSlash(d: string | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.replaceAll("-", "/");
}
export function slashDateToDb(d: string | null | undefined): string | null {
  if (!d) return null;
  return d.replaceAll("/", "-");
}

// ------------------------------------------------------------------
// customers
// ------------------------------------------------------------------
export interface DbCustomerRow {
  id: string;
  store_id: string;
  legacy_id: string | null;
  name: string;
  nickname: string;
  rank: CustomerRank;
  phone: string | null;
  pledge_no: string | null;
  email: string | null;
  date_of_birth: string | null;
  referrer_name: string | null;
  notes: string | null;
  caution_text: string | null;
  is_blacklisted: boolean;
  is_hidden: boolean;
  first_visit_checked: { ageVerified: boolean; pledgeSigned: boolean; rulesExplained: boolean; checkedAt?: string } | null;
  sns_x: string | null;
  sns_ig: string | null;
  sns_tiktok: string | null;
  total_visits: number;
  total_spent: number;
  chip_balance: number;
  point_balance: number;
  multike_balance: number | null;
  last_visit: string | null;
  prize_count: number;
  last_prize: string | null;
  created_at: string;
  updated_at: string;
}

export function dbCustomerToApp(row: DbCustomerRow): CustomerRecord {
  return {
    id: row.id,
    name: row.name,
    nickname: row.nickname,
    rank: row.rank,
    phone: row.phone ?? "",
    pledgeNo: row.pledge_no ?? undefined,
    email: row.email ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
    // lineId: customer_line_accounts へ分離のため今回はマップ対象外
    referrerName: row.referrer_name ?? undefined,
    notes: row.notes ?? undefined,
    cautionText: row.caution_text ?? undefined,
    isBlacklisted: row.is_blacklisted ?? undefined,
    isHidden: row.is_hidden ?? undefined,
    firstVisitChecked: row.first_visit_checked ?? undefined,
    snsX: row.sns_x ?? undefined,
    snsIg: row.sns_ig ?? undefined,
    snsTikTok: row.sns_tiktok ?? undefined,
    totalVisits: row.total_visits ?? 0,
    totalSpent: row.total_spent ?? 0,
    chipBalance: row.chip_balance ?? 0,
    pointBalance: row.point_balance ?? 0,
    multikeBalance: row.multike_balance ?? undefined,
    lastVisit: dbDateToSlash(row.last_visit),
    prizeCount: row.prize_count ?? 0,
    lastPrize: dbDateToSlash(row.last_prize),
    createdAt: row.created_at,
  };
}

/** customers insert用ペイロード。store_idは呼び出し側(repo)で付与。 */
export type CustomerInsertInput = Partial<CustomerRecord> & Pick<CustomerRecord, "name">;

export function appCustomerToDbInsert(input: CustomerInsertInput, storeId: string) {
  return {
    store_id: storeId,
    name: input.name,
    nickname: input.nickname ?? "",
    rank: input.rank ?? "regular",
    phone: input.phone ?? "",
    pledge_no: input.pledgeNo ?? null,
    email: input.email ?? null,
    date_of_birth: input.dateOfBirth ?? null,
    referrer_name: input.referrerName ?? null,
    notes: input.notes ?? null,
    caution_text: input.cautionText ?? null,
    is_blacklisted: input.isBlacklisted ?? false,
    is_hidden: input.isHidden ?? false,
    first_visit_checked: input.firstVisitChecked ?? null,
    sns_x: input.snsX ?? null,
    sns_ig: input.snsIg ?? null,
    sns_tiktok: input.snsTikTok ?? null,
    total_visits: input.totalVisits ?? 0,
    total_spent: input.totalSpent ?? 0,
    chip_balance: input.chipBalance ?? 0,
    point_balance: input.pointBalance ?? 0,
    multike_balance: input.multikeBalance ?? 0,
    last_visit: slashDateToDb(input.lastVisit),
    prize_count: input.prizeCount ?? 0,
    last_prize: slashDateToDb(input.lastPrize),
  };
}

/** customers update用ペイロード。渡されたキーのみ更新(部分更新)。 */
export function appCustomerToDbUpdate(patch: Partial<CustomerRecord>) {
  const out: Record<string, unknown> = {};
  if ("name" in patch) out.name = patch.name;
  if ("nickname" in patch) out.nickname = patch.nickname;
  if ("rank" in patch) out.rank = patch.rank;
  if ("phone" in patch) out.phone = patch.phone;
  if ("pledgeNo" in patch) out.pledge_no = patch.pledgeNo ?? null;
  if ("email" in patch) out.email = patch.email ?? null;
  if ("dateOfBirth" in patch) out.date_of_birth = patch.dateOfBirth ?? null;
  if ("referrerName" in patch) out.referrer_name = patch.referrerName ?? null;
  if ("notes" in patch) out.notes = patch.notes ?? null;
  if ("cautionText" in patch) out.caution_text = patch.cautionText ?? null;
  if ("isBlacklisted" in patch) out.is_blacklisted = patch.isBlacklisted ?? false;
  if ("isHidden" in patch) out.is_hidden = patch.isHidden ?? false;
  if ("firstVisitChecked" in patch) out.first_visit_checked = patch.firstVisitChecked ?? null;
  if ("snsX" in patch) out.sns_x = patch.snsX ?? null;
  if ("snsIg" in patch) out.sns_ig = patch.snsIg ?? null;
  if ("snsTikTok" in patch) out.sns_tiktok = patch.snsTikTok ?? null;
  if ("totalVisits" in patch) out.total_visits = patch.totalVisits;
  if ("totalSpent" in patch) out.total_spent = patch.totalSpent;
  if ("chipBalance" in patch) out.chip_balance = patch.chipBalance;
  if ("pointBalance" in patch) out.point_balance = patch.pointBalance;
  if ("multikeBalance" in patch) out.multike_balance = patch.multikeBalance ?? 0;
  if ("lastVisit" in patch) out.last_visit = slashDateToDb(patch.lastVisit);
  if ("prizeCount" in patch) out.prize_count = patch.prizeCount;
  if ("lastPrize" in patch) out.last_prize = slashDateToDb(patch.lastPrize);
  return out;
}

// ------------------------------------------------------------------
// visits
// ------------------------------------------------------------------
export interface DbVisitRow {
  id: string;
  store_id: string;
  customer_id: string | null;
  legacy_id: string | null;
  guest_name: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  status: "in_store" | "left";
  table_id: string | null;
  seat_index: number | null;
  entrance_fee: number | null;
  entrance_fee_status: string | null;
  source: string;
  note: string | null;
  spent: number;
  created_at: string;
  updated_at: string;
  // 来店中一覧の取得時に customers を埋め込みselectして name/rank を導出する
  customer?: { name: string; nickname: string; rank: CustomerRank } | null;
}

/** アプリ側 Visit型 (checkin/page.tsx 等のローカル定義に合わせる) */
export interface AppVisit {
  id: string;
  customerId: string | null;
  name: string;
  rank: CustomerRank;
  checkedInAt: string;
  tableId?: string;
  seatIndex?: number;
}

export function dbVisitToApp(row: DbVisitRow): AppVisit {
  const cust = row.customer ?? null;
  return {
    id: row.id,
    customerId: row.customer_id,
    name: cust ? (cust.nickname || cust.name) : (row.guest_name ?? ""),
    // ゲスト(customer未紐付け)の場合、DBにrank保持列がないため regular 表示にフォールバックする。
    rank: cust ? cust.rank : "regular",
    checkedInAt: row.checked_in_at,
    tableId: row.table_id ?? undefined,
    seatIndex: row.seat_index ?? undefined,
  };
}

/** 顧客詳細の来店履歴表示用エントリ */
export interface VisitHistoryEntry {
  id: string;
  checkedInAt: string;
  checkedOutAt?: string;
  status: "in_store" | "left";
}

export function dbVisitToHistory(row: DbVisitRow): VisitHistoryEntry {
  return {
    id: row.id,
    checkedInAt: row.checked_in_at,
    checkedOutAt: row.checked_out_at ?? undefined,
    status: row.status,
  };
}
