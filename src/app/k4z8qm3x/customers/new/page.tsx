"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type CustomerRank } from "@/lib/store/domain-stores";
import { useCustomers } from "@/lib/repositories/use-customers";
import { PageHeader, Btn, Panel, Field, VStack, HStack, Banner } from "@/components/v2/ui";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();
  const { createCustomer } = useCustomers();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [pledgeNo, setPledgeNo] = useState("");
  const [email, setEmail] = useState("");
  const [rank, setRank] = useState<CustomerRank>("regular");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) { setError("本名は必須です"); return; }
    await createCustomer({
      name: name.trim(), nickname: nickname.trim(),
      rank, phone: phone.trim(), pledgeNo: pledgeNo.trim() || undefined,
      email: email.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      notes: notes.trim() || undefined,
    });
    router.push("/k4z8qm3x/customers");
  }

  return (
    <VStack gap={16}>
      <Link href="/k4z8qm3x/customers" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
        <ArrowLeft size={12} />一覧へ戻る
      </Link>
      <PageHeader title="顧客新規登録" />

      <Panel>
        <VStack gap={16}>
          {error && <Banner variant="danger">{error}</Banner>}

          <div className="v2-form-grid">
            <Field label="本名" required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="田中 太郎" />
            </Field>
            <Field label="ポーカーネーム" hint="客同士に見える呼び名(本名は店側のみ)">
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="タロウ" />
            </Field>
            <Field label="ランク">
              <select value={rank} onChange={(e) => setRank(e.target.value as CustomerRank)}>
                <option value="regular">Regular</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip">VIP</option>
              </select>
            </Field>
            <Field label="生年月日">
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </Field>
            <Field label="電話番号">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="090-0000-0000" />
            </Field>
            <Field label="誓約書管理番号" hint="紙の誓約書に振った管理番号を記載">
              <input value={pledgeNo} onChange={(e) => setPledgeNo(e.target.value)} placeholder="例: P-0001" />
            </Field>
            <Field label="メール">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" />
            </Field>
          </div>

          <Field label="備考">
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="運用メモ" />
          </Field>

          <HStack gap={8} style={{ justifyContent: "flex-end" }}>
            <Btn onClick={() => router.push("/k4z8qm3x/customers")}>キャンセル</Btn>
            <Btn variant="primary" onClick={submit}>登録</Btn>
          </HStack>
        </VStack>
      </Panel>
    </VStack>
  );
}
