import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";
import { resolveConditionIds } from "@/lib/newsletter/list-resolver";
import type { ListCondition } from "@/lib/newsletter/list-resolver";

// D1 の bind パラメーター上限は 100。大量 ID は 99 件ずつバッチ処理する
const D1_BATCH = 99;

async function fetchSubscribersByIds(
  db: any,
  ids: string[]
): Promise<{ id: string; email: string; name: string; company: string; department: string }[]> {
  const results: any[] = [];
  for (let i = 0; i < ids.length; i += D1_BATCH) {
    const batch = ids.slice(i, i + D1_BATCH);
    const ph = batch.map(() => "?").join(", ");
    const rows = await db.prepare(
      `SELECT id, email, name, company, department
       FROM newsletter_subscribers WHERE id IN (${ph}) ORDER BY created_at ASC`
    ).bind(...batch).all() as any;
    results.push(...(rows.results ?? []));
  }
  return results;
}

async function fetchAlreadyInList(
  db: any,
  listId: string,
  ids: string[]
): Promise<string[]> {
  const BATCH = D1_BATCH - 1; // listId が +1 されるため
  const result: string[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const ph = batch.map(() => "?").join(", ");
    const rows = await db.prepare(
      `SELECT subscriber_id FROM newsletter_list_members
       WHERE list_id = ? AND subscriber_id IN (${ph})`
    ).bind(listId, ...batch).all() as any;
    result.push(...(rows.results ?? []).map((r: any) => r.subscriber_id));
  }
  return result;
}

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

    // バッチ処理で購読者情報を取得（D1 bind 上限対応）
    const subscribers = await fetchSubscribersByIds(db, pageIds);

    // 既にリストに入っているIDを確認（バッチ処理）
    let alreadyInList: string[] = [];
    if (excludeListId && allIds.length > 0) {
      alreadyInList = await fetchAlreadyInList(db, excludeListId, allIds);
    }

    return NextResponse.json({
      total: allIds.length,
      subscribers,
      already_in_list: alreadyInList,
    });
  } catch (error) {
    console.error("[subscribers/search] POST error:", error);
    return NextResponse.json({ error: "検索に失敗しました" }, { status: 500 });
  }
}
