import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "./actions";

export const metadata: Metadata = { title: "通知 / Notifications" };

function formatDate(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("ja-JP", { month: "2-digit", day: "2-digit" }) +
    " " +
    d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
  );
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, actor_name, type, created_at, read")
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.read);

  return (
    <Section eyebrow="Inbox" title="通知 / Notifications">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/community"
          className="font-mono text-xs text-accent hover:underline"
        >
          ← VoiceUP へ
        </Link>
        {hasUnread && (
          <form action={markAllRead}>
            <button className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-fg">
              すべて既読にする
            </button>
          </form>
        )}
      </div>

      {(!notifications || notifications.length === 0) && (
        <p className="text-sm text-muted">通知はまだありません。</p>
      )}

      <ul className="space-y-2">
        {notifications?.map((n) => (
          <li
            key={n.id}
            className={`rounded-lg border px-4 py-3 text-sm ${
              n.read
                ? "border-line bg-surface/10 text-muted"
                : "border-accent/40 bg-accent/10 text-fg"
            }`}
          >
            <span className="text-accent">@{n.actor_name}</span>
            {n.type === "comment"
              ? " さんがあなたの投稿にコメントしました"
              : n.type === "mention"
                ? " さんがあなたにメンションしました"
                : " からの通知"}
            <span className="ml-2 font-mono text-[11px] text-muted">
              {formatDate(n.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
