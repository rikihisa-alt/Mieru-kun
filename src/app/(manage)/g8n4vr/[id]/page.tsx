"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Briefcase, CreditCard,
  Shield, Users, Award, FileText, Pencil, Calendar,
} from "lucide-react";
import {
  findStaff, staffFullName, staffFullNameKana,
  EMPLOYMENT_TYPE_LABEL, GENDER_LABEL, STATUS_LABEL, STATUS_CHIP,
} from "@/lib/staff-data";

const TABS = ["基本情報", "雇用", "給与", "社会保険・税", "緊急連絡先", "資格・備考"] as const;
type Tab = (typeof TABS)[number];

function ageFromBirth(iso: string): number {
  const b = new Date(iso);
  const today = new Date();
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
  return age;
}

export default function StaffDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const staff = findStaff(id);
  const [activeTab, setActiveTab] = useState<Tab>("基本情報");

  if (!staff) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Link href="/g8n4vr" className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-3.5 h-3.5" />従業員一覧
        </Link>
        <div className="glass-panel text-center py-12">
          <p className="text-[14px] text-text-tertiary">該当する従業員が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <Link href="/g8n4vr" className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary">
        <ArrowLeft className="w-3.5 h-3.5" />従業員一覧
      </Link>

      {/* ヘッダー */}
      <div className="pb-4 border-b border-border-light">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <h1 className="text-[18px] font-bold text-text-primary">{staffFullName(staff)}</h1>
              <span className="text-[12px] text-text-tertiary">{staffFullNameKana(staff)}</span>
              <span className={`chip chip-sm ${STATUS_CHIP[staff.status]}`}>{STATUS_LABEL[staff.status]}</span>
              <span className="text-[11px] text-text-tertiary font-mono">{staff.employeeNo}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-text-secondary flex-wrap">
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-text-tertiary" />{staff.role} / {staff.department}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-text-tertiary" />{staff.joinDate} 入社</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-text-tertiary" />{staff.phone}</span>
            </div>
          </div>
          <button className="btn btn-subtle btn-sm">
            <Pencil className="w-3.5 h-3.5" />編集
          </button>
        </div>
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

      {/* タブコンテンツ */}
      <div className="glass-panel space-y-5">
        {activeTab === "基本情報" && (
          <>
            <Section icon={<User />} title="氏名・基本情報">
              <Field label="姓" value={staff.lastName} />
              <Field label="名" value={staff.firstName} />
              <Field label="セイ" value={staff.lastNameKana} />
              <Field label="メイ" value={staff.firstNameKana} />
              <Field label="性別" value={GENDER_LABEL[staff.gender]} />
              <Field label="生年月日" value={`${staff.dateOfBirth}（${ageFromBirth(staff.dateOfBirth)}歳）`} />
            </Section>
            <Section icon={<MapPin />} title="連絡先">
              <Field label="郵便番号" value={staff.postalCode || "—"} />
              <Field label="住所" value={staff.address || "—"} colSpan={2} />
              <Field label="電話番号" value={staff.phone || "—"} />
              <Field label="メールアドレス" value={staff.email || "—"} colSpan={2} />
            </Section>
          </>
        )}

        {activeTab === "雇用" && (
          <Section icon={<Briefcase />} title="雇用情報">
            <Field label="社員番号" value={staff.employeeNo} />
            <Field label="入社日" value={staff.joinDate} />
            <Field label="雇用形態" value={EMPLOYMENT_TYPE_LABEL[staff.employmentType]} />
            <Field label="部署" value={staff.department} />
            <Field label="役職" value={staff.role} />
            <Field label="勤務地" value={staff.workplace} />
            {staff.trialEndDate && <Field label="試用期間満了日" value={staff.trialEndDate} />}
            <Field label="ステータス" value={STATUS_LABEL[staff.status]} />
            {staff.resignDate && <Field label="退職日" value={staff.resignDate} />}
            {staff.resignReason && <Field label="退職理由" value={staff.resignReason} colSpan={2} />}
          </Section>
        )}

        {activeTab === "給与" && (
          <>
            <Section icon={<CreditCard />} title="給与">
              <Field label="支給形態" value={staff.salaryType === "monthly" ? "月給" : "時給"} />
              {staff.salaryType === "monthly" ? (
                <Field label="基本給" value={`¥${staff.baseSalary.toLocaleString()} /月`} />
              ) : (
                <Field label="時給" value={`¥${staff.hourlyWage.toLocaleString()} /h`} />
              )}
              <Field label="通勤手当" value={`¥${staff.commuteAllowance.toLocaleString()} /月`} />
              <Field label="その他手当" value={`¥${staff.otherAllowance.toLocaleString()} /月`} />
              <Field label="支給方法" value={staff.paymentMethod === "transfer" ? "口座振込" : "現金支給"} />
            </Section>
            {staff.bank && (
              <Section icon={<CreditCard />} title="振込先口座">
                <Field label="銀行名" value={staff.bank.bankName} />
                <Field label="支店名" value={staff.bank.branchName} />
                <Field label="預金種目" value={staff.bank.accountType === "ordinary" ? "普通" : "当座"} />
                <Field label="口座番号" value={staff.bank.accountNumber} />
                <Field label="口座名義(カナ)" value={staff.bank.accountHolder} colSpan={2} />
              </Section>
            )}
          </>
        )}

        {activeTab === "社会保険・税" && (
          <>
            <Section icon={<Shield />} title="マイナンバー・税">
              <Field label="マイナンバー" value={staff.myNumber} />
              <Field label="扶養家族数" value={`${staff.dependents}名`} />
              <Field label="配偶者(扶養)" value={staff.spouseDependent ? "あり" : "なし"} />
              <Field label="住民税徴収" value={staff.residentTax === "special" ? "特別徴収" : "普通徴収"} />
            </Section>
            <Section icon={<Shield />} title="社会保険">
              <Field label="健康保険" value={staff.insurance.health ? "加入" : "未加入"} />
              <Field label="厚生年金" value={staff.insurance.pension ? "加入" : "未加入"} />
              <Field label="雇用保険" value={staff.insurance.employment ? "加入" : "未加入"} />
              <Field label="労災保険" value={staff.insurance.workers ? "加入" : "未加入"} />
            </Section>
            {staff.residence?.required && (
              <Section icon={<FileText />} title="在留資格">
                <Field label="国籍" value={staff.residence.nationality || "—"} />
                <Field label="在留資格" value={staff.residence.status || "—"} />
                <Field label="期限" value={staff.residence.expiresAt || "—"} />
                <Field label="在留カード番号" value={staff.residence.cardNumber || "—"} />
              </Section>
            )}
          </>
        )}

        {activeTab === "緊急連絡先" && (
          <Section icon={<Users />} title="緊急連絡先">
            {staff.emergencyContacts.length === 0 ? (
              <p className="text-[12px] text-text-tertiary col-span-2">登録なし</p>
            ) : staff.emergencyContacts.map((c, i) => (
              <div key={i} className="col-span-2 bg-bg-hover rounded-[6px] p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold">{c.name}</span>
                  <span className="chip chip-neutral chip-sm">{c.relation}</span>
                </div>
                <p className="text-[12px] text-text-secondary flex items-center gap-1">
                  <Phone className="w-3 h-3 text-text-tertiary" />{c.phone}
                </p>
                {c.address && (
                  <p className="text-[11px] text-text-tertiary flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{c.address}
                  </p>
                )}
              </div>
            ))}
          </Section>
        )}

        {activeTab === "資格・備考" && (
          <>
            <Section icon={<Award />} title="資格・免許">
              {staff.licenses.length === 0 ? (
                <p className="text-[12px] text-text-tertiary col-span-2">登録なし</p>
              ) : staff.licenses.map(l => (
                <div key={l.id} className="col-span-2 flex items-center justify-between bg-bg-hover rounded-[6px] px-3 py-2">
                  <span className="text-[13px] font-medium">{l.name}</span>
                  <span className="text-[11px] text-text-tertiary">{l.acquiredAt || "取得日不明"}</span>
                </div>
              ))}
            </Section>
            <Section icon={<FileText />} title="備考">
              <p className="col-span-2 text-[13px] text-text-secondary leading-[1.7] whitespace-pre-wrap">
                {staff.notes || "—"}
              </p>
            </Section>
          </>
        )}
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

function Field({ label, value, colSpan }: { label: string; value: string; colSpan?: number }) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <p className="text-[10px] text-text-tertiary font-semibold uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[13px] text-text-primary">{value}</p>
    </div>
  );
}
