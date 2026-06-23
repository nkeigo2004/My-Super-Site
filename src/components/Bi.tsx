import type { L } from "@/content/types";
import { getLang } from "@/lib/lang";

// 日英ペアを「選択中の言語ひとつ」で表示するヘルパー。
// 言語は設定ページ（/settings）で切り替えられ、初期値は各自のデバイス言語。
// 選んだ言語が空のときは、もう一方の言語にフォールバックします。
export function Bi({
  v,
}: {
  v: L;
  // 旧実装との互換のため受け取るが、現在は未使用（1言語表示のため）
  enClass?: string;
}) {
  const lang = getLang();
  const text = lang === "en" ? v.en || v.ja : v.ja || v.en;
  return <>{text}</>;
}
