import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { cellOfDay } from "@/lib/cell";
import { toggleFollow } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", params.id)
    .maybeSingle();
  return { title: p?.display_name ? `@${p.display_name}` : "Profile" };
}

function ymd(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function PublicProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url, banner_url, bio, birthday, birthday_public, is_private")
    .eq("id", params.id)
    .maybeSingle();

  if (!profile) {
    return (
      <section className="mx-auto max-w-content px-5 py-24 text-center">
        <p className="text-sm text-muted">このユーザーは見つかりませんでした。</p>
        <Link href="/community" className="mt-4 inline-block text-sm text-accent hover:underline">
          ← VoiceUP へ
        </Link>
      </section>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, content, image_url, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: tags } = await supabase
    .from("profile_tags")
    .select("tag")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  const { data: links } = await supabase
    .from("profile_links")
    .select("id, label, url")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: true });

  const cell = cellOfDay(profile.username || profile.display_name || profile.id);

  // フォロー情報
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { count: followers } = await supabase
    .from("follows")
    .select("follower_id", { count: "exact", head: true })
    .eq("following_id", profile.id)
    .eq("status", "accepted");
  const { count: following } = await supabase
    .from("follows")
    .select("following_id", { count: "exact", head: true })
    .eq("follower_id", profile.id)
    .eq("status", "accepted");

  const isSelf = !!user && user.id === profile.id;
  let relStatus: string | null = null;
  if (user && !isSelf) {
    const { data: f } = await supabase
      .from("follows")
      .select("status")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    relStatus = (f?.status as string) ?? null;
  }
  const isFollowing = relStatus === "accepted";
  const isPending = relStatus === "pending";
  const canViewContent = isSelf || !profile.is_private || isFollowing;

  // 自分のプロフィールなら保留中のフォローリクエスト数
  let pendingCount = 0;
  if (isSelf) {
    const { count } = await supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", profile.id)
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  const name = profile.display_name || "user";
  const handle = profile.username || null;
  const initial = name.slice(0, 1).toUpperCase();

  // 誕生日は「月日」だけ表示（年は出さない）
  let birthdayLabel: string | null = null;
  if (profile.birthday_public && profile.birthday) {
    const d = new Date(profile.birthday + "T00:00:00");
    if (!isNaN(d.getTime())) {
      birthdayLabel = `${d.getMonth() + 1}月${d.getDate()}日`;
    }
  }

  return (
    <section className="mx-auto max-w-content pb-16">
      {/* バナー */}
      <div className="relative h-40 w-full overflow-hidden rounded-b-lg bg-surface/40 sm:h-56">
        {profile.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="px-5">
        {/* アイコン（バナーより前面） */}
        <div className="relative z-10 -mt-12 flex items-end justify-between">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-bg bg-surface shadow-lg">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-3xl text-accent">
                {initial}
              </div>
            )}
          </div>
        </div>

        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          {name}
        </h1>
        {handle && (
          <p className="font-mono text-xs text-muted">
            @{handle}
            {profile.is_private && <span className="ml-2">🔒 非公開</span>}
          </p>
        )}
        {isSelf && pendingCount > 0 && (
          <Link
            href="/requests"
            className="mt-2 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-mono text-xs text-accent hover:bg-accent/20"
          >
            フォローリクエスト {pendingCount}件 →
          </Link>
        )}

        {/* フォロー情報 */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <Link href={`/u/${profile.id}/followers`} className="hover:opacity-80">
            <span className="font-semibold text-fg">{followers ?? 0}</span>{" "}
            <span className="text-muted">フォロワー</span>
          </Link>
          <Link href={`/u/${profile.id}/following`} className="hover:opacity-80">
            <span className="font-semibold text-fg">{following ?? 0}</span>{" "}
            <span className="text-muted">フォロー中</span>
          </Link>
          {user && !isSelf && (
            <form action={toggleFollow}>
              <input type="hidden" name="target_id" value={profile.id} />
              <button
                className={
                  isFollowing || isPending
                    ? "rounded-full border border-line px-4 py-1.5 text-xs text-muted transition-colors hover:border-red-400 hover:text-red-400"
                    : "rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90"
                }
              >
                {isFollowing ? "フォロー中" : isPending ? "リクエスト中" : "フォロー"}
              </button>
            </form>
          )}
          {user && !isSelf && (
            <Link
              href={`/messages/${profile.id}`}
              className="rounded-full border border-line px-4 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg"
            >
              メッセージ
            </Link>
          )}
          {isSelf && (
            <Link
              href="/account"
              className="rounded-full border border-line px-4 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg"
            >
              プロフィールを編集
            </Link>
          )}
        </div>
        {birthdayLabel && (
          <p className="mt-1 font-mono text-xs text-muted">🎂 {birthdayLabel}</p>
        )}

        {/* 今日の細胞 */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/30 px-3 py-1.5 text-sm">
          <span className="text-lg leading-none">{cell.emoji}</span>
          <span className="font-mono text-xs text-accent">今日の細胞</span>
          <span className="text-fg">{cell.type}</span>
          <span className="hidden text-muted sm:inline">— {cell.desc}</span>
        </div>

        {profile.bio && (
          <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-fg/90">
            {profile.bio}
          </p>
        )}

        {/* 他サービスへのリンク */}
        {links && links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-line bg-surface/30 px-3 py-1.5 text-sm text-accent transition-colors hover:border-accent"
              >
                {l.label || l.url} ↗
              </a>
            ))}
          </div>
        )}

        {/* 興味タグ */}
        {tags && tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.tag}
                href={`/tag/${encodeURIComponent(t.tag)}`}
                className="rounded-full border border-line bg-surface/30 px-3 py-1 text-sm text-accent transition-colors hover:border-accent"
              >
                #{t.tag}
              </Link>
            ))}
          </div>
        )}

        {/* 投稿 */}
        <div className="mt-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Posts
          </p>
          {!canViewContent ? (
            <div className="rounded-lg border border-line bg-surface/20 p-6 text-center text-sm text-muted">
              🔒 非公開アカウントです。フォローが承認されると投稿を見られます。
            </div>
          ) : (
          <>
          {(!posts || posts.length === 0) && (
            <p className="text-sm text-muted">まだ投稿がありません。</p>
          )}
          <div className="space-y-3">
            {posts?.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-line bg-surface/20 p-4"
              >
                <p className="font-mono text-[11px] text-muted">
                  {ymd(p.created_at)}
                </p>
                {p.content && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg">
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
            ))}
          </div>
          </>
          )}
        </div>
      </div>
    </section>
  );
}
