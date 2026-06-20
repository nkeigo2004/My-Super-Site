# 個人サイト ─ Phase 1

プロフィール / 研究・制作物 / News を備えた個人サイトの土台です。
ダーク基調・ティールのアクセント。フレームワークは **Next.js 14 + TypeScript + Tailwind CSS**。

Phase 1 は「情報を集めない静的サイト」なので、サーバーやデータベースは不要です。
コミュニティ（SNS）・ログイン・LIVE 配信は Phase 2 以降で Supabase を導入して追加します。

---

## 1. まず動かす（ローカル）

事前に [Node.js](https://nodejs.org/)（18 以上）が必要です。

```bash
npm install     # 初回だけ
npm run dev      # 開発サーバー起動
```

ブラウザで http://localhost:3000 を開く。ファイルを保存すると自動で再読み込みされます。

---

## 2. 中身を書き換える（ここが本番）

編集するのは基本この3ファイルだけです。

| ファイル | 内容 |
| --- | --- |
| `src/content/profile.ts` | 名前・ハンドル・自己紹介・各種リンク |
| `src/content/works.ts`   | 研究・論文・制作物の一覧 |
| `src/content/news.ts`    | News（活動・会社の更新情報） |

News の更新は「`news.ts` を編集して git に push」＝それが公開・更新になります
（管理者＝あなただけが編集できる、という設計）。

### アクセントカラーを変える
`src/app/globals.css` の `--accent` の1行を書き換えるだけです。
候補: ティール `#34D0BA` / スカイ `#38BDF8` / ライム `#A3E635` / アンバー `#F5A524`

---

## 3. GitHub に上げる

```bash
git init
git add .
git commit -m "init: personal site phase 1"
# GitHub で空のリポジトリを作ってから:
git remote add origin https://github.com/<あなた>/<リポジトリ名>.git
git branch -M main
git push -u origin main
```

---

## 4. 公開する（Vercel）

1. https://vercel.com にアクセスし、GitHub アカウントでサインイン
2. 「Add New… → Project」で先ほどのリポジトリを Import
3. 設定はそのまま「Deploy」を押すだけ（Next.js は自動認識されます）
4. 数十秒で `https://<プロジェクト名>.vercel.app` が発行されます

以降は `git push` するたびに自動で再デプロイされます。

### 独自ドメインをつなぐ
1. Vercel のプロジェクト → Settings → Domains で取得済みドメインを追加
2. 表示される DNS レコード（A / CNAME）を、ドメイン取得元（お名前.com 等）の
   DNS 設定に登録
3. 反映されると独自ドメインで公開されます（HTTPS は自動）

※ ドメインの購入や DNS 登録、アカウント作成はご自身で行ってください。

---

## 5. これから（Phase 2 以降）

- ログイン / プロフィール / 投稿 / コメント / リアクション → **Supabase**
- 管理画面からの News 編集（git push 不要に）
- LIVE 配信 → LiveKit / Cloudflare などの専用サービス

Phase 2 に進むときは、認証やデータベースのテーブル設計から一緒に進めましょう。
