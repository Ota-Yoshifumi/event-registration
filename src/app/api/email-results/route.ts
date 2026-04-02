import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// GET /api/email-results?tenant=whgc-seminars
// 配信済みスケジュール一覧（配信回ごとの集計）
export async function GET(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const tenant = searchParams.get("tenant");

  try {
    const db = await getD1();

    const rows = await db.prepare(`
      SELECT
        es.id                                              AS schedule_id,
        es.template_id,
        es.sent_at,
        es.seminar_id,
        et.name                                            AS template_name,
        s.title                                            AS seminar_title,
        COUNT(l.id)                                        AS total,
        SUM(CASE WHEN l.status != 'failed' THEN 1 ELSE 0 END)          AS sent_count,
        SUM(CASE WHEN l.delivered_at IS NOT NULL THEN 1 ELSE 0 END)    AS delivered_count,
        SUM(CASE WHEN l.opened_at IS NOT NULL THEN 1 ELSE 0 END)       AS opened_count,
        SUM(CASE WHEN l.bounced_at IS NOT NULL
                   OR l.status = 'bounced' THEN 1 ELSE 0 END)          AS bounced_count,
        SUM(CASE WHEN l.status = 'failed' THEN 1 ELSE 0 END)           AS failed_count
      FROM email_schedules es
      JOIN email_send_logs l  ON l.schedule_id = es.id
      JOIN email_templates et ON et.id = es.template_id
      JOIN seminars s         ON s.id = es.seminar_id
      ${tenant ? "WHERE s.tenant = ?" : ""}
      GROUP BY es.id
      ORDER BY es.sent_at DESC
    `).bind(...(tenant ? [tenant] : [])).all();

    return NextResponse.json(rows.results ?? []);
  } catch (err) {
    console.error("[email-results] GET error:", err);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
