"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  EMOJIS,
  SLASH_COMMANDS,
  trailingSlashQuery,
  type SlashCommand,
} from "@/lib/compose";

type Msg = {
  id: string;
  author: string;
  content: string;
  created_at: string;
};

export function LiveChat({
  userId,
  userName,
  isLive,
  sessionStart,
}: {
  userId: string | null;
  userName: string | null;
  isLive: boolean;
  sessionStart: string | null;
}) {
  const [supabase] = useState(() => createClient());
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [slashQuery, setSlashQuery] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onChange(v: string) {
    setText(v);
    setSlashQuery(trailingSlashQuery(v));
  }

  function insertAtCursor(t: string) {
    const el = inputRef.current;
    if (!el) {
      setText((c) => c + t);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + t + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + t.length;
      el.selectionStart = el.selectionEnd = pos;
    });
  }

  function runSlash(c: SlashCommand) {
    const cleaned = text.replace(/(?:^|\s)\/[a-zA-Z]*$/, (m) =>
      m.startsWith(" ") ? " " : "",
    );
    setText(cleaned + c.run());
    setSlashQuery(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  useEffect(() => {
    // 配信していないときはチャットを表示しない
    if (!isLive) {
      setMessages([]);
      return;
    }

    let active = true;
    let query = supabase
      .from("live_chat")
      .select("id, author, content, created_at")
      .order("created_at", { ascending: true })
      .limit(200);
    // このセッション（配信開始時刻以降）のメッセージだけ取得
    if (sessionStart) query = query.gte("created_at", sessionStart);

    query.then(({ data }) => {
      if (active && data) setMessages(data as Msg[]);
    });

    const channel = supabase
      .channel("live-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_chat" },
        (payload) => {
          const m = payload.new as Msg;
          if (!sessionStart || m.created_at >= sessionStart) {
            setMessages((prev) => [...prev, m]);
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, isLive, sessionStart]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const content = text.trim();
    if (!content || !userId || !isLive) return;
    setText("");
    setShowEmoji(false);
    setSlashQuery(null);
    await supabase.from("live_chat").insert({
      user_id: userId,
      author: userName ?? "user",
      content: content.slice(0, 300),
    });
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-lg border border-line bg-surface/20">
      <div className="border-b border-line px-3 py-2 font-mono text-xs text-muted">
        ライブチャット {isLive && <span className="text-accent">· 配信中</span>}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {!isLive ? (
          <p className="text-sm text-muted">
            配信が始まるとチャットが開きます。
          </p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted">まだメッセージはありません。</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-mono text-xs text-accent">@{m.author}</span>{" "}
              <span className="whitespace-pre-wrap text-fg/90">{m.content}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-line p-2">
        {!isLive ? (
          <p className="px-1 py-1 font-mono text-[11px] text-muted">
            配信中のみコメントできます。
          </p>
        ) : userId ? (
          <div className="relative">
            {/* スラッシュコマンド候補 */}
            {slashQuery !== null && (
              <div className="absolute bottom-full mb-1 w-full overflow-hidden rounded-md border border-line bg-bg shadow-lg">
                {SLASH_COMMANDS.filter((c) =>
                  c.cmd.startsWith(slashQuery.toLowerCase()),
                ).map((c) => (
                  <button
                    key={c.cmd}
                    type="button"
                    onClick={() => runSlash(c)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface/60"
                  >
                    <span className="font-mono text-xs text-accent">
                      /{c.cmd}
                    </span>
                    <span className="text-muted">{c.label}</span>
                  </button>
                ))}
              </div>
            )}
            {/* 絵文字パレット */}
            {showEmoji && (
              <div className="absolute bottom-full right-0 mb-1 grid w-56 grid-cols-7 gap-1 rounded-md border border-line bg-bg p-2 shadow-lg">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmoji((s) => !s)}
                title="絵文字"
                className="rounded-md border border-line px-2 py-1.5 text-base leading-none hover:border-accent"
              >
                😊
              </button>
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                maxLength={300}
                placeholder="メッセージを送る…（「/」でコマンド）"
                className="flex-1 rounded-md border border-line bg-bg/40 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent"
              />
              <button
                onClick={send}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg transition-opacity hover:opacity-90"
              >
                送信
              </button>
            </div>
          </div>
        ) : (
          <p className="px-1 py-1 font-mono text-[11px] text-muted">
            チャットするにはログインしてください。
          </p>
        )}
      </div>
    </div>
  );
}
