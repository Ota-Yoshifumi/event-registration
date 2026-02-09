"use client";

import { AdminReservationsContent } from "@/components/admin-reservations-content";

export default function WhgcSeminarsAdminReservationsPage() {
  return (
    <AdminReservationsContent
      adminBase="/whgc-seminars/admin"
      tenant="whgc-seminars"
    />
  );
}
