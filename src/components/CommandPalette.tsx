"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Item = {
  type: "note" | "research" | "radio" | "user" | "nav";
  label: string;
  sub: string;
  href: string;
};

const NAV: Item[] = [
  { type: "nav", label: "ホーム", sub: "Home", href: "/" },
  { type: "nav", label: "About", sub: "自己紹介", href: "/about" },
  { type: "nav", label: "News", sub: "お知らせ", href: "/news" },
  { type: "nav", label: "Research", sub: "研究・論文", href: "/research" },
  { type: "nav", label: "Notes", sub: "ノート", href: "/notes" },
  { type: "nav", label: "VoiceUP", sub: "コミュニティ", href: "/community" },
  { type: "nav", label: "ラジオ", sub: "ポッドキャスト", href: "/community/radio" },
  { type: "nav", label: "LIVE", sub: "生配信", href: "/live" },
  { type: "nav", label: "メッセージ", sub: "DM", href: "/messages" },
  { type: "nav", label: "設定", sub: "Settings", href: "/settings" },
];

const ICON: Record<Item["type"], string> = {
  note: "📝",
  research: "📄",
  radio: "🎙",
  user: "👤",
  nav: "→",
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // 開閉
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  // 開いたら初期化＆フォーカス
  useEffect(() => {
    if (open) {
      setQuery("");
      setRemote([]);
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // 検索（デバウンス）
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setRemote([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setRemote(Array.isArray(data.results) ? data.results : []);
      } catch {
        setRemote([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(id);
  }, [query, open]);

  const q = query.trim().toLowerCase();
  const navFiltered = q
    ? NAV.filter(
        (n) =>
          n.label.toLowerCase().includes(q) || n.sub.toLowerCase().includes(q),
      )
    : NAV;
  const items: Item[] = [...navFiltered, ...remote];

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = useCallback(
    (item?: Item) => {
      if (!item) return;
      setOpen(false);
      router.push(item.href);
    },
    [router],
  );

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active]);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-bg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <span className="text-muted">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onListKey}
            placeholder="検索・ページへ移動…（記事・論文・ラジオ・ユーザー）"
            className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-muted/60"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {loading && (
            <p className="px-3 py-2 font-mono text-[11px] text-muted">検索中…</p>
          )}
          {!loading && items.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted">
              一致する項目がありません
            </p>
          )}
          {items.map((item, i) => (
            <button
              key={`${item.type}-${item.href}-${i}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                i === active ? "bg-accent/15" : "hover:bg-surface/60"
              }`}
            >
              <span className="w-5 flex-shrink-0 text-center text-sm">
                {ICON[item.type]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-fg">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-muted">
                  {item.sub}
                </span>
              </span>
              {item.type === "nav" && (
                <span className="font-mono text-[10px] text-muted/60">移動</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2 font-mono text-[10px] text-muted/60">
          <span>↑↓ 選択 ・ Enter で移動</span>
          <span>⌘K / Ctrl+K で開閉</span>
        </div>
      </div>
    </div>
  );
}
