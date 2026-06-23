import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bi } from "@/components/Bi";
import { createClient } from "@/lib/supabase/server";
import { getLang, pick } from "@/lib/lang";
import { ui } from "@/content/ui";

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

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("title_ja")
    .eq("slug", params.slug)
    .maybeSingle();
  return { title: note ? note.title_ja : "Note" };
}

export default async function NotePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createClient();
  const lang = getLang();
  const { data: note } = await supabase
    .from("notes")
    .select("slug, title_ja, title_en, body_ja, body_en, tags, image_url, created_at")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!note) notFound();

  return (
    <section className="mx-auto max-w-content px-5 py-16">
      <Link href="/notes" className="font-mono text-xs text-accent hover:underline">
        {pick(ui.backToNotes, lang)}
      </Link>

      <p className="mt-6 font-mono text-xs text-muted">{ymd(note.created_at)}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {note.title_ja}
        {note.title_en && (
          <span className="mt-1 block text-lg font-normal text-muted">
            {note.title_en}
          </span>
        )}
      </h1>

      {tagList(note.tags).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tagList(note.tags).map((t) => (
            <span key={t} className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted">
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

      <div className="mt-8 max-w-2xl border-t border-line pt-8">
        <p className="whitespace-pre-line leading-relaxed text-fg/90">
          <Bi
            v={{ ja: note.body_ja, en: note.body_en }}
            enClass="mt-4 block whitespace-pre-line text-base leading-relaxed text-muted"
          />
        </p>
      </div>
    </section>
  );
}
