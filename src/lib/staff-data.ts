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
  retiredAt?: string; // 退職処理日 (論理削除の目印)
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

// デモデータ
export const DEMO_STAFF: StaffFull[] = [
  {
    id: "s1",
    employeeNo: "EMP-001",
    lastName: "山田", firstName: "太郎",
    lastNameKana: "ヤマダ", firstNameKana: "タロウ",
    gender: "male", dateOfBirth: "1995-03-15",
    postalCode: "150-0001", address: "東京都渋谷区神宮前1-2-3",
    phone: "090-1111-2222", email: "yamada@example.com",
    joinDate: "2024-04-01", employmentType: "fulltime",
    department: "店舗運営", role: "ディーラー", workplace: "Come On Casino",
    status: "active",
    salaryType: "hourly", baseSalary: 0, hourlyWage: 1500,
    commuteAllowance: 12000, otherAllowance: 0,
    paymentMethod: "transfer",
    bank: { bankName: "三菱UFJ銀行", branchName: "渋谷支店", accountType: "ordinary", accountNumber: "1234567", accountHolder: "ヤマダタロウ" },
    myNumber: "************", dependents: 0, spouseDependent: false,
    insurance: { health: true, pension: true, employment: true, workers: true },
    residentTax: "special",
    emergencyContacts: [
      { name: "山田 花子", relation: "母", phone: "090-9999-1111", address: "東京都渋谷区神宮前1-2-3" }
    ],
    licenses: [
      { id: "l1", name: "普通自動車免許", acquiredAt: "2014-05-20" }
    ],
    notes: "ディーラー歴3年。ホールデムが得意。",
  },
  {
    id: "s2",
    employeeNo: "EMP-002",
    lastName: "鈴木", firstName: "一郎",
    lastNameKana: "スズキ", firstNameKana: "イチロウ",
    gender: "male", dateOfBirth: "1992-08-22",
    postalCode: "160-0023", address: "東京都新宿区西新宿2-1-1",
    phone: "090-2222-3333", email: "suzuki@example.com",
    joinDate: "2024-06-15", employmentType: "fulltime",
    department: "店舗運営", role: "ディーラー", workplace: "Come On Casino",
    status: "active",
    salaryType: "hourly", baseSalary: 0, hourlyWage: 1500,
    commuteAllowance: 8000, otherAllowance: 0,
    paymentMethod: "transfer",
    myNumber: "************", dependents: 1, spouseDependent: true,
    insurance: { health: true, pension: true, employment: true, workers: true },
    residentTax: "special",
    emergencyContacts: [{ name: "鈴木 美咲", relation: "配偶者", phone: "090-9999-2222" }],
    licenses: [],
    notes: "",
  },
  {
    id: "s3",
    employeeNo: "EMP-003",
    lastName: "佐藤", firstName: "花",
    lastNameKana: "サトウ", firstNameKana: "ハナ",
    gender: "female", dateOfBirth: "2000-01-30",
    postalCode: "151-0053", address: "東京都渋谷区代々木1-1-1",
    phone: "090-3333-4444", email: "sato.hana@example.com",
    joinDate: "2025-01-10", employmentType: "parttime",
    department: "店舗運営", role: "フロア", workplace: "Come On Casino",
    status: "active",
    salaryType: "hourly", baseSalary: 0, hourlyWage: 1200,
    commuteAllowance: 6000, otherAllowance: 0,
    paymentMethod: "transfer",
    myNumber: "************", dependents: 0, spouseDependent: false,
    insurance: { health: false, pension: false, employment: true, workers: true },
    residentTax: "ordinary",
    emergencyContacts: [{ name: "佐藤 太郎", relation: "父", phone: "090-9999-3333" }],
    licenses: [],
    notes: "学生バイト。週3日勤務。",
  },
  {
    id: "s4",
    employeeNo: "EMP-004",
    lastName: "高橋", firstName: "健",
    lastNameKana: "タカハシ", firstNameKana: "ケン",
    gender: "male", dateOfBirth: "1988-11-05",
    postalCode: "150-0002", address: "東京都渋谷区渋谷3-2-1",
    phone: "090-4444-5555", email: "takahashi@example.com",
    joinDate: "2024-09-01", employmentType: "fulltime",
    department: "店舗運営", role: "ディーラー", workplace: "Come On Casino",
    status: "active",
    salaryType: "hourly", baseSalary: 0, hourlyWage: 1500,
    commuteAllowance: 10000, otherAllowance: 0,
    paymentMethod: "transfer",
    myNumber: "************", dependents: 2, spouseDependent: true,
    insurance: { health: true, pension: true, employment: true, workers: true },
    residentTax: "special",
    emergencyContacts: [{ name: "高橋 美由紀", relation: "配偶者", phone: "090-9999-4444" }],
    licenses: [{ id: "l2", name: "普通自動車免許" }],
    notes: "",
  },
  {
    id: "s5",
    employeeNo: "EMP-005",
    lastName: "伊藤", firstName: "美咲",
    lastNameKana: "イトウ", firstNameKana: "ミサキ",
    gender: "female", dateOfBirth: "1998-06-12",
    postalCode: "150-0021", address: "東京都渋谷区恵比寿4-5-6",
    phone: "090-5555-6666", email: "ito@example.com",
    joinDate: "2025-03-15", employmentType: "parttime",
    department: "店舗運営", role: "フロア", workplace: "Come On Casino",
    status: "leave",
    salaryType: "hourly", baseSalary: 0, hourlyWage: 1200,
    commuteAllowance: 7000, otherAllowance: 0,
    paymentMethod: "transfer",
    myNumber: "************", dependents: 0, spouseDependent: false,
    insurance: { health: false, pension: false, employment: true, workers: true },
    residentTax: "ordinary",
    emergencyContacts: [{ name: "伊藤 達也", relation: "父", phone: "090-9999-5555" }],
    licenses: [],
    notes: "産休中。2026/06復帰予定。",
  },
  {
    id: "s6",
    employeeNo: "EMP-006",
    lastName: "中村", firstName: "翔",
    lastNameKana: "ナカムラ", firstNameKana: "ショウ",
    gender: "male", dateOfBirth: "1985-02-28",
    postalCode: "150-0011", address: "東京都渋谷区東2-3-4",
    phone: "090-6666-7777", email: "nakamura@example.com",
    joinDate: "2023-08-01", employmentType: "fulltime",
    department: "管理", role: "マネージャー", workplace: "Come On Casino",
    status: "retired", resignDate: "2026-03-31", resignReason: "自己都合",
    salaryType: "monthly", baseSalary: 320000, hourlyWage: 0,
    commuteAllowance: 15000, otherAllowance: 30000,
    paymentMethod: "transfer",
    myNumber: "************", dependents: 1, spouseDependent: true,
    insurance: { health: true, pension: true, employment: true, workers: true },
    residentTax: "special",
    emergencyContacts: [{ name: "中村 久美子", relation: "配偶者", phone: "090-9999-6666" }],
    licenses: [],
    notes: "",
  },
];

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
