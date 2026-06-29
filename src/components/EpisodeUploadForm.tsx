"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createEpisode } from "@/app/community/radio/actions";

const inputCls =
  "w-full rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg outline-none focus:border-accent";
const labelCls = "mb-1 block font-mono text-xs text-muted";

export function EpisodeUploadForm({ userId }: { userId: string }) {
  const [supabase] = useState(() => createClient());
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [duration, setDuration] = useState<number | "">("");
  const [audioName, setAudioName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const audioInput = useRef<HTMLInputElement | null>(null);
  const coverInput = useRef<HTMLInputElement | null>(null);

  function readDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(isFinite(a.duration) ? Math.round(a.duration) : null);
      };
      a.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      a.src = url;
    });
  }

  async function onAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("音声ファイルを選んでください");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("音声は50MBまでです（長い回は圧縮してください）");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const dur = await readDuration(file);
      if (dur) setDuration(dur);
      const safe = file.name.replace(/[^\w.\-]/g, "_");
      const p = `${userId}/ep-${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("podcast-audio")
        .upload(p, file, { upsert: false });
      if (upErr) {
        setError("音声アップロード失敗: " + upErr.message);
        return;
      }
      const { data } = supabase.storage.from("podcast-audio").getPublicUrl(p);
      setAudioUrl(data.publicUrl);
      setAudioName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選んでください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("カバー画像は5MBまでです");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const safe = file.name.replace(/[^\w.\-]/g, "_");
      const p = `${userId}/cover-${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("post-images")
        .upload(p, file, { upsert: false });
      if (upErr) {
        setError("カバーアップロード失敗: " + upErr.message);
        return;
      }
      const { data } = supabase.storage.from("post-images").getPublicUrl(p);
      setCoverUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action={createEpisode} className="space-y-4">
      <input type="hidden" name="audio_url" value={audioUrl} />
      <input type="hidden" name="cover_url" value={coverUrl} />
      <input type="hidden" name="duration_seconds" value={duration} />

      <div>
        <label className={labelCls}>タイトル（必須）</label>
        <input name="title" required className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>説明（任意）</label>
        <textarea name="description" rows={4} className={`${inputCls} resize-y`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>配信日（任意）</label>
          <input type="date" name="published_on" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>再生時間（自動取得）</label>
          <input
            value={duration ? `${duration} 秒` : "—"}
            readOnly
            className={`${inputCls} text-muted`}
          />
        </div>
      </div>

      {/* 音声 */}
      <div>
        <label className={labelCls}>音声ファイル（必須・mp3/m4a など・50MBまで）</label>
        <button
          type="button"
          onClick={() => audioInput.current?.click()}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          🎙 音声を選ぶ
        </button>
        <input
          ref={audioInput}
          type="file"
          accept="audio/*"
          onChange={onAudio}
          className="hidden"
        />
        {audioUrl && (
          <p className="mt-2 font-mono text-[11px] text-accent">
            ✓ {audioName} をアップロードしました
          </p>
        )}
      </div>

      {/* カバー */}
      <div>
        <label className={labelCls}>カバー画像（任意）</label>
        <button
          type="button"
          onClick={() => coverInput.current?.click()}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          🖼️ カバーを選ぶ
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/*"
          onChange={onCover}
          className="hidden"
        />
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="mt-2 h-24 w-24 rounded-md border border-line object-cover"
          />
        )}
      </div>

      {busy && <p className="font-mono text-[11px] text-muted">アップロード中…</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex justify-end">
        <button
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          投稿する
        </button>
      </div>
    </form>
  );
}
