"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * セミナー管理は予約一覧に統合したため、予約一覧へリダイレクトします。
 */
export default function WhgcSeminarsAdminSeminarsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/whgc-seminars/manage-console/reservations");
  }, [router]);
  return (
    <p className="text-sm text-muted-foreground">予約一覧へ移動しています...</p>
  );
}
