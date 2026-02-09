import { NextRequest, NextResponse } from "next/server";
import {
  getMemberDomains,
  addMemberDomain,
  removeMemberDomain,
  getMemberDomainsForTenant,
  addMemberDomainForTenant,
  removeMemberDomainForTenant,
} from "@/lib/google/sheets";
import { verifyAdminRequest } from "@/lib/auth";
import { isTenantKey } from "@/lib/tenant-config";

/**
 * GET: 会員企業ドメイン一覧を返す（管理画面・判定用）。
 */
export async function GET(request: NextRequest) {
  try {
    const tenant = new URL(request.url).searchParams.get("tenant");
    const tenantKey = tenant && isTenantKey(tenant) ? tenant : undefined;

    const domains = tenantKey
      ? await getMemberDomainsForTenant(tenantKey)
      : await getMemberDomains();
    return NextResponse.json(domains);
  } catch (error) {
    console.error("[member-domains GET]", error);
    return NextResponse.json(
      { error: "会員企業ドメインの取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST: 会員企業ドメインを1件追加する（管理者のみ）。
 * Body: { domain: string, tenant?: string }
 */
export async function POST(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const domain = typeof body.domain === "string" ? body.domain.trim() : "";
    const tenant = typeof body.tenant === "string" ? body.tenant : undefined;
    const tenantKey = tenant && isTenantKey(tenant) ? tenant : undefined;

    if (!domain) {
      return NextResponse.json(
        { error: "ドメインを入力してください" },
        { status: 400 }
      );
    }

    if (tenantKey) {
      await addMemberDomainForTenant(tenantKey, domain);
      const domains = await getMemberDomainsForTenant(tenantKey);
      return NextResponse.json(domains);
    } else {
      await addMemberDomain(domain);
      const domains = await getMemberDomains();
      return NextResponse.json(domains);
    }
  } catch (error) {
    console.error("[member-domains POST]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "追加に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 会員企業ドメインを1件削除する（管理者のみ）。
 * Body: { domain: string, tenant?: string } または Query: ?domain=xxx
 */
export async function DELETE(request: NextRequest) {
  const ok = await verifyAdminRequest(request);
  if (!ok) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  try {
    const url = new URL(request.url);
    let domain = url.searchParams.get("domain")?.trim() ?? "";
    let tenant: string | undefined;

    if (!domain) {
      const body = await request.json().catch(() => ({}));
      domain = typeof body.domain === "string" ? body.domain.trim() : "";
      tenant = typeof body.tenant === "string" ? body.tenant : undefined;
    }

    const tenantKey = tenant && isTenantKey(tenant) ? tenant : undefined;

    if (!domain) {
      return NextResponse.json(
        { error: "ドメインを指定してください" },
        { status: 400 }
      );
    }

    if (tenantKey) {
      await removeMemberDomainForTenant(tenantKey, domain);
      const domains = await getMemberDomainsForTenant(tenantKey);
      return NextResponse.json(domains);
    } else {
      await removeMemberDomain(domain);
      const domains = await getMemberDomains();
      return NextResponse.json(domains);
    }
  } catch (error) {
    console.error("[member-domains DELETE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "削除に失敗しました" },
      { status: 500 }
    );
  }
}
