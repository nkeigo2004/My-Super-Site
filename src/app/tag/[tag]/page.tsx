import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { RichComposer } from "@/components/RichComposer";
import { createClient } from "@/lib/supabase/server";
import { addTag, removeTag } from "@/app/account/actions";
import { createTagPost, deleteTagPost } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Promise<Metadata> {
  return { title: `#${decodeURIComponent(params.tag)}` };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
  });
  const time = d.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { tag: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const tag = decodeURIComponent(params.tag);
  const dest = `/tag/${encodeURIComponent(tag)}`;
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // このタグに興味があるメンバー
  const { data: memberRows } = await supabase
    .from("profile_tags")
    .select("user_id")
    .eq("tag", tag);
  const memberIds = (memberRows ?? []).map((r) => r.user_id);
  const isMember = !!user && memberIds.includes(user.id);

  // タグスペースの投稿
  const { data: tagPosts } = await supabase
    .from("tag_posts")
    .select("id, user_id, author, content, image_url, created_at")
    .eq("tag", tag)
    .order("created_at", { ascending: false })
    .limit(100);

  // 関係するユーザーのプロフィール（メンバー＋投稿者）
  const ids = Array.from(
    new Set([...memberIds, ...(tagPosts ?? []).map((p) => p.user_id)]),
  );
  const { data: profiles } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };

  const profById = new Map(
    (profiles ?? []).map((p) => [p.id, p] as const),
  );

  return (
    <Section eyebrow="Interest" title={`#${tag}`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          このタグに興味がある人が集まる場所です。
        </p>
        {user ? (
          isMember ? (
            <form action={removeTag}>
              <input type="hidden" name="tag" value={tag} />
              <input type="hidden" name="redirect" value={dest} />
              <button className="rounded-md border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/20">
                興味を登録済み（外す）
              </button>
            </form>
          ) : (
            <form action={addTag}>
              <input type="hidden" name="tag" value={tag} />
              <input type="hidden" name="redirect" value={dest} />
              <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                このタグに興味を登録
              </button>
            </form>
          )
        ) : (
          <Link href="/login" className="text-xs text-accent hover:underline">
            ログインして参加 →
          </Link>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* メンバー */}
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs text-muted">
          興味がある人 {memberIds.length > 0 && `(${memberIds.length})`}
        </p>
        {memberIds.length === 0 ? (
          <p className="text-sm text-muted">まだ誰もいません。最初の一人になりましょう。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memberIds.map((id) => {
              const pr = profById.get(id);
              const nm = pr?.display_name || "user";
              return (
                <Link
                  key={id}
                  href={`/u/${id}`}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface/30 py-1 pl-1 pr-3 text-sm transition-colors hover:border-accent"
                >
                  {pr?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pr.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-[10px] text-accent">
                      {nm.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="text-fg/90">{nm}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* タグスペース投稿 */}
      <div>
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Talk
        </p>

        {user ? (
          <div className="mb-5">
            <RichComposer
              action={createTagPost}
              userId={user.id}
              placeholder={`#${tag} について話す…`}
              submitLabel="投稿"
              hiddenFields={{ tag }}
              rows={2}
            />
          </div>
        ) : (
          <p className="mb-5 rounded-lg border border-line bg-surface/30 px-4 py-3 text-sm text-muted">
            投稿するには{" "}
            <Link href="/login" className="text-accent hover:underline">
              ログイン
            </Link>{" "}
            が必要です。
          </p>
        )}

        {(!tagPosts || tagPosts.length === 0) && (
          <p className="text-sm text-muted">まだ投稿がありません。</p>
        )}

        <div className="space-y-3">
          {tagPosts?.map((p) => {
            const pr = profById.get(p.user_id);
            const nm = pr?.display_name || p.author;
            return (
              <div
                key={p.id}
                className="rounded-lg border border-line bg-surface/20 p-4"
              >
                <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                  <Link
                    href={`/u/${p.user_id}`}
                    className="flex items-center gap-1.5 hover:opacity-80"
                  >
                    {pr?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pr.avatar_url}
                        alt=""
                        className="h-5 w-5 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-[9px] text-accent">
                        {nm.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="text-accent">@{nm}</span>
                  </Link>
                  <span className="flex items-center gap-2">
                    {formatDate(p.created_at)}
                    {user?.id === p.user_id && (
                      <form action={deleteTagPost}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="tag" value={tag} />
                        <button className="text-muted/60 transition-colors hover:text-red-400">
                          削除
                        </button>
                      </form>
                    )}
                  </span>
                </div>
                {p.content && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                    {p.content}
                  </p>
                )}
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt=""
                    className="mt-2 max-h-80 rounded-md border border-line"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
