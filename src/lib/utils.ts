import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 表示用に改行を正規化する。
 * - 入力の改行（\n）はそのまま表示で活かす
 * - <br> / <br /> も改行として扱う（管理画面で入力した場合用）
 * 表示側では white-space: pre-line と組み合わせて使用する。
 */
export function normalizeLineBreaks(text: string): string {
  if (!text) return ""
  return text.replace(/<br\s*\/?>/gi, "\n")
}
