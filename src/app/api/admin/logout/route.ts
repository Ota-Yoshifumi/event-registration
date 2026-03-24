import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/logout — admin_token Cookie を削除してログアウト
export async function POST(request: NextRequest) {
  const referer = request.headers.get("referer") ?? "";
  // テナント管理画面からのログアウトはテナントのログイン画面へ
  const tenantMatch = referer.match(/\/([\w-]+)\/manage-console/);
  const redirectPath = tenantMatch
    ? `/${tenantMatch[1]}/manage-console/login`
    : "/super-manage-console/login";

  const response = NextResponse.json({ success: true, redirect: redirectPath });
  response.cookies.set("admin_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // 即時削除
    path: "/",
  });
  return response;
}
