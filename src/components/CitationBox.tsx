"use client";

import { useState } from "react";

function normalizeUrl(u?: string | null) {
  if (!u) return null;
  const s = u.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : "https://" + s;
}

// BibTeX 用の見出しキー（英数字のみ。日本語名でも壊れないようにフォールバック）
function makeKey(
  authors?: string | null,
  title?: string | null,
  year?: string | null,
  id?: string,
) {
  const firstAuthor = (authors?.split(/[,、]/)[0] ?? "").trim().split(/\s+/).pop() ?? "";
  let base = firstAuthor.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!base) base = (title ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  if (!base) base = "ref" + (id ? id.slice(0, 4) : "");
  return `${base}${year ?? ""}`;
}

export function CitationBox({
  title,
  authors,
  year,
  url,
  id,
}: {
  title: string;
  authors?: string | null;
  year?: string | null;
  url?: string | null;
  id?: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  const cleanTitle = title.replace(/\s+/g, " ").trim();
  const cleanAuthors = (authors ?? "").replace(/\s+/g, " ").trim();
  const link = normalizeUrl(url);
  const key = makeKey(authors, title, year, id);

  const bibtex =
    `@misc{${key},\n` +
    `  title  = {${cleanTitle}},\n` +
    (cleanAuthors ? `  author = {${cleanAuthors}},\n` : "") +
    (year ? `  year   = {${year}},\n` : "") +
    (link ? `  url    = {${link}},\n` : "") +
    `}`;

  const plain =
    `${cleanAuthors ? cleanAuthors + ". " : ""}${cleanTitle}.${year ? " " + year + "." : ""}${
      link ? " " + link : ""
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
