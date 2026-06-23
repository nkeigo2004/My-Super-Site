import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";
import { Bi } from "@/components/Bi";
import { createClient } from "@/lib/supabase/server";
import { ImageUploadField } from "@/components/ImageUploadField";
import { createNote, editNote, deleteNote } from "./actions";

export const metadata: Metadata = { title: "Notes" };

function ymd(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function tagList(tags: string) {
  return tags
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
    .select("id, slug, title_ja, title_en, summary_ja, summary_en, body_ja, body_en, tags, image_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <Section eyebrow="Log" title="ノート / Notes">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        研究や告知に収まらない、自由な記録です。
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
        <form
          action={createNote}
          className="mb-10 space-y-3 rounded-lg border border-line bg-surface/30 p-4"
        >
          <p className="font-mono text-xs text-accent">管理者：ノートを追加</p>
          <input name="slug" required placeholder="slug（URLになる英数字・例: my-first-note・必須）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="title_ja" required placeholder="タイトル（日本語・必須）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="title_en" placeholder="Title (English・任意)" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="summary_ja" placeholder="概要（日本語・一覧に出る短い説明・任意）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="summary_en" placeholder="Summary (English・任意)" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <textarea name="body_ja" rows={4} placeholder="本文（日本語）。空行で段落が分かれます。" className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <textarea name="body_en" rows={4} placeholder="Body (English・任意)" className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <input name="tags" placeholder="タグ（カンマ区切り・任意・例: note, research）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
          <ImageUploadField userId={user?.id ?? ""} />
          <div className="flex justify-end">
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">追加</button>
          </div>
        </form>
      )}

      {(!notes || notes.length === 0) && (
        <p className="text-sm text-muted">まだノートがありません。</p>
      )}

      <ul className="divide-y divide-line border-y border-line">
        {notes?.map((n) => (
          <li key={n.id} className="py-6">
            <Link href={`/notes/${n.slug}`} className="group block transition-colors hover:bg-surface/30">
              <p className="font-mono text-xs text-muted">{ymd(n.created_at)}</p>
              <h3 className="mt-1.5 font-display text-lg font-medium tracking-tight group-hover:text-fg">
                <Bi v={{ ja: n.title_ja, en: n.title_en }} enClass="mt-0.5 block text-sm font-normal text-muted" />
                <span className="ml-1 text-muted group-hover:text-accent">→</span>
              </h3>
              {(n.summary_ja || n.summary_en) && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  <Bi v={{ ja: n.summary_ja, en: n.summary_en }} enClass="mt-1.5 block text-muted/70" />
                </p>
              )}
            </Link>
            {tagList(n.tags).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tagList(n.tags).map((t) => (
                  <span key={t} className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted">{t}</span>
                ))}
              </div>
            )}
            {isAdmin && (
              <div className="mt-3 flex items-center gap-3">
                <form action={deleteNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="font-mono text-[11px] text-muted/70 transition-colors hover:text-red-400">削除</button>
                </form>
                <details>
                  <summary className="cursor-pointer font-mono text-[11px] text-muted/70 transition-colors hover:text-fg">編集</summary>
                  <form action={editNote} className="mt-2 space-y-2">
                    <input type="hidden" name="id" value={n.id} />
                    <input name="title_ja" required defaultValue={n.title_ja} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <input name="title_en" defaultValue={n.title_en} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <input name="summary_ja" defaultValue={n.summary_ja} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <input name="summary_en" defaultValue={n.summary_en} className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <textarea name="body_ja" rows={4} defaultValue={n.body_ja} placeholder="本文（日本語）" className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <textarea name="body_en" rows={4} defaultValue={n.body_en} placeholder="Body (English)" className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <input name="tags" defaultValue={n.tags} placeholder="タグ（カンマ区切り）" className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent" />
                    <ImageUploadField userId={user?.id ?? ""} defaultUrl={n.image_url ?? ""} />
                    <div className="flex justify-end">
                      <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">更新</button>
                    </div>
                  </form>
                </details>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
