import { NextRequest, NextResponse } from "next/server";
import { getSheetData } from "@/lib/google/sheets";
import type { PreSurveyResponse, PostSurveyResponse } from "@/lib/types";

// 事前アンケート列順:
// A:ID B:予約ID C:関心度(1-5) D:期待すること E:関連経験 F:事前質問 G:回答日時 H:備考
function rowToPreSurvey(row: string[]): PreSurveyResponse {
  return {
    id: row[0] || "",
    reservation_id: row[1] || "",
    q1_interest_level: row[2] || "",
    q2_expectations: row[3] || "",
    q3_experience: row[4] || "",
    q4_questions: row[5] || "",
    submitted_at: row[6] || "",
    note: row[7] || "",
  };
}

// 事後アンケート列順:
// A:ID B:予約ID C:満足度(1-5) D:内容の質(1-5) E:登壇者評価(1-5)
// F:学んだこと G:改善点 H:推薦度(0-10) I:回答日時 J:備考
function rowToPostSurvey(row: string[]): PostSurveyResponse {
  return {
    id: row[0] || "",
    reservation_id: row[1] || "",
    q1_satisfaction: row[2] || "",
    q2_content_quality: row[3] || "",
    q3_speaker_rating: row[4] || "",
    q4_learnings: row[5] || "",
    q5_improvements: row[6] || "",
    q6_recommend: row[7] || "",
    submitted_at: row[8] || "",
    note: row[9] || "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const spreadsheetId = searchParams.get("spreadsheet_id");
    const type = searchParams.get("type"); // "pre" or "post"

    if (!spreadsheetId || !type) {
      return NextResponse.json(
        { error: "spreadsheet_id と type が必要です" },
        { status: 400 }
      );
    }

    if (type === "pre") {
      const rows = await getSheetData(spreadsheetId, "事前アンケート");
      const results = rows.slice(1).map(rowToPreSurvey);
      return NextResponse.json(results);
    }

    if (type === "post") {
      const rows = await getSheetData(spreadsheetId, "事後アンケート");
      const results = rows.slice(1).map(rowToPostSurvey);
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: "type は pre または post を指定してください" }, { status: 400 });
  } catch (error) {
    console.error("Error fetching survey results:", error);
    return NextResponse.json({ error: "アンケート結果の取得に失敗しました" }, { status: 500 });
  }
}
