import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { LiveChat } from "@/components/LiveChat";
import { updateLive } from "./actions";

export const metadata: Metadata = { title: "Live" };

function embedSrc(provider: string, videoId: string) {
  if (provider === "twitch") {
    return `https://player.twitch.tv/?channel=${encodeURIComponent(
      videoId,
    )}&parent=nkcells2004.com&parent=localhost&autoplay=true`;
  }
  // 既定は YouTube
  return `https://www.youtube.com/embed/${encodeURIComponent(
    videoId,
  )}?autoplay=1`;
}

export default async function LivePage({
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
  let userName: string | null = null;
  if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("is_admin, display_name")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!p?.is_admin;
    userName = p?.display_name ?? (user.email ? user.email.split("@")[0] : "user");
  }

  const { data: live } = await supabase
    .from("live_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const isLive = !!live?.is_live && !!live?.video_id;

  return (
    <Section eyebrow="Live" title="LIVE 配信 / Live">
      {error && (
        <p className="mb-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}
      {message && (
        <p className="mb-4 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">{message}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        {/* プレイヤー */}
        <div>
          {isLive && (
            <div className="mb-2 flex items-center gap-2 font-mono text-xs text-accent">
              <span className="live-dot" aria-hidden />
              <span>LIVE</span>
              {live?.title && <span className="text-fg">— {live.title}</span>}
            </div>
          )}
          {isLive ? (
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-line bg-black">
              <iframe
                src={embedSrc(live.provider, live.video_id)}
                title="Live stream"
                className="h-full w-full"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-line bg-surface/20 text-center">
              <div>
                <p className="font-mono text-sm text-muted">現在配信していません</p>
                <p className="mt-1 font-mono text-xs text-muted/70">Currently offline</p>
              </div>
            </div>
          )}
        </div>

        {/* チャット */}
        <LiveChat
          userId={user ? user.id : null}
          userName={userName}
          isLive={isLive}
          sessionStart={live?.started_at ?? null}
        />
      </div>

      {/* 管理者：配信設定 */}
      {isAdmin && (
        <details className="mt-8 rounded-lg border border-line bg-surface/30 p-4">
          <summary className="cursor-pointer font-mono text-xs text-accent">
            管理者：配信設定
          </summary>
          <form action={updateLive} className="mt-4 space-y-3">
            <label className="flex items-center gap-2 font-mono text-xs text-muted">
              <input type="checkbox" name="is_live" defaultChecked={!!live?.is_live} />
              配信中にする（LIVE表示・プレイヤー表示）
            </label>
            <div>
              <p className="mb-1 font-mono text-xs text-muted">配信元</p>
              <select name="provider" defaultValue={live?.provider ?? "youtube"} className="rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent">
                <option value="youtube">YouTube</option>
                <option value="twitch">Twitch</option>
              </select>
            </div>
            <div>
              <p className="mb-1 font-mono text-xs text-muted">
                ID（YouTube: 配信動画のID / Twitch: チャンネル名）
              </p>
              <input name="video_id" defaultValue={live?.video_id ?? ""} placeholder="例（YouTube）: dQw4w9WgXcQ" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
            </div>
            <input name="title" defaultValue={live?.title ?? ""} placeholder="配信タイトル（任意）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
            <div className="flex justify-end">
              <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">保存</button>
            </div>
          </form>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted/70">
            ※ YouTube の ID は、配信URL <span className="text-muted">youtube.com/watch?v=<b>ID</b></span> の太字部分です。
            Twitch はチャンネル名(URL末尾)を入れます。
          </p>
        </details>
      )}
    </Section>
  );
}
