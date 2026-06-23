import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { signIn, signUp } from "./actions";

export const metadata: Metadata = { title: "ログイン / Login" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;
  const message =
    typeof searchParams.message === "string" ? searchParams.message : undefined;

  return (
    <Section eyebrow="Account" title="ログイン / Login">
      <div className="mx-auto max-w-sm">
        <p className="text-sm leading-relaxed text-muted">
          メールアドレスとパスワードで登録・ログインできます。初めての方は
          「新規登録」を押してください。
        </p>

        <form className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block font-mono text-xs text-muted"
            >
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block font-mono text-xs text-muted"
            >
              パスワード（6文字以上）
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              className="w-full rounded-md border border-line bg-surface/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              formAction={signIn}
              className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90"
            >
              ログイン
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-md border border-line px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-accent"
            >
              新規登録
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            {message}
          </p>
        )}
      </div>
    </Section>
  );
}
