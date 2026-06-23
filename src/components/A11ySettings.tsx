"use client";

import { useEffect, useState } from "react";

const sizes = [
  { id: "normal", label: "標準" },
  { id: "large", label: "大きめ" },
  { id: "xlarge", label: "特大" },
];

export function A11ySettings() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [textSize, setTextSize] = useState("normal");

  useEffect(() => {
    const d = document.documentElement;
    setReduceMotion(d.getAttribute("data-reduce-motion") === "true");
    setTextSize(d.getAttribute("data-text-size") || "normal");
  }, []);

  function toggleMotion() {
    const next = !reduceMotion;
    document.documentElement.setAttribute(
      "data-reduce-motion",
      next ? "true" : "false",
    );
    try {
      localStorage.setItem("reduce-motion", next ? "true" : "false");
    } catch {}
    setReduceMotion(next);
  }

  function applySize(id: string) {
    document.documentElement.setAttribute("data-text-size", id);
    try {
      localStorage.setItem("text-size", id);
    } catch {}
    setTextSize(id);
  }

  return (
    <div className="space-y-6">
      {/* 動きを減らす */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-fg">動きを減らす</p>
          <p className="mt-0.5 text-xs text-muted">
            アニメーションや動く点滅を抑えます。
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMotion}
          role="switch"
          aria-checked={reduceMotion}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
            reduceMotion ? "border-accent bg-accent/30" : "border-line bg-surface"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-fg transition-transform ${
              reduceMotion ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* 文字サイズ */}
      <div>
        <p className="text-sm text-fg">文字サイズ</p>
        <p className="mt-0.5 mb-2 text-xs text-muted">
          サイト全体の文字とUIの大きさを変えます。
        </p>
        <div className="flex gap-2" role="group" aria-label="文字サイズ">
          {sizes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => applySize(s.id)}
              aria-pressed={textSize === s.id}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                textSize === s.id
                  ? "border-accent bg-accent/10 text-fg"
                  : "border-line text-muted hover:border-accent hover:text-fg"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
