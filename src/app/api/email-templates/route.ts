import { NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import type { EmailTemplate } from "@/lib/d1";

// Next.js のルートキャッシュを無効化（常に最新の D1 データを返す）
export const dynamic = "force-dynamic";

// GET /api/email-templates - 全テンプレート取得
export async function GET() {
  try {
    const db = await getD1();
    const raw = await db.prepare(
      "SELECT * FROM email_templates ORDER BY id"
    ).all() as any;
    const results = (raw.results ?? []) as EmailTemplate[];
    return NextResponse.json(results);
  } catch (error) {
    console.error("[EmailTemplates] GET error:", error);
    return NextResponse.json({ error: "テンプレートの取得に失敗しました" }, { status: 500 });
  }
}
