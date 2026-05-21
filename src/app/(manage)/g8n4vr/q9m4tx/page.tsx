"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, User, MapPin, Briefcase, CreditCard,
  Shield, Users, Award, FileText, Plus, X, Save,
} from "lucide-react";
import {
  EMPLOYMENT_TYPE_LABEL, GENDER_LABEL, ROLES, DEPARTMENTS,
  type EmploymentType, type Gender, type SalaryType,
  type Insurance, type EmergencyContact, type License,
  type StaffFull,
} from "@/lib/staff-data";
import { staffStore } from "@/lib/store/domain-stores";

const TABS = ["基本情報", "雇用", "給与", "社会保険・税", "緊急連絡先", "資格・備考"] as const;
type Tab = (typeof TABS)[number];

export default function NewStaffPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("基本情報");
  const [done, setDone] = useState(false);

  // 基本情報
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameKana, setLastNameKana] = useState("");
  const [firstNameKana, setFirstNameKana] = useState("");
  const [gender, setGender] = useState<Gender>("no_answer");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // 連絡先
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // 雇用
  const [employeeNo, setEmployeeNo] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("fulltime");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [role, setRole] = useState(ROLES[0]);
  const [workplace, setWorkplace] = useState("Come On Casino");
  const [trialEndDate, setTrialEndDate] = useState("");

  // 給与
  const [salaryType, setSalaryType] = useState<SalaryType>("hourly");
  const [baseSalary, setBaseSalary] = useState(0);
  const [hourlyWage, setHourlyWage] = useState(1200);
  const [commuteAllowance, setCommuteAllowance] = useState(0);
  const [otherAllowance, setOtherAllowance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">("transfer");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountType, setAccountType] = useState<"ordinary" | "checking">("ordinary");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  // 社会保険・税
  const [myNumber, setMyNumber] = useState("");
  const [dependents, setDependents] = useState(0);
  const [spouseDependent, setSpouseDependent] = useState(false);
  const [insurance, setInsurance] = useState<Insurance>({ health: true, pension: true, employment: true, workers: true });
  const [residentTax, setResidentTax] = useState<"special" | "ordinary">("special");

  // 在留資格
  const [isForeign, setIsForeign] = useState(false);
  const [nationality, setNationality] = useState("");
  const [residenceStatus, setResidenceStatus] = useState("");
  const [residenceExpiresAt, setResidenceExpiresAt] = useState("");
  const [residenceCardNumber, setResidenceCardNumber] = useState("");

  // 緊急連絡先
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([
    { name: "", relation: "", phone: "", address: "" },
  ]);

  // 資格
  const [licenses, setLicenses] = useState<License[]>([]);

  // 備考
  const [notes, setNotes] = useState("");

  function addContact() {
    setEmergencyContacts(prev => [...prev, { name: "", relation: "", phone: "", address: "" }]);
  }
  function removeContact(i: number) {
    setEmergencyContacts(prev => prev.filter((_, j) => j !== i));
  }
  function updateContact(i: number, field: keyof EmergencyContact, value: string) {
    setEmergencyContacts(prev => prev.map((c, j) => j === i ? { ...c, [field]: value } : c));
  }
  function addLicense() {
    setLicenses(prev => [...prev, { id: `l${Date.now()}`, name: "", acquiredAt: "" }]);
  }
  function removeLicense(i: number) {
    setLicenses(prev => prev.filter((_, j) => j !== i));
  }
  function updateLicense(i: number, field: "name" | "acquiredAt", value: string) {
    setLicenses(prev => prev.map((l, j) => j === i ? { ...l, [field]: value } : l));
  }

  function submit() {
    // バリデーション(必須項目)
    if (!lastName || !firstName) { setActiveTab("基本情報"); return; }
    if (!joinDate) { setActiveTab("雇用"); return; }

    const id = `s${Date.now()}`;
    const newStaff: StaffFull = {
      id,
      employeeNo: employeeNo || `EMP-${String(Date.now()).slice(-4)}`,
      lastName, firstName, lastNameKana, firstNameKana,
      gender, dateOfBirth,
      postalCode, address, phone, email,
      joinDate, employmentType, department, role, workplace,
      trialEndDate: trialEndDate || undefined,
      status: "active",
      salaryType,
      baseSalary: salaryType === "monthly" ? baseSalary : 0,
      hourlyWage: salaryType === "hourly" ? hourlyWage : 0,
      commuteAllowance, otherAllowance,
      paymentMethod,
      bank: paymentMethod === "transfer" && bankName ? {
        bankName, branchName, accountType, accountNumber, accountHolder,
      } : undefined,
      myNumber, dependents, spouseDependent, insurance, residentTax,
      emergencyContacts: emergencyContacts.filter(c => c.name.trim()),
      residence: isForeign ? {
        required: true, nationality, status: residenceStatus,
        expiresAt: residenceExpiresAt || undefined,
        cardNumber: residenceCardNumber || undefined,
      } : undefined,
      licenses: licenses.filter(l => l.name.trim()),
      notes,
    };
    staffStore.set(prev => [newStaff, ...prev]);

    setDone(true);
    setTimeout(() => router.push("/g8n4vr"), 1800);
  }

  if (done) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <div className="glass-panel text-center py-12">
          <CheckCircle className="w-14 h-14 text-accent mx-auto mb-3" />
          <p className="text-[15px] font-semibold">{lastName} {firstName} さんを登録しました</p>
          <p className="text-[12px] text-text-tertiary mt-1.5">一覧へ戻ります...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Link href="/g8n4vr" className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="w-3.5 h-3.5" />従業員一覧
      </Link>

      <div className="pb-4 border-b border-border-light">
        <h1 className="text-[18px] font-bold text-text-primary mb-1">従業員を新規登録</h1>
        <p className="text-[12px] text-text-tertiary">freee人事労務と同等レベルの項目を入力できます。後から編集も可能です。</p>
      </div>

      {/* タブ */}
      <div className="tabs-underline">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`tab-underline ${activeTab === t ? "tab-underline-active" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 入力エリア */}
      <div className="glass-panel space-y-5">
        {activeTab === "基本情報" && (
          <>
            <Section icon={<User />} title="氏名・基本情報">
              <Input label="姓 *" value={lastName} onChange={setLastName} placeholder="山田" />
              <Input label="名 *" value={firstName} onChange={setFirstName} placeholder="太郎" />
              <Input label="セイ" value={lastNameKana} onChange={setLastNameKana} placeholder="ヤマダ" />
              <Input label="メイ" value={firstNameKana} onChange={setFirstNameKana} placeholder="タロウ" />
              <Select label="性別" value={gender} onChange={(v) => setGender(v as Gender)}
                options={(Object.keys(GENDER_LABEL) as Gender[]).map(g => ({ value: g, label: GENDER_LABEL[g] }))} />
              <Input label="生年月日" type="date" value={dateOfBirth} onChange={setDateOfBirth} />
            </Section>
            <Section icon={<MapPin />} title="連絡先">
              <Input label="郵便番号" value={postalCode} onChange={setPostalCode} placeholder="150-0001" />
              <Input label="住所" value={address} onChange={setAddress} placeholder="東京都渋谷区..." colSpan={2} />
              <Input label="電話番号" type="tel" value={phone} onChange={setPhone} placeholder="090-0000-0000" />
              <Input label="メールアドレス" type="email" value={email} onChange={setEmail} placeholder="example@example.com" colSpan={2} />
            </Section>
          </>
        )}

        {activeTab === "雇用" && (
          <Section icon={<Briefcase />} title="雇用情報">
            <Input label="社員番号" value={employeeNo} onChange={setEmployeeNo} placeholder="EMP-001" />
            <Input label="入社日 *" type="date" value={joinDate} onChange={setJoinDate} />
            <Select label="雇用形態" value={employmentType} onChange={(v) => setEmploymentType(v as EmploymentType)}
              options={(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map(e => ({ value: e, label: EMPLOYMENT_TYPE_LABEL[e] }))} />
            <Select label="部署" value={department} onChange={setDepartment}
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            <Select label="役職" value={role} onChange={setRole}
              options={ROLES.map(r => ({ value: r, label: r }))} />
            <Input label="勤務地" value={workplace} onChange={setWorkplace} />
            <Input label="試用期間満了日(任意)" type="date" value={trialEndDate} onChange={setTrialEndDate} colSpan={2} />
          </Section>
        )}

        {activeTab === "給与" && (
          <>
            <Section icon={<CreditCard />} title="給与">
              <Select label="支給形態" value={salaryType} onChange={(v) => setSalaryType(v as SalaryType)}
                options={[{ value: "monthly", label: "月給" }, { value: "hourly", label: "時給" }]} />
              {salaryType === "monthly" ? (
                <NumberInput label="基本給(円/月)" value={baseSalary} onChange={setBaseSalary} />
              ) : (
                <NumberInput label="時給(円)" value={hourlyWage} onChange={setHourlyWage} />
              )}
              <NumberInput label="通勤手当(円/月)" value={commuteAllowance} onChange={setCommuteAllowance} />
              <NumberInput label="その他手当(円/月)" value={otherAllowance} onChange={setOtherAllowance} />
              <Select label="支給方法" value={paymentMethod} onChange={(v) => setPaymentMethod(v as "transfer" | "cash")}
                options={[{ value: "transfer", label: "口座振込" }, { value: "cash", label: "現金支給" }]} colSpan={2} />
            </Section>
            {paymentMethod === "transfer" && (
              <Section icon={<CreditCard />} title="振込先口座">
                <Input label="銀行名" value={bankName} onChange={setBankName} placeholder="三菱UFJ銀行" />
                <Input label="支店名" value={branchName} onChange={setBranchName} placeholder="渋谷支店" />
                <Select label="預金種目" value={accountType} onChange={(v) => setAccountType(v as "ordinary" | "checking")}
                  options={[{ value: "ordinary", label: "普通" }, { value: "checking", label: "当座" }]} />
                <Input label="口座番号" value={accountNumber} onChange={setAccountNumber} placeholder="1234567" />
                <Input label="口座名義(カナ)" value={accountHolder} onChange={setAccountHolder} placeholder="ヤマダタロウ" colSpan={2} />
              </Section>
            )}
          </>
        )}

        {activeTab === "社会保険・税" && (
          <>
            <Section icon={<Shield />} title="マイナンバー・税">
              <Input label="マイナンバー" value={myNumber} onChange={setMyNumber} placeholder="12桁" />
              <NumberInput label="扶養家族数" value={dependents} onChange={setDependents} />
              <Checkbox label="配偶者を扶養に入れる" checked={spouseDependent} onChange={setSpouseDependent} />
              <Select label="住民税徴収方法" value={residentTax} onChange={(v) => setResidentTax(v as "special" | "ordinary")}
                options={[{ value: "special", label: "特別徴収(給与天引き)" }, { value: "ordinary", label: "普通徴収(本人納付)" }]} />
            </Section>
            <Section icon={<Shield />} title="社会保険加入">
              <Checkbox label="健康保険" checked={insurance.health} onChange={(v) => setInsurance(p => ({ ...p, health: v }))} />
              <Checkbox label="厚生年金" checked={insurance.pension} onChange={(v) => setInsurance(p => ({ ...p, pension: v }))} />
              <Checkbox label="雇用保険" checked={insurance.employment} onChange={(v) => setInsurance(p => ({ ...p, employment: v }))} />
              <Checkbox label="労災保険" checked={insurance.workers} onChange={(v) => setInsurance(p => ({ ...p, workers: v }))} />
            </Section>
            <Section icon={<FileText />} title="在留資格(外国籍の場合)">
              <div className="col-span-2">
                <Checkbox label="外国籍の従業員" checked={isForeign} onChange={setIsForeign} />
              </div>
              {isForeign && (
                <>
                  <Input label="国籍" value={nationality} onChange={setNationality} />
                  <Input label="在留資格" value={residenceStatus} onChange={setResidenceStatus} placeholder="技術・人文知識・国際業務 など" />
                  <Input label="在留期限" type="date" value={residenceExpiresAt} onChange={setResidenceExpiresAt} />
                  <Input label="在留カード番号" value={residenceCardNumber} onChange={setResidenceCardNumber} />
                </>
              )}
            </Section>
          </>
        )}

        {activeTab === "緊急連絡先" && (
          <Section icon={<Users />} title="緊急連絡先">
            {emergencyContacts.map((c, i) => (
              <div key={i} className="col-span-2 bg-bg-hover rounded-[6px] p-3 space-y-2 relative">
                {emergencyContacts.length > 1 && (
                  <button onClick={() => removeContact(i)} className="absolute top-2 right-2 p-1 hover:bg-status-danger-bg rounded">
                    <X className="w-3.5 h-3.5 text-status-danger" />
                  </button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="氏名" value={c.name} onChange={(v) => updateContact(i, "name", v)} placeholder="山田 花子" />
                  <Input label="続柄" value={c.relation} onChange={(v) => updateContact(i, "relation", v)} placeholder="母 / 父 / 配偶者 など" />
                  <Input label="電話番号" type="tel" value={c.phone} onChange={(v) => updateContact(i, "phone", v)} />
                  <Input label="住所(任意)" value={c.address || ""} onChange={(v) => updateContact(i, "address", v)} />
                </div>
              </div>
            ))}
            <div className="col-span-2">
              <button onClick={addContact} className="btn btn-subtle btn-sm">
                <Plus className="w-3 h-3" />連絡先を追加
              </button>
            </div>
          </Section>
        )}

        {activeTab === "資格・備考" && (
          <>
            <Section icon={<Award />} title="資格・免許">
              {licenses.length === 0 ? (
                <p className="col-span-2 text-[12px] text-text-tertiary">未登録</p>
              ) : licenses.map((l, i) => (
                <div key={l.id} className="col-span-2 flex items-center gap-2 bg-bg-hover rounded-[6px] px-3 py-2">
                  <input type="text" value={l.name} onChange={e => updateLicense(i, "name", e.target.value)}
                    placeholder="資格・免許名" className="text-[13px] flex-1" />
                  <input type="date" value={l.acquiredAt || ""} onChange={e => updateLicense(i, "acquiredAt", e.target.value)}
                    className="text-[12px] max-w-[150px]" />
                  <button onClick={() => removeLicense(i)} className="p-1 hover:bg-status-danger-bg rounded">
                    <X className="w-3 h-3 text-status-danger" />
                  </button>
                </div>
              ))}
              <div className="col-span-2">
                <button onClick={addLicense} className="btn btn-subtle btn-sm">
                  <Plus className="w-3 h-3" />資格を追加
                </button>
              </div>
            </Section>
            <Section icon={<FileText />} title="備考">
              <div className="col-span-2">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="勤務に関する申し送り事項など"
                  className="w-full text-[13px] resize-none"
                />
              </div>
            </Section>
          </>
        )}
      </div>

      {/* フッター操作 */}
      <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-[var(--bg-main)] py-3">
        <Link href="/g8n4vr" className="btn btn-ghost btn-sm">キャンセル</Link>
        <div className="flex gap-2">
          {(() => {
            const idx = TABS.indexOf(activeTab);
            return (
              <>
                {idx > 0 && (
                  <button onClick={() => setActiveTab(TABS[idx - 1])} className="btn btn-subtle btn-sm">
                    ← 戻る
                  </button>
                )}
                {idx < TABS.length - 1 ? (
                  <button onClick={() => setActiveTab(TABS[idx + 1])} className="btn btn-primary btn-sm">
                    次へ →
                  </button>
                ) : (
                  <button onClick={submit} className="btn btn-primary">
                    <Save className="w-3.5 h-3.5" />登録する
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="t-label flex items-center gap-1.5 mb-3">
        <span className="text-text-tertiary [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", colSpan }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; colSpan?: number;
}) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="block text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-0.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="text-[13px]" />
    </div>
  );
}

function NumberInput({ label, value, onChange, colSpan }: {
  label: string; value: number; onChange: (v: number) => void; colSpan?: number;
}) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="block text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-0.5">{label}</label>
      <input type="number" min={0} value={value} onChange={e => onChange(parseInt(e.target.value) || 0)} className="text-[13px]" />
    </div>
  );
}

function Select<T extends string>({ label, value, onChange, options, colSpan }: {
  label: string; value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[]; colSpan?: number;
}) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="block text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-0.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value as T)} className="text-[13px]">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Checkbox({ label, checked, onChange, colSpan }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; colSpan?: number;
}) {
  return (
    <label className={`flex items-center gap-2 text-[13px] text-text-primary cursor-pointer ${colSpan === 2 ? "col-span-2" : ""}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
