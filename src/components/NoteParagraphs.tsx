"use client";

import { useState, useTransition } from "react";
import { reactParagraph } from "@/app/notes/actions";

export function NoteParagraphs({
  paragraphs,
  noteId,
  initialCounts,
  initialMine,
  canReact,
  maxCount,
}: {
  paragraphs: string[];
  noteId: string;
  initialCounts: number[];
  initialMine: boolean[];
  canReact: boolean;
  maxCount: number;
}) {
  const [counts, setCounts] = useState<number[]>(initialCounts);
  const [mine, setMine] = useState<boolean[]>(initialMine);
  const [, startTransition] = useTransition();

  const tap = (i: number) => {
    if (!canReact) return;
    const was = mine[i];
    setMine((m) => m.map((v, idx) => (idx === i ? !v : v)));
    setCounts((c) => c.map((v, idx) => (idx === i ? v + (was ? -1 : 1) : v)));
    startTransition(async () => {
      const res = await reactParagraph(noteId, i);
      if (!res.ok) {
        setMine((m) => m.map((v, idx) => (idx === i ? was : v)));
        setCounts((c) => c.map((v, idx) => (idx === i ? v + (was ? 1 : -1) : v)));
      }
    });
  };

  return (
    <div className="space-y-5">
      {paragraphs.map((p, i) => {
        const count = counts[i] ?? 0;
        const reacted = mine[i] ?? false;
        const hot = maxCount > 0 && count === maxCount && count > 0;
        return (
          <div
            key={i}
            className={`rounded-md py-1 pl-4 transition-colors ${
              hot ? "border-l-2 border-accent/60" : "border-l-2 border-transparent"
            }`}
          >
            <p className="whitespace-pre-line leading-relaxed text-fg/90">{p}</p>
            <button
              onClick={() => tap(i)}
              disabled={!canReact}
              title={canReact ? "この段落が響いたら押す" : "ログインすると押せます"}
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${
                reacted
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-line text-muted/60 hover:border-accent hover:text-fg"
              }`}
            >
              {reacted ? "♥" : "♡"} 響いた{count > 0 ? ` ${count}` : ""}
            </button>
          </div>
        );
      })}
    </div>
  );
}
