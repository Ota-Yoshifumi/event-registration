import { NextRequest, NextResponse } from "next/server";
import { getD1 } from "@/lib/d1";
import { verifyAdminRequest } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

// POST /api/newsletter/lists/[id]/quality-check
// リストメンバーの重複・姓名逆転を AI でチェック
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await verifyAdminRequest(request);
  if (!ok) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { id } = await params;

  try {
    const db = await getD1();

    // リストの全メンバーを取得
    const rows = await db.prepare(
      `SELECT s.id, s.email, s.name, s.company
       FROM newsletter_list_members m
       JOIN newsletter_subscribers s ON s.id = m.subscriber_id
       WHERE m.list_id = ?
       ORDER BY s.name`
    ).bind(id).all() as any;

    const members = (rows.results ?? []) as {
      id: string; email: string; name: string; company: string;
    }[];

    if (members.length === 0) {
      return NextResponse.json({ duplicates: [], reversed_names: [] });
    }

    // ─ 1. 名前の正規化（スペース除去）で重複グループを検出 ─
    const nameMap = new Map<string, typeof members>();
    for (const m of members) {
      const normalized = m.name.replace(/[\s　\t]/g, "");
      if (!normalized) continue;
      const group = nameMap.get(normalized) ?? [];
      group.push(m);
      nameMap.set(normalized, group);
    }

    const duplicates = [...nameMap.entries()]
      .filter(([, group]) => group.length > 1)
      .map(([name, group]) => ({
        name,
        count: group.length,
        subscribers: group.map((s) => ({ id: s.id, email: s.email, company: s.company })),
      }));

    // ─ 2. AI による姓名逆転チェック（最大 200 件まで） ─
    let reversedNames: { id: string; email: string; current_name: string; suggested_name: string; reason: string }[] = [];
    const toCheck = members.filter((m) => m.name && m.name.trim()).slice(0, 200);

    if (toCheck.length > 0 && process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const nameList = toCheck.map((m) => `${m.id}\t${m.name}`).join("\n");

      try {
        const response = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          messages: [{
            role: "user",
            content: `以下は日本語の人名リストです（形式: ID\t名前）。
姓名が逆順になっている可能性が高いものだけを抽出してください。
確信度が低いものは含めないでください。

${nameList}

JSON配列で返してください（逆転の可能性がなければ空配列）:
[{"id":"...","current_name":"...","suggested_name":"正しい順の名前","reason":"理由"}]
JSON以外は出力しないでください。`,
          }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text.trim() : "[]";
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          reversedNames = parsed
            .filter((r: any) => r.id && r.current_name && r.suggested_name)
            .map((r: any) => {
              const member = toCheck.find((m) => m.id === r.id);
              return {
                id: r.id,
                email: member?.email ?? "",
                current_name: r.current_name,
                suggested_name: r.suggested_name,
                reason: r.reason ?? "",
              };
            });
        }
      } catch {
        // AI エラーは無視（重複チェックの結果だけ返す）
      }
    }

    return NextResponse.json({ duplicates, reversed_names: reversedNames });
  } catch (error) {
    console.error("[lists/[id]/quality-check] POST error:", error);
    return NextResponse.json({ error: "チェックに失敗しました" }, { status: 500 });
  }
}
