"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Mail,
  MailCheck,
  MailOpen,
  MailX,
  AlertCircle,
  X,
} from "lucide-react";

const TENANT = "whgc-seminars";

const ANNOUNCE_TEMPLATE_IDS = ["announce_30", "announce_14", "announce_7"];

const TEMPLATE_LABELS: Record<string, string> = {
  announce_30:  "30日前告知",
  announce_14:  "2週間前告知",
  announce_7:   "1週間前告知",
  reminder_30:  "2週間前リマインド",
  reminder_7:   "7日前リマインド",
  reminder_1:   "前日リマインド",
  followup_1:   "御礼・アンケート",
};

interface SendBatch {
  schedule_id: number;
  template_id: string;
  template_name: string;
  seminar_id: string;
  seminar_title: string;
  sent_at: string;
  total: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  bounced_count: number;
  failed_count: number;
}

interface LogDetail {
  id: number;
  recipient_email: string;
  recipient_name: string;
  status: string;
  resend_id: string | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  bounced_at: string | null;
  error_message: string | null;
}

function formatJst(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function pct(num: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((num / total) * 100)}%`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    sent:       { label: "送信済",   className: "bg-blue-100 text-blue-700 border-blue-200" },
    delivered:  { label: "到達",     className: "bg-green-100 text-green-700 border-green-200" },
    bounced:    { label: "バウンス", className: "bg-red-100 text-red-700 border-red-200" },
    complained: { label: "苦情",     className: "bg-orange-100 text-orange-700 border-orange-200" },
    failed:     { label: "失敗",     className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const s = map[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function RecipientStatus({ log }: { log: LogDetail }) {
  // 最終ステータスを判定
  if (log.bounced_at || log.status === "bounced") return <StatusBadge status="bounced" />;
  if (log.status === "complained") return <StatusBadge status="complained" />;
  if (log.status === "failed") return <StatusBadge status="failed" />;
  if (log.opened_at) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
        <MailOpen className="size-3" />開封済
      </span>
    );
  }
  if (log.delivered_at) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <MailCheck className="size-3" />到達
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
      <Mail className="size-3" />送信済
    </span>
  );
}

export default function EmailResultsPage() {
  const [batches, setBatches] = useState<SendBatch[]>([]);
  const [loading, setLoading] = useState(true);

  // 詳細モーダル
  const [detailScheduleId, setDetailScheduleId] = useState<number | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailLogs, setDetailLogs] = useState<LogDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // セミナー別折りたたみ
  const [collapsedSeminars, setCollapsedSeminars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`/api/email-results?tenant=${TENANT}`)
      .then((r) => r.json())
      .then((data) => {
        setBatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function openDetail(batch: SendBatch) {
    setDetailScheduleId(batch.schedule_id);
    setDetailTitle(`${batch.seminar_title} ／ ${TEMPLATE_LABELS[batch.template_id] ?? batch.template_name}`);
    setDetailLogs([]);
    setDetailLoading(true);
    const res = await fetch(`/api/email-results/${batch.schedule_id}`);
    const data = await res.json();
    setDetailLogs(Array.isArray(data) ? data : []);
    setDetailLoading(false);
  }

  function closeDetail() {
    setDetailScheduleId(null);
  }

  function toggleSeminar(seminarId: string) {
    setCollapsedSeminars((prev) => ({ ...prev, [seminarId]: !prev[seminarId] }));
  }

  // セミナーごとにグループ化
  const grouped: Record<string, { title: string; batches: SendBatch[] }> = {};
  for (const b of batches) {
    if (!grouped[b.seminar_id]) {
      grouped[b.seminar_id] = { title: b.seminar_title, batches: [] };
    }
    grouped[b.seminar_id].batches.push(b);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="size-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">配信結果一覧</h1>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      )}

      {!loading && batches.length === 0 && (
        <Card className="admin-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            配信済みのメールはまだありません
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([seminarId, group]) => {
        const isCollapsed = collapsedSeminars[seminarId] ?? false;
        const totalSent = group.batches.reduce((s, b) => s + b.total, 0);

        return (
          <div key={seminarId} className="space-y-2">
            {/* セミナーヘッダー */}
            <button
              onClick={() => toggleSeminar(seminarId)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/70"
            >
              {isCollapsed ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="size-4 text-muted-foreground" />
              )}
              <span className="flex-1 font-semibold text-foreground">{group.title}</span>
              <span className="text-xs text-muted-foreground">
                {group.batches.length} 回配信 ／ 延べ {totalSent} 件
              </span>
            </button>

            {!isCollapsed && (
              <div className="space-y-3 pl-2">
                {group.batches.map((batch) => {
                  const deliverRate = pct(batch.delivered_count, batch.sent_count);
                  const openRate    = pct(batch.opened_count, batch.delivered_count || batch.sent_count);
                  const isAnnounce  = ANNOUNCE_TEMPLATE_IDS.includes(batch.template_id);
                  const accentBorder = isAnnounce ? "border-l-orange-400" : "border-l-blue-400";
                  const categoryBadge = isAnnounce
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";
                  const categoryLabel = isAnnounce ? "告知集客用" : "予約者向け";

                  return (
                    <Card key={batch.schedule_id} className={`admin-card overflow-hidden border-l-4 ${accentBorder}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${categoryBadge}`}>
                                {categoryLabel}
                              </span>
                              <Badge variant="outline" className="text-xs font-normal">
                                {TEMPLATE_LABELS[batch.template_id] ?? batch.template_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatJst(batch.sent_at)} 配信
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs"
                            onClick={() => openDetail(batch)}
                          >
                            受信者詳細
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {/* 集計バー */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <StatCard
                            icon={<Mail className="size-4 text-blue-500" />}
                            label="送信数"
                            value={batch.total}
                            sub={batch.failed_count > 0 ? `失敗 ${batch.failed_count}` : undefined}
                            subColor="text-red-500"
                          />
                          <StatCard
                            icon={<MailCheck className="size-4 text-green-500" />}
                            label="到達"
                            value={batch.delivered_count}
                            sub={deliverRate}
                          />
                          <StatCard
                            icon={<MailOpen className="size-4 text-purple-500" />}
                            label="開封"
                            value={batch.opened_count}
                            sub={openRate}
                          />
                          <StatCard
                            icon={<MailX className="size-4 text-red-500" />}
                            label="バウンス"
                            value={batch.bounced_count}
                            sub={pct(batch.bounced_count, batch.total)}
                          />
                        </div>

                        {/* 進捗バー */}
                        {batch.total > 0 && (
                          <div className="mt-3 space-y-1">
                            <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="bg-purple-400 transition-all"
                                style={{ width: `${(batch.opened_count / batch.total) * 100}%` }}
                              />
                              <div
                                className="bg-green-400 transition-all"
                                style={{ width: `${((batch.delivered_count - batch.opened_count) / batch.total) * 100}%` }}
                              />
                              <div
                                className="bg-red-400 transition-all"
                                style={{ width: `${(batch.bounced_count / batch.total) * 100}%` }}
                              />
                            </div>
                            <div className="flex gap-4 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-purple-400" />開封</span>
                              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-green-400" />到達</span>
                              <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-full bg-red-400" />バウンス</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 受信者詳細モーダル */}
      <Dialog open={detailScheduleId !== null} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="force-light max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
            <DialogTitle className="text-base font-semibold pr-8">{detailTitle}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {detailLoading && (
              <p className="text-sm text-muted-foreground py-8 text-center">読み込み中...</p>
            )}

            {!detailLoading && detailLogs.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">データがありません</p>
            )}

            {!detailLoading && detailLogs.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 text-left font-medium pr-4">氏名</th>
                      <th className="pb-2 text-left font-medium pr-4">メールアドレス</th>
                      <th className="pb-2 text-left font-medium pr-4 w-24">ステータス</th>
                      <th className="pb-2 text-left font-medium pr-4 w-36">到達日時</th>
                      <th className="pb-2 text-left font-medium w-36">開封日時</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {detailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="py-2.5 pr-4 font-medium text-foreground whitespace-nowrap">
                          {log.recipient_name || "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                          {log.recipient_email}
                        </td>
                        <td className="py-2.5 pr-4">
                          <RecipientStatus log={log} />
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                          {log.delivered_at ? formatJst(log.delivered_at) : "—"}
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {log.opened_at ? formatJst(log.opened_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 失敗があれば別セクションで表示 */}
                {detailLogs.some((l) => l.status === "failed") && (
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="size-4 text-red-500" />
                      <p className="text-sm font-medium text-red-700">送信失敗</p>
                    </div>
                    {detailLogs
                      .filter((l) => l.status === "failed")
                      .map((log) => (
                        <div key={log.id} className="text-xs text-red-600 space-y-0.5">
                          <p className="font-medium">{log.recipient_name} &lt;{log.recipient_email}&gt;</p>
                          <p className="text-red-500">{log.error_message}</p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border px-6 py-3 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {detailLogs.length} 件
            </p>
            <Button variant="outline" size="sm" onClick={closeDetail}>
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  subColor = "text-muted-foreground",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  subColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xl font-bold leading-tight text-foreground">{value}</p>
        {sub && <p className={`text-[10px] ${subColor}`}>{sub}</p>}
      </div>
    </div>
  );
}
