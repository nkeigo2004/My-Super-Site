"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 本文テキストエリア＋「画像を挿入」ボタン。
// 画像は post-images バケットにアップし、カーソル位置に ![](URL) を差し込みます。
export function NoteBodyEditor({
  userId,
  defaultValue = "",
}: {
  userId: string;
  defaultValue?: string;
}) {
  const [supabase] = useState(() => createClient());
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function insertAtCursor(text: string) {
    const ta = taRef.current;
    if (!ta) {
      setValue((v) => v + text);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setError("画像ファイルを選んでください");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("画像は5MBまでにしてください");
        continue;
      }
      const safe = file.name.replace(/[^\w.\-]/g, "_");
      const p = `${userId}/note-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(p, file, { upsert: false });
      if (upErr) {
        setError(upErr.message);
        continue;
      }
      const { data } = supabase.storage.from("post-images").getPublicUrl(p);
      insertAtCursor(`\n\n![](${data.publicUrl})\n\n`);
    }
    setUploading(false);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          🖼️ 画像を挿入（複数可）
        </button>
        {uploading && (
          <span className="font-mono text-[11px] text-muted">
            アップロード中…
          </span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />

      <textarea
        ref={taRef}
        name="body"
        rows={16}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="本文を書きます。1行あけると段落が分かれ、読者は段落ごとに『響いた』を残せます。画像は本文の好きな位置に差し込めます。"
        className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm leading-relaxed text-fg outline-none focus:border-accent"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      <p className="mt-1 font-mono text-[11px] text-muted/60">
        画像は本文中に並びます。段落は空行で区切ってください。
      </p>
    </div>
  );
}
