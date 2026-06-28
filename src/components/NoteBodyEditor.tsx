"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Block =
  | { id: number; type: "text"; text: string }
  | { id: number; type: "image"; url: string; caption: string };

// 既存の本文文字列をブロックに分解
function parseBody(body: string): Block[] {
  let idc = 1;
  const blocks: Block[] = [];
  const paras = body.split(/\n\s*\n/).map((p) => p.trim());
  for (const p of paras) {
    if (!p) continue;
    const md = p.match(/^!\[([^\]]*)\]\((.+?)\)$/);
    const bare = p.match(/^https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?$/i);
    if (md) {
      blocks.push({ id: idc++, type: "image", url: md[2], caption: md[1] });
    } else if (bare) {
      blocks.push({ id: idc++, type: "image", url: p, caption: "" });
    } else {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "text") last.text += "\n\n" + p;
      else blocks.push({ id: idc++, type: "text", text: p });
    }
  }
  return blocks;
}

function sanitizeCaption(s: string) {
  return s.replace(/[\[\]\r\n]/g, " ").trim();
}

// ブロックを本文文字列へ
function serialize(blocks: Block[]): string {
  return blocks
    .map((b) =>
      b.type === "text"
        ? b.text.trim()
        : `![${sanitizeCaption(b.caption)}](${b.url})`,
    )
    .filter((s, i) => s.length > 0 || blocks[i].type === "image")
    .join("\n\n");
}

export function NoteBodyEditor({
  userId,
  defaultValue = "",
}: {
  userId: string;
  defaultValue?: string;
}) {
  const [supabase] = useState(() => createClient());
  const idRef = useRef(1000);
  const nextId = () => ++idRef.current;

  const initial = useMemo(() => {
    const b = parseBody(defaultValue);
    return b.length ? b : [{ id: 1, type: "text", text: "" } as Block];
  }, [defaultValue]);

  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [focusIndex, setFocusIndex] = useState<number>(initial.length - 1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const body = serialize(blocks);

  function insertAfterFocus(newBlocks: Block[]) {
    setBlocks((prev) => {
      const at = Math.min(Math.max(focusIndex, -1) + 1, prev.length);
      const next = [...prev.slice(0, at), ...newBlocks, ...prev.slice(at)];
      return next;
    });
  }

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    const added: Block[] = [];
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
      added.push({ id: nextId(), type: "image", url: data.publicUrl, caption: "" });
    }
    if (added.length) insertAfterFocus(added);
    setUploading(false);
  }

  function addTextBlock() {
    insertAfterFocus([{ id: nextId(), type: "text", text: "" }]);
  }

  function updateBlock(id: number, patch: Partial<Block>) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
    );
  }

  function removeBlock(id: number) {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length ? next : [{ id: nextId(), type: "text", text: "" }];
    });
  }

  function move(index: number, dir: -1 | 1) {
    setBlocks((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  return (
    <div>
      {/* 本文はこの hidden に集約されて送信される */}
      <input type="hidden" name="body" value={body} />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          🖼️ 画像を挿入（複数可）
        </button>
        <button
          type="button"
          onClick={addTextBlock}
          className="rounded-md border border-line px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-fg"
        >
          ＋ 文章ブロック
        </button>
        {uploading && (
          <span className="font-mono text-[11px] text-muted">アップロード中…</span>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPickImages}
        className="hidden"
      />
      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div
            key={b.id}
            className="rounded-md border border-line bg-bg/40 p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted/60">
                {b.type === "image" ? "画像" : "文章"}
              </span>
              <div className="flex items-center gap-2 font-mono text-[11px] text-muted/60">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  className="hover:text-fg"
                  title="上へ"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  className="hover:text-fg"
                  title="下へ"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(b.id)}
                  className="hover:text-red-400"
                  title="削除"
                >
                  削除
                </button>
              </div>
            </div>

            {b.type === "text" ? (
              <textarea
                rows={4}
                value={b.text}
                onFocus={() => setFocusIndex(i)}
                onChange={(e) => updateBlock(b.id, { text: e.target.value })}
                placeholder="文章を書く（空行で段落が分かれ、読者は段落ごとに『響いた』を残せます）"
                className="w-full resize-y rounded-md border border-line bg-bg/40 px-3 py-2 text-sm leading-relaxed text-fg outline-none focus:border-accent"
              />
            ) : (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.url}
                  alt={b.caption}
                  className="mx-auto max-h-80 w-full rounded-md border border-line object-contain"
                />
                <input
                  value={b.caption}
                  onFocus={() => setFocusIndex(i)}
                  onChange={(e) => updateBlock(b.id, { caption: e.target.value })}
                  placeholder="図・表の名前や説明（任意）"
                  className="mt-2 w-full rounded-md border border-line bg-bg/40 px-3 py-1.5 text-center text-xs text-muted outline-none focus:border-accent"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2 font-mono text-[11px] text-muted/60">
        「🖼️ 画像を挿入」を押すと、いま選んでいるブロックのすぐ下に画像が入ります。各画像には説明（キャプション）を付けられます。
      </p>
    </div>
  );
}
