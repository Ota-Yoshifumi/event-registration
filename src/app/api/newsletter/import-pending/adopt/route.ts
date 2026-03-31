import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// POST /api/newsletter/import-pending/adopt
// Body: { existingId: string, adoptPendingId: string | null }
//   adoptPendingId = null  → 既存レコードを採用（全 pending を dismissed にする）
//   adoptPendingId = "xxx" → そのpending の情報で既存を上書き（他 pending は dismissed）
export async function POST(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  try {
    const { existingId, adoptPendingId } = await request.json() as {
      existingId: string;
      adoptPendingId: string | null;
    };

    if (!existingId) return NextResponse.json({ error: "existingId が必要です" }, { status: 400 });

    const db = await getD1();
    const now = new Date().toISOString();

    if (adoptPendingId) {
      // ── pending の情報で既存レコードを上書き ──
      const pending = await db
        .prepare(`SELECT * FROM newsletter_import_pending WHERE id = ? AND status = 'pending'`)
        .bind(adoptPendingId)
        .first() as Record<string, string> | null;

      if (!pending) return NextResponse.json({ error: "対象が見つかりません" }, { status: 404 });

      // 空でない項目のみ上書き
      const fields: { col: string; val: string }[] = [
        { col: "name",       val: pending.new_name },
        { col: "company",    val: pending.new_company },
        { col: "department", val: pending.new_department },
        { col: "phone",      val: pending.new_phone },
        { col: "note",       val: pending.new_note },
      ].filter(({ val }) => val && val.trim() !== "");

      if (fields.length > 0) {
        const setClauses = [...fields.map(({ col }) => `${col} = ?`), "updated_at = ?"].join(", ");
        const values = [...fields.map(({ val }) => val), now, existingId];
        await db
          .prepare(`UPDATE newsletter_subscribers SET ${setClauses} WHERE id = ?`)
          .bind(...values)
          .run();
      }

      // 新タグを追記（既存タグは維持）
      if (pending.new_tags) {
        for (const tag of pending.new_tags.split(",").map((t) => t.trim()).filter(Boolean)) {
          await db
            .prepare(`INSERT OR IGNORE INTO newsletter_tags (subscriber_id, tag, created_at) VALUES (?, ?, ?)`)
            .bind(existingId, tag, now)
            .run();
        }
      }
    }

    // ── 同じ existing_id の全 pending を解決済みにする ──
    const resolveStatus = adoptPendingId ? "used_new" : "kept_existing";
    await db
      .prepare(
        `UPDATE newsletter_import_pending
         SET status = ?, resolved_at = ?
         WHERE existing_id = ? AND status = 'pending'`
      )
      .bind(resolveStatus, now, existingId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ImportPending/Adopt] POST error:", error);
    return NextResponse.json({ error: "処理に失敗しました" }, { status: 500 });
  }
}
