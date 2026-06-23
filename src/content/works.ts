import type { L } from "./types";

// ============================================================
//  研究・制作物  ─ 配列に項目を足すだけで一覧に並びます
//  title / summary は { ja, en } で併記。meta / tags は共通表記でOK。
// ============================================================
export type Work = {
  kind: "paper" | "project" | "talk"; // 論文 / プロジェクト / 発表
  title: L;
  meta?: string;   // 年・役割・会議名など（例: "2026 ・ 第一著者"）
  summary: L;
  href?: string;   // 論文PDF・GitHub などのリンク。無ければ省略
  tags?: string[];
};

export const works: Work[] = [
  {
    kind: "project",          // "paper"(論文) / "project"(制作物) / "talk"(発表) から選ぶ
    title: {
      ja: "(作品・研究のタイトル)",
      en: "(English Title)",
    },
    meta: "2026 ・ 個人",      // 年や役割など。任意（消してもOK）
    summary: {
      ja: "何をしたか・使った技術・結果を1〜3行で。",
      en: "What you did, the tools, the result — in 1–3 lines.",
    },
    href: "https://github.com/...",  // リンク。無ければこの行ごと消す
    tags: ["Python", "機械学習"],     // 任意
  },
];
