import { getAccessToken } from "./auth";
import { v4 as uuidv4 } from "uuid";

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

export interface CalendarEventResult {
  eventId: string;
  meetUrl: string;
}

/**
 * 入力された日時文字列（"2025-02-15T14:30:00" など）を
 * 日本時間オフセット付きの RFC 3339 文字列に変換する。
 * Google Calendar API に "Asia/Tokyo" タイムゾーンと組み合わせ、
 * 正確に日本時間としてイベントを設定する。
 */
function toJSTDateTime(localDateTime: string): string {
  // 入力: "YYYY-MM-DDTHH:MM:00" （日本時間として扱う）
  // 出力: "YYYY-MM-DDTHH:MM:00+09:00"
  const base = localDateTime.replace(/\..*$/, "").replace(/\+.*$/, "").replace(/Z$/, "");
  return `${base}+09:00`;
}

/**
 * 開始日時の JST 文字列と終了時刻 "HH:mm" から、終了日時の JST RFC 3339 文字列を生成する。
 */
function buildEndJST(startJST: string, endTime: string): string {
  // startJST: "YYYY-MM-DDTHH:MM:00+09:00"
  const datePart = startJST.slice(0, 10); // "YYYY-MM-DD"
  return `${datePart}T${endTime}:00+09:00`;
}

export async function createCalendarEvent(
  title: string,
  startDateTime: string,
  endTime: string,
  description?: string
): Promise<CalendarEventResult> {
  const token = await getAccessToken();
  const calendarId = getCalendarId();

  const startJST = toJSTDateTime(startDateTime);
  const endJST = buildEndJST(startJST, endTime);

  const response = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: title,
        description: description || "",
        start: {
          dateTime: startJST,
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: endJST,
          timeZone: "Asia/Tokyo",
        },
        conferenceData: {
          createRequest: {
            conferenceSolutionKey: { type: "hangoutsMeet" },
            requestId: uuidv4(),
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create calendar event: ${error}`);
  }

  const data = await response.json();
  const meetUrl =
    data.conferenceData?.entryPoints?.find(
      (ep: { entryPointType: string; uri: string }) => ep.entryPointType === "video"
    )?.uri || "";

  return {
    eventId: data.id,
    meetUrl,
  };
}

export async function updateCalendarEvent(
  eventId: string,
  title: string,
  startDateTime: string,
  endTime: string,
  description?: string
): Promise<void> {
  const token = await getAccessToken();
  const calendarId = getCalendarId();

  const startJST = toJSTDateTime(startDateTime);
  const endJST = buildEndJST(startJST, endTime);

  const response = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: title,
        description: description || "",
        start: {
          dateTime: startJST,
          timeZone: "Asia/Tokyo",
        },
        end: {
          dateTime: endJST,
          timeZone: "Asia/Tokyo",
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update calendar event: ${error}`);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  const calendarId = getCalendarId();

  const response = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 410) {
    const error = await response.text();
    throw new Error(`Failed to delete calendar event: ${error}`);
  }
}
