"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TENANT_OPTIONS = [
  { value: "whgc-seminars",   label: "WHGC セミナー" },
  { value: "kgri-pic-center", label: "KGRI PIC センター" },
  { value: "aff-events",      label: "AFF イベント" },
  { value: "pic-courses",     label: "PIC コース" },
] as const;

type TenantValue = (typeof TENANT_OPTIONS)[number]["value"];

export default function TenantLoginPage() {
  const router = useRouter();
  const [tenant, setTenant]     = useState<TenantValue>("whgc-seminars");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, tenant }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "ログインに失敗しました");
      }

      toast.success("ログインしました");
      router.replace(`/${tenant}/manage-console`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ログインに失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="force-light flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-foreground">管理画面ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* テナント選択 */}
            <div className="space-y-2">
              <Label htmlFor="tenant">テナント</Label>
              <select
                id="tenant"
                value={tenant}
                onChange={(e) => setTenant(e.target.value as TenantValue)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {TENANT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* パスワード */}
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="パスワードを入力"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
