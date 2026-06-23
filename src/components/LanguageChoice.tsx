"use client";

const options = [
  { id: "ja", label: "日本語" },
  { id: "en", label: "English" },
];

export function LanguageChoice({ current }: { current: "ja" | "en" }) {
  function apply(id: string) {
    document.cookie = `lang=${id}; path=/; max-age=${60 * 60 * 24 * 365}`;
    // 言語はサーバー側で表示に反映されるため、再読み込みで切り替え
    location.reload();
  }

  return (
    <div className="flex gap-2" role="group" aria-label="表示言語">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => apply(o.id)}
          aria-pressed={current === o.id}
          className={`rounded-md border px-4 py-2 text-sm transition-colors ${
            current === o.id
              ? "border-accent bg-accent/10 text-fg"
              : "border-line text-muted hover:border-accent hover:text-fg"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
