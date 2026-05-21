// 従業員データのデモ用 共有定義
// freee人事労務レベルの項目を保持

export type StaffStatus = "active" | "leave" | "retired";
export type EmploymentType = "fulltime" | "contract" | "parttime" | "outsource";
export type Gender = "male" | "female" | "other" | "no_answer";
export type SalaryType = "monthly" | "hourly";

export interface EmergencyContact {
  name: string;
  relation: string; // 続柄
  phone: string;
  address?: string;
}

export interface BankAccount {
  bankName: string;
  branchName: string;
  accountType: "ordinary" | "checking";
  accountNumber: string;
  accountHolder: string;
}

export interface Insurance {
  health: boolean;     // 健康保険
  pension: boolean;    // 厚生年金
  employment: boolean; // 雇用保険
  workers: boolean;    // 労災保険
}

export interface ResidenceStatus {
  required: boolean;       // 外国籍か
  nationality?: string;
  status?: string;         // 在留資格
  expiresAt?: string;
  cardNumber?: string;
}

export interface License {
  id: string;
  name: string;
  acquiredAt?: string;
}

export interface StaffFull {
  id: string;
  employeeNo: string; // 社員番号
  // 基本情報
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  // 連絡先
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  // 雇用情報
  joinDate: string;
  employmentType: EmploymentType;
  department: string;
  role: string;
  workplace: string;
  trialEndDate?: string;
  status: StaffStatus;
  resignDate?: string;
  resignReason?: string;
  // 給与
  salaryType: SalaryType;
  baseSalary: number;       // 月給 or 0
  hourlyWage: number;        // 時給 or 0
  commuteAllowance: number;  // 通勤手当(月)
  otherAllowance: number;    // その他手当
  paymentMethod: "transfer" | "cash";
  bank?: BankAccount;
  // 社会保険・税
  myNumber: string;          // マイナンバー
  dependents: number;        // 扶養家族数
  spouseDependent: boolean;  // 配偶者の有無(扶養)
  insurance: Insurance;
  residentTax: "special" | "ordinary"; // 住民税徴収方法
  // 緊急連絡先
  emergencyContacts: EmergencyContact[];
  // 在留資格
  residence?: ResidenceStatus;
  // 資格・免許
  licenses: License[];
  // 備考
  notes: string;
}

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  fulltime: "正社員",
  contract: "契約社員",
  parttime: "パート/アルバイト",
  outsource: "業務委託",
};

export const GENDER_LABEL: Record<Gender, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
  no_answer: "回答しない",
};

export const STATUS_LABEL: Record<StaffStatus, string> = {
  active: "在籍",
  leave: "休職",
  retired: "退職",
};

export const STATUS_CHIP: Record<StaffStatus, string> = {
  active: "chip-success",
  leave: "chip-warning",
  retired: "chip-neutral",
};

export const ROLES = ["ディーラー", "フロア", "マネージャー", "キッチン"];
export const DEPARTMENTS = ["店舗運営", "管理", "キッチン"];

// 出荷状態: 空
export const DEMO_STAFF: StaffFull[] = [];

export function findStaff(id: string): StaffFull | undefined {
  return DEMO_STAFF.find(s => s.id === id);
}

// 名前を1つの文字列に
export function staffFullName(s: { lastName: string; firstName: string }): string {
  return `${s.lastName} ${s.firstName}`;
}
export function staffFullNameKana(s: { lastNameKana: string; firstNameKana: string }): string {
  return `${s.lastNameKana} ${s.firstNameKana}`;
}
