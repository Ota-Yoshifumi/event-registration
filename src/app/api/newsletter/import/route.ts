import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";
import { randomUUID } from "crypto";

// POST /api/newsletter/import — CSV 一括インポート
// Body: { rows: [{email, name, company, department, phone, note, tags}[]], filename, source }
export async function POST(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  try {
    const body = await request.json();
    const { rows = [], filename = "", source = "csv_import", tags: globalTags = [] } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "データがありません" }, { status: 400 });
    }

    const db = await getD1();
    const now = new Date().toISOString();
    let imported = 0;
    let pending = 0;
    const errors: string[] = [];

    // インポート履歴を先に作成して batch_id を取得
    const batchResult = await db.prepare(
      `INSERT INTO newsletter_import_batches (filename, total, imported, skipped, created_at)
       VALUES (?, ?, 0, 0, ?) RETURNING id`
    ).bind(filename, rows.length, now).first() as { id: number } | null;
    const batchId = batchResult?.id ?? null;

    for (const row of rows) {
      const email = (row.email ?? "").toLowerCase().trim();
      if (!email || !email.includes("@")) { continue; }

      try {
        // 既存レコードを確認
        const existing = await db
          .prepare(
            `SELECT s.*, (SELECT GROUP_CONCAT(t.tag, ',') FROM newsletter_tags t WHERE t.subscriber_id = s.id) as tags
             FROM newsletter_subscribers s WHERE s.email = ?`
          )
          .bind(email)
          .first() as Record<string, string> | null;

        if (existing) {
          // ── 重複：既存と新情報を pending テーブルに保存 ──
          const newTags = [
            ...globalTags,
            ...(row.tags ? String(row.tags).split(/[,、]/).map((t: string) => t.trim()).filter(Boolean) : []),
          ];

          await db.prepare(
            `INSERT INTO newsletter_import_pending
               (id, batch_id, existing_id,
                existing_email, existing_name, existing_company, existing_department, existing_phone, existing_note, existing_tags,
                new_name, new_company, new_department, new_phone, new_note, new_tags,
                status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`
          ).bind(
            randomUUID(),
            batchId,
            existing.id,
            // 既存スナップショット
            existing.email ?? "",
            existing.name ?? "",
            existing.company ?? "",
            existing.department ?? "",
            existing.phone ?? "",
            existing.note ?? "",
            existing.tags ?? "",
            // CSV の新情報
            row.name ?? "",
            row.company ?? "",
            row.department ?? "",
            row.phone ?? "",
            row.note ?? "",
            newTags.join(","),
            now
          ).run();

          pending++;
        } else {
          // ── 新規：通常の INSERT ──
          const id = randomUUID();
          await db.prepare(
            `INSERT INTO newsletter_subscribers
               (id, email, name, company, department, phone, note, source, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
          ).bind(
            id, email,
            row.name ?? "", row.company ?? "", row.department ?? "",
            row.phone ?? "", row.note ?? "",
            source, now, now
          ).run();

          // タグ付与
          const rowTags = [
            ...globalTags,
            ...(row.tags ? String(row.tags).split(/[,、]/).map((t: string) => t.trim()).filter(Boolean) : []),
          ];
          for (const tag of rowTags) {
            if (tag) {
              await db.prepare(
                `INSERT OR IGNORE INTO newsletter_tags (subscriber_id, tag, created_at) VALUES (?, ?, ?)`
              ).bind(id, tag, now).run();
            }
          }

          imported++;
        }
      } catch {
        errors.push(email);
      }
    }

    // バッチ履歴を更新
    if (batchId) {
      await db.prepare(
        `UPDATE newsletter_import_batches SET imported = ?, skipped = ? WHERE id = ?`
      ).bind(imported, pending, batchId).run();
    }

    return NextResponse.json({ imported, pending, total: rows.length, errors });
  } catch (error) {
    console.error("[Newsletter/Import] POST error:", error);
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 });
  }
}
