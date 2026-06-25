import Link from "next/link";
import { site } from "@/content/site";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

const summaryCls =
  "flex cursor-pointer list-none items-center gap-1 rounded px-2.5 py-1.5 text-muted transition-colors hover:text-fg [&::-webkit-details-marker]:hidden";
const menuCls =
  "absolute right-0 z-50 mt-1 min-w-[11rem] overflow-hidden rounded-md border border-line bg-bg p-1 shadow-lg";
const itemCls =
  "block rounded px-3 py-2 text-muted transition-colors hover:bg-surface/60 hover:text-fg";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null = null;
  let unread = 0;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data ?? null;

    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);
    unread = count ?? 0;
  }

  const handle =
    profile?.username ||
    profile?.display_name ||
    (user?.email ? user.email.split("@")[0] : "account");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-3 gap-y-2 px-5 py-4">
        <Link href="/" className="group flex items-center" aria-label={site.name}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={site.name} className="h-6 w-auto sm:h-7" />
        </Link>

        <nav className="flex flex-wrap items-center gap-0.5 font-mono text-xs">
          <Link href="/about" className="rounded px-2.5 py-1.5 text-muted transition-colors hover:text-fg">
            About
          </Link>

          {/* Publish */}
          <details className="relative">
            <summary className={summaryCls}>Publish ▾</summary>
            <div className={menuCls}>
              <Link href="/news" className={itemCls}>News</Link>
              <Link href="/research" className={itemCls}>Research</Link>
              <Link href="/notes" className={itemCls}>Notes</Link>
            </div>
          </details>

          {/* Community */}
          <details className="relative">
            <summary className={summaryCls}>Community ▾</summary>
            <div className={menuCls}>
              <Link href="/community" className={itemCls}>VoiceUP</Link>
              <Link href="/live" className={itemCls}>LIVE</Link>
            </div>
          </details>

          {/* Settings */}
          <Link
            href="/settings"
            className="rounded px-2 py-1.5 text-base leading-none text-muted transition-colors hover:text-fg"
            title="設定"
            aria-label="設定"
          >
            ⚙
          </Link>

          {/* Profile / Login */}
          {user ? (
            <div className="ml-1 flex items-center gap-1">
              <Link
                href="/notifications"
                className="relative rounded px-1.5 py-1 text-muted transition-colors hover:text-fg"
                title="通知"
                aria-label="通知"
              >
                🔔
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>

              <details className="relative">
                <summary className={`${summaryCls} pl-1`}>
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-[10px] text-accent">
                      {handle.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="max-w-[7rem] truncate">@{handle}</span>
                </summary>
                <div className={menuCls}>
                  <Link href={`/u/${user.id}`} className={itemCls}>
                    公開プロフィール
                  </Link>
                  <Link href="/messages" className={itemCls}>
                    メッセージ
                  </Link>
                  <Link href="/requests" className={itemCls}>
                    フォローリクエスト
                  </Link>
                  <Link href="/account" className={itemCls}>
                    アカウント設定
                  </Link>
                  <form action={signOut}>
                    <button className={`${itemCls} w-full text-left`}>
                      ログアウト
                    </button>
                  </form>
                </div>
              </details>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded px-2.5 py-1.5 text-muted transition-colors hover:text-fg"
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
