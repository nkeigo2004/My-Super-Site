import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { NoteParagraphs } from "@/components/NoteParagraphs";
import { createClient } from "@/lib/supabase/server";
import { toggleNoteReaction } from "../actions";

const EMOJIS = [
  { e: "👍", label: "なるほど" },
  { e: "💡", label: "学びになった" },
  { e: "❤️", label: "好き" },
  { e: "🔥", label: "すごい" },
  { e: "🤔", label: "考えた" },
];

function tagList(tags?: string | null) {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function splitParagraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("title, title_ja")
    .eq("slug", params.slug)
    .maybeSingle();
  return { title: note?.title || note?.title_ja || "Note" };
}

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: note } = await supabase
    .from("notes")
    .select(
      "id, slug, title, title_ja, summary, summary_ja, body, body_ja, tags, image_url, created_at",
    )
    .eq("slug", params.slug)
    .maybeSingle();

  if (!note) notFound();

  const title = note.title || note.title_ja || "(untitled)";
  const summary = note.summary || note.summary_ja || "";
  const body = note.body || note.body_ja || "";
  const paragraphs = splitParagraphs(body);

  // 読書時間（日本語 ~500字/分の目安）
  const minutes = Math.max(1, Math.round(body.replace(/\s/g, "").length / 500));

  // 段落「響いた」
  const { data: pr } = await supabase
    .from("note_para_reactions")
    .select("para_index, user_id")
    .eq("note_id", note.id);
  const counts = new Array(paragraphs.length).fill(0);
  const mine = new Array(paragraphs.length).fill(false);
  for (const r of pr ?? []) {
    const idx = r.para_index as number;
    if (idx >= 0 && idx < paragraphs.length) {
      counts[idx]++;
      if (user && r.user_id === user.id) mine[idx] = true;
    }
  }
  const maxCount = counts.length ? Math.max(0, ...counts) : 0;
  const totalResonance = counts.reduce((a, b) => a + b, 0);

  // ノート絵文字リアクション
  const { data: nr } = await supabase
    .from("note_reactions")
    .select("emoji, user_id")
    .eq("note_id", note.id);
  const emojiCount = new Map<string, number>();
  const myEmoji = new Set<string>();
  for (const r of nr ?? []) {
    emojiCount.set(r.emoji, (emojiCount.get(r.emoji) ?? 0) + 1);
    if (user && r.user_id === user.id) myEmoji.add(r.emoji);
  }

  return (
    <section className="mx-auto max-w-content px-5 py-16">
      <Link href="/notes" className="font-mono text-xs text-accent hover:underline">
        ← ノート一覧
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted">
        <LocalTime iso={note.created_at} mode="date" />
        <span>・ 約{minutes}分で読めます</span>
        {totalResonance > 0 && <span>・ ♥ {totalResonance}</span>}
      </div>

      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>

      {summary && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          {summary}
        </p>
      )}

      {tagList(note.tags).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tagList(note.tags).map((t) => (
            <span
              key={t}
              className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {note.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={note.image_url}
          alt=""
          className="mt-6 max-h-96 rounded-md border border-line"
        />
      )}

      {/* 本文（段落ごとに「響いた」を押せる） */}
      <div className="mt-8 max-w-2xl border-t border-line pt-8">
        {paragraphs.length > 0 ? (
          <NoteParagraphs
            paragraphs={paragraphs}
            noteId={note.id}
            initialCounts={counts}
            initialMine={mine}
            canReact={!!user}
            maxCount={maxCount}
          />
        ) : (
          <p className="text-sm text-muted">本文がありません。</p>
        )}
        <p className="mt-4 font-mono text-[11px] text-muted/60">
          ※ 心に残った段落の「♡ 響いた」を押すと、書き手に届きます。
        </p>
      </div>

      {/* ノート全体への絵文字リアクション */}
      <div className="mt-10 max-w-2xl border-t border-line pt-6">
        <p className="mb-3 font-mono text-xs text-muted">このノートに反応する</p>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(({ e, label }) => {
            const c = emojiCount.get(e) ?? 0;
            const reacted = myEmoji.has(e);
            return (
              <form action={toggleNoteReaction} key={e}>
                <input type="hidden" name="note_id" value={note.id} />
                <input type="hidden" name="slug" value={note.slug} />
                <input type="hidden" name="emoji" value={e} />
                <button
                  disabled={!user}
                  title={user ? label : "ログインすると押せます"}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                    reacted
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-line text-muted hover:border-accent hover:text-fg"
                  }`}
                >
                  <span>{e}</span>
                  <span className="font-mono text-xs">{c > 0 ? c : ""}</span>
                </button>
              </form>
            );
          })}
        </div>
        {!user && (
          <p className="mt-2 font-mono text-[11px] text-muted/70">
            反応するにはログインしてください。
          </p>
        )}
      </div>
    </section>
  );
}
