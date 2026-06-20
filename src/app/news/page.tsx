import type { Metadata } from "next";
import { news } from "@/content/news";
import { Section } from "@/components/Section";

export const metadata: Metadata = { title: "News" };

function sortedNews() {
  return [...news].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return a.date < b.date ? 1 : -1;
  });
}

export default function NewsPage() {
  return (
    <Section eyebrow="Updates" title="News">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        活動・会社に関する更新情報です。編集できるのは管理者（あなた）のみ。
        現在は{" "}
        <code className="font-mono text-fg">src/content/news.ts</code>{" "}
        を編集して git に push すると更新されます。
      </p>

      <ol className="relative ml-3 border-l border-line">
        {sortedNews().map((item) => (
          <li key={item.date + item.title} className="mb-8 pl-6">
            <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-bg bg-accent" />
            <div className="flex flex-wrap items-center gap-2">
              <time className="font-mono text-xs text-muted">{item.date}</time>
              {item.pinned && (
                <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                  pinned
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              {item.title}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {item.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
