import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "メッセージ / Messages" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 自分が関わる全メッセージ（新しい順）
  const { data: msgs } = await supabase
    .from("messages")
    .select("sender_id, recipient_id, content, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  // 相手ごとに最新メッセージだけ残す
  const latestByOther = new Map<
    string,
    { content: string; created_at: string }
  >();
  for (const m of msgs ?? []) {
    const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
    if (!latestByOther.has(other)) {
      latestByOther.set(other, { content: m.content, created_at: m.created_at });
    }
  }

  const otherIds = Array.from(latestByOther.keys());
  const { data: profiles } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", otherIds)
    : { data: [] as any[] };
  const profById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <Section eyebrow="Messages" title="メッセージ / Messages">
      {otherIds.length === 0 ? (
        <p className="text-sm text-muted">
          まだメッセージはありません。プロフィールの「メッセージ」ボタンから送れます。
        </p>
      ) : (
        <div className="space-y-2">
          {otherIds.map((id) => {
            const p = profById.get(id);
            const nm = p?.display_name || "user";
            const last = latestByOther.get(id)!;
            return (
              <Link
                key={id}
                href={`/messages/${id}`}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface/20 p-3 transition-colors hover:border-accent"
              >
                {p?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full border border-line object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-xs text-accent">
                    {nm.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-fg">{nm}</span>
                  <span className="block truncate text-xs text-muted">
                    {last.content}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}
