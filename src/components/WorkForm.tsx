type WorkLike = {
  kind?: string | null;
  title?: string | null;
  authors?: string | null;
  abstract?: string | null;
  body?: string | null;
  category?: string | null;
  keywords?: string | null;
  published_on?: string | null;
  pdf_url?: string | null;
  code_url?: string | null;
  doi?: string | null;
};

const input =
  "w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent";
const label = "mb-1 block font-mono text-xs text-muted";

export function WorkForm({
  action,
  work,
  hiddenId,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  work?: WorkLike;
  hiddenId?: string;
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {hiddenId && <input type="hidden" name="id" value={hiddenId} />}

      <div>
        <label className={label}>種別</label>
        <select
          name="kind"
          defaultValue={work?.kind ?? "paper"}
          className={input}
        >
          <option value="paper">論文 (Paper)</option>
          <option value="preprint">プレプリント (Preprint)</option>
          <option value="project">制作物 (Project)</option>
          <option value="talk">発表 (Talk)</option>
        </select>
      </div>

      <div>
        <label className={label}>タイトル（必須）</label>
        <input
          name="title"
          required
          defaultValue={work?.title ?? ""}
          className={input}
        />
      </div>

      <div>
        <label className={label}>著者（カンマ区切り）</label>
        <input
          name="authors"
          defaultValue={work?.authors ?? ""}
          placeholder="例: 中根 啓冴, 共著者名"
          className={input}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>分野 / カテゴリ</label>
          <input
            name="category"
            defaultValue={work?.category ?? ""}
            placeholder="例: 機械学習 / cs.LG"
            className={input}
          />
        </div>
        <div>
          <label className={label}>公開日</label>
          <input
            type="date"
            name="published_on"
            defaultValue={work?.published_on ?? ""}
            className={input}
          />
        </div>
      </div>

      <div>
        <label className={label}>概要 (Abstract)</label>
        <textarea
          name="abstract"
          rows={5}
          defaultValue={work?.abstract ?? ""}
          placeholder="研究の目的・手法・結果を簡潔に。"
          className={`${input} resize-y`}
        />
      </div>

      <div>
        <label className={label}>本文・詳細（任意・長文OK）</label>
        <textarea
          name="body"
          rows={10}
          defaultValue={work?.body ?? ""}
          placeholder="導入・方法・実験・結論などを自由に記述できます。"
          className={`${input} resize-y`}
        />
      </div>

      <div>
        <label className={label}>キーワード（カンマ区切り）</label>
        <input
          name="keywords"
          defaultValue={work?.keywords ?? ""}
          placeholder="例: 深層学習, 医療, 画像認識"
          className={input}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label}>PDF の URL</label>
          <input name="pdf_url" defaultValue={work?.pdf_url ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>コード URL</label>
          <input name="code_url" defaultValue={work?.code_url ?? ""} className={input} />
        </div>
        <div>
          <label className={label}>DOI</label>
          <input
            name="doi"
            defaultValue={work?.doi ?? ""}
            placeholder="10.xxxx/xxxxx"
            className={input}
          />
        </div>
      </div>

      <p className="font-mono text-[11px] text-muted/70">
        ※ 日本語だけで書けばOKです。海外の閲覧者はブラウザの翻訳機能で読めます。
      </p>

      <div className="flex justify-end">
        <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
