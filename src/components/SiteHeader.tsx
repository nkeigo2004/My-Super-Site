import Link from "next/link";
import { profile } from "@/content/profile";

const nav = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Research" },
  { href: "/news", label: "News" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-display text-sm font-semibold tracking-tight">
            {profile.name}
          </span>
          <span className="font-mono text-xs text-muted">{profile.handle}</span>
        </Link>
        <nav className="flex items-center gap-1 font-mono text-xs">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 text-muted transition-colors hover:text-fg focus-visible:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
