// 「今日の細胞 / Cell of the Day」
// ハンドル（やユーザーID）と日付から、その日の"細胞タイプ"を決める遊び心の機能。
// 同じ人・同じ日なら必ず同じ結果になります（サーバー側で計算するのでブレません）。

export type Cell = { type: string; emoji: string; desc: string };

export const CELLS: Cell[] = [
  { type: "NK細胞", emoji: "🦠", desc: "今日は何でも倒せる気分。直感を信じていこう。" },
  { type: "マクロファージ", emoji: "🍽️", desc: "とりあえず全部のみ込んで理解するタイプの一日。" },
  { type: "B細胞", emoji: "📚", desc: "記憶が冴えてる。昔のことまで思い出せそう。" },
  { type: "ヘルパーT細胞", emoji: "🤝", desc: "誰かを助けたくてうずうずしている。" },
  { type: "キラーT細胞", emoji: "⚔️", desc: "今日は容赦しないモード。やることはやる。" },
  { type: "樹状細胞", emoji: "📡", desc: "情報を集めて広めたい一日。アンテナ全開。" },
  { type: "好中球", emoji: "🏃", desc: "まっさきに駆けつける働き者。フットワーク軽め。" },
  { type: "制御性T細胞", emoji: "🧘", desc: "今日は抑えめに。落ち着いていこう。" },
  { type: "マスト細胞", emoji: "🎇", desc: "ちょっと過敏な日。深呼吸を忘れずに。" },
  { type: "記憶細胞", emoji: "💾", desc: "懐かしさに浸りがち。エモい一日になりそう。" },
  { type: "好酸球", emoji: "🌶️", desc: "刺激を求めている。新しいことを試すと吉。" },
  { type: "幹細胞", emoji: "🌱", desc: "何にでもなれる気がする。可能性に満ちた日。" },
];

// 文字列から安定したハッシュ値を作る
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// 日本時間の「今日」を YYYY/MM/DD 形式で取得
export function todayJST(): string {
  return new Date().toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" });
}

// シード（ハンドルやID）と日付から、その日の細胞を決める
export function cellOfDay(seed: string, dateStr = todayJST()): Cell {
  const idx = hash(`${seed}::${dateStr}`) % CELLS.length;
  return CELLS[idx];
}
