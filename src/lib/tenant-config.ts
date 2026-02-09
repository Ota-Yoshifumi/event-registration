/**
 * テナント設定（4テナントをハードコード）。
 * 環境変数からマスタースプレッドシートID・DriveフォルダIDを取得する。
 */

export const TENANT_KEYS = [
  "whgc-seminars",
  "kgri-pic-center",
  "aff-events",
  "pic-courses",
] as const;

export type TenantKey = (typeof TENANT_KEYS)[number];

export interface TenantConfig {
  masterSpreadsheetId: string;
  driveFolderId: string;
}

function getEnvKey(tenant: string): TenantKey | null {
  if (TENANT_KEYS.includes(tenant as TenantKey)) return tenant as TenantKey;
  return null;
}

/**
 * テナントの設定を返す。未設定の場合は null。
 */
export function getTenantConfig(tenant: string): TenantConfig | null {
  const key = getEnvKey(tenant);
  if (!key) return null;

  const masterId =
    key === "whgc-seminars"
      ? process.env.TENANT_WHGC_SEMINARS_MASTER_SPREADSHEET_ID
      : key === "kgri-pic-center"
        ? process.env.TENANT_KGRI_PIC_CENTER_MASTER_SPREADSHEET_ID
        : key === "aff-events"
          ? process.env.TENANT_AFF_EVENTS_MASTER_SPREADSHEET_ID
          : key === "pic-courses"
            ? process.env.TENANT_PIC_COURSES_MASTER_SPREADSHEET_ID
            : undefined;

  const folderId =
    key === "whgc-seminars"
      ? process.env.TENANT_WHGC_SEMINARS_DRIVE_FOLDER_ID
      : key === "kgri-pic-center"
        ? process.env.TENANT_KGRI_PIC_CENTER_DRIVE_FOLDER_ID
        : key === "aff-events"
          ? process.env.TENANT_AFF_EVENTS_DRIVE_FOLDER_ID
          : key === "pic-courses"
            ? process.env.TENANT_PIC_COURSES_DRIVE_FOLDER_ID
            : undefined;

  if (!masterId) return null;
  return {
    masterSpreadsheetId: masterId,
    driveFolderId: folderId ?? "",
  };
}

export function isTenantKey(pathSegment: string): pathSegment is TenantKey {
  return TENANT_KEYS.includes(pathSegment as TenantKey);
}

/** テナント別 Resend 設定（送信者名・送信元・問い合わせ先）。未設定時は null。 */
export interface TenantResendConfig {
  fromName: string;
  fromEmail: string;
  contactEmail: string;
}

const DEFAULT_RESEND_FROM_NAME = "アライアンス・フォーラム財団［送信専用］";
const DEFAULT_RESEND_CONTACT_EMAIL = "info@whgcforum.org";

/**
 * テナントの Resend 設定を返す。
 * テナント用の env が未設定の場合は共通の RESEND_FROM_EMAIL とデフォルト名・問い合わせ先を使う。
 */
export function getTenantResendConfig(tenant: string): TenantResendConfig {
  const key = getEnvKey(tenant);
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  if (!key) {
    return {
      fromName: DEFAULT_RESEND_FROM_NAME,
      fromEmail,
      contactEmail: DEFAULT_RESEND_CONTACT_EMAIL,
    };
  }

  const fromName =
    key === "whgc-seminars"
      ? process.env.TENANT_WHGC_SEMINARS_RESEND_FROM_NAME
      : key === "kgri-pic-center"
        ? process.env.TENANT_KGRI_PIC_CENTER_RESEND_FROM_NAME
        : key === "aff-events"
          ? process.env.TENANT_AFF_EVENTS_RESEND_FROM_NAME
          : key === "pic-courses"
            ? process.env.TENANT_PIC_COURSES_RESEND_FROM_NAME
            : undefined;

  const tenantFromEmail =
    key === "whgc-seminars"
      ? process.env.TENANT_WHGC_SEMINARS_RESEND_FROM_EMAIL
      : key === "kgri-pic-center"
        ? process.env.TENANT_KGRI_PIC_CENTER_RESEND_FROM_EMAIL
        : key === "aff-events"
          ? process.env.TENANT_AFF_EVENTS_RESEND_FROM_EMAIL
          : key === "pic-courses"
            ? process.env.TENANT_PIC_COURSES_RESEND_FROM_EMAIL
            : undefined;

  const contactEmail =
    key === "whgc-seminars"
      ? process.env.TENANT_WHGC_SEMINARS_RESEND_CONTACT_EMAIL
      : key === "kgri-pic-center"
        ? process.env.TENANT_KGRI_PIC_CENTER_RESEND_CONTACT_EMAIL
        : key === "aff-events"
          ? process.env.TENANT_AFF_EVENTS_RESEND_CONTACT_EMAIL
          : key === "pic-courses"
            ? process.env.TENANT_PIC_COURSES_RESEND_CONTACT_EMAIL
            : undefined;

  return {
    fromName: fromName?.trim() || DEFAULT_RESEND_FROM_NAME,
    fromEmail: tenantFromEmail?.trim() || fromEmail,
    contactEmail: contactEmail?.trim() || DEFAULT_RESEND_CONTACT_EMAIL,
  };
}

/**
 * テナントの管理画面パスワードを返す。未設定の場合は null。
 */
export function getTenantAdminPassword(tenant: string): string | null {
  const key = getEnvKey(tenant);
  if (!key) return null;

  const password =
    key === "whgc-seminars"
      ? process.env.TENANT_WHGC_SEMINARS_ADMIN_PASSWORD
      : key === "kgri-pic-center"
        ? process.env.TENANT_KGRI_PIC_CENTER_ADMIN_PASSWORD
        : key === "aff-events"
          ? process.env.TENANT_AFF_EVENTS_ADMIN_PASSWORD
          : key === "pic-courses"
            ? process.env.TENANT_PIC_COURSES_ADMIN_PASSWORD
            : undefined;

  return password ?? null;
}

/** テナントの表示名（ログイン画面の選択肢用） */
export const TENANT_LABELS: Record<TenantKey, string> = {
  "whgc-seminars": "WHGC セミナー",
  "kgri-pic-center": "KGRI PIC センター",
  "aff-events": "AFF イベント",
  "pic-courses": "PIC コース",
};
