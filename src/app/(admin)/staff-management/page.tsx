import { getStaffList } from "@/lib/db/staff";
import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { roleLabel, roleColor } from "@/lib/constants/roles";
import { UserCog } from "lucide-react";
import type { StaffUser } from "@/types/database";

export default async function StaffManagementPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  let staffList: StaffUser[] = [];

  try {
    staffList = await getStaffList(storeId);
  } catch {
    // デモモード
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">スタッフ管理</h1>
            <p className="text-sm text-muted-foreground">
              {staffList.length}名のスタッフ
            </p>
          </div>
        </div>
      </div>

      <Card padding={false}>
        {staffList.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            スタッフがまだ登録されていません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>名前</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>時給</TableHead>
            </TableHeader>
            <TableBody>
              {staffList.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.name}</TableCell>
                  <TableCell>
                    <Badge variant="custom" className={roleColor(staff.role)}>
                      {roleLabel(staff.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.is_active ? "success" : "default"}>
                      {staff.is_active ? "有効" : "無効"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {staff.hourly_wage
                      ? `¥${staff.hourly_wage.toLocaleString("ja-JP")}`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
