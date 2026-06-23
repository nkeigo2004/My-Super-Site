import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { ImageUploadField } from "@/components/ImageUploadField";
import { updateProfile, addTag, removeTag, addLink, removeLink } from "./actions";

export const metadata: Metadata = { title: "アカウント / Account" };

export default async function AccountPage({
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
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url, banner_url, bio, birthday, birthday_public")
    .eq("id", user.id)
    .maybeSingle();

  const currentName = profile?.display_name ?? "";

  const { data: tags } = await supabase
    .from("profile_tags")
    .select("tag")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: links } = await supabase
    .from("profile_links")
    .select("id, label, url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <Section eyebrow="Account" title="アカウント / Account">
      <div className="max-w-xl space-y-6">
        <div className="flex items-center justify-between font-mono text-xs text-muted">
          <span>ログイン中: {user.email}</span>
          <Link href={`/u/${user.id}`} className="text-accent hover:underline">
            公開プロフィールを見る →
          </Link>
        </div>

        {error && (
          <p className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {message}
          </p>
        )}

        <form action={updateProfile} className="space-y-5">
          <div>
            <label htmlFor="display_name" className="mb-1 block font-mono text-xs text-muted">
              表示名（プロフィールに大きく出る名前・日本語OK）
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              maxLength={40}
              defaultValue={currentName}
              className="w-full rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1 block font-mono text-xs text-muted">
              ユーザーネーム（@ハンドル・半角英数）
            </label>
            <div className="flex items-center rounded-md border border-line bg-surface/40 focus-within:border-accent">
              <span className="pl-3 font-mono text-sm text-muted">@</span>
              <input
                id="username"
                name="username"
                type="text"
                maxLength={30}
                defaultValue={profile?.username ?? ""}
                placeholder="keigo2004"
                className="w-full bg-transparent px-2 py-2 text-sm text-fg outline-none"
              />
            </div>
          </div>

          <div>
            <p className="mb-1 font-mono text-xs text-muted">アイコン</p>
            <ImageUploadField
              userId={user.id}
              name="avatar_url"
              defaultUrl={profile?.avatar_url ?? ""}
            />
          </div>

          <div>
            <p className="mb-1 font-mono text-xs text-muted">バナー</p>
            <ImageUploadField
              userId={user.id}
              name="banner_url"
              defaultUrl={profile?.banner_url ?? ""}
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1 block font-mono text-xs text-muted">
              自由書き欄（自己紹介・ひとこと）
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              maxLength={500}
              defaultValue={profile?.bio ?? ""}
              placeholder="好きなこと、研究のこと、なんでも。"
              className="w-full resize-y rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="birthday" className="mb-1 block font-mono text-xs text-muted">
              誕生日
            </label>
            <input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={profile?.birthday ?? ""}
              className="rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
            <label className="mt-2 flex items-center gap-2 font-mono text-xs text-muted">
              <input
                type="checkbox"
                name="birthday_public"
                defaultChecked={!!profile?.birthday_public}
              />
              プロフィールに誕生日（月日）を表示する
            </label>
          </div>

          <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
            保存
          </button>
        </form>

        {/* 興味タグ */}
        <div className="space-y-3 border-t border-line pt-6">
          <div>
            <p className="font-mono text-xs text-muted">興味のタグ</p>
            <p className="mt-0.5 text-xs text-muted/70">
              好きなこと・趣味などを登録すると、同じタグの人とつながれます（プロフィールにも表示されます）。
            </p>
          </div>

          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t.tag}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface/40 py-1 pl-3 pr-1.5 text-sm"
                >
                  <Link href={`/tag/${encodeURIComponent(t.tag)}`} className="text-accent hover:underline">
                    #{t.tag}
                  </Link>
                  <form action={removeTag}>
                    <input type="hidden" name="tag" value={t.tag} />
                    <input type="hidden" name="redirect" value="/account" />
                    <button className="rounded-full px-1 text-xs text-muted hover:text-red-400">
                      ×
                    </button>
                  </form>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">まだタグがありません。</p>
          )}

          <form action={addTag} className="flex items-center gap-2">
            <input type="hidden" name="redirect" value="/account" />
            <input
              name="tag"
              maxLength={30}
              placeholder="例: 免疫学、ゲーム、機械学習（#は不要）"
              className="flex-1 rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
            <button className="rounded-md border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg">
              追加
            </button>
          </form>
        </div>

        {/* 他サービスへのリンク */}
        <div className="space-y-3 border-t border-line pt-6">
          <div>
            <p className="font-mono text-xs text-muted">リンク</p>
            <p className="mt-0.5 text-xs text-muted/70">
              他のSNSやサイトのURLを追加できます（プロフィールに表示されます）。
            </p>
          </div>

          {links && links.length > 0 ? (
            <ul className="space-y-2">
              {links.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center gap-2 rounded-md border border-line bg-surface/30 px-3 py-2 text-sm"
                >
                  <span className="truncate">
                    <span className="text-fg">{l.label}</span>{" "}
                    <span className="text-muted">{l.url}</span>
                  </span>
                  <form action={removeLink} className="ml-auto">
                    <input type="hidden" name="id" value={l.id} />
                    <button className="text-xs text-muted hover:text-red-400">×</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">まだリンクがありません。</p>
          )}

          <form action={addLink} className="space-y-2">
            <input
              name="label"
              maxLength={30}
              placeholder="表示名（例: X / GitHub・任意）"
              className="w-full rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
            <div className="flex items-center gap-2">
              <input
                name="url"
                maxLength={300}
                placeholder="https://..."
                className="flex-1 rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />
              <button className="rounded-md border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-fg">
                追加
              </button>
            </div>
          </form>
        </div>
      </div>
    </Section>
  );
}
