import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "検索 / Search" };

function ymd(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const qRaw = typeof searchParams.q === "string" ? searchParams.q : "";
  const q = qRaw.trim();
  // PostgREST のフィルタ構文を壊す文字を除去
  const safe = q.replace(/[%,()]/g, " ").trim();

  const supabase = await createClient();

  let users: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  }[] = [];
  let posts: {
    id: string;
    user_id: string;
    author: string;
    content: string | null;
    created_at: string;
  }[] = [];
  let postAuthors = new Map<
    string,
    { display_name: string | null; username: string | null; avatar_url: string | null }
  >();

  if (safe) {
    const { data: u } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .or(`username.ilike.%${safe}%,display_name.ilike.%${safe}%`)
      .limit(15);
    users = u ?? [];

    const { data: p } = await supabase
      .from("posts")
      .select("id, user_id, author, content, created_at")
      .ilike("content", `%${safe}%`)
      .order("created_at", { ascending: false })
      .limit(30);
    posts = p ?? [];

    const ids = Array.from(new Set(posts.map((x) => x.user_id)));
    if (ids.length) {
      const { data: pr } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", ids);
      postAuthors = new Map(
        (pr ?? []).map((x) => [
          x.id,
          {
            display_name: x.display_name,
            username: x.username,
            avatar_url: x.avatar_url,
          },
        ]),
      );
    }
  }

  return (
    <Section eyebrow="Search" title="検索 / Search">
      {/* 検索ボックス */}
      <form method="get" action="/search" className="mb-8 flex items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="ユーザー名・投稿のことばで検索…"
          className="flex-1 rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
          検索
        </button>
      </form>

      {!safe && (
        <p className="text-sm text-muted">
          ユーザー名や、投稿に含まれることばを入力してください。
        </p>
      )}

      {safe && (
        <div className="space-y-10">
          {/* ユーザー */}
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              ユーザー
            </p>
            {users.length === 0 ? (
              <p className="text-sm text-muted">該当するユーザーはいません。</p>
            ) : (
              <div className="space-y-2">
                {users.map((u) => {
                  const nm = u.display_name || "user";
                  return (
                    <Link
                      key={u.id}
                      href={`/u/${u.id}`}
                      className="flex items-center gap-3 rounded-lg border border-line bg-surface/20 p-3 transition-colors hover:border-accent"
                    >
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="h-9 w-9 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-xs text-accent">
                          {nm.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span>
                        <span className="block text-sm text-fg">{nm}</span>
                        {u.username && (
                          <span className="block font-mono text-xs text-muted">
                            @{u.username}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 投稿 */}
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
              投稿
            </p>
            {posts.length === 0 ? (
              <p className="text-sm text-muted">該当する投稿はありません。</p>
            ) : (
              <div className="space-y-3">
                {posts.map((p) => {
                  const a = postAuthors.get(p.user_id);
                  const nm = a?.display_name || p.author;
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-line bg-surface/20 p-4"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                        <Link
                          href={`/u/${p.user_id}`}
                          className="text-accent hover:underline"
                        >
                          @{a?.username || nm}
                        </Link>
                        <span>{ymd(p.created_at)}</span>
                      </div>
                      {p.content && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                          {p.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
