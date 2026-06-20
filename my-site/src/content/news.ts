// ============================================================
//  News  ─ 会社・活動の更新情報（管理者＝あなたが編集）
//  Phase 1 では「編集 = このファイルを書き換えて git push」で更新します。
//  Phase 2 で管理画面 + データベース（Supabase）に移行します。
// ============================================================
export type NewsItem = {
  date: string;    // "YYYY-MM-DD"
  title: string;
  body: string;
  pinned?: boolean; // 先頭に固定したい時は true
};

export const news: NewsItem[] = [
  {
    date: "2026-06-20",
    title: "サイトを公開しました",
    body:
      "個人サイトの Phase 1（プロフィール・研究・News）を公開しました。" +
      "今後、コミュニティ機能や LIVE 配信を段階的に追加していきます。",
    pinned: true,
  },
];
