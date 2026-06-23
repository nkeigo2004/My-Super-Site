"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 管理フォーム（News/Notes など）に埋め込む画像フィールド。
// アップロード後、hidden input（既定 name="image_url"）にURLを入れます。
export function ImageUploadField({
  userId,
  name = "image_url",
  defaultUrl = "",
}: {
  userId: string;
  name?: string;
  defaultUrl?: string;
}) {
  const [supabase] = useState(() => createClient());
  const [url, setUrl] = useState(defaultUrl);
  const [path, setPath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
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
    const safe = file.name.replace(/[^\w.\-]/g, "_");
    const p = `${userId}/img-${Date.now()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from("post-images")
      .upload(p, file, { upsert: false });
    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("post-images").getPublicUrl(p);
    setUrl(data.publicUrl);
    setPath(p);
    setUploading(false);
  }

  async function remove() {
    if (path) {
      try {
        await supabase.storage.from("post-images").remove([path]);
      } catch {}
    }
    setUrl("");
    setPath("");
  }

  return (
    <div className="rounded-md border border-line bg-bg/40 p-3">
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          🖼️ 画像を選ぶ
        </button>
        {uploading && (
          <span className="font-mono text-[11px] text-muted">
            アップロード中…
          </span>
        )}
        {url && (
          <button
            type="button"
            onClick={remove}
            className="font-mono text-[11px] text-muted hover:text-red-400"
          >
            画像を外す
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {url && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="画像プレビュー"
            className="max-h-40 rounded-md border border-line"
          />
        </div>
      )}
    </div>
  );
}
