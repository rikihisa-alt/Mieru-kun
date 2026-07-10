"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { staffStore } from "@/lib/store/domain-stores";
import { type StaffFull, type EmploymentType, type Gender, type SalaryType, EMPLOYMENT_TYPE_LABEL, GENDER_LABEL, ROLES, DEPARTMENTS } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, Field, VStack, HStack, Tabs, Banner } from "@/components/v2/ui";
import { ArrowLeft } from "lucide-react";

export default function NewStaffPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"basic" | "employ" | "salary" | "social">("basic");

  // 基本情報
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastNameKana, setLastNameKana] = useState("");
  const [firstNameKana, setFirstNameKana] = useState("");
  const [gender, setGender] = useState<Gender>("no_answer");
  const [dateOfBirth, setDateOfBirth] = useState("");
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
  const [workplace, setWorkplace] = useState("");

  // 給与
  const [salaryType, setSalaryType] = useState<SalaryType>("hourly");
  const [baseSalary, setBaseSalary] = useState(0);
  const [hourlyWage, setHourlyWage] = useState(1200);
  const [commuteAllowance, setCommuteAllowance] = useState(0);
  const [otherAllowance, setOtherAllowance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">("transfer");

  // 社会保険
  const [myNumber, setMyNumber] = useState("");
  const [dependents, setDependents] = useState(0);

  const [error, setError] = useState("");

  function submit() {
    setError("");
    if (!lastName || !firstName) { setTab("basic"); setError("姓名は必須です"); return; }
    if (!joinDate) { setTab("employ"); setError("入社日は必須です"); return; }

    const wageUnset = salaryType === "hourly" ? hourlyWage <= 0 : baseSalary <= 0;
    if (wageUnset) {
      const ok = confirm("時給・給与が未設定です。このまま登録しますか？");
      if (!ok) { setTab("salary"); return; }
    }

    const s: StaffFull = {
      id: `s${Date.now()}`,
      employeeNo: employeeNo || `EMP-${String(Date.now()).slice(-4)}`,
      lastName, firstName, lastNameKana, firstNameKana,
      gender, dateOfBirth,
      postalCode, address, phone, email,
      joinDate, employmentType, department, role, workplace,
      status: "active",
      salaryType,
      baseSalary: salaryType === "monthly" ? baseSalary : 0,
      hourlyWage: salaryType === "hourly" ? hourlyWage : 0,
      commuteAllowance, otherAllowance, paymentMethod,
      myNumber, dependents, spouseDependent: false,
      insurance: { health: true, pension: true, employment: true, workers: true },
      residentTax: "special",
      emergencyContacts: [],
      licenses: [],
      notes: "",
    };
    staffStore.set(prev => [s, ...prev]);
    router.push("/k4z8qm3x/staff");
  }

  return (
    <VStack gap={16}>
      <Link href="/k4z8qm3x/staff" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
        <ArrowLeft size={12} />一覧へ戻る
      </Link>
      <PageHeader title="従業員 新規登録" />

      <Tabs value={tab} onChange={(v) => { setTab(v as typeof tab); setError(""); }} items={[
        { value: "basic", label: "基本情報" },
        { value: "employ", label: "雇用" },
        { value: "salary", label: "給与" },
        { value: "social", label: "社会保険・税" },
      ]} />

      {error && <Banner variant="danger">{error}</Banner>}

      <Panel>
        {tab === "basic" && (
          <div className="v2-form-grid">
            <Field label="姓" required><input value={lastName} onChange={(e) => { setLastName(e.target.value); setError(""); }} /></Field>
            <Field label="名" required><input value={firstName} onChange={(e) => { setFirstName(e.target.value); setError(""); }} /></Field>
            <Field label="セイ"><input value={lastNameKana} onChange={(e) => setLastNameKana(e.target.value)} /></Field>
            <Field label="メイ"><input value={firstNameKana} onChange={(e) => setFirstNameKana(e.target.value)} /></Field>
            <Field label="性別">
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                {(Object.keys(GENDER_LABEL) as Gender[]).map(g => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
              </select>
            </Field>
            <Field label="生年月日"><input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></Field>
            <Field label="郵便番号"><input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="000-0000" /></Field>
            <Field label="住所"><input value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
            <Field label="電話"><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-0000-0000" /></Field>
            <Field label="メール"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          </div>
        )}

        {tab === "employ" && (
          <div className="v2-form-grid">
            <Field label="社員番号" hint="未入力で自動生成"><input value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} placeholder="EMP-001" /></Field>
            <Field label="入社日" required><input type="date" value={joinDate} onChange={(e) => { setJoinDate(e.target.value); setError(""); }} /></Field>
            <Field label="雇用形態">
              <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}>
                {(Object.keys(EMPLOYMENT_TYPE_LABEL) as EmploymentType[]).map(t => <option key={t} value={t}>{EMPLOYMENT_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="部署">
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="役職">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="勤務地"><input value={workplace} onChange={(e) => setWorkplace(e.target.value)} placeholder="店舗名" /></Field>
          </div>
        )}

        {tab === "salary" && (
          <div className="v2-form-grid">
            <Field label="支給形態">
              <select value={salaryType} onChange={(e) => setSalaryType(e.target.value as SalaryType)}>
                <option value="monthly">月給</option>
                <option value="hourly">時給</option>
              </select>
            </Field>
            {salaryType === "monthly"
              ? <Field label="基本給 (円/月)"><input type="number" value={baseSalary} onChange={(e) => setBaseSalary(parseInt(e.target.value) || 0)} /></Field>
              : <Field label="時給 (円)"><input type="number" value={hourlyWage} onChange={(e) => setHourlyWage(parseInt(e.target.value) || 0)} /></Field>}
            <Field label="通勤手当 (円/月)"><input type="number" value={commuteAllowance} onChange={(e) => setCommuteAllowance(parseInt(e.target.value) || 0)} /></Field>
            <Field label="その他手当 (円/月)"><input type="number" value={otherAllowance} onChange={(e) => setOtherAllowance(parseInt(e.target.value) || 0)} /></Field>
            <Field label="支給方法">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "transfer" | "cash")}>
                <option value="transfer">口座振込</option>
                <option value="cash">現金支給</option>
              </select>
            </Field>
          </div>
        )}

        {tab === "social" && (
          <div className="v2-form-grid">
            <Field label="マイナンバー"><input value={myNumber} onChange={(e) => setMyNumber(e.target.value)} /></Field>
            <Field label="扶養家族数"><input type="number" value={dependents} onChange={(e) => setDependents(parseInt(e.target.value) || 0)} /></Field>
          </div>
        )}
      </Panel>

      <HStack gap={8} style={{ justifyContent: "flex-end" }}>
        <Btn onClick={() => router.push("/k4z8qm3x/staff")}>キャンセル</Btn>
        <Btn variant="primary" onClick={submit}>登録</Btn>
      </HStack>
    </VStack>
  );
}
