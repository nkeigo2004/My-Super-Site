import { getLang } from "@/lib/lang";

// "日本語 / English" 形式のタイトルを、選択言語で出し分ける
function localizeTitle(title: string, lang: "ja" | "en") {
  const i = title.indexOf(" / ");
  if (i === -1) return title; // 区切りが無ければそのまま
  const ja = title.slice(0, i);
  const en = title.slice(i + 3);
  return lang === "en" ? en : ja;
}

export function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const lang = getLang();
  return (
    <section className="mx-auto max-w-content px-5 py-16">
      {(eyebrow || title) && (
        <div className="mb-8">
          {eyebrow && (
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="gradient-text font-display text-2xl font-semibold tracking-tight">
              {localizeTitle(title, lang)}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
