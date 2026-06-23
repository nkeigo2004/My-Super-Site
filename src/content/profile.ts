import type { L } from "./types";

// ============================================================
//  プロフィール  ─ ここを編集すればサイト全体に反映されます
//  文章は { ja: "日本語", en: "English" } の形で併記します。
// ============================================================
export const profile = {
  // ▼▼ 表示名はここを書き換えてください ▼▼
  name: "中根 啓冴",            // 表示名（About・コピーライトに使用）
  handle: "",                   // 公開コードには個人情報を置かないため空にしています
  // ▲▲ ここまで ▲▲

  tagline: {
    ja: "機械学習・AI を研究する大学生",
    en: "CS student researching machine learning & AI",
  } as L,

  // ヒーロー下のメタ行（論文の著者・所属ブロックのイメージ）
  role: { ja: "学生研究者", en: "Student Researcher" } as L,
  field: { ja: "機械学習・AI", en: "Machine Learning / AI" } as L,
  status: {
    ja: "学部4年 ・ 2027年4月 卒業見込み",
    en: "Final-year undergrad ・ Graduating Apr 2027",
  } as L,

  // 自己紹介。改行はそのまま表示されます。文章を書き換えれば反映されます。
  bio: {
    ja: `2004年、愛知県豊田市で生まれました。

・経歴
2023年4月　鈴鹿医療科学大学 医用工学部 医療健康データサイエンス学科 入学
2027年3月　鈴鹿医療科学大学 医用工学部 医療健康データサイエンス学科 卒業見込み
2027年4月　テクノプロ・デザイン社 入社

・趣味
サッカー、クリケット観戦（日本では同好の士を募集中！！）、音楽鑑賞

・特技
（準備中）`,
    en: `Born in 2004 in Toyota, Aichi.

· Background
Apr 2023 — Enrolled in the Department of Medical Health Data Science, Faculty of Medical Engineering, Suzuka University of Medical Science
Mar 2027 — Expected to graduate
Apr 2027 — Joining TechnoPro Design

· Hobbies
Football, watching cricket (I'm looking for people to join me in Japan!), listening to music

· Skills
(coming soon)`,
  } as L,

  // リンクは公開コードに個人情報を残さないため空にしています。
  // 表示が必要になったら About の管理画面側で扱う想定。
  links: [] as { label: string; href: string }[],
};