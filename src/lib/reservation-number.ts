/**
 * 予約番号の生成・検証（形式: YYMM-XXYY、36進法2桁×2）
 * 設計: docs/member-invitation-and-reservation-number-design.md
 */

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

/** 0〜1295 を36進2桁の文字列に（00〜zz） */
export function toBase36Two(n: number): string {
  const clamped = Math.max(0, Math.min(1295, Math.floor(n)));
  const a = Math.floor(clamped / 36);
  const b = clamped % 36;
  return BASE36[a]! + BASE36[b]!;
}

/** 文字列から安定した数値（0〜1295）を生成（セミナーID用） */
function hashTo1296(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 1296;
  }
  return Math.abs(h);
}

/**
 * 予約番号を生成する。
 * @param seminarDate ISO日付文字列（セミナー開催日）
 * @param seminarId セミナーID（セミナー識別2桁の種）
 * @param receiptSequence 受付順（1-based。そのセミナーの既存予約件数+1）
 */
export function generateReservationNumber(
  seminarDate: string,
  seminarId: string,
  receiptSequence: number
): string {
  const d = new Date(seminarDate);
  const yy = d.getFullYear() % 100;
  const mm = d.getMonth() + 1;
  const yymm = String(yy).padStart(2, "0") + String(mm).padStart(2, "0");
  const seminarCode = toBase36Two(hashTo1296(seminarId));
  const receiptCode = toBase36Two(receiptSequence - 1); // 0-based for 00..zz
  return `${yymm}-${seminarCode}${receiptCode}`;
}

/** 予約番号の形式チェック（簡易: YYMM-XXXX の形） */
export function isValidReservationNumberFormat(s: string): boolean {
  return /^\d{4}-[0-9a-z]{4}$/.test(s.trim().toLowerCase());
}
