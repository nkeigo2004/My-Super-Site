"use client";

export function SearchTrigger() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
      aria-label="検索"
      className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-muted transition-colors hover:text-fg"
    >
      <span>🔍</span>
      <kbd className="hidden rounded border border-line px-1 py-0.5 text-[10px] text-muted/70 sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
