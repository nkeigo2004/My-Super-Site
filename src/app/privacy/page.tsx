import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { Section } from "@/components/Section";

export const metadata: Metadata = { title: "プライバシーポリシー" };

/*
  これは「たたき台」です。正式な法的文書ではありません。
  実際の公開・運用にあたっては、内容が自分のサービスの実態に合っているかを
  確認し、必要に応じて専門家のレビューを受けてください。
*/
export default function PrivacyPage() {
  const updated = "2026-06-21";
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
          <p>本サイトでは、以下の情報を取得します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              アカウント情報：会員登録・ログインのために、メールアドレスおよび
              パスワードを取得します（パスワードは認証基盤側で安全に管理され、
              運営者が平文で参照することはありません）。
            </li>
            <li>
              投稿コンテンツ：コミュニティ機能で利用者が投稿した本文・コメント・
              リアクション、および表示名（メールアドレスの一部）と投稿日時。
            </li>
            <li>
              アクセス情報：ページの表示等に伴い、一般的なアクセスログ（利用環境等）が
              記録される場合があります。
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            2. 利用目的
          </h3>
          <p>
            取得した情報は、会員登録・ログインの認証、コミュニティ機能の提供・表示、
            不正利用の防止、サービスの維持・改善のために利用します。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            3. 投稿の公開範囲
          </h3>
          <p>
            コミュニティ機能に投稿された本文・コメント・表示名・投稿日時は、
            本サイトの閲覧者（未ログインの第三者を含む）に公開されます。
            公開されたくない情報は投稿しないようご注意ください。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            4. Cookie の利用
          </h3>
          <p>
            ログイン状態を維持するために、認証用の Cookie を使用します。これは
            サービスの提供に必要なものです。ブラウザの設定で Cookie を無効化できますが、
            その場合ログイン機能が利用できないことがあります。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            5. 外部サービスへの委託
          </h3>
          <p>
            本サイトは、認証・データベース等のバックエンドに Supabase、ホスティングに
            Vercel を利用しています。取得した情報は、これらのサービスのサーバー上で
            保管・処理されます。これらの委託先における取り扱いは、各社のポリシーに従います。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            6. 第三者提供
          </h3>
          <p>
            法令に基づく場合、または前項の委託に必要な場合を除き、取得した情報を本人の
            同意なく第三者へ提供することはありません。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            7. 退会・削除
          </h3>
          <p>
            利用者は、自分が投稿した内容を削除できます。アカウント自体の削除を希望する
            場合は、お問い合わせ先までご連絡ください。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            8. ポリシーの変更
          </h3>
          <p>
            本ポリシーの内容は、必要に応じて変更されることがあります。変更後の内容は
            本ページに掲載した時点で効力を生じます。
          </p>
        </div>

        <div>
          <h3 className="mb-2 font-display text-base font-medium text-fg">
            9. お問い合わせ
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
