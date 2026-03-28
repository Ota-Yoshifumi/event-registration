import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// GET /api/newsletter/lists/[id]/members?page=1&limit=50
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const page  = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const offset = (page - 1) * limit;

  try {
    const db = await getD1();

    const countRow = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM newsletter_list_members WHERE list_id = ?`
    ).bind(id).first() as any;

    const rows = await db.prepare(
      `SELECT m.subscriber_id, m.added_at,
              s.email, s.name, s.company, s.department, s.status AS sub_status
       FROM newsletter_list_members m
       JOIN newsletter_subscribers s ON s.id = m.subscriber_id
       WHERE m.list_id = ?
       ORDER BY m.added_at DESC
       LIMIT ? OFFSET ?`
    ).bind(id, limit, offset).all() as any;

    return NextResponse.json({
      total: countRow?.cnt ?? 0,
      page,
      limit,
      members: rows.results ?? [],
    });
  } catch (error) {
    console.error("[lists/[id]/members] GET error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}

// POST /api/newsletter/lists/[id]/members — 購読者をリストに追加
// Body: { subscriber_ids: string[] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const subscriberIds: string[] = body.subscriber_ids ?? [];

  if (subscriberIds.length === 0) {
    return NextResponse.json({ added: 0 });
  }

  try {
    const db = await getD1();
    const now = new Date().toISOString();
    let added = 0;

    for (const sid of subscriberIds) {
      try {
        await db.prepare(
          `INSERT OR IGNORE INTO newsletter_list_members (list_id, subscriber_id, added_at)
           VALUES (?, ?, ?)`
        ).bind(id, sid, now).run();
        added++;
      } catch {
        // 重複は無視
      }
    }

    // preview_count を更新
    const countRow = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM newsletter_list_members WHERE list_id = ?`
    ).bind(id).first() as any;
    await db.prepare(
      `UPDATE newsletter_lists SET preview_count = ?, updated_at = ? WHERE id = ?`
    ).bind(countRow?.cnt ?? 0, now, id).run();

    return NextResponse.json({ added });
  } catch (error) {
    console.error("[lists/[id]/members] POST error:", error);
    return NextResponse.json({ error: "追加に失敗しました" }, { status: 500 });
  }
}

// DELETE /api/newsletter/lists/[id]/members
// Body: { subscriber_ids: string[] } or { all: true }
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  try {
    const db = await getD1();
    const now = new Date().toISOString();

    if (body.all) {
      await db.prepare(
        `DELETE FROM newsletter_list_members WHERE list_id = ?`
      ).bind(id).run();
    } else {
      const subscriberIds: string[] = body.subscriber_ids ?? [];
      if (subscriberIds.length === 0) return NextResponse.json({ removed: 0 });
      for (const sid of subscriberIds) {
        await db.prepare(
          `DELETE FROM newsletter_list_members WHERE list_id = ? AND subscriber_id = ?`
        ).bind(id, sid).run();
      }
    }

    // preview_count を更新
    const countRow = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM newsletter_list_members WHERE list_id = ?`
    ).bind(id).first() as any;
    await db.prepare(
      `UPDATE newsletter_lists SET preview_count = ?, updated_at = ? WHERE id = ?`
    ).bind(countRow?.cnt ?? 0, now, id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[lists/[id]/members] DELETE error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
