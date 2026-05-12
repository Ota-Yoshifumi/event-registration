"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";

interface NoteArticle {
  title: string;
  url: string;
  image: string;
  pubDate: string;
  creator: string;
}

/** pubDate（RFC 2822）を「○日前 / ○週間前 / ○か月前」に変換 */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "今日";
  if (diffDays === 1) return "1日前";
  if (diffDays < 7) return `${diffDays}日前`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}週間前`;
  }
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months}か月前`;
  const years = Math.floor(months / 12);
  return `${years}年前`;
}

const NOTE_USER = "whgc_official";

// 固定表示する記事 URL（真ん中・右側）
const PINNED_MIDDLE_URL = "https://note.com/whgc_official/n/n6fbb7d815872";
const PINNED_RIGHT_URL = "https://note.com/whgc_official/n/n4e23e4029d03";

export function NoteArticlesSection() {
  const [articles, setArticles] = useState<NoteArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/note-articles?user=${NOTE_USER}&limit=10`)
        .then((res) => res.json())
        .catch(() => []),
      fetch(
        `/api/note-articles/by-url?url=${encodeURIComponent(PINNED_MIDDLE_URL)}`
      )
        .then((res) => res.json())
        .catch(() => null),
      fetch(
        `/api/note-articles/by-url?url=${encodeURIComponent(PINNED_RIGHT_URL)}`
      )
        .then((res) => res.json())
        .catch(() => null),
    ])
      .then(([list, middle, right]) => {
        const items: NoteArticle[] = Array.isArray(list) ? list : [];
        const pinnedUrls = new Set([PINNED_MIDDLE_URL, PINNED_RIGHT_URL]);

        // 左側: 固定 URL 以外の最新記事
        const leftFromList = items.find((a) => !pinnedUrls.has(a.url));

        // 固定記事のメタ取得に失敗した場合は RSS 内から探す
        const middleArticle: NoteArticle | null =
          middle && middle.url
            ? middle
            : items.find((a) => a.url === PINNED_MIDDLE_URL) || null;
        const rightArticle: NoteArticle | null =
          right && right.url
            ? right
            : items.find((a) => a.url === PINNED_RIGHT_URL) || null;

        const result: NoteArticle[] = [];
        if (leftFromList) result.push(leftFromList);
        if (middleArticle) result.push(middleArticle);
        if (rightArticle) result.push(rightArticle);
        setArticles(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 記事がなければセクション自体非表示
  if (!loading && articles.length === 0) return null;

  return (
    <section className="content-container section-stack">
      {/* ヘッダー行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <Newspaper className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            最近の活動報告
          </h2>
        </div>
        <a
          href={`https://note.com/${NOTE_USER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          noteで全記事を見る
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* カードグリッド */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[var(--block-gap)]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl bg-muted aspect-[4/3]"
            />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-[var(--block-gap)]">
          {articles.map((article) => (
            <a
              key={article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl overflow-hidden bg-card border border-border hover:shadow-xl transition-all duration-300"
            >
              {/* サムネイル */}
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                )}
                {!article.image && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Newspaper className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* テキスト（global.css の block-stack-tight / フォント規定に合わせる） */}
              <div className="p-5 block-stack-tight">
                <p className="text-sm text-muted-foreground">
                  {formatRelativeDate(article.pubDate)}
                </p>
                <h3 className="text-base font-semibold text-foreground leading-relaxed line-clamp-3 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold">
                    W
                  </div>
                  <span className="text-sm text-muted-foreground">
                    WHGC公式
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* モバイル用リンク */}
      <a
        href={`https://note.com/${NOTE_USER}`}
        target="_blank"
        rel="noopener noreferrer"
        className="sm:hidden flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        noteで全記事を見る
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </section>
  );
}
