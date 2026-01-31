"use client";

import { useState, useMemo } from "react";
import { SeminarCard } from "@/components/seminar-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Seminar } from "@/lib/types";

interface SeminarListClientProps {
  seminars: Seminar[];
}

export function SeminarListClient({ seminars }: SeminarListClientProps) {
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return seminars.filter((s) => {
      if (formatFilter !== "all" && s.format !== formatFilter) return false;
      if (targetFilter !== "all" && s.target !== targetFilter) return false;
      return true;
    });
  }, [seminars, formatFilter, targetFilter]);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label htmlFor="filter-format" className="text-sm">開催形式</Label>
          <Select value={formatFilter} onValueChange={setFormatFilter}>
            <SelectTrigger id="filter-format" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="online">オンライン</SelectItem>
              <SelectItem value="venue">会場</SelectItem>
              <SelectItem value="hybrid">ハイブリッド</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-target" className="text-sm">対象</Label>
          <Select value={targetFilter} onValueChange={setTargetFilter}>
            <SelectTrigger id="filter-target" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              <SelectItem value="public">一般公開</SelectItem>
              <SelectItem value="members_only">会員限定</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {seminars.length === 0
            ? "現在、公開中のセミナーはありません。"
            : "该当するセミナーはありません。"}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((seminar) => (
            <SeminarCard key={seminar.id} seminar={seminar} />
          ))}
        </div>
      )}
    </>
  );
}
