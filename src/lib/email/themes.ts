export const EMAIL_THEMES = [
  { id: "dark",   label: "ダーク",   header: "#18181b", bg: "#f4f4f5" },
  { id: "navy",   label: "ネイビー", header: "#1e3a5f", bg: "#eff6ff" },
  { id: "green",  label: "グリーン", header: "#14532d", bg: "#f0fdf4" },
  { id: "purple", label: "パープル", header: "#4c1d95", bg: "#f5f3ff" },
  { id: "wine",   label: "ワイン",   header: "#881337", bg: "#fff1f2" },
] as const;

export type ThemeId = typeof EMAIL_THEMES[number]["id"];

export function getTheme(id?: string | null) {
  return EMAIL_THEMES.find((t) => t.id === id) ?? EMAIL_THEMES[0];
}
