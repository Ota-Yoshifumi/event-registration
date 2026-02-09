import { NextRequest, NextResponse } from "next/server";
import {
  findMasterRowById,
  findMasterRowByIdForTenant,
  ensureSurveyQuestionSheets,
} from "@/lib/google/sheets";
import { rowToSeminar } from "@/lib/seminars";
import { isTenantKey } from "@/lib/tenant-config";

/**
 * 既存のセミナー用スプレッドシートに「事前アンケート設問」「事後アンケート設問」シートが
 * なければ追加する。既に存在する場合は何もしない。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = request.nextUrl.searchParams.get("tenant");
    let tenantKey: string | undefined;

    // bodyからもtenantを取得（POSTなので）
    try {
      const body = await request.json();
      if (body.tenant && isTenantKey(body.tenant)) {
        tenantKey = body.tenant;
      }
    } catch {
      // bodyが空の場合もある
    }

    if (!tenantKey && tenant && isTenantKey(tenant)) {
      tenantKey = tenant;
    }

    const result = tenantKey
      ? await findMasterRowByIdForTenant(tenantKey, id)
      : await findMasterRowById(id);
    if (!result) {
      return NextResponse.json(
        { error: "セミナーが見つかりません" },
        { status: 404 }
      );
    }

    const seminar = rowToSeminar(result.values);
    const spreadsheetId = seminar.spreadsheet_id;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: "このセミナーにはスプレッドシートが紐づいていません" },
        { status: 400 }
      );
    }

    const { addedPre, addedPost } = await ensureSurveyQuestionSheets(spreadsheetId);

    return NextResponse.json({
      success: true,
      addedPre,
      addedPost,
      message:
        addedPre || addedPost
          ? "アンケートシートを追加しました。"
          : "アンケートシートは既に存在します。",
    });
  } catch (error) {
    console.error("Error ensuring survey sheets:", error);
    return NextResponse.json(
      { error: "アンケートシートの追加に失敗しました" },
      { status: 500 }
    );
  }
}
