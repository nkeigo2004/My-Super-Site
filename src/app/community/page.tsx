import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { RichComposer } from "@/components/RichComposer";
import { Mentions } from "@/components/Mentions";
import { createClient } from "@/lib/supabase/server";
import { getLang, pick } from "@/lib/lang";
import { ui } from "@/content/ui";
import {
  createPost,
  editPost,
  deletePost,
  createComment,
  editComment,
  deleteComment,
  toggleLike,
  toggleRepost,
} from "./actions";

export const metadata: Metadata = { title: "Community" };

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
  );
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  const supabase = await createClient();
  const lang = getLang();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 鍵アカウント：非フォロワーには見せない著者を割り出す
  const { data: privRows } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_private", true);
  const privateIds = new Set((privRows ?? []).map((r) => r.id as string));
  const visiblePrivate = new Set<string>();
  if (user) {
    visiblePrivate.add(user.id);
    const { data: myFollows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id)
      .eq("status", "accepted");
    for (const f of myFollows ?? []) {
      if (privateIds.has(f.following_id)) visiblePrivate.add(f.following_id as string);
    }
  }
  const isHidden = (uid: string) => privateIds.has(uid) && !visiblePrivate.has(uid);
  const hiddenIds = Array.from(privateIds).filter((id) => !visiblePrivate.has(id));

  let postsQuery = supabase
    .from("posts")
    .select("id, author, content, created_at, user_id, image_url, file_url, file_name")
    .order("created_at", { ascending: false })
    .limit(50);
  if (hiddenIds.length) {
    postsQuery = postsQuery.not("user_id", "in", `(${hiddenIds.join(",")})`);
  }
  const { data: posts } = await postsQuery;

  const postIds = (posts ?? []).map((p) => p.id as string);

  const { data: comments } = postIds.length
    ? await supabase
        .from("comments")
        .select("id, post_id, author, content, created_at, user_id, image_url")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] as any[] };

  const { data: reactions } = postIds.length
    ? await supabase.from("reactions").select("post_id, user_id").in("post_id", postIds)
    : { data: [] as any[] };

  // 投稿・コメントに登場するユーザーの表示名をまとめて取得
  const userIds = Array.from(
    new Set([
      ...(posts ?? []).map((p) => p.user_id as string),
      ...(comments ?? []).map((c) => c.user_id as string),
    ]),
  );
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
    : { data: [] as any[] };

  const nameById = new Map<string, string>();
  const avatarById = new Map<string, string | null>();
  for (const pr of profiles ?? []) {
    nameById.set(pr.id, pr.display_name);
    avatarById.set(pr.id, pr.avatar_url);
  }
  const nameOf = (userId: string, fallback?: string) =>
    nameById.get(userId) ?? fallback ?? "user";

  // コメントを投稿ごとにまとめる
  const commentsByPost = new Map<string, any[]>();
  for (const c of comments ?? []) {
    const arr = commentsByPost.get(c.post_id) ?? [];
    arr.push(c);
    commentsByPost.set(c.post_id, arr);
  }

  // @メンションのリンク用：本文から @ユーザー名 を集めてIDを引く
  const mentionTokens = new Set<string>();
  const collectMentions = (txt: string | null) => {
    const re = /@([A-Za-z0-9_]{1,30})/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(txt ?? "")) !== null) mentionTokens.add(mm[1].toLowerCase());
  };
  for (const pp of posts ?? []) collectMentions(pp.content);
  for (const cc of comments ?? []) collectMentions(cc.content);
  const mentionMap: Record<string, string> = {};
  if (mentionTokens.size) {
    const { data: mprofiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("username", Array.from(mentionTokens));
    for (const mp of mprofiles ?? []) {
      if (mp.username) mentionMap[mp.username.toLowerCase()] = mp.id;
    }
  }

  // リポスト：表示中の投稿の数 / 自分が押したか
  const { data: repostsForPosts } = postIds.length
    ? await supabase.from("reposts").select("post_id, user_id").in("post_id", postIds)
    : { data: [] as any[] };
  const repostCount = new Map<string, number>();
  const repostedByMe = new Set<string>();
  for (const r of repostsForPosts ?? []) {
    repostCount.set(r.post_id, (repostCount.get(r.post_id) ?? 0) + 1);
    if (user && r.user_id === user.id) repostedByMe.add(r.post_id);
  }

  // タイムライン用の最近のリポスト
  const { data: recentReposts } = await supabase
    .from("reposts")
    .select("id, post_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  // リポスト元の投稿（postsに無いものを補完）
  const origPostById = new Map<string, any>();
  for (const pp of posts ?? []) origPostById.set(pp.id, pp);
  const missingIds = Array.from(
    new Set(
      (recentReposts ?? [])
        .map((r) => r.post_id as string)
        .filter((id) => !origPostById.has(id)),
    ),
  );
  if (missingIds.length) {
    const { data: extraPosts } = await supabase
      .from("posts")
      .select("id, author, content, created_at, user_id, image_url, file_url, file_name")
      .in("id", missingIds);
    for (const pp of extraPosts ?? []) origPostById.set(pp.id, pp);
  }

  // リポスター・リポスト元投稿者の表示名を補完
  const extraUserIds = Array.from(
    new Set([
      ...(recentReposts ?? []).map((r) => r.user_id as string),
      ...Array.from(origPostById.values()).map((pp: any) => pp.user_id as string),
    ]),
  ).filter((id) => !nameById.has(id));
  if (extraUserIds.length) {
    const { data: ep } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", extraUserIds);
    for (const pr of ep ?? []) {
      nameById.set(pr.id, pr.display_name);
      avatarById.set(pr.id, pr.avatar_url);
    }
  }

  // 投稿とリポストを時系列に統合
  type TL =
    | { kind: "post"; ts: string; post: any }
    | { kind: "repost"; ts: string; id: string; reposter: string; orig: any };
  const timeline: TL[] = [];
  for (const pp of posts ?? []) timeline.push({ kind: "post", ts: pp.created_at, post: pp });
  for (const r of recentReposts ?? []) {
    const orig = origPostById.get(r.post_id);
    if (!orig) continue;
    if (isHidden(r.user_id as string) || isHidden(orig.user_id as string)) continue;
    timeline.push({ kind: "repost", ts: r.created_at, id: r.id, reposter: r.user_id, orig });
  }
  timeline.sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
  const feed = timeline.slice(0, 60);

  // いいね数 / 自分が押したか
  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const r of reactions ?? []) {
    likeCount.set(r.post_id, (likeCount.get(r.post_id) ?? 0) + 1);
    if (user && r.user_id === user.id) likedByMe.add(r.post_id);
  }

  return (
    <Section eyebrow="Community" title="VoiceUP">
      {/* リロード無しで最新化 */}
      <RealtimeRefresh />

      {/* 検索 */}
      <form method="get" action="/search" className="mb-5 flex items-center gap-2">
        <input
          name="q"
          placeholder="ユーザー名・ことばで検索…"
          className="flex-1 rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <button className="rounded-md border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg">
          検索
        </button>
      </form>

      {user ? (
        <RichComposer
          action={createPost}
          userId={user.id}
          placeholder={pick(ui.whatsOnYourMind, lang)}
          submitLabel={pick(ui.post, lang)}
          allowFile
        />
      ) : (
        <p className="rounded-lg border border-line bg-surface/30 px-4 py-3 text-sm text-muted">
          {lang === "en" ? (
            <>
              <Link href="/login" className="text-accent hover:underline">
                Log in
              </Link>{" "}
              to post, comment, and like. Anyone can browse.
            </>
          ) : (
            <>
              投稿・コメント・いいねには{" "}
              <Link href="/login" className="text-accent hover:underline">
                ログイン
              </Link>{" "}
              が必要です。閲覧は誰でもできます。
            </>
          )}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {feed.length === 0 && (
          <p className="text-sm text-muted">{pick(ui.noPosts, lang)}</p>
        )}

        {feed.map((entry) => {
          if (entry.kind === "repost") {
            const o = entry.orig;
            return (
              <div
                key={"rp-" + entry.id}
                className="rounded-lg border border-line bg-surface/10 p-4"
              >
                <p className="mb-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted">
                  <span>🔁</span>
                  <Link
                    href={`/u/${entry.reposter}`}
                    className="text-accent hover:opacity-80"
                  >
                    @{nameOf(entry.reposter)}
                  </Link>
                  <span>がリポスト ・ {formatDate(entry.ts)}</span>
                </p>
                <div className="rounded-md border border-line bg-bg/30 p-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                    <Link
                      href={`/u/${o.user_id}`}
                      className="flex items-center gap-1.5 hover:opacity-80"
                    >
                      {avatarById.get(o.user_id) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarById.get(o.user_id) as string}
                          alt=""
                          className="h-5 w-5 rounded-full border border-line object-cover"
                        />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-[9px] text-accent">
                          {nameOf(o.user_id, o.author).slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="text-accent">
                        @{nameOf(o.user_id, o.author)}
                      </span>
                    </Link>{" "}
                    ・ {formatDate(o.created_at)}
                  </div>
                  {o.content && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                      {o.content}
                    </p>
                  )}
                  {o.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={o.image_url}
                      alt="添付画像"
                      className="mt-2 max-h-80 rounded-md border border-line"
                    />
                  )}
                </div>
              </div>
            );
          }

          const p = entry.post;
          const postComments = commentsByPost.get(p.id) ?? [];
          const likes = likeCount.get(p.id) ?? 0;
          const liked = likedByMe.has(p.id);
          const reposted = repostedByMe.has(p.id);
          const repostN = repostCount.get(p.id) ?? 0;

          return (
            <div
              key={p.id}
              className="rounded-lg border border-line bg-surface/20 p-4"
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                  <Link
                    href={`/u/${p.user_id}`}
                    className="flex items-center gap-1.5 hover:opacity-80"
                  >
                    {avatarById.get(p.user_id) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarById.get(p.user_id) as string}
                        alt=""
                        className="h-5 w-5 rounded-full border border-line object-cover"
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface text-[9px] text-accent">
                        {nameOf(p.user_id, p.author).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="text-accent">@{nameOf(p.user_id, p.author)}</span>
                  </Link>{" "}
                  ・ {formatDate(p.created_at)}
                </span>
                {user?.id === p.user_id && (
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-muted/70 transition-colors hover:text-red-400">
                      削除
                    </button>
                  </form>
                )}
              </div>

              {p.content && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                  <Mentions text={p.content} map={mentionMap} />
                </p>
              )}
              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt="添付画像"
                  className="mt-2 max-h-96 rounded-md border border-line"
                />
              )}
              {p.file_url && (
                <a
                  href={p.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 rounded-md border border-line bg-bg/40 px-3 py-1.5 text-sm text-accent hover:border-accent"
                >
                  📎 {p.file_name || "ファイル"}
                </a>
              )}

              {user?.id === p.user_id && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-mono text-[10px] text-muted/70 transition-colors hover:text-fg">
                    編集
                  </summary>
                  <form action={editPost} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={p.id} />
                    <textarea
                      name="content"
                      required
                      maxLength={1000}
                      rows={3}
                      defaultValue={p.content}
                      className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                    />
                    <div className="flex justify-end">
                      <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                        更新
                      </button>
                    </div>
                  </form>
                </details>
              )}

              <div className="mt-3 flex items-center gap-3">
                <form action={toggleLike}>
                  <input type="hidden" name="post_id" value={p.id} />
                  <button
                    className={`flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                      liked
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line text-muted hover:text-fg"
                    }`}
                    disabled={!user}
                    title={user ? "" : "ログインが必要です"}
                  >
                    <span>{liked ? "♥" : "♡"}</span>
                    <span>{likes}</span>
                  </button>
                </form>
                <form action={toggleRepost}>
                  <input type="hidden" name="post_id" value={p.id} />
                  <button
                    className={`flex items-center gap-1 rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                      reposted
                        ? "border-accent/50 bg-accent/10 text-accent"
                        : "border-line text-muted hover:text-fg"
                    }`}
                    disabled={!user || user?.id === p.user_id}
                    title={
                      !user
                        ? "ログインが必要です"
                        : user.id === p.user_id
                          ? "自分の投稿はリポストできません"
                          : ""
                    }
                  >
                    <span>🔁</span>
                    <span>{repostN}</span>
                  </button>
                </form>
                <span className="font-mono text-[11px] text-muted">
                  {postComments.length} コメント
                </span>
              </div>

              {postComments.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  {postComments.map((c) => (
                    <div key={c.id} className="text-sm">
                      <div className="flex items-center justify-between font-mono text-[10px] text-muted">
                        <span>
                          <Link
                            href={`/u/${c.user_id}`}
                            className="text-fg/70 hover:text-accent"
                          >
                            @{nameOf(c.user_id, c.author)}
                          </Link>{" "}
                          ・ {formatDate(c.created_at)}
                        </span>
                        {user?.id === c.user_id && (
                          <form action={deleteComment}>
                            <input type="hidden" name="id" value={c.id} />
                            <button className="text-muted/60 transition-colors hover:text-red-400">
                              削除
                            </button>
                          </form>
                        )}
                      </div>
                      {c.content && (
                        <p className="mt-0.5 whitespace-pre-wrap leading-relaxed text-muted">
                          <Mentions text={c.content} map={mentionMap} />
                        </p>
                      )}
                      {c.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image_url}
                          alt="添付画像"
                          className="mt-1 max-h-60 rounded-md border border-line"
                        />
                      )}
                      {user?.id === c.user_id && (
                        <details className="mt-1">
                          <summary className="cursor-pointer font-mono text-[10px] text-muted/60 transition-colors hover:text-fg">
                            編集
                          </summary>
                          <form
                            action={editComment}
                            className="mt-1 flex items-center gap-2"
                          >
                            <input type="hidden" name="id" value={c.id} />
                            <input
                              name="content"
                              required
                              maxLength={500}
                              defaultValue={c.content}
                              className="flex-1 rounded-md border border-line bg-bg/40 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent"
                            />
                            <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                              更新
                            </button>
                          </form>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {user && (
                <div className="mt-3">
                  <RichComposer
                    action={createComment}
                    userId={user.id}
                    placeholder="コメントを書く…"
                    submitLabel="送信"
                    hiddenFields={{ post_id: p.id }}
                    rows={2}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
