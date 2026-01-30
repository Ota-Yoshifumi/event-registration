// スプレッドシート作成テスト
import 'dotenv/config';

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

function base64UrlEncode(data) {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function strToUint8Array(str) {
  return new TextEncoder().encode(str);
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function signJWT(payload, privateKeyPem, keyId) {
  const header = { alg: "RS256", typ: "JWT", kid: keyId };
  const headerEncoded = base64UrlEncode(strToUint8Array(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(strToUint8Array(JSON.stringify(payload)));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const keyData = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signingData = strToUint8Array(signingInput);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signingData.buffer);
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const keyId = process.env.GOOGLE_PRIVATE_KEY_ID;

  const now = Math.floor(Date.now() / 1000);
  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
  ].join(" ");

  const impersonateEmail = process.env.GOOGLE_IMPERSONATE_EMAIL;

  const payload = {
    iss: email,
    scope: scopes,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  if (impersonateEmail) {
    payload.sub = impersonateEmail;
    console.log(`  (ユーザー ${impersonateEmail} として委任)`);
  }

  const jwt = await signJWT(payload, privateKey, keyId);
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token error: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function main() {
  console.log("=== スプレッドシート作成テスト ===\n");

  try {
    console.log("Step 1: アクセストークン取得...");
    const token = await getAccessToken();
    console.log("  ✓ 成功\n");

    console.log("Step 2: 新規スプレッドシート作成テスト...");
    const createRes = await fetch(SHEETS_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: "【テスト】セミナー作成テスト",
        },
        sheets: [
          { properties: { title: "イベント情報", index: 0 } },
          { properties: { title: "予約情報", index: 1 } },
        ],
      }),
    });

    if (!createRes.ok) {
      const error = await createRes.text();
      console.error("  ✗ 失敗");
      console.error("  ステータス:", createRes.status);
      console.error("  エラー:", error);
      return;
    }

    const spreadsheet = await createRes.json();
    console.log("  ✓ 成功");
    console.log("  スプレッドシートID:", spreadsheet.spreadsheetId);
    console.log("  URL:", spreadsheet.spreadsheetUrl);

    console.log("\n=== テスト完了 ===");
    console.log("\n作成されたスプレッドシートは手動で削除してください。");

  } catch (error) {
    console.error("エラー:", error.message);
  }
}

main();
