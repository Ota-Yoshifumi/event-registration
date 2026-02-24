"use client";

import { AdminReservationsContent } from "@/components/manage-console-reservations-content";

export default function WhgcSeminarsAdminReservationsPage() {
  return (
    <AdminReservationsContent
      adminBase="/whgc-seminars/manage-console"
      tenant="whgc-seminars"
    />
  );
}
