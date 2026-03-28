import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";
import { resolveConditionIds } from "@/lib/newsletter/list-resolver";
import type { ListCondition } from "@/lib/newsletter/list-resolver";

// POST /api/newsletter/subscribers/search
// Body: { conditions: ListCondition[], page?: number, limit?: number, exclude_list_id?: string }
// Returns: { total, subscribers: { id, email, name, company, department }[], already_in_list: string[] }
export async function POST(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const conditions: ListCondition[] = body.conditions ?? [];
  const page = Math.max(1, Number(body.page ?? 1));
  const limit = Math.min(200, Math.max(1, Number(body.limit ?? 50)));
  const offset = (page - 1) * limit;
  const excludeListId: string | undefined = body.exclude_list_id;

  try {
    const db = await getD1();

    // 条件に一致する subscriber_id を取得
    const allIds = await resolveConditionIds(db, conditions);

    if (allIds.length === 0) {
      return NextResponse.json({ total: 0, subscribers: [], already_in_list: [] });
    }

    const pageIds = allIds.slice(offset, offset + limit);
    const placeholders = pageIds.map(() => "?").join(", ");

    const rows = await db.prepare(
      `SELECT id, email, name, company, department
       FROM newsletter_subscribers
       WHERE id IN (${placeholders})
       ORDER BY created_at ASC`
    ).bind(...pageIds).all() as any;

    // 既にリストに入っているIDを確認
    let alreadyInList: string[] = [];
    if (excludeListId && allIds.length > 0) {
      const allPlaceholders = allIds.map(() => "?").join(", ");
      const inListRows = await db.prepare(
        `SELECT subscriber_id FROM newsletter_list_members
         WHERE list_id = ? AND subscriber_id IN (${allPlaceholders})`
      ).bind(excludeListId, ...allIds).all() as any;
      alreadyInList = (inListRows.results ?? []).map((r: any) => r.subscriber_id);
    }

    return NextResponse.json({
      total: allIds.length,
      subscribers: rows.results ?? [],
      already_in_list: alreadyInList,
    });
  } catch (error) {
    console.error("[subscribers/search] POST error:", error);
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 500 });
  }
}
