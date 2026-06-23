// 投稿欄・チャットで共有する絵文字とスラッシュコマンド。
// 絵文字や定型文を増やしたいときはここに足してください。

export const EMOJIS = [
  "😀", "😄", "😁", "😂", "🤣", "😊", "😍", "😘",
  "😎", "🤩", "🥳", "🤔", "😴", "😭", "😡", "🙇",
  "👍", "👎", "👏", "🙏", "💪", "🙌", "🤝", "✌️",
  "🔥", "✨", "🎉", "💯", "⭐", "🌟", "⚡", "🌈",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "💔",
  "🍀", "🌸", "🍎", "🍕", "🍔", "🍰", "☕", "🍺",
  "⚽", "🎮", "🎵", "📷", "💻", "📱", "📚", "💡",
  "🚀", "🧬", "🩺", "🧪", "🔬", "🏥", "🎓", "📝",
];

export type SlashCommand = {
  cmd: string;
  label: string;
  run: () => string;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  { cmd: "shrug", label: "¯\\_(ツ)_/¯", run: () => "¯\\_(ツ)_/¯" },
  { cmd: "tableflip", label: "(╯°□°)╯︵ ┻━┻", run: () => "(╯°□°)╯︵ ┻━┻" },
  { cmd: "heart", label: "♡ を挿入", run: () => "♡" },
  {
    cmd: "date",
    label: "今日の日付を挿入",
    run: () => new Date().toLocaleDateString("ja-JP"),
  },
  {
    cmd: "time",
    label: "現在時刻を挿入",
    run: () =>
      new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
];

// テキスト末尾の "/xxx" を検出（コマンド候補の絞り込み用）
export function trailingSlashQuery(text: string): string | null {
  const m = text.match(/(?:^|\s)\/([a-zA-Z]*)$/);
  return m ? m[1] : null;
}
