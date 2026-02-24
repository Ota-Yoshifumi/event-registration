import { NextRequest, NextResponse } from "next/server";
import { getTenantAdminPassword, isTenantKey } from "@/lib/tenant-config";

// ブルートフォース対策: IP別ログイン試行管理
const rateLimitMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15分

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createToken(secret: string, tenant?: string): Promise<string> {
  const encoder = new TextEncoder();
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payloadObj: { role: string; tenant?: string; iat: number; exp: number } = {
    role: "admin",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
  };
  if (tenant) payloadObj.tenant = tenant;
  const payload = base64UrlEncode(encoder.encode(JSON.stringify(payloadObj)));

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${payload}`));
  const signatureEncoded = base64UrlEncode(new Uint8Array(signature));

  return `${header}.${payload}.${signatureEncoded}`;
}

export async function POST(request: NextRequest) {
  try {
    const { password, tenant } = await request.json();
    const jwtSecret = process.env.ADMIN_JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json({ error: "サーバー設定エラー" }, { status: 500 });
    }

    // IPアドレス取得とレート制限チェック
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip);
    if (rateLimit && rateLimit.lockedUntil > now) {
      const remainingMin = Math.ceil((rateLimit.lockedUntil - now) / 60000);
      return NextResponse.json(
        { error: `ログイン試行回数が上限を超えました。${remainingMin}分後に再試行してください。` },
        { status: 429 }
      );
    }

    let valid = false;
    let resolvedTenant: string | undefined;

    if (tenant && isTenantKey(tenant)) {
      const tenantPassword = getTenantAdminPassword(tenant);
      if (tenantPassword && password === tenantPassword) {
        valid = true;
        resolvedTenant = tenant;
      }
    }

    if (!valid) {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (adminPassword && password === adminPassword) {
        valid = true;
      }
    }

    if (!valid) {
      // 失敗回数をインクリメント
      const current = rateLimitMap.get(ip) ?? { count: 0, lockedUntil: 0 };
      const newCount = current.count + 1;
      rateLimitMap.set(ip, {
        count: newCount,
        lockedUntil: newCount >= MAX_ATTEMPTS ? now + LOCK_DURATION_MS : 0,
      });
      return NextResponse.json({ error: "パスワードが正しくありません" }, { status: 401 });
    }

    // ログイン成功時はレート制限をリセット
    rateLimitMap.delete(ip);

    const token = await createToken(jwtSecret, resolvedTenant);

    const response = NextResponse.json({ success: true, tenant: resolvedTenant });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "認証処理に失敗しました" }, { status: 500 });
  }
}
