import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageChoice } from "@/components/LanguageChoice";
import { A11ySettings } from "@/components/A11ySettings";
import { getLang } from "@/lib/lang";
import { createClient } from "@/lib/supabase/server";
import { updatePassword, updateNotifyPrefs, updatePrivacy, deleteAccount } from "./actions";

export const metadata: Metadata = { title: "Settings" };

function loc(title: string, lang: "ja" | "en") {
  const i = title.indexOf(" / ");
  if (i === -1) return title;
  return lang === "en" ? title.slice(i + 3) : title.slice(0, i);
}

function Row({
  title,
  desc,
  children,
  lang,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  lang: "ja" | "en";
}) {
  return (
    <div className="rounded-lg border border-line bg-surface/30 p-5 sm:p-6">
      <h3 className="font-display text-lg font-medium tracking-tight">{loc(title, lang)}</h3>
      {desc && <p className="mt-1 text-sm text-muted">{desc}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const lang = getLang();
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;
  const message =
    typeof searchParams.message === "string" ? searchParams.message : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let notifyComments = true;
  let isPrivate = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("notify_comments, is_private")
      .eq("id", user.id)
      .maybeSingle();
    notifyComments = profile?.notify_comments ?? true;
    isPrivate = profile?.is_private ?? false;
  }

  return (
    <Section eyebrow="Settings" title="設定 / Settings">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        {lang === "en"
          ? "Language, theme, accessibility, notifications, and account settings."
          : "表示言語・テーマ・アクセシビリティ・通知・アカウントの設定です。"}
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

      <div className="space-y-5">
        <Row
          lang={lang}
          title="表示言語 / Language"
          desc={lang === "en" ? "Switch the site between Japanese and English. Defaults to your device language." : "サイトの表示を日本語か英語に切り替えます。初期値はお使いの端末の言語です。"}
        >
          <LanguageChoice current={lang} />
        </Row>

        <Row lang={lang} title="テーマ / Theme" desc={lang === "en" ? "Choose a color scheme." : "配色を選べます。"}>
          <ThemeToggle />
        </Row>

        <Row lang={lang} title="アクセシビリティ / Accessibility">
          <A11ySettings />
        </Row>

        {/* 通知（ログイン時） */}
        {user && (
          <Row lang={lang} title="通知 / Notifications" desc={lang === "en" ? "Choose which notifications you receive." : "受け取る通知を選べます。"}>
            <form action={updateNotifyPrefs} className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  name="notify_comments"
                  defaultChecked={notifyComments}
                />
                自分の投稿へのコメントを通知する
              </label>
              <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                保存
              </button>
            </form>
          </Row>
        )}

        {/* プライバシー（ログイン時） */}
        {user && (
          <Row lang={lang} title="プライバシー / Privacy" desc={lang === "en" ? "Make your account private (locked)." : "アカウントを非公開（鍵アカウント）にできます。"}>
            <form action={updatePrivacy} className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" name="is_private" defaultChecked={isPrivate} />
                アカウントを非公開（鍵アカウント）にする
              </label>
              <p className="font-mono text-[11px] text-muted/70">
                非公開にすると、あなたの投稿は承認したフォロワーだけが見られます。新しいフォローは承認制になります。プロフィール（名前・自己紹介）は表示されます。
              </p>
              <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                保存
              </button>
            </form>
          </Row>
        )}

        {/* アカウント（ログイン時） */}
        {user && (
          <Row lang={lang} title="アカウント / Account">
            <div className="space-y-6">
              <p className="font-mono text-xs text-muted">{user.email}</p>

              {/* パスワード変更 */}
              <form action={updatePassword} className="space-y-2">
                <p className="font-mono text-xs text-muted">パスワードの変更</p>
                <input
                  type="password"
                  name="password"
                  placeholder="新しいパスワード（6文字以上）"
                  className="w-full max-w-sm rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                />
                <input
                  type="password"
                  name="password2"
                  placeholder="新しいパスワード（確認）"
                  className="w-full max-w-sm rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
                />
                <div>
                  <button className="rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-fg">
                    パスワードを変更
                  </button>
                </div>
              </form>

              {/* 退会 */}
              <div className="rounded-md border border-red-400/30 bg-red-400/5 p-4">
                <p className="text-sm font-medium text-red-400">退会（アカウント削除）</p>
                <p className="mt-1 text-xs text-muted">
                  アカウントと、あなたの投稿・コメント・プロフィールが完全に削除されます。この操作は取り消せません。
                </p>
                <form action={deleteAccount} className="mt-3 space-y-2">
                  <input
                    name="confirm"
                    placeholder="確認のため「削除」と入力"
                    className="w-full max-w-xs rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-red-400"
                  />
                  <div>
                    <button className="rounded-md border border-red-400/50 bg-red-400/10 px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-400/20">
                      退会する
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Row>
        )}
      </div>
    </Section>
  );
}
