"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePersisted } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import {
  staffFullName, staffFullNameKana, STATUS_LABEL, EMPLOYMENT_TYPE_LABEL, GENDER_LABEL,
  ROLES, DEPARTMENTS,
  type StaffStatus, type StaffFull, type EmploymentType, type Gender, type SalaryType,
} from "@/lib/staff-data";
import { PageHeader, Btn, Panel, Field, VStack, HStack, Chip, Kpis, Kpi, Tabs } from "@/components/v2/ui";
import { ArrowLeft } from "lucide-react";

function age(iso: string): number {
  if (!iso) return 0;
  const b = new Date(iso); const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

export default function StaffDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [allStaff] = usePersisted(staffStore);
  const s = allStaff.find(x => x.id === id);

  const [editing, setEditing] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  if (!s) {
    return (
      <VStack gap={16}>
        <Link href="/v2/staff" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}><ArrowLeft size={12} />一覧へ戻る</Link>
        <Panel><div className="v2-mute" style={{ padding: 32, textAlign: "center" }}>該当する従業員が見つかりません</div></Panel>
      </VStack>
    );
  }

  function setStatus(status: StaffStatus) {
    staffStore.set(prev => prev.map(x => x.id === id ? { ...x, status } : x));
  }

  // 退職処理(論理削除): status=retired + retiredAt を記録。物理削除はしない
  function retire() {
    if (!confirm("退職処理を行いますか？給与・雇用履歴は保持されたまま「退職」扱いになります。")) return;
    const today = new Date().toISOString().slice(0, 10);
    staffStore.set(prev => prev.map(x => x.id === id ? { ...x, status: "retired", retiredAt: today, resignDate: x.resignDate || today } : x));
    setSavedMsg("退職処理を行いました");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  // 完全削除は退職者のみ許可。二重確認
  function hardDelete() {
    if (!s || s.status !== "retired") return;
    if (!confirm("この従業員データを完全に削除します。給与・雇用履歴も含めて復元できません。よろしいですか？")) return;
    if (!confirm("本当に完全削除しますか？この操作は取り消せません。")) return;
    staffStore.set(prev => prev.filter(x => x.id !== id));
    router.push("/v2/staff");
  }

  if (editing) {
    return (
      <StaffEditForm
        staff={s}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          setEditing(false);
          setSavedMsg("保存しました");
          setTimeout(() => setSavedMsg(""), 3000);
        }}
      />
    );
  }

  return (
    <VStack gap={16}>
      <Link href="/v2/staff" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}><ArrowLeft size={12} />一覧へ戻る</Link>

      {savedMsg && (
        <div style={{ padding: 10, background: "var(--v2-success-bg)", color: "var(--v2-success)", fontSize: 12, borderRadius: 3 }}>{savedMsg}</div>
      )}

      <PageHeader
        title={staffFullName(s)}
        sub={<>
          {staffFullNameKana(s)} · {s.role} / {s.department}
          {" "}<Chip variant={s.status === "active" ? "success" : s.status === "leave" ? "warn" : undefined}>{STATUS_LABEL[s.status]}</Chip>
        </>}
        action={
          <>
            <Btn variant="primary" onClick={() => setEditing(true)}>編集</Btn>
            {s.status !== "active" && <Btn onClick={() => setStatus("active")}>復帰</Btn>}
            {s.status !== "leave" && <Btn onClick={() => setStatus("leave")}>休職</Btn>}
            {s.status !== "retired" && <Btn variant="danger" onClick={retire}>退職処理</Btn>}
            {s.status === "retired" && <Btn variant="danger" onClick={hardDelete}>完全削除</Btn>}
          </>
        }
      />

      <Kpis>
        <Kpi label="社員番号" value={<span style={{ fontFamily: "var(--v2-num)", fontSize: 18 }}>{s.employeeNo}</span>} />
        <Kpi label="入社日" value={<span style={{ fontSize: 18 }}>{s.joinDate}</span>} />
        <Kpi label="年齢" value={s.dateOfBirth ? `${age(s.dateOfBirth)}` : "—"} sub="歳" />
        <Kpi label="時給/月給" value={
          <span style={{ fontSize: 18 }}>
            {s.salaryType === "hourly" ? `¥${s.hourlyWage.toLocaleString()}/h` : `¥${s.baseSalary.toLocaleString()}/月`}
          </span>
        } />
      </Kpis>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Panel title="基本情報">
          <VStack gap={10}>
            <DetailRow label="氏名" value={`${staffFullName(s)} (${staffFullNameKana(s)})`} />
            <DetailRow label="性別" value={GENDER_LABEL[s.gender]} />
            <DetailRow label="生年月日" value={s.dateOfBirth || "—"} />
            <DetailRow label="住所" value={`${s.postalCode ? `〒${s.postalCode} ` : ""}${s.address || "—"}`} />
            <DetailRow label="電話" value={s.phone || "—"} />
            <DetailRow label="メール" value={s.email || "—"} />
          </VStack>
        </Panel>

        <Panel title="雇用情報">
          <VStack gap={10}>
            <DetailRow label="社員番号" value={s.employeeNo} />
            <DetailRow label="雇用形態" value={EMPLOYMENT_TYPE_LABEL[s.employmentType]} />
            <DetailRow label="部署" value={s.department} />
            <DetailRow label="役職" value={s.role} />
            <DetailRow label="勤務地" value={s.workplace || "—"} />
            <DetailRow label="入社日" value={s.joinDate} />
            {s.resignDate && <DetailRow label="退職日" value={s.resignDate} />}
            {s.retiredAt && <DetailRow label="退職処理日" value={s.retiredAt} />}
          </VStack>
        </Panel>

        <Panel title="給与">
          <VStack gap={10}>
            <DetailRow label="支給形態" value={s.salaryType === "monthly" ? "月給" : "時給"} />
            <DetailRow label="基本" value={s.salaryType === "monthly" ? `¥${s.baseSalary.toLocaleString()}/月` : `¥${s.hourlyWage.toLocaleString()}/h`} />
            <DetailRow label="通勤手当" value={`¥${s.commuteAllowance.toLocaleString()}`} />
            <DetailRow label="その他手当" value={`¥${s.otherAllowance.toLocaleString()}`} />
            <DetailRow label="支給方法" value={s.paymentMethod === "transfer" ? "口座振込" : "現金支給"} />
            {s.bank && <DetailRow label="振込先" value={`${s.bank.bankName} ${s.bank.branchName} ${s.bank.accountType === "ordinary" ? "普通" : "当座"} ${s.bank.accountNumber}`} />}
          </VStack>
        </Panel>

        <Panel title="社会保険・税">
          <VStack gap={10}>
            <DetailRow label="マイナンバー" value={s.myNumber || "—"} />
            <DetailRow label="扶養家族" value={`${s.dependents}名${s.spouseDependent ? " (配偶者含む)" : ""}`} />
            <DetailRow label="住民税" value={s.residentTax === "special" ? "特別徴収" : "普通徴収"} />
            <DetailRow label="健康保険" value={s.insurance.health ? "加入" : "未加入"} />
            <DetailRow label="厚生年金" value={s.insurance.pension ? "加入" : "未加入"} />
            <DetailRow label="雇用保険" value={s.insurance.employment ? "加入" : "未加入"} />
            <DetailRow label="労災保険" value={s.insurance.workers ? "加入" : "未加入"} />
          </VStack>
        </Panel>
      </div>

      {s.notes && (
        <Panel title="備考"><div style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{s.notes}</div></Panel>
      )}
    </VStack>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <HStack gap={12} style={{ borderBottom: "1px solid var(--v2-border)", paddingBottom: 8 }}>
      <span className="v2-mute" style={{ fontSize: 12, width: 100 }}>{label}</span>
      <span style={{ fontSize: 13, flex: 1 }}>{value}</span>
    </HStack>
  );
}

// ============= 編集フォーム =============
function StaffEditForm({ staff, onCancel, onSaved }: { staff: StaffFull; onCancel: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<"basic" | "employ" | "salary" | "social">("basic");

  // 基本情報
  const [lastName, setLastName] = useState(staff.lastName);
  const [firstName, setFirstName] = useState(staff.firstName);
  const [lastNameKana, setLastNameKana] = useState(staff.lastNameKana);
  const [firstNameKana, setFirstNameKana] = useState(staff.firstNameKana);
  const [gender, setGender] = useState<Gender>(staff.gender);
  const [dateOfBirth, setDateOfBirth] = useState(staff.dateOfBirth);
  const [postalCode, setPostalCode] = useState(staff.postalCode);
  const [address, setAddress] = useState(staff.address);
  const [phone, setPhone] = useState(staff.phone);
  const [email, setEmail] = useState(staff.email);

  // 雇用
  const [employeeNo, setEmployeeNo] = useState(staff.employeeNo);
  const [joinDate, setJoinDate] = useState(staff.joinDate);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(staff.employmentType);
  const [department, setDepartment] = useState(staff.department);
  const [role, setRole] = useState(staff.role);
  const [workplace, setWorkplace] = useState(staff.workplace);

  // 給与
  const [salaryType, setSalaryType] = useState<SalaryType>(staff.salaryType);
  const [baseSalary, setBaseSalary] = useState(staff.baseSalary);
  const [hourlyWage, setHourlyWage] = useState(staff.hourlyWage);
  const [commuteAllowance, setCommuteAllowance] = useState(staff.commuteAllowance);
  const [otherAllowance, setOtherAllowance] = useState(staff.otherAllowance);
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">(staff.paymentMethod);

  // 社会保険
  const [myNumber, setMyNumber] = useState(staff.myNumber);
  const [dependents, setDependents] = useState(staff.dependents);

  const [error, setError] = useState("");

  function save() {
    if (!lastName || !firstName) { setError(""); setTab("basic"); setError("姓名は必須です"); return; }
    if (!joinDate) { setError(""); setTab("employ"); setError("入社日は必須です"); return; }

    const finalHourly = salaryType === "hourly" ? hourlyWage : 0;
    const finalBase = salaryType === "monthly" ? baseSalary : 0;
    if ((salaryType === "hourly" && finalHourly <= 0) || (salaryType === "monthly" && finalBase <= 0)) {
      const ok = confirm("時給・給与が未設定です。このまま保存しますか？");
      if (!ok) { setTab("salary"); return; }
    }

    setError("");
    staffStore.set(prev => prev.map(x => x.id === staff.id ? {
      ...x,
      lastName, firstName, lastNameKana, firstNameKana,
      gender, dateOfBirth,
      postalCode, address, phone, email,
      employeeNo, joinDate, employmentType, department, role, workplace,
      salaryType, baseSalary: finalBase, hourlyWage: finalHourly,
      commuteAllowance, otherAllowance, paymentMethod,
      myNumber, dependents,
    } : x));
    onSaved();
  }

  return (
    <VStack gap={16}>
      <Link href="/v2/staff" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
        <ArrowLeft size={12} />一覧へ戻る
      </Link>
      <PageHeader title={`${staffFullName(staff)} を編集`} />

      <Tabs value={tab} onChange={(v) => setTab(v as typeof tab)} items={[
        { value: "basic", label: "基本情報" },
        { value: "employ", label: "雇用" },
        { value: "salary", label: "給与" },
        { value: "social", label: "社会保険・税" },
      ]} />

      {error && <div style={{ padding: 10, background: "var(--v2-danger-bg)", color: "var(--v2-danger)", fontSize: 12, borderRadius: 3 }}>{error}</div>}

      <Panel>
        {tab === "basic" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="姓" required><input value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
            <Field label="名" required><input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></Field>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="社員番号"><input value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} placeholder="EMP-001" /></Field>
            <Field label="入社日" required><input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} /></Field>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="マイナンバー"><input value={myNumber} onChange={(e) => setMyNumber(e.target.value)} /></Field>
            <Field label="扶養家族数"><input type="number" value={dependents} onChange={(e) => setDependents(parseInt(e.target.value) || 0)} /></Field>
          </div>
        )}
      </Panel>

      <HStack gap={8} style={{ justifyContent: "flex-end" }}>
        <Btn onClick={onCancel}>キャンセル</Btn>
        <Btn variant="primary" onClick={save}>保存</Btn>
      </HStack>
    </VStack>
  );
}
