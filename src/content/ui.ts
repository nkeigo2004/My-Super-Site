import type { L } from "./types";

// サイトの固定文言（ボタン・リンク等）の日英辞書。
// 新しい文言はここに足して、各ページで pick(ui.キー, lang) で表示します。
export const ui = {
  open: { ja: "開く", en: "Open" },
  viewAll: { ja: "すべて見る", en: "View all" },
  allNews: { ja: "すべてのニュース", en: "All news" },
  allNotes: { ja: "すべてのノート", en: "All notes" },
  backToNotes: { ja: "← ノート一覧", en: "← All notes" },
  soon: { ja: "準備中", en: "Soon" },
  whatsOnYourMind: { ja: "いまどうしてる？", en: "What's on your mind?" },
  post: { ja: "投稿", en: "Post" },
  login: { ja: "ログイン", en: "Log in" },
  noPosts: { ja: "まだ投稿がありません。", en: "No posts yet." },
} satisfies Record<string, L>;
