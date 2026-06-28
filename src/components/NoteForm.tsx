import { ImageUploadField } from "@/components/ImageUploadField";

type NoteLike = {
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  tags?: string | null;
  image_url?: string | null;
};

const inputCls =
  "w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent";
const labelCls = "mb-1 block font-mono text-xs text-muted";

export function NoteForm({
  action,
  note,
  hiddenId,
  userId,
  submitLabel,
  withSlug = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  note?: NoteLike;
  hiddenId?: string;
  userId: string;
  submitLabel: string;
  withSlug?: boolean;
}) {
  return (
    <form action={action} className="space-y-4">
      {hiddenId && <input type="hidden" name="id" value={hiddenId} />}

      {withSlug && (
        <div>
          <label className={labelCls}>slug（URLになる英数字・必須）</label>
          <input
            name="slug"
            required
            placeholder="例: my-first-note"
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className={labelCls}>タイトル（必須）</label>
        <input
          name="title"
          required
          defaultValue={note?.title ?? ""}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>概要（一覧に出る短い説明・任意）</label>
        <input name="summary" defaultValue={note?.summary ?? ""} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>本文（空行で段落が分かれます）</label>
        <textarea
          name="body"
          rows={10}
          defaultValue={note?.body ?? ""}
          placeholder="段落を空行で区切ると、読者は段落ごとに『響いた』反応を残せます。"
          className={`${inputCls} resize-y`}
        />
      </div>

      <div>
        <label className={labelCls}>タグ（カンマ区切り・任意）</label>
        <input
          name="tags"
          defaultValue={note?.tags ?? ""}
          placeholder="例: 日記, 研究"
          className={inputCls}
        />
      </div>

      <ImageUploadField userId={userId} defaultUrl={note?.image_url ?? ""} />

      <p className="font-mono text-[11px] text-muted/70">
        ※ 日本語だけで書けばOKです。海外の閲覧者はブラウザ翻訳で読めます。
      </p>

      <div className="flex justify-end">
        <button className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
