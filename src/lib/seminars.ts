import { getMasterData, findMasterRowById, getSheetData } from "@/lib/google/sheets";
import { getTenantConfig } from "@/lib/tenant-config";
import type { Seminar } from "@/lib/types";

// マスタースプレッドシート「セミナー一覧」シートの列順 (20列固定):
// A:ID  B:title  C:description  D:date  E:end_time  F:capacity  G:current_bookings
// H:speaker  I:meet_url  J:calendar_event_id  K:status  L:spreadsheet_id
// M:speaker_title  N:format  O:target  P:invitation_code  Q:image_url
// R:created_at  S:updated_at  T:speaker_reference_url

/**
 * シートの1行を Seminar オブジェクトに変換する。
 * Google Sheets は末尾の空セルを省略して返す場合があるため、
 * 安全に参照できるよう 20 列までパディングする。
 */
export function rowToSeminar(row: string[]): Seminar {
  // 20列未満の場合は空文字で埋める（Google Sheets が末尾空セルを省略する対策）
  const r = [...row];
  while (r.length < 20) r.push("");

  return {
    id: r[0],
    title: r[1],
    description: r[2],
    date: r[3],
    end_time: r[4],
    capacity: parseInt(r[5] || "0", 10),
    current_bookings: parseInt(r[6] || "0", 10),
    speaker: r[7],
    meet_url: r[8],
    calendar_event_id: r[9],
    status: (r[10] as Seminar["status"]) || "draft",
    spreadsheet_id: r[11],
    speaker_title: r[12],
    format: (r[13] || "online") as Seminar["format"],
    target: (r[14] || "public") as Seminar["target"],
    invitation_code: r[15].trim(),
    image_url: r[16],
    created_at: r[17],
    updated_at: r[18],
    speaker_reference_url: r[19],
  };
}

/**
 * マスタースプレッドシートから1つのセミナーを ID で取得する。
 * Server Component から直接呼べる（APIルートへのself-fetchを経由しない）。
 */
export async function getSeminarById(id: string): Promise<Seminar | null> {
  try {
    const result = await findMasterRowById(id);
    if (!result) return null;
    return rowToSeminar(result.values);
  } catch (err) {
    console.error("[getSeminarById] failed for id:", id, err);
    return null;
  }
}

/**
 * マスタースプレッドシートから公開中のセミナー一覧を取得する。
 * Server Component から直接呼べる（APIルートへのself-fetchを経由しない）。
 */
export async function getPublishedSeminars(): Promise<Seminar[]> {
  try {
    const rows = await getMasterData();
    const seminars = rows
      .slice(1)
      .filter((row) => row[0]?.trim())
      .map(rowToSeminar)
      .filter((s) => s.status === "published");

    // 日付の近い順（昇順＝直近の日付が先）
    seminars.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return seminars;
  } catch {
    return [];
  }
}

/**
 * 指定テナントのマスターから公開中のセミナー一覧を取得する。
 * テナント未設定の場合は空配列を返す。
 * 各セミナーに tenant を付与し、予約APIで確実にテナントを渡せるようにする。
 */
export async function getPublishedSeminarsForTenant(
  tenant: string
): Promise<Seminar[]> {
  const config = getTenantConfig(tenant);
  if (!config) return [];
  try {
    const rows = await getSheetData(
      config.masterSpreadsheetId,
      "セミナー一覧"
    );
    const seminars = rows
      .slice(1)
      .filter((row) => row[0]?.trim())
      .map((row) => ({ ...rowToSeminar(row), tenant }))
      .filter((s) => s.status === "published");

    seminars.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return seminars;
  } catch {
    return [];
  }
}
