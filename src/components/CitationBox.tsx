"use client";

import { useState } from "react";

export function CitationBox({
  title,
  authors,
  year,
  url,
}: {
  title: string;
  authors?: string | null;
  year?: string | null;
  url?: string | null;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const firstAuthorLast =
    (authors?.split(/[,、]/)[0] ?? "").trim().split(/\s+/).pop() || "author";
  const key = `${firstAuthorLast.toLowerCase().replace(/[^a-z0-9]/g, "")}${year ?? ""}`;

  const bibtex =
    `@misc{${key},\n` +
    `  title  = {${title}},\n` +
    (authors ? `  author = {${authors}},\n` : "") +
    (year ? `  year   = {${year}},\n` : "") +
    (url ? `  url    = {${url}},\n` : "") +
    `}`;

  const plain =
    `${authors ? authors + ". " : ""}${title}.${year ? " " + year + "." : ""}${
      url ? " " + url : ""
    }`;

  const copy = async (text: string, which: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">引用 (text)</span>
          <button
            onClick={() => copy(plain, "plain")}
            className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-accent hover:text-fg"
          >
            {copied === "plain" ? "コピーしました" : "コピー"}
          </button>
        </div>
        <p className="rounded-md border border-line bg-bg/40 px-3 py-2 text-sm text-fg">
          {plain}
        </p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-xs text-muted">BibTeX</span>
          <button
            onClick={() => copy(bibtex, "bibtex")}
            className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-accent hover:text-fg"
          >
            {copied === "bibtex" ? "コピーしました" : "コピー"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-md border border-line bg-bg/40 px-3 py-2 font-mono text-xs leading-relaxed text-fg">
          {bibtex}
        </pre>
      </div>
    </div>
  );
}
