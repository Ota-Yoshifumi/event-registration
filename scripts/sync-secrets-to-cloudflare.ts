/**
 * .env.local の環境変数を Cloudflare Workers のシークレットに反映する。
 * 実行: npx tsx scripts/sync-secrets-to-cloudflare.ts
 * 前提: wrangler がインストール済み、Cloudflare にログイン済み。
 */

import { config } from "dotenv";
import { resolve } from "path";
import { spawnSync } from "child_process";

config({ path: resolve(process.cwd(), ".env.local") });

const SECRET_NAMES = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_PRIVATE_KEY",
  "GOOGLE_PRIVATE_KEY_ID",
  "GOOGLE_SPREADSHEET_ID",
  "GOOGLE_DRIVE_FOLDER_ID",
  "GOOGLE_DRIVE_IMAGES_FOLDER_ID",
  "TENANT_WHGC_SEMINARS_MASTER_SPREADSHEET_ID",
  "TENANT_WHGC_SEMINARS_DRIVE_FOLDER_ID",
  "TENANT_WHGC_SEMINARS_DRIVE_IMAGES_FOLDER_ID",
  "TENANT_KGRI_PIC_CENTER_MASTER_SPREADSHEET_ID",
  "TENANT_KGRI_PIC_CENTER_DRIVE_FOLDER_ID",
  "TENANT_KGRI_PIC_CENTER_DRIVE_IMAGES_FOLDER_ID",
  "TENANT_AFF_EVENTS_MASTER_SPREADSHEET_ID",
  "TENANT_AFF_EVENTS_DRIVE_FOLDER_ID",
  "TENANT_AFF_EVENTS_DRIVE_IMAGES_FOLDER_ID",
  "TENANT_PIC_COURSES_MASTER_SPREADSHEET_ID",
  "TENANT_PIC_COURSES_DRIVE_FOLDER_ID",
  "TENANT_PIC_COURSES_DRIVE_IMAGES_FOLDER_ID",
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_IMPERSONATE_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_JWT_SECRET",
  "RESEND_API_KEY",
  "TENANT_WHGC_SEMINARS_RESEND_FROM_NAME",
  "TENANT_WHGC_SEMINARS_RESEND_FROM_EMAIL",
  "TENANT_WHGC_SEMINARS_RESEND_CONTACT_EMAIL",
  "TENANT_KGRI_PIC_CENTER_RESEND_FROM_NAME",
  "TENANT_KGRI_PIC_CENTER_RESEND_FROM_EMAIL",
  "TENANT_KGRI_PIC_CENTER_RESEND_CONTACT_EMAIL",
  "TENANT_AFF_EVENTS_RESEND_FROM_NAME",
  "TENANT_AFF_EVENTS_RESEND_FROM_EMAIL",
  "TENANT_AFF_EVENTS_RESEND_CONTACT_EMAIL",
  "TENANT_PIC_COURSES_RESEND_FROM_NAME",
  "TENANT_PIC_COURSES_RESEND_FROM_EMAIL",
  "TENANT_PIC_COURSES_RESEND_CONTACT_EMAIL",
  // RESEND_FROM_EMAIL は wrangler.toml [vars] に記載されているためここでは設定しない
];

function main() {
  console.log("Syncing .env.local secrets to Cloudflare...\n");

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const name of SECRET_NAMES) {
    const value = process.env[name];
    if (value === undefined || value === "") {
      console.log(`⏭ ${name}: (empty) skip`);
      skip++;
      continue;
    }

    const result = spawnSync(
      "npx",
      ["wrangler", "secret", "put", name],
      {
        input: value,
        stdio: ["pipe", "inherit", "inherit"],
        encoding: "utf8",
        cwd: process.cwd(),
      }
    );

    if (result.status === 0) {
      console.log(`✅ ${name}`);
      ok++;
    } else {
      console.log(`❌ ${name} (exit ${result.status})`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} set, ${skip} skipped, ${fail} failed.`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
