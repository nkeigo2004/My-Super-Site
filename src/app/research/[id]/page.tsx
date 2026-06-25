import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { LocalTime } from "@/components/LocalTime";
import { Section } from "@/components/Section";
import { RichComposer } from "@/components/RichComposer";
import { CitationBox } from "@/components/CitationBox";
import { WorkForm } from "@/components/WorkForm";
import { createClient } from "@/lib/supabase/server";
import {
  editWork,
  deleteWork,
  createWorkComment,
  deleteWorkComment,
} from "../actions";

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

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: w } = await supabase
    .from("works")
    .select("title, title_ja")
    .eq("id", params.id)
    .maybeSingle();
  return { title: w?.title || w?.title_ja || "Research" };
}

export default async function WorkDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: w } = await supabase
    .from("works")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (!w) notFound();

  const title = w.title || w.title_ja || "(untitled)";
  const abstract = w.abstract || w.summary_ja || "";
  const kws = splitKeywords(w.keywords);
  const pdf = w.pdf_url || w.href || null;
  const dateIso = w.published_on ? `${w.published_on}T00:00:00` : w.created_at;
  const year = String(new Date(dateIso).getFullYear());
  const citeUrl = pdf || (w.doi ? `https://doi.org/${w.doi}` : null);

  // コメント
  const { data: wcomments } = await supabase
    .from("work_comments")
    .select("id, author, content, created_at, user_id, image_url")
    .eq("work_id", w.id)
    .order("created_at", { ascending: true });
  const userIds = Array.from(
    new Set((wcomments ?? []).map((c) => c.user_id as string)),
  );
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as any[] };
  const nameById = new Map<string, string>();
  for (const pr of profiles ?? []) nameById.set(pr.id, pr.display_name);
  const nameOf = (uid: string, fallback?: string) =>
    nameById.get(uid) ?? fallback ?? "user";

  return (
    <Section eyebrow={kindLabel[w.kind] ?? "Research"} title={title}>
      <Link
        href="/research"
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← 研究・論文の一覧
      </Link>

      {/* メタ情報 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted">
        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-accent">
          {kindLabel[w.kind] ?? w.kind}
        </span>
        {w.category && <span>{w.category}</span>}
        <LocalTime iso={dateIso} mode="date" />
      </div>

      {w.authors && <p className="mt-3 text-base text-fg/90">{w.authors}</p>}

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

      {/* リンク */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {pdf && (
          <a
            href={pdf}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            PDF を開く ↗
          </a>
        )}
        {w.code_url && (
          <a
            href={w.code_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
          >
            コード ↗
          </a>
        )}
        {w.doi && (
          <a
            href={`https://doi.org/${w.doi}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
          >
            DOI ↗
          </a>
        )}
      </div>

      {/* 概要 */}
      {abstract && (
        <div className="mt-8 rounded-lg border border-line bg-surface/30 p-5">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Abstract / 概要
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-fg/90">
            {abstract}
          </p>
        </div>
      )}

      {/* 本文 */}
      {w.body && (
        <div className="mt-8">
          <p className="whitespace-pre-line text-sm leading-relaxed text-fg/90">
            {w.body}
          </p>
        </div>
      )}

      {/* 引用 */}
      <div className="mt-10 border-t border-line pt-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Cite / 引用
        </p>
        <CitationBox title={title} authors={w.authors} year={year} url={citeUrl} />
      </div>

      {/* 管理者：編集・削除 */}
      {isAdmin && (
        <div className="mt-10 space-y-3 border-t border-line pt-6">
          <div className="flex items-center gap-4">
            <details className="flex-1">
              <summary className="cursor-pointer font-mono text-xs text-accent">
                管理者：この論文を編集
              </summary>
              <div className="mt-4">
                <WorkForm action={editWork} work={w} hiddenId={w.id} submitLabel="更新する" />
              </div>
            </details>
            <form action={deleteWork}>
              <input type="hidden" name="id" value={w.id} />
              <button className="font-mono text-[11px] text-muted/70 transition-colors hover:text-red-400">
                削除
              </button>
            </form>
          </div>
        </div>
      )}

      {/* コメント（専門家・閲覧者のフィードバック） */}
      <div className="mt-10 border-t border-line pt-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          コメント・意見 {wcomments && wcomments.length > 0 && `(${wcomments.length})`}
        </p>

        <div className="space-y-3">
          {wcomments?.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-surface/20 p-3 text-sm">
              <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                <span>
                  <span className="text-fg/70">@{nameOf(c.user_id, c.author)}</span>{" "}
                  ・ <LocalTime iso={c.created_at} mode="datetime" />
                </span>
                {user?.id === c.user_id && (
                  <form action={deleteWorkComment}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="work_id" value={w.id} />
                    <button className="text-muted/60 transition-colors hover:text-red-400">
                      削除
                    </button>
                  </form>
                )}
              </div>
              {c.content && (
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-muted">
                  {c.content}
                </p>
              )}
              {c.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.image_url}
                  alt="添付画像"
                  className="mt-1 max-h-56 rounded-md border border-line"
                />
              )}
            </div>
          ))}
        </div>

        {user ? (
          <div className="mt-4">
            <RichComposer
              action={createWorkComment}
              userId={user.id}
              placeholder="この論文へのコメント・意見を書く…"
              submitLabel="送信"
              hiddenFields={{ work_id: w.id }}
              rows={2}
            />
          </div>
        ) : (
          <p className="mt-2 font-mono text-[11px] text-muted/70">
            コメントするにはログインしてください。
          </p>
        )}
      </div>
    </Section>
  );
}
