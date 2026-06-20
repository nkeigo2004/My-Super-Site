import Link from "next/link";
import { profile } from "@/content/profile";
import { works } from "@/content/works";
import { news } from "@/content/news";
import { Section } from "@/components/Section";

const kindLabel: Record<string, string> = {
  paper: "Paper",
  project: "Project",
  talk: "Talk",
};

function sortedNews() {
  return [...news].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return a.date < b.date ? 1 : -1;
  });
}

export default function HomePage() {
  const latest = sortedNews()[0];
  const featured = works.slice(0, 2);

  return (
    <>
      {/* ── ヒーロー：名前を「タイトル/著者ブロック」のように見せる ── */}
      <section className="mx-auto max-w-content px-5 pb-10 pt-20 sm:pt-28">
        <p className="mb-5 font-mono text-xs uppercase tracking-widest text-muted">
          {profile.handle}
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          {profile.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">{profile.tagline}</p>

        {/* メタ行：論文の著者・所属ラインのイメージ */}
        <div className="mt-8 border-t border-line pt-5">
          <dl className="grid grid-cols-1 gap-y-2 font-mono text-xs sm:grid-cols-[8rem_1fr]">
            <dt className="text-muted">role</dt>
            <dd>{profile.role}</dd>
            <dt className="text-muted">field</dt>
            <dd className="text-accent">{profile.field}</dd>
            <dt className="text-muted">status</dt>
            <dd className="flex items-center gap-2">
              <span className="live-dot" aria-hidden />
              {profile.status}
            </dd>
          </dl>
        </div>

        {/* リンク */}
        <div className="mt-7 flex flex-wrap gap-2 font-mono text-xs">
          {profile.links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded border border-line px-3 py-1.5 text-muted transition-colors hover:border-accent hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {l.label} ↗
            </a>
          ))}
        </div>

        <p className="mt-10 max-w-2xl leading-relaxed text-fg/90">{profile.bio}</p>
      </section>

      {/* ── ピックアップ（研究・制作物） ── */}
      <Section eyebrow="Selected" title="ピックアップ">
        <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
          {featured.map((w) => (
            <li key={w.title} className="bg-bg p-5">
              <p className="mb-2 font-mono text-xs text-accent">
                {kindLabel[w.kind]}
              </p>
              <h3 className="font-display text-lg font-medium tracking-tight">
                {w.title}
              </h3>
              {w.meta && (
                <p className="mt-1 font-mono text-xs text-muted">{w.meta}</p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {w.summary}
              </p>
            </li>
          ))}
        </ul>
        <Link
          href="/research"
          className="mt-5 inline-block font-mono text-xs text-accent hover:underline"
        >
          すべて見る →
        </Link>
      </Section>

      {/* ── 最新のNews ── */}
      {latest && (
        <Section eyebrow="Latest" title="News">
          <article className="rounded-lg border border-line bg-surface/40 p-5">
            <p className="font-mono text-xs text-muted">{latest.date}</p>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              {latest.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {latest.body}
            </p>
          </article>
          <Link
            href="/news"
            className="mt-5 inline-block font-mono text-xs text-accent hover:underline"
          >
            すべてのNews →
          </Link>
        </Section>
      )}
    </>
  );
}
