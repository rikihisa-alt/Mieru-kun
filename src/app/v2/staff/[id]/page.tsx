"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePersisted } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName, staffFullNameKana, STATUS_LABEL, EMPLOYMENT_TYPE_LABEL, GENDER_LABEL, type StaffStatus } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, VStack, HStack, Chip, Kpis, Kpi } from "@/components/v2/ui";
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
  function remove() {
    if (!confirm("削除しますか？")) return;
    staffStore.set(prev => prev.filter(x => x.id !== id));
    router.push("/v2/staff");
  }

  return (
    <VStack gap={16}>
      <Link href="/v2/staff" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}><ArrowLeft size={12} />一覧へ戻る</Link>

      <PageHeader
        title={staffFullName(s)}
        sub={<>
          {staffFullNameKana(s)} · {s.role} / {s.department}
          {" "}<Chip variant={s.status === "active" ? "success" : s.status === "leave" ? "warn" : undefined}>{STATUS_LABEL[s.status]}</Chip>
        </>}
        action={
          <>
            {s.status !== "active" && <Btn onClick={() => setStatus("active")}>復帰</Btn>}
            {s.status !== "leave" && <Btn onClick={() => setStatus("leave")}>休職</Btn>}
            {s.status !== "retired" && <Btn variant="danger" onClick={() => setStatus("retired")}>退職</Btn>}
            <Btn variant="danger" onClick={remove}>削除</Btn>
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
