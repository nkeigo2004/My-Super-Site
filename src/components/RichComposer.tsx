"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EMOJIS,
  SLASH_COMMANDS,
  trailingSlashQuery,
  type SlashCommand,
} from "@/lib/compose";

export function RichComposer({
  action,
  userId,
  placeholder,
  submitLabel,
  hiddenFields,
  rows = 3,
  allowImage = true,
  allowFile = false,
}: {
  action: (formData: FormData) => void | Promise<void>;
  userId: string;
  placeholder: string;
  submitLabel: string;
  hiddenFields?: Record<string, string>;
  rows?: number;
  allowImage?: boolean;
  allowFile?: boolean;
}) {
  const [supabase] = useState(() => createClient());
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const imageRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function insertAtCursor(text: string) {
    const ta = taRef.current;
    if (!ta) {
      setContent((c) => c + text);
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setContent(content.slice(0, start) + text + content.slice(end));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.selectionStart = ta.selectionEnd = pos;
    });
  }

  function onChange(v: string) {
    setContent(v);
    setSlashQuery(trailingSlashQuery(v));
  }

  function runSlash(c: SlashCommand) {
    const cleaned = content.replace(/(?:^|\s)\/[a-zA-Z]*$/, (m) =>
      m.startsWith(" ") ? " " : "",
    );
    setContent(cleaned + c.run());
    setSlashQuery(null);
    requestAnimationFrame(() => taRef.current?.focus());
  }

  async function uploadTo(file: File, prefix: string) {
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${userId}/${prefix}-${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(path, file, { upsert: false });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選んでください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("画像は5MBまでにしてください");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { url, path } = await uploadTo(file, "img");
      setImageUrl(url);
      setImagePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    }
    setUploading(false);
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルは10MBまでにしてください");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const { url, path } = await uploadTo(file, "file");
      setFileUrl(url);
      setFileName(file.name);
      setFilePath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    }
    setUploading(false);
  }

  async function removeImage() {
    if (imagePath) {
      try {
        await supabase.storage.from("post-images").remove([imagePath]);
      } catch {}
    }
    setImageUrl("");
    setImagePath("");
  }

  async function removeFile() {
    if (filePath) {
      try {
        await supabase.storage.from("post-images").remove([filePath]);
      } catch {}
    }
    setFileUrl("");
    setFileName("");
    setFilePath("");
  }

  async function handleSubmit(formData: FormData) {
    await action(formData);
    setContent("");
    setImageUrl("");
    setImagePath("");
    setFileUrl("");
    setFileName("");
    setFilePath("");
    setShowEmoji(false);
    setSlashQuery(null);
  }

  const canSubmit = (content.trim() || imageUrl || fileUrl) && !uploading;

  return (
    <form
      action={handleSubmit}
      className="relative rounded-lg border border-line bg-surface/30 p-4"
    >
      {hiddenFields &&
        Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

      <textarea
        ref={taRef}
        name="content"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        maxLength={1000}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
      />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="file_url" value={fileUrl} />
      <input type="hidden" name="file_name" value={fileName} />

      {slashQuery !== null && (
        <div className="mt-1 overflow-hidden rounded-md border border-line bg-bg shadow-lg">
          {SLASH_COMMANDS.filter((c) =>
            c.cmd.startsWith(slashQuery.toLowerCase()),
          ).map((c) => (
            <button
              key={c.cmd}
              type="button"
              onClick={() => runSlash(c)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface/60"
            >
              <span className="font-mono text-xs text-accent">/{c.cmd}</span>
              <span className="text-muted">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {imageUrl && (
        <div className="relative mt-2 inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="添付画像"
            className="max-h-48 rounded-md border border-line"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute right-1 top-1 rounded-full bg-bg/80 px-2 py-0.5 text-xs text-fg hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}

      {fileUrl && (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-bg/40 px-3 py-1.5 text-sm">
          <span>📎</span>
          <span className="truncate text-fg">{fileName}</span>
          <button
            type="button"
            onClick={removeFile}
            className="ml-auto text-xs text-muted hover:text-red-400"
          >
            ×
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmoji((s) => !s)}
              title="絵文字"
              className="rounded-md border border-line px-2 py-1.5 text-base leading-none hover:border-accent"
            >
              😊
            </button>
            {showEmoji && (
              <div className="absolute z-20 mt-1 grid w-64 grid-cols-8 gap-1 rounded-md border border-line bg-bg p-2 shadow-lg">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      insertAtCursor(e);
                      setShowEmoji(false);
                    }}
                    className="rounded text-lg hover:bg-surface/60"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {allowImage && (
            <>
              <button
                type="button"
                onClick={() => imageRef.current?.click()}
                title="画像を追加"
                className="rounded-md border border-line px-2 py-1.5 text-sm text-muted hover:border-accent hover:text-fg"
              >
                🖼️
              </button>
              <input
                ref={imageRef}
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="hidden"
              />
            </>
          )}

          {allowFile && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                title="ファイルを添付"
                className="rounded-md border border-line px-2 py-1.5 text-sm text-muted hover:border-accent hover:text-fg"
              >
                📎
              </button>
              <input
                ref={fileRef}
                type="file"
                onChange={onPickFile}
                className="hidden"
              />
            </>
          )}

          {uploading && (
            <span className="font-mono text-[11px] text-muted">
              アップロード中…
            </span>
          )}
          <span className="ml-1 font-mono text-[11px] text-muted/60">
            「/」でコマンド
          </span>
        </div>

        <button
          disabled={!canSubmit}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
