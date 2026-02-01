import { SeminarListClient } from "@/components/seminar-list-client";
import type { Seminar } from "@/lib/types";

async function getSeminars(): Promise<Seminar[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/seminars?status=published`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function SeminarsPage() {
  const seminars = await getSeminars();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">セミナー一覧</h1>
      <SeminarListClient seminars={seminars} />
    </div>
  );
}
