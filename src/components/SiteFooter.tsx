import Link from "next/link";
import { profile } from "@/content/profile";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-5 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span className="font-mono">
          © {year} {profile.name}
        </span>
        <Link
          href="/privacy"
          className="font-mono transition-colors hover:text-fg focus-visible:text-fg"
        >
          プライバシーポリシー
        </Link>
      </div>
    </footer>
  );
}
