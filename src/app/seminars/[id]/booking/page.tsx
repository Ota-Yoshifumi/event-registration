import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingForm } from "@/components/booking-form";
import type { Seminar } from "@/lib/types";

async function getSeminar(id: string): Promise<Seminar | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/seminars/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FORMAT_LABEL: Record<string, string> = {
  venue: "会場",
  online: "オンライン",
  hybrid: "ハイブリッド",
};

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seminar = await getSeminar(id);

  if (!seminar || seminar.status !== "published") {
    notFound();
  }

  const isFull = seminar.current_bookings >= seminar.capacity;
  if (isFull) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="mb-4 text-2xl font-bold">満席です</h1>
        <p className="text-muted-foreground">
          申し訳ありませんが、このセミナーは定員に達しました。
        </p>
        <Link
          href="/seminars"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          セミナー一覧に戻る
        </Link>
      </div>
    );
  }

  const remaining = seminar.capacity - seminar.current_bookings;

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href={`/seminars/${id}`}
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← セミナー詳細に戻る
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>申し込み</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* セミナー情報サマリー */}
          <div className="rounded-lg bg-gray-50 p-4 space-y-2">
            <h3 className="font-semibold text-base">{seminar.title}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>開催日時</span>
                <span>{formatDate(seminar.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>所要時間</span>
                <span>{seminar.duration_minutes}分</span>
              </div>
              <div className="flex justify-between">
                <span>登壇者</span>
                <span>
                  {seminar.speaker}
                  {seminar.speaker_title ? `（${seminar.speaker_title}）` : ""}
                </span>
              </div>
              {seminar.format && (
                <div className="flex justify-between">
                  <span>開催形式</span>
                  <span>{FORMAT_LABEL[seminar.format] || seminar.format}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>残席</span>
                <span>{remaining}名</span>
              </div>
            </div>
          </div>

          {/* 申し込みフォーム */}
          <BookingForm seminarId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
