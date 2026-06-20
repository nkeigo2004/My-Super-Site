// ============================================================
//  研究・制作物  ─ 配列に項目を足していくだけで一覧に並びます
// ============================================================
export type Work = {
  kind: "paper" | "project" | "talk"; // 論文 / プロジェクト / 発表
  title: string;
  meta?: string;     // 会議名・年・役割など（例: "2026 ・ 第一著者"）
  summary: string;   // 1〜3行の概要
  href?: string;     // リンク（論文PDF, GitHub など）。無ければ省略
  tags?: string[];
};

export const works: Work[] = [
  {
    kind: "project",
    title: "サンプル：画像分類モデルの軽量化",
    meta: "2026 ・ 個人プロジェクト",
    summary:
      "何を解いたか・使った手法・結果を簡潔に。これはサンプルなので、" +
      "自分の研究や制作物に置き換えてください。",
    href: "#",
    tags: ["Deep Learning", "PyTorch"],
  },
  {
    kind: "paper",
    title: "サンプル：論文タイトルをここに",
    meta: "学会名 2026",
    summary: "アブストラクトを2〜3行に要約して載せると読みやすいです。",
    href: "#",
    tags: ["NLP"],
  },
];
