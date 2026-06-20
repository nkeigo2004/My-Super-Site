export function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-content px-5 py-12">
      {(eyebrow || title) && (
        <div className="mb-8">
          {eyebrow && (
            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
