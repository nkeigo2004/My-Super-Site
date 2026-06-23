import type { L } from "./types";

// ============================================================
//  News  ─ 会社・活動の更新情報（管理者＝あなたが編集）
//  Phase 1 は「news.ts を編集して git push」で更新します。
//  Phase 2 で管理画面 + データベース（Supabase）に移行します。
// ============================================================
export type NewsItem = {
  date: string;     // "YYYY-MM-DD"
  title: L;
  body: L;
  pinned?: boolean; // 先頭に固定したい時は true
};

export const news: NewsItem[] = [
  {
    date: "2026-06-20",
    title: { ja: "サイトを公開しました", en: "Launched this site" },
    body: {
      ja: "個人サイトの Phase 1（プロフィール・研究・News）を公開しました。今後、コミュニティ機能や LIVE 配信を段階的に追加していきます。",
      en: "Phase 1 (profile, research, news) is now live. Community features and live streaming will follow in stages.",
    },
    pinned: true,
  },
  {
    date: "2026-06-21",                       // 日付 YYYY-MM-DD
    title: { ja: "お知らせ見出し", en: "Headline" },
    body:  { ja: "本文。", en: "Body text." },
    pinned: false,                             // 先頭に固定したい時だけ。不要なら行ごと消す
  },
];
