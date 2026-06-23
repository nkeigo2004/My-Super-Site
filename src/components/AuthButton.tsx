import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

// ヘッダーに表示する、ログイン状態に応じたボタン
export async function AuthButton() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded px-2.5 py-1.5 font-mono text-xs text-muted transition-colors hover:text-fg"
      >
        ログイン
      </Link>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("read", false);

  const name =
    profile?.display_name ??
    (user.email ? user.email.split("@")[0] : "account");

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <Link
        href="/notifications"
        className="relative rounded px-1.5 py-1 text-muted transition-colors hover:text-fg"
        title="通知"
        aria-label="通知"
      >
        🔔
        {!!unread && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </Link>
      <Link
        href="/account"
        className="max-w-[8rem] truncate text-muted transition-colors hover:text-fg"
        title="アカウント設定"
      >
        @{name}
      </Link>
      <form action={signOut}>
        <button className="rounded border border-line px-2 py-1 text-muted transition-colors hover:text-fg">
          ログアウト
        </button>
      </form>
    </div>
  );
}
