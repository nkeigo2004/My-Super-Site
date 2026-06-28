import type { Metadata } from "next";
import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { Section } from "@/components/Section";
import { NoteForm } from "@/components/NoteForm";
import { createClient } from "@/lib/supabase/server";
import { createNote, editNote, deleteNote } from "./actions";

export const metadata: Metadata = { title: "Notes" };

function tagList(tags?: string | null) {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function NotesPage({
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
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!profile?.is_admin;
  }

  const { data: notes } = await supabase
    .from("notes")
    .select(
      "id, slug, title, title_ja, summary, summary_ja, tags, image_url, created_at",
    )
    .order("created_at", { ascending: false });

  return (
    <Section eyebrow="Log" title="ノート / Notes">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        研究や告知に収まらない、自由な記録です。各ノートでは、読者が段落ごとに「響いた」反応や絵文字を残せます。
        {isAdmin && "（管理者として下のフォームから追加・編集・削除できます）"}
      </p>

      {error && (
        <p className="mb-6 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-6 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}

      {isAdmin && (
        <details className="mb-10 rounded-lg border border-line bg-surface/30 p-4">
          <summary className="cursor-pointer font-mono text-xs text-accent">
            管理者：ノートを追加
          </summary>
          <div className="mt-4">
            <NoteForm
              action={createNote}
              userId={user?.id ?? ""}
              submitLabel="追加"
              withSlug
            />
          </div>
        </details>
      )}

      {(!notes || notes.length === 0) && (
        <p className="text-sm text-muted">まだノートがありません。</p>
      )}

      <ul className="divide-y divide-line border-y border-line">
        {notes?.map((n) => {
          const title = n.title || n.title_ja || "(untitled)";
          const summary = n.summary || n.summary_ja || "";
          return (
            <li key={n.id} className="py-6">
              <Link
                href={`/notes/${n.slug}`}
                className="group block transition-colors hover:bg-surface/30"
              >
                <p className="font-mono text-xs text-muted">
                  <LocalTime iso={n.created_at} mode="date" />
                </p>
                <h3 className="mt-1.5 font-display text-lg font-medium tracking-tight group-hover:text-fg">
                  {title}
                  <span className="ml-1 text-muted group-hover:text-accent">→</span>
                </h3>
                {summary && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    {summary}
                  </p>
                )}
              </Link>
              {tagList(n.tags).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tagList(n.tags).map((t) => (
                    <span
                      key={t}
                      className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {isAdmin && (
                <div className="mt-3 flex items-center gap-3">
                  <form action={deleteNote}>
                    <input type="hidden" name="id" value={n.id} />
                    <button className="font-mono text-[11px] text-muted/70 transition-colors hover:text-red-400">
                      削除
                    </button>
                  </form>
                  <details>
                    <summary className="cursor-pointer font-mono text-[11px] text-muted/70 transition-colors hover:text-fg">
                      編集
                    </summary>
                    <div className="mt-2">
                      <NoteForm
                        action={editNote}
                        note={{
                          title: n.title ?? n.title_ja,
                          summary: n.summary ?? n.summary_ja,
                          body: null,
                          tags: n.tags,
                          image_url: n.image_url,
                        }}
                        hiddenId={n.id}
                        userId={user?.id ?? ""}
                        submitLabel="更新"
                      />
                    </div>
                  </details>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
