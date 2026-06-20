import type { Metadata } from "next";
import { works } from "@/content/works";
import { Section } from "@/components/Section";

export const metadata: Metadata = { title: "Research" };

const kindLabel: Record<string, string> = {
  paper: "Paper",
  project: "Project",
  talk: "Talk",
};

export default function ResearchPage() {
  return (
    <Section eyebrow="Portfolio" title="Research & Works">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">
        研究・論文・制作物の一覧です。項目は{" "}
        <code className="font-mono text-fg">src/content/works.ts</code>{" "}
        に追記すると、ここに自動で並びます。
      </p>

      <ul className="divide-y divide-line border-y border-line">
        {works.map((w) => {
          const Wrapper = w.href ? "a" : "div";
          return (
            <li key={w.title}>
              <Wrapper
                {...(w.href
                  ? { href: w.href, target: "_blank", rel: "noreferrer" }
                  : {})}
                className="group block py-6 transition-colors hover:bg-surface/30"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-accent">
                    {kindLabel[w.kind]}
                  </span>
                  {w.meta && (
                    <span className="font-mono text-xs text-muted">
                      {w.meta}
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 font-display text-lg font-medium tracking-tight group-hover:text-fg">
                  {w.title}
                  {w.href && (
                    <span className="ml-1 text-muted group-hover:text-accent">
                      ↗
                    </span>
                  )}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                  {w.summary}
                </p>
                {w.tags && w.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {w.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Wrapper>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
