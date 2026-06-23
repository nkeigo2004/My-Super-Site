import type { L } from "./types";

// ============================================================
//  ノート（ログ）  ─ 自由に書ける投稿。ニュース/研究に収まらないもの。
//  1件 = 1記事。slug が URL（/notes/▢▢）になります。
//  body は改行そのまま表示。段落は「空行」で区切ります。
// ============================================================
export type Note = {
  slug: string;   // URLになる識別子。半角英数とハイフンのみ（例: "first-post"）
  date: string;   // "YYYY-MM-DD"
  title: L;
  summary: L;     // 一覧に出る短い説明
  body: L;        // 本文
  tags?: string[];
};

export const notes: Note[] = [
  {
    slug: "hello-world",
    date: "2026-06-21",
    title: { ja: "はじめての投稿", en: "Hello, world" },
    summary: {
      ja: "このノートのコーナーについて。",
      en: "About this notes section.",
    },
    body: {
      ja: `ここは自由に書けるノート（ログ）のコーナーです。

研究のメモ、つくったものの裏話、日々考えていること、ちょっとした創作——ニュースや研究一覧に収まらないものを、ここに気軽に書いていきます。

このサンプルは消して、自分の言葉に置き換えてください。新しい記事は notes.ts の配列に { } を足すだけで増やせます。`,
      en: `This is a free-form notes (log) section.

Research memos, the story behind things I build, daily thoughts, a bit of creative writing — anything that doesn't fit into News or Research lives here.

Delete this sample and replace it with your own words. Add a new entry by appending another { } to the array in notes.ts.`,
    },
    tags: ["note"],
  },
];
