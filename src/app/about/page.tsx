import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { updateAbout } from "./actions";

export const metadata: Metadata = { title: "About" };

// DBの値が空なら profile.ts の値を使う
function pick(dbVal: string | undefined | null, fallback: string) {
  return dbVal && dbVal.trim() ? dbVal : fallback;
}

export default async function AboutPage({
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
    const { data: p } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = !!p?.is_admin;
  }

  const { data: sp } = await supabase
    .from("site_profile")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const fieldText = pick(sp?.field_ja, profile.field.ja);
  const bioText = pick(sp?.bio_ja, profile.bio.ja);

  return (
    <Section eyebrow="About" title="プロフィール / About">
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

      <div className="rounded-lg border border-line bg-surface/30 p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-bg font-display text-xl text-accent">
            {profile.name.slice(0, 1)}
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {profile.name}
            </h2>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-y-2.5 border-t border-line pt-6 font-mono text-xs sm:grid-cols-[8rem_1fr]">
          <dt className="text-muted">field</dt>
          <dd className="text-accent">{fieldText}</dd>
        </dl>

        <div className="mt-8 border-t border-line pt-6">
          <p className="whitespace-pre-line leading-relaxed text-fg/90">
            {bioText}
          </p>
        </div>
      </div>

      {/* 管理者：編集フォーム（日本語1言語でシンプルに） */}
      {isAdmin && (
        <details className="mt-8 rounded-lg border border-line bg-surface/30 p-4">
          <summary className="cursor-pointer font-mono text-xs text-accent">
            管理者：プロフィールを編集
          </summary>
          <form action={updateAbout} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block font-mono text-xs text-muted">
                field（分野）
              </label>
              <input
                name="field_ja"
                defaultValue={fieldText}
                placeholder="例: 機械学習・AI"
                className="w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-xs text-muted">
                自己紹介・経歴
              </label>
              <textarea
                name="bio_ja"
                rows={8}
                defaultValue={bioText}
                placeholder="自己紹介や経歴を書いてください"
                className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
            </div>
            <p className="font-mono text-[11px] text-muted/70">
              ※ 日本語だけでOKです。英語の閲覧者はブラウザの翻訳機能を使えます。
            </p>
            <div className="flex justify-end">
              <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
                保存
              </button>
            </div>
          </form>
        </details>
      )}
    </Section>
  );
}
