import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { Section } from "@/components/Section";

export const metadata: Metadata = { title: "プライバシーポリシー" };

/*
  これは Phase 1（情報を集めない静的サイト）向けの「たたき台」です。
  正式な法的文書ではありません。お問い合わせフォーム・アクセス解析・
  ユーザー登録（Phase 2）を追加したら、必ず内容を更新してください。
*/
export default function PrivacyPage() {
  const updated = "2026-06-20";
  return (
    <Section eyebrow="Legal" title="プライバシーポリシー">
      <div className="max-w-2xl space-y-6 text-sm leading-relaxed text-muted">
        <p>
          本ポリシーは、{profile.name}（以下「運営者」）が運営する本ウェブサイト
          （以下「本サイト」）における、利用者の情報の取り扱いについて定めるものです。
        </p>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            1. 取得する情報
          </h3>
          <p>
            現在の本サイトは情報発信を目的とした静的サイトであり、氏名・メールアドレス等の
            個人情報を入力フォーム等で取得することはありません。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            2. アクセス情報・Cookie
          </h3>
          <p>
            アクセス解析を導入する場合、Cookie 等を用いて閲覧状況（ページ閲覧数、
            利用環境等）を取得することがあります。これらは統計的に利用し、個人を特定する
            目的では使用しません。ブラウザの設定で Cookie を無効化できます。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            3. 第三者提供
          </h3>
          <p>
            法令に基づく場合を除き、取得した情報を本人の同意なく第三者へ提供することは
            ありません。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            4. ポリシーの変更
          </h3>
          <p>
            本ポリシーの内容は、必要に応じて予告なく変更されることがあります。変更後の
            内容は本ページに掲載した時点で効力を生じます。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            5. お問い合わせ
          </h3>
          <p>
            本ポリシーに関するお問い合わせは、各種リンク記載の連絡先までお願いします。
          </p>
        </div>

        <p className="font-mono text-xs">最終更新日: {updated}</p>
      </div>
    </Section>
  );
}
