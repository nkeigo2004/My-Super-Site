import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Bi } from "@/components/Bi";
import { createClient } from "@/lib/supabase/server";
import { ImageUploadField } from "@/components/ImageUploadField";
import { createNews, deleteNews, togglePin } from "./actions";

export const metadata: Metadata = { title: "News" };

function ymd(iso: string) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export default async function NewsPage({
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

  const { data: news } = await supabase
    .from("news")
    .select("id, created_at, title_ja, title_en, body_ja, body_en, pinned, image_url")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <Section eyebrow="Updates" title="ニュース / News">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        活動・お知らせの更新情報です。
        {isAdmin
          ? "（管理者として、下のフォームから追加・削除・固定ができます）"
          : "編集できるのは管理者のみです。"}
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

      {/* 管理者用：追加フォーム */}
      {isAdmin && (
        <form
          action={createNews}
          className="mb-10 space-y-3 rounded-lg border border-line bg-surface/30 p-4"
        >
          <p className="font-mono text-xs text-accent">管理者：ニュースを追加</p>
          <input
            name="title_ja"
            required
            placeholder="タイトル（日本語・必須）"
            className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
          <input
            name="title_en"
            placeholder="Title (English・任意)"
            className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
          <textarea
            name="body_ja"
            required
            rows={3}
            placeholder="本文（日本語・必須）"
            className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
          <textarea
            name="body_en"
            rows={3}
            placeholder="Body (English・任意)"
            className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
          />
          <div>
            <p className="mb-1 font-mono text-xs text-muted">画像（任意）</p>
            <ImageUploadField userId={user?.id ?? ""} />
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-muted">
            <input type="checkbox" name="pinned" />
            先頭に固定する（pinned）
          </label>
          <div className="flex justify-end">
            <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
              追加
            </button>
          </div>
        </form>
      )}

      {/* 一覧 */}
      {(!news || news.length === 0) && (
        <p className="text-sm text-muted">まだニュースがありません。</p>
      )}

      <ol className="relative ml-3 border-l border-line">
        {news?.map((item) => (
          <li key={item.id} className="mb-8 pl-6">
            <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-bg bg-accent" />
            <div className="flex flex-wrap items-center gap-2">
              <time className="font-mono text-xs text-muted">
                {ymd(item.created_at)}
              </time>
              {item.pinned && (
                <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                  pinned
                </span>
              )}
              {isAdmin && (
                <span className="flex items-center gap-2">
                  <form action={togglePin}>
                    <input type="hidden" name="id" value={item.id} />
                    <input
                      type="hidden"
                      name="pinned"
                      value={String(item.pinned)}
                    />
                    <button className="font-mono text-[10px] text-muted/70 transition-colors hover:text-accent">
                      {item.pinned ? "固定解除" : "固定"}
                    </button>
                  </form>
                  <form action={deleteNews}>
                    <input type="hidden" name="id" value={item.id} />
                    <button className="font-mono text-[10px] text-muted/70 transition-colors hover:text-red-400">
                      削除
                    </button>
                  </form>
                </span>
              )}
            </div>
            <h3 className="mt-1 font-display text-lg font-medium tracking-tight">
              <Bi
                v={{ ja: item.title_ja, en: item.title_en }}
                enClass="mt-0.5 block text-sm font-normal text-muted"
              />
            </h3>
            <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted">
              <Bi
                v={{ ja: item.body_ja, en: item.body_en }}
                enClass="mt-1.5 block text-muted/70"
              />
            </p>
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="mt-3 max-h-80 rounded-md border border-line"
              />
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
