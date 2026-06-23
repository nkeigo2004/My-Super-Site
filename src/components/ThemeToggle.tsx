"use client";

import { useEffect, useState } from "react";

// テーマの定義。色を増やしたい時はここに足してください
// （globals.css にも同じ id の [data-theme="..."] ブロックが必要です）
const themes = [
  { id: "dark", label: "ダーク", swatch: "#0B0D10" },
  { id: "navy", label: "ネイビー", swatch: "#0E1530" },
  { id: "light", label: "ライト", swatch: "#FFFFFF" },
  { id: "paper", label: "ペーパー", swatch: "#F4F0E7" },
];

export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
  }, []);

  function apply(id: string) {
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem("theme", id);
    } catch {}
    setTheme(id);
  }

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="テーマを切り替え"
    >
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => apply(t.id)}
          aria-label={t.label}
          aria-pressed={theme === t.id}
          title={t.label}
          className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
            theme === t.id ? "border-accent ring-1 ring-accent" : "border-line"
          }`}
          style={{ backgroundColor: t.swatch }}
        />
      ))}
    </div>
  );
}
