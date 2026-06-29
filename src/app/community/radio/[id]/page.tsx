import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LocalTime } from "@/components/LocalTime";
import { Section } from "@/components/Section";
import { AudioPlayer } from "@/components/AudioPlayer";
import { createClient } from "@/lib/supabase/server";
import { deleteEpisode } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { data: ep } = await supabase
    .from("episodes")
    .select("title")
    .eq("id", params.id)
    .maybeSingle();
  return { title: ep?.title || "Radio" };
}

export default async function EpisodePage({
  params,
}: {
  params: { id: string };
}) {
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

  const { data: ep } = await supabase
    .from("episodes")
    .select("id, title, description, audio_url, cover_url, duration_seconds, published_on, created_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!ep) notFound();

  const { data: markRows } = await supabase
    .from("episode_marks")
    .select("t_seconds")
    .eq("episode_id", ep.id);
  const marks = (markRows ?? []).map((m) => m.t_seconds as number);

  return (
    <Section eyebrow="Radio / Podcast" title={ep.title}>
      <Link
        href="/community/radio"
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← ラジオ一覧
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {ep.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ep.cover_url}
            alt=""
            className="h-40 w-40 flex-shrink-0 rounded-lg border border-line object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted">
            <LocalTime
              iso={ep.published_on ? `${ep.published_on}T00:00:00` : ep.created_at}
              mode="date"
            />
          </p>
          {ep.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg/90">
              {ep.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-2xl">
        <AudioPlayer
          episodeId={ep.id}
          audioUrl={ep.audio_url}
          durationSeconds={ep.duration_seconds}
          initialMarks={marks}
          canReact={!!user}
        />
      </div>

      {isAdmin && (
        <form action={deleteEpisode} className="mt-8">
          <input type="hidden" name="id" value={ep.id} />
          <button className="font-mono text-[11px] text-muted/70 transition-colors hover:text-red-400">
            このエピソードを削除
          </button>
        </form>
      )}
    </Section>
  );
}
