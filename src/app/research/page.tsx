import type { Metadata } from "next";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { safeHref } from "@/lib/url";

export const metadata: Metadata = { title: "Research" };

const kindLabel: Record<string, string> = {
  paper: "Paper",
  project: "Project",
  talk: "Talk",
  preprint: "Preprint",
};

function splitKeywords(s?: string | null) {
  return (s ?? "")
    .split(/[,、]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;
  const message =
    typeof searchParams.message === "string" ? searchParams.message : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!profile?.is_admin;
  }

  const { data: works } = await supabase
    .from("works")
    .select(
      "id, kind, title, title_ja, authors, abstract, summary_ja, category, keywords, published_on, pdf_url, href, code_url, doi, created_at",
    )
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <Section eyebrow="Research" title="研究・論文 / Research">
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        研究・論文・プレプリントの一覧です。各論文のページで、概要・キーワード・PDF・引用(BibTeX)を確認でき、専門家・閲覧者がコメントを残せます。
      </p>

      {error && (
        <p className="mb-6 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-6 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}

      {isAdmin && (
        <div className="mb-8">
          <Link
            href="/research/new"
            className="inline-flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            ＋ 新しい論文を投稿
          </Link>
        </div>
      )}

      {(!works || works.length === 0) && (
        <p className="text-sm text-muted">まだ論文がありません。</p>
      )}

      <div className="divide-y divide-line border-y border-line">
        {works?.map((w) => {
          const title = w.title || w.title_ja || "(untitled)";
          const abstract = w.abstract || w.summary_ja || "";
          const kws = splitKeywords(w.keywords);
          const pdf = safeHref(w.pdf_url || w.href);
          const dateIso = w.published_on
            ? `${w.published_on}T00:00:00`
            : w.created_at;
          return (
            <article key={w.id} className="py-6">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
                <span className="rounded bg-accent/10 px-1.5 py-0.5 text-accent">
                  {kindLabel[w.kind] ?? w.kind}
                </span>
                {w.category && <span>{w.category}</span>}
                <LocalTime iso={dateIso} mode="date" />
              </div>

              <h3 className="mt-2 font-display text-xl font-semibold leading-snug tracking-tight">
                <Link href={`/research/${w.id}`} className="hover:text-accent">
                  {title}
                </Link>
              </h3>

              {w.authors && (
                <p className="mt-1 text-sm text-fg/80">{w.authors}</p>
              )}

              {abstract && (
                <p className="mt-2 line-clamp-3 max-w-3xl text-sm leading-relaxed text-muted">
                  {abstract}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs">
                <Link
                  href={`/research/${w.id}`}
                  className="text-accent hover:underline"
                >
                  詳細を読む →
                </Link>
                {pdf && (
                  <a
                    href={pdf}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted transition-colors hover:text-fg"
                  >
                    PDF ↗
                  </a>
                )}
                {safeHref(w.code_url) && (
                  <a
                    href={safeHref(w.code_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted transition-colors hover:text-fg"
                  >
                    Code ↗
                  </a>
                )}
                {w.doi && (
                  <a
                    href={`https://doi.org/${w.doi}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted transition-colors hover:text-fg"
                  >
                    DOI ↗
                  </a>
                )}
              </div>

              {kws.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {kws.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-muted"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Section>
  );
}
