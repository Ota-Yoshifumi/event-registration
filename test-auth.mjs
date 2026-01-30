// Google API認証テストスクリプト
import 'dotenv/config';

const TOKEN_URL = "https://oauth2.googleapis.com/token";

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
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: keyId,
  };

  const headerEncoded = base64UrlEncode(strToUint8Array(JSON.stringify(header)));
  const payloadEncoded = base64UrlEncode(strToUint8Array(JSON.stringify(payload)));
  const signingInput = `${headerEncoded}.${payloadEncoded}`;

  const keyData = pemToArrayBuffer(privateKeyPem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signingData = strToUint8Array(signingInput);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signingData.buffer
  );

  const signatureEncoded = base64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${signatureEncoded}`;
}

async function main() {
  console.log("=== Google API認証テスト ===\n");

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const keyId = process.env.GOOGLE_PRIVATE_KEY_ID;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const impersonateEmail = process.env.GOOGLE_IMPERSONATE_EMAIL;

  console.log("環境変数チェック:");
  console.log("  - GOOGLE_SERVICE_ACCOUNT_EMAIL:", email ? "✓ 設定済み" : "✗ 未設定");
  console.log("  - GOOGLE_PRIVATE_KEY:", privateKey ? "✓ 設定済み" : "✗ 未設定");
  console.log("  - GOOGLE_PRIVATE_KEY_ID:", keyId ? "✓ 設定済み" : "✗ 未設定");
  console.log("  - GOOGLE_SPREADSHEET_ID:", spreadsheetId ? `✓ ${spreadsheetId}` : "✗ 未設定");
  console.log("  - GOOGLE_IMPERSONATE_EMAIL:", impersonateEmail || "(未設定 - ドメイン全体の委任なし)");
  console.log("");

  if (!email || !privateKey || !keyId) {
    console.error("必要な環境変数が設定されていません");
    process.exit(1);
  }

  // Step 1: トークン取得
  console.log("Step 1: アクセストークン取得中...");

  const now = Math.floor(Date.now() / 1000);
  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/drive",
  ].join(" ");

  const payload = {
    iss: email,
    scope: scopes,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  // ドメイン全体の委任を使う場合
  if (impersonateEmail) {
    payload.sub = impersonateEmail;
    console.log(`  (ユーザー ${impersonateEmail} として委任)`)
  }

  try {
    const jwt = await signJWT(payload, privateKey, keyId);
    console.log("  JWT署名: ✓ 成功");

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
      console.error("  トークン取得: ✗ 失敗");
      console.error("  エラー:", error);
      process.exit(1);
    }

    const data = await response.json();
    console.log("  トークン取得: ✓ 成功");
    const token = data.access_token;

    // Step 2: スプレッドシート読み込みテスト
    console.log("\nStep 2: スプレッドシート読み込みテスト...");

    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/セミナー一覧`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!sheetsResponse.ok) {
      const error = await sheetsResponse.text();
      console.error("  スプレッドシート読み込み: ✗ 失敗");
      console.error("  エラー:", error);
      console.log("\n考えられる原因:");
      console.log("  1. スプレッドシートがサービスアカウントと共有されていない");
      console.log("  2. シート名「セミナー一覧」が存在しない");
      console.log("  3. スプレッドシートIDが間違っている");
      process.exit(1);
    }

    const sheetsData = await sheetsResponse.json();
    console.log("  スプレッドシート読み込み: ✓ 成功");
    console.log("  データ行数:", (sheetsData.values || []).length);

    console.log("\n=== すべてのテストが成功しました ===");

  } catch (error) {
    console.error("エラー:", error.message);
    process.exit(1);
  }
}

main();
