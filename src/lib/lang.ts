import { cookies } from "next/headers";
import type { L } from "@/content/types";

export type Lang = "ja" | "en";

// 訪問者の表示言語（Cookie。初期値はミドルウェアがデバイス言語から設定）
export function getLang(): Lang {
  const v = cookies().get("lang")?.value;
  return v === "en" ? "en" : "ja";
}

// 日英ペアから、選択言語の文字列を返す（空なら他方にフォールバック）
export function pick(v: L, lang: Lang): string {
  if (lang === "en") return v.en || v.ja;
  return v.ja || v.en;
}
