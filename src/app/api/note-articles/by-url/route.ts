import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface NoteArticle {
  title: string;
  url: string;
  image: string;
  pubDate: string;
  creator: string;
}

/**
 * GET /api/note-articles/by-url?url=https://note.com/whgc_official/n/xxxx
 * note 個別記事ページから og:title / og:image / 公開日時 を取得して返す。
 * 固定表示したい記事のメタデータ取得に使用する。
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";

  if (!isAllowedNoteUrl(url)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EventRegistration/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 }, // 1時間キャッシュ
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "記事ページの取得に失敗しました" },
        { status: 502 }
      );
    }

    const html = await res.text();

    const title = stripSiteSuffix(
      extractMeta(html, "og:title") || extractTitleTag(html) || ""
    );
    const image = extractMeta(html, "og:image") || "";
    const pubDate =
      extractMeta(html, "article:published_time") ||
      extractMeta(html, "article:modified_time") ||
      extractLdJsonDate(html) ||
      "";
    const creator = extractMeta(html, "og:site_name") || "";

    const article: NoteArticle = { title, url, image, pubDate, creator };

    return NextResponse.json(article, {
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (err) {
    console.error("note by-url fetch error:", err);
    return NextResponse.json(
      { error: "記事ページの取得に失敗しました" },
      { status: 500 }
    );
  }
}

function isAllowedNoteUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "note.com" || host.endsWith(".note.com");
  } catch {
    return false;
  }
}

function extractMeta(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]*content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${escaped}["']`,
    "i"
  );
  return (html.match(re1)?.[1] || html.match(re2)?.[1] || "").trim();
}

function extractTitleTag(html: string): string {
  return (html.match(/<title>([^<]+)<\/title>/i)?.[1] || "").trim();
}

/** note.com は ld+json の datePublished に公開日を入れている */
function extractLdJsonDate(html: string): string {
  const m = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
  return m?.[1]?.trim() || "";
}

/** og:title 末尾の ｜サイト名｜キャッチコピー を除去して記事タイトルだけ取り出す */
function stripSiteSuffix(title: string): string {
  // 全角パイプ（｜/｜）または半角パイプ（|）で分割し、最初のセグメントだけ返す
  const idx = title.search(/[｜|]/);
  return idx > 0 ? title.slice(0, idx).trim() : title.trim();
}
