import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { sendMessage } from "../actions";

export const metadata = { title: "メッセージ / Messages" };

function timeLabel(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const otherId = params.id;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (otherId === user.id) redirect("/messages");

  const { data: other } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .eq("id", otherId)
    .maybeSingle();
  if (!other) notFound();

  // 2人の間のメッセージ（古い順）
  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .or(
      `and(sender_id.eq.${user.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user.id})`,
    )
    .order("created_at", { ascending: true });

  const name = other.display_name || "user";

  return (
    <Section eyebrow="Messages" title={name}>
      <Link
        href="/messages"
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← メッセージ一覧
      </Link>

      <div className="space-y-3">
        {(!msgs || msgs.length === 0) && (
          <p className="text-sm text-muted">まだメッセージはありません。</p>
        )}
        {msgs?.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-accent text-bg"
                    : "border border-line bg-surface/40 text-fg"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p
                  className={`mt-1 text-right font-mono text-[10px] ${
                    mine ? "text-bg/70" : "text-muted"
                  }`}
                >
                  {timeLabel(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 送信 */}
      <form action={sendMessage} className="mt-6 flex items-end gap-2">
        <input type="hidden" name="recipient_id" value={otherId} />
        <textarea
          name="content"
          rows={2}
          required
          maxLength={2000}
          placeholder="メッセージを入力…"
          className="flex-1 resize-y rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
          送信
        </button>
      </form>
    </Section>
  );
}
