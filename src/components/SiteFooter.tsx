import Link from "next/link";
import { site } from "@/content/site";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/news", label: "News" },
  { href: "/research", label: "Research" },
  { href: "/community", label: "Community" },
  { href: "/live", label: "LIVE" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-content px-5 py-10">
        {/* 上段：ページナビ */}
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted transition-colors hover:text-fg focus-visible:text-fg"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* 下段：左に著作権・右にサポート/プライバシー */}
        <div className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono">
            © {year} {site.name}
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono">
            <Link
              href="/support"
              className="transition-colors hover:text-fg focus-visible:text-fg"
            >
              サポート
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-fg focus-visible:text-fg"
            >
              プライバシーポリシー
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
