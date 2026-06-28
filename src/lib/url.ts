// 表示時：href に出して安全な URL だけ通す。
// javascript: data: vbscript: などの危険スキームを遮断する。
export function safeHref(url?: string | null): string | undefined {
  if (!url) return undefined;
  const s = url.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s; // サイト内リンク
  return undefined;
}

// 保存時：スキームが無ければ https:// を付与し、http(s) 以外のスキームは拒否する。
export function normalizeSavedUrl(url?: string | null): string | null {
  if (!url) return null;
  const s = url.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  // 何らかのスキームが付いていて http(s) でないものは拒否（javascript: data: 等）
  if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  return "https://" + s;
}
