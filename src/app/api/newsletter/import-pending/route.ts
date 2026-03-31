import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";

// GET /api/newsletter/import-pending — 重複保留一覧（existing_id でグループ化）
export async function GET(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  try {
    const db = await getD1();

    // pending + 現在の既存レコードを JOIN して取得
    const rows = await db
      .prepare(
        `SELECT p.*,
           s.name    AS current_name,
           s.company AS current_company,
           s.department AS current_department,
           s.phone   AS current_phone,
           s.note    AS current_note,
           s.status  AS current_status,
           (SELECT GROUP_CONCAT(t.tag, ',') FROM newsletter_tags t WHERE t.subscriber_id = s.id) AS current_tags
         FROM newsletter_import_pending p
         JOIN newsletter_subscribers s ON s.id = p.existing_id
         WHERE p.status = 'pending'
         ORDER BY p.existing_id, p.created_at`
      )
      .all();

    // existing_id でグループ化
    const groupMap = new Map<string, {
      existingId: string;
      email: string;
      currentName: string;
      currentCompany: string;
      currentDepartment: string;
      currentPhone: string;
      currentNote: string;
      currentTags: string;
      currentStatus: string;
      pending: unknown[];
    }>();

    for (const row of rows.results as Record<string, string>[]) {
      if (!groupMap.has(row.existing_id)) {
        groupMap.set(row.existing_id, {
          existingId: row.existing_id,
          email: row.existing_email,
          currentName: row.current_name ?? "",
          currentCompany: row.current_company ?? "",
          currentDepartment: row.current_department ?? "",
          currentPhone: row.current_phone ?? "",
          currentNote: row.current_note ?? "",
          currentTags: row.current_tags ?? "",
          currentStatus: row.current_status ?? "active",
          pending: [],
        });
      }
      groupMap.get(row.existing_id)!.pending.push({
        id: row.id,
        newName: row.new_name,
        newCompany: row.new_company,
        newDepartment: row.new_department,
        newPhone: row.new_phone,
        newNote: row.new_note,
        newTags: row.new_tags,
        createdAt: row.created_at,
      });
    }

    const groups = Array.from(groupMap.values());

    return NextResponse.json({
      groups,
      total: groups.length,   // グループ数（メールアドレス数）
    });
  } catch (error) {
    console.error("[ImportPending] GET error:", error);
    return NextResponse.json({ error: "取得に失敗しました" }, { status: 500 });
  }
}
