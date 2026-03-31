import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// POST /api/newsletter/import-pending/[id]
// Body: { action: "keep_existing" | "use_new" }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  try {
    const { id } = await params;
    const { action } = await request.json() as { action: "keep_existing" | "use_new" };

    if (!["keep_existing", "use_new"].includes(action)) {
      return NextResponse.json({ error: "action は keep_existing または use_new です" }, { status: 400 });
    }

    const db = await getD1();
    const now = new Date().toISOString();

    // pending レコードを取得
    const pending = await db
      .prepare(`SELECT * FROM newsletter_import_pending WHERE id = ? AND status = 'pending'`)
      .bind(id)
      .first() as Record<string, string> | null;

    if (!pending) {
      return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });
    }

    if (action === "use_new") {
      // 既存レコードを新情報で上書き（空でない項目のみ）
      const fields: { col: string; val: string }[] = [
        { col: "name",       val: pending.new_name },
        { col: "company",    val: pending.new_company },
        { col: "department", val: pending.new_department },
        { col: "phone",      val: pending.new_phone },
        { col: "note",       val: pending.new_note },
      ].filter(({ val }) => val && val.trim() !== "");

      if (fields.length > 0) {
        const setClauses = [...fields.map(({ col }) => `${col} = ?`), "updated_at = ?"].join(", ");
        const values = [...fields.map(({ val }) => val), now, pending.existing_id];
        await db
          .prepare(`UPDATE newsletter_subscribers SET ${setClauses} WHERE id = ?`)
          .bind(...values)
          .run();
      }

      // 新タグを追加（既存タグは維持したまま追記）
      if (pending.new_tags) {
        const newTags = pending.new_tags.split(",").map((t) => t.trim()).filter(Boolean);
        for (const tag of newTags) {
          await db
            .prepare(`INSERT OR IGNORE INTO newsletter_tags (subscriber_id, tag, created_at) VALUES (?, ?, ?)`)
            .bind(pending.existing_id, tag, now)
            .run();
        }
      }
    }

    // pending を解決済みにマーク
    await db
      .prepare(`UPDATE newsletter_import_pending SET status = ?, resolved_at = ? WHERE id = ?`)
      .bind(action === "keep_existing" ? "kept_existing" : "used_new", now, id)
      .run();

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("[ImportPending] POST error:", error);
    return NextResponse.json({ error: "処理に失敗しました" }, { status: 500 });
  }
}
