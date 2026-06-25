import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/Section";

export const metadata: Metadata = { title: "サポート / Support" };

const faqs = [
  {
    q: "ログインできない / 確認メールが届かない",
    a: "確認メールが届かないときは、迷惑メールフォルダもご確認ください。それでも届かない場合は、少し時間をおいてから再度お試しください。",
  },
  {
    q: "アカウントを削除（退会）したい",
    a: "設定 → アカウント → 退会 から削除できます。削除するとアカウント・投稿・コメント・プロフィールがすべて消え、元には戻せません。",
  },
  {
    q: "アカウントを非公開（鍵アカウント）にしたい",
    a: "設定 → プライバシー から「非公開」に切り替えられます。非公開にすると、投稿は承認したフォロワーだけが見られるようになります。",
  },
  {
    q: "パスワードを変更したい",
    a: "設定 → アカウント → パスワードの変更 から変更できます。",
  },
];

export default function SupportPage() {
  return (
    <Section eyebrow="Support" title="サポート / Support">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        NK Cells のご利用ありがとうございます。よくある質問と、困ったときの対処をまとめています。
      </p>

      <div className="space-y-4">
        {faqs.map((f) => (
          <div
            key={f.q}
            className="rounded-lg border border-line bg-surface/30 p-5"
          >
            <h3 className="font-display text-base font-medium tracking-tight">
              {f.q}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        解決しない場合は、
        <Link href="/community" className="text-accent hover:underline">
          コミュニティ（VoiceUP）
        </Link>
        でも質問できます。
      </p>
    </Section>
  );
}
