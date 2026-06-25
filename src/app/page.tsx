import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { site } from "@/content/site";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { getLang, pick } from "@/lib/lang";
import { ui } from "@/content/ui";
import { Bi } from "@/components/Bi";

const kindLabel: Record<string, string> = {
  paper: "Paper",
  project: "Project",
  talk: "Talk",
};

// ▼ トップ（入口）のキャッチコピー。自由に書き換えてOK
const intro = {
  ja: "研究の記録、つくったもの、そしてこれからの実験場。",
  en: "A home for my research, my work, and whatever comes next.",
};

// ▼ 各セクションへの入口カード。増やしたい時はここに足す
const groups = [
  {
    title: { ja: "制作と記録", en: "Work & Notes" },
    items: [
      {
        href: "/research",
        title: { ja: "研究・制作物", en: "Research & Works" },
        desc: { ja: "論文・プロジェクト・発表の一覧。", en: "Papers, projects, and talks." },
      },
      {
        href: "/notes",
        title: { ja: "ノート", en: "Notes" },
        desc: { ja: "自由な記録・創作・メモ。", en: "Free-form notes, writing, and logs." },
      },
    ],
  },
  {
    title: { ja: "SNS", en: "SNS" },
    items: [
      {
        href: "/community",
        title: { ja: "VoiceUP", en: "VoiceUP" },
        desc: { ja: "投稿・コメント・つながり。", en: "Posts, comments, and connections." },
      },
      {
        href: "/live",
        title: { ja: "LIVE 配信", en: "Live" },
        desc: { ja: "配信とリアルタイムチャット。", en: "Live stream and real-time chat." },
      },
    ],
  },
];


export default async function HomePage() {
  const supabase = await createClient();
  const { data: latestNews } = await supabase
    .from("news")
    .select("id, created_at, title_ja, title_en, pinned")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: latestNotes } = await supabase
    .from("notes")
    .select("id, slug, title_ja, title_en, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: featured } = await supabase
    .from("works")
    .select("id, kind, title, title_ja, abstract, summary_ja, meta, category, published_on")
    .order("created_at", { ascending: false })
    .limit(2);

  const lang = getLang();

  return (
    <>
      {/* ── 入口ヒーロー（NK Cells のロゴを主役に） ── */}
      <section className="mx-auto max-w-content px-5 pb-12 pt-24 sm:pt-32">
        <h1 className="m-0 leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={site.name} className="h-12 w-auto sm:h-16" />
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-fg/90">
          {pick(intro, lang)}
        </p>
      </section>

      {/* ── 最新のニュース（ヒーロー直下） ── */}
      {latestNews && latestNews.length > 0 && (
        <Section eyebrow="Latest" title="最新のニュース / News">
          <ul className="divide-y divide-line border-y border-line">
            {latestNews.map((item) => (
              <li key={item.id} className="py-5">
                <p className="font-mono text-xs text-muted"><LocalTime iso={item.created_at} mode="date" /></p>
                <h3 className="mt-1 font-display text-base font-medium tracking-tight">
                  <Bi v={{ ja: item.title_ja, en: item.title_en }} enClass="mt-0.5 block text-sm font-normal text-muted" />
                </h3>
              </li>
            ))}
          </ul>
          <Link
            href="/news"
            className="mt-5 inline-block font-mono text-xs text-accent hover:underline"
          >
            {pick(ui.allNews, lang)} →
          </Link>
        </Section>
      )}

      {/* ── 各セクションへの入口（グループ） ── */}
      <section className="mx-auto max-w-content space-y-8 px-5">
        {groups.map((g) => (
          <div key={g.title.en}>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              {pick(g.title, lang)}
            </p>
            <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              {g.items.map((s) => (
                <li key={s.href} className="bg-bg">
                  <Link
                    href={s.href}
                    className="group flex h-full flex-col justify-between gap-6 p-6 transition-colors hover:bg-surface/40 focus-visible:bg-surface/40 focus-visible:outline-none"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-medium tracking-tight">
                          {pick(s.title, lang)}
                        </h2>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-muted">{pick(s.desc, lang)}</p>
                    </div>
                    <span className="font-mono text-xs text-accent">{pick(ui.open, lang)} →</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* ── ピックアップ ── */}
      {featured && featured.length > 0 && (
        <Section eyebrow="Selected" title="ピックアップ / Highlights">
          <ul className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {featured.map((w) => (
              <li key={w.id} className="bg-bg p-5">
                <p className="mb-2 font-mono text-xs text-accent">
                  {kindLabel[w.kind] ?? w.kind}
                </p>
                <h3 className="font-display text-lg font-medium tracking-tight">
                  <Link href={`/research/${w.id}`} className="hover:text-accent">
                    {w.title || w.title_ja || "(untitled)"}
                  </Link>
                </h3>
                {(w.category || w.meta) && (
                  <p className="mt-2 font-mono text-xs text-muted">{w.category || w.meta}</p>
                )}
                {(w.abstract || w.summary_ja) && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                    {w.abstract || w.summary_ja}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/research"
            className="mt-5 inline-block font-mono text-xs text-accent hover:underline"
          >
            {pick(ui.viewAll, lang)} →
          </Link>
        </Section>
      )}

      {/* ── 最新のノート ── */}
      {latestNotes && latestNotes.length > 0 && (
        <Section eyebrow="Log" title="最新のノート / Notes">
          <ul className="divide-y divide-line border-y border-line">
            {latestNotes.map((n) => (
              <li key={n.id} className="py-5">
                <Link href={`/notes/${n.slug}`} className="group block">
                  <p className="font-mono text-xs text-muted"><LocalTime iso={n.created_at} mode="date" /></p>
                  <h3 className="mt-1 font-display text-base font-medium tracking-tight group-hover:text-fg">
                    <Bi v={{ ja: n.title_ja, en: n.title_en }} enClass="mt-0.5 block text-sm font-normal text-muted" />
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/notes"
            className="mt-5 inline-block font-mono text-xs text-accent hover:underline"
          >
            {pick(ui.allNotes, lang)} →
          </Link>
        </Section>
      )}
    </>
  );
}
