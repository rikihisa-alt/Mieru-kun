import { createClient } from "@/lib/supabase/server";
import type { CouponMaster, CustomerCoupon, CustomerCouponWithMaster } from "@/types/database";

export async function getCouponMasters(storeId: string): Promise<CouponMaster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupon_masters")
    .select("*")
    .eq("store_id", storeId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as CouponMaster[]) ?? [];
}

export async function getCustomerCoupons(customerId: string): Promise<CustomerCouponWithMaster[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_coupons")
    .select("*, coupon:coupon_masters(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as CustomerCouponWithMaster[]) ?? [];
}

export async function issueCoupon(input: {
  couponId: string;
  customerId: string;
}): Promise<CustomerCoupon> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_coupons")
    .insert({
      coupon_id: input.couponId,
      customer_id: input.customerId,
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;
  return data as CustomerCoupon;
}

export async function useCoupon(couponId: string, visitId: string): Promise<CustomerCoupon> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_coupons")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
      visit_id: visitId,
    })
    .eq("id", couponId)
    .eq("status", "active")
    .select()
    .single();
  if (error) throw error;
  return data as CustomerCoupon;
}
