import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// POST /api/newsletter/subscribers/delete-by-tag
// Body: { tag: string, preview?: boolean }
// preview=true: returns count only; preview=false: deletes subscribers
export async function POST(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  try {
    const { tag, preview = false } = await request.json() as { tag: string; preview?: boolean };
    if (!tag?.trim()) return NextResponse.json({ error: "タグを指定してください" }, { status: 400 });

    const db = await getD1();

    // タグを持つ購読者IDを取得
    const rows = await db
      .prepare(`SELECT DISTINCT subscriber_id FROM newsletter_tags WHERE tag = ?`)
      .bind(tag.trim())
      .all() as { results: { subscriber_id: string }[] };

    const ids = rows.results.map((r) => r.subscriber_id);

    if (preview) {
      return NextResponse.json({ count: ids.length, tag });
    }

    if (ids.length === 0) {
      return NextResponse.json({ deleted: 0, tag });
    }

    // ON DELETE CASCADE で newsletter_tags も自動削除される
    const placeholders = ids.map(() => "?").join(", ");
    await db
      .prepare(`DELETE FROM newsletter_subscribers WHERE id IN (${placeholders})`)
      .bind(...ids)
      .run();

    return NextResponse.json({ deleted: ids.length, tag });
  } catch (error) {
    console.error("[Newsletter/DeleteByTag] POST error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
