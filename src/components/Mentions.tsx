import Link from "next/link";

// 本文の中の "@ユーザー名" を、存在するユーザーならプロフィールへのリンクにする。
// map は { 小文字のユーザーネーム: ユーザーID } の対応表。
export function Mentions({
  text,
  map,
}: {
  text: string;
  map: Record<string, string>;
}) {
  const parts: React.ReactNode[] = [];
  const re = /@([A-Za-z0-9_]{1,30})/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const id = map[m[1].toLowerCase()];
    if (id) {
      parts.push(
        <Link
          key={key++}
          href={`/u/${id}`}
          className="text-accent hover:underline"
        >
          @{m[1]}
        </Link>,
      );
    } else {
      parts.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}
