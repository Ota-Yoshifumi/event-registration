import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// GET /api/email-results/[scheduleId]
// 特定スケジュールの受信者ごとの配信ログ詳細
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { scheduleId } = await params;

  try {
    const db = await getD1();

    const rows = await db.prepare(`
      SELECT
        l.id,
        l.recipient_email,
        l.recipient_name,
        l.status,
        l.resend_id,
        l.sent_at,
        l.delivered_at,
        l.opened_at,
        l.bounced_at,
        l.error_message
      FROM email_send_logs l
      WHERE l.schedule_id = ?
      ORDER BY l.recipient_name ASC
    `).bind(scheduleId).all();

    return NextResponse.json(rows.results ?? []);
  } catch (err) {
    console.error("[email-results/detail] GET error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
