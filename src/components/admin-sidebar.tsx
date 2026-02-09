"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "", label: "実施一覧", icon: "📊" },
  { path: "/reservations", label: "予約一覧", icon: "📋" },
  { path: "/member-domains", label: "会員企業ドメイン", icon: "📧" },
  { path: "/surveys", label: "アンケート結果", icon: "📝" },
];

interface AdminSidebarProps {
  /** 管理画面のベースパス（例: /admin または /whgc-seminars/admin） */
  basePath?: string;
  /** 公開サイトへのリンク（例: /seminars または /whgc-seminars） */
  publicPath?: string;
}

export function AdminSidebar({
  basePath = "/admin",
  publicPath = "/seminars",
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar font-sans">
      <div className="p-4 pb-2">
        <Link
          href={basePath}
          className="text-lg font-bold tracking-tight text-sidebar-foreground"
        >
          管理画面
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {navItems.map((item) => {
          const href = `${basePath}${item.path}`;
          const isActive =
            item.path === ""
              ? pathname === basePath
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4 pt-4">
        <Link
          href={publicPath}
          className="text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground"
        >
          公開サイトへ →
        </Link>
      </div>
    </aside>
  );
}
