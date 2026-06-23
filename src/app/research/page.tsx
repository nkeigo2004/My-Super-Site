import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Bi } from "@/components/Bi";
import { RichComposer } from "@/components/RichComposer";
import { createClient } from "@/lib/supabase/server";
import {
  createWork,
  editWork,
  deleteWork,
  createWorkComment,
  deleteWorkComment,
} from "./actions";

export const metadata: Metadata = { title: "Research" };

const kindLabel: Record<string, string> = {
  paper: "Paper",
  project: "Project",
  talk: "Talk",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
  );
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
    .select("id, kind, title_ja, title_en, summary_ja, summary_en, meta, href, created_at")
    .order("created_at", { ascending: false });

  const workIds = (works ?? []).map((w) => w.id as string);
  const { data: wcomments } = workIds.length
    ? await supabase
        .from("work_comments")
        .select("id, work_id, author, content, created_at, user_id, image_url")
        .in("work_id", workIds)
        .order("created_at", { ascending: true })
    : { data: [] as any[] };

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

  const commentsByWork = new Map<string, any[]>();
  for (const c of wcomments ?? []) {
    const arr = commentsByWork.get(c.work_id) ?? [];
    arr.push(c);
    commentsByWork.set(c.work_id, arr);
  }

  return (
    <Section eyebrow="Portfolio" title="研究・制作物 / Research & Works">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        研究・論文・制作物の一覧です。各項目には、ログインした方がコメント・意見を残せます。
        {isAdmin && "（管理者として、下のフォームから追加・編集・削除できます）"}
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

      {/* 管理者：追加フォーム */}
      {isAdmin && (
        <form
          action={createWork}
          className="mb-10 space-y-3 rounded-lg border border-line bg-surface/30 p-4"
        >
          <p className="font-mono text-xs text-accent">管理者：研究・制作物を追加</p>
          <select
            name="kind"
            className="rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          >
            <option value="project">project（制作物）</option>
            <option value="paper">paper（論文）</option>
            <option value="talk">talk（発表）</option>
          </select>
          <input name="title_ja" required placeholder="タイトル（日本語・必須）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="title_en" placeholder="Title (English・任意)" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="meta" placeholder="メタ情報（例: 2026 ・ 第一著者・任意）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <textarea name="summary_ja" rows={2} placeholder="概要（日本語・任意）" className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <textarea name="summary_en" rows={2} placeholder="Summary (English・任意)" className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="href" placeholder="リンク（論文PDF・GitHub 等・任意）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <div className="flex justify-end">
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">追加</button>
          </div>
        </form>
      )}

      {(!works || works.length === 0) && (
        <p className="text-sm text-muted">まだ項目がありません。</p>
      )}

      <div className="space-y-6">
        {works?.map((w) => {
          const wc = commentsByWork.get(w.id) ?? [];
          return (
            <div key={w.id} className="rounded-lg border border-line bg-surface/20 p-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-accent">{kindLabel[w.kind] ?? w.kind}</span>
                {w.meta && <span className="font-mono text-xs text-muted">{w.meta}</span>}
              </div>
              <h3 className="mt-1.5 font-display text-lg font-medium tracking-tight">
                <Bi v={{ ja: w.title_ja, en: w.title_en }} enClass="mt-0.5 block text-sm font-normal text-muted" />
              </h3>
              {(w.summary_ja || w.summary_en) && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  <Bi v={{ ja: w.summary_ja, en: w.summary_en }} enClass="mt-1.5 block text-muted/70" />
                </p>
              )}
              {w.href && (
                <a href={w.href} target="_blank" rel="noreferrer" className="mt-2 inline-block font-mono text-xs text-accent hover:underline">
                  リンクを開く ↗
                </a>
              )}

              {/* 管理者：編集・削除 */}
              {isAdmin && (
                <div className="mt-3 flex items-center gap-3">
                  <form action={deleteWork}>
                    <input type="hidden" name="id" value={w.id} />
                    <button className="font-mono text-[11px] text-muted/70 transition-colors hover:text-red-400">削除</button>
                  </form>
                  <details>
                    <summary className="cursor-pointer font-mono text-[11px] text-muted/70 transition-colors hover:text-fg">編集</summary>
                    <form action={editWork} className="mt-2 space-y-2">
                      <input type="hidden" name="id" value={w.id} />
                      <select name="kind" defaultValue={w.kind} className="rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent">
                        <option value="project">project</option>
                        <option value="paper">paper</option>
                        <option value="talk">talk</option>
                      </select>
                      <input name="title_ja" required defaultValue={w.title_ja} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                      <input name="title_en" defaultValue={w.title_en} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                      <input name="meta" defaultValue={w.meta} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                      <textarea name="summary_ja" rows={2} defaultValue={w.summary_ja} className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                      <textarea name="summary_en" rows={2} defaultValue={w.summary_en} className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                      <input name="href" defaultValue={w.href} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                      <div className="flex justify-end">
                        <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">更新</button>
                      </div>
                    </form>
                  </details>
                </div>
              )}

              {/* コメント（専門家フィードバック） */}
              <div className="mt-4 border-t border-line pt-3">
                <p className="mb-2 font-mono text-[11px] text-muted">
                  コメント・意見 {wc.length > 0 && `(${wc.length})`}
                </p>
                {wc.map((c) => (
                  <div key={c.id} className="mb-2 text-sm">
                    <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                      <span>
                        <span className="text-fg/70">@{nameOf(c.user_id, c.author)}</span> ・ {formatDate(c.created_at)}
                      </span>
                      {user?.id === c.user_id && (
                        <form action={deleteWorkComment}>
                          <input type="hidden" name="id" value={c.id} />
                          <button className="text-muted/60 transition-colors hover:text-red-400">削除</button>
                        </form>
                      )}
                    </div>
                    {c.content && (
                      <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-muted">{c.content}</p>
                    )}
                    {c.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image_url} alt="添付画像" className="mt-1 max-h-56 rounded-md border border-line" />
                    )}
                  </div>
                ))}

                {user ? (
                  <div className="mt-2">
                    <RichComposer
                      action={createWorkComment}
                      userId={user.id}
                      placeholder="この研究へのコメント・意見を書く…"
                      submitLabel="送信"
                      hiddenFields={{ work_id: w.id }}
                      rows={2}
                    />
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-[11px] text-muted/70">コメントするにはログインしてください。</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
