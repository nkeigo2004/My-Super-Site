import type { Metadata } from "next";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Radio / Podcast" };

function fmtDur(s?: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default async function RadioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!profile?.is_admin;
  }

  const { data: episodes } = await supabase
    .from("episodes")
    .select("id, title, description, cover_url, duration_seconds, published_on, created_at")
    .order("published_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <Section eyebrow="Community" title="ラジオ / ポッドキャスト">
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
        音声で配信するラジオ・ポッドキャストです。再生中の好きな瞬間に「ここ好き」を残せます。
      </p>

      {error && (
        <p className="mb-6 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {isAdmin && (
        <div className="mb-8">
          <Link
            href="/community/radio/new"
            className="inline-flex items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
          >
            ＋ エピソードを投稿
          </Link>
        </div>
      )}

      {(!episodes || episodes.length === 0) && (
        <p className="text-sm text-muted">まだエピソードがありません。</p>
      )}

      <div className="space-y-3">
        {episodes?.map((ep) => (
          <Link
            key={ep.id}
            href={`/community/radio/${ep.id}`}
            className="flex items-center gap-4 rounded-xl border border-line bg-surface/20 p-4 transition-colors hover:border-accent"
          >
            {ep.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ep.cover_url}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-md border border-line object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border border-line bg-surface text-2xl">
                🎙
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-medium tracking-tight">
                {ep.title}
              </span>
              {ep.description && (
                <span className="mt-0.5 line-clamp-1 block text-sm text-muted">
                  {ep.description}
                </span>
              )}
              <span className="mt-1 block font-mono text-[11px] text-muted/70">
                <LocalTime
                  iso={ep.published_on ? `${ep.published_on}T00:00:00` : ep.created_at}
                  mode="date"
                />
                {ep.duration_seconds ? ` ・ ${fmtDur(ep.duration_seconds)}` : ""}
              </span>
            </span>
            <span className="font-mono text-xs text-accent">▶ 再生</span>
          </Link>
        ))}
      </div>
    </Section>
  );
}
