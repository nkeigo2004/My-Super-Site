import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Item = {
  type: "note" | "research" | "radio" | "user";
  label: string;
  sub: string;
  href: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("q") ?? "").trim();
  // .or() フィルタを壊す文字を除去
  const q = raw.replace(/[,%()*\\]/g, " ").trim();
  if (!q) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const like = `%${q}%`;

  const [notes, works, episodes, users] = await Promise.all([
    supabase
      .from("notes")
      .select("slug, title, title_ja, summary, summary_ja")
      .or(`title.ilike.${like},title_ja.ilike.${like},summary.ilike.${like}`)
      .limit(5),
    supabase
      .from("works")
      .select("id, title, title_ja, authors, category")
      .or(`title.ilike.${like},title_ja.ilike.${like},authors.ilike.${like}`)
      .limit(5),
    supabase
      .from("episodes")
      .select("id, title, description")
      .or(`title.ilike.${like},description.ilike.${like}`)
      .limit(5),
    supabase
      .from("profiles")
      .select("id, display_name, username")
      .or(`display_name.ilike.${like},username.ilike.${like}`)
      .limit(5),
  ]);

  const results: Item[] = [
    ...(notes.data ?? []).map((n) => ({
      type: "note" as const,
      label: n.title || n.title_ja || "(untitled)",
      sub: n.summary || n.summary_ja || "Notes",
      href: `/notes/${n.slug}`,
    })),
    ...(works.data ?? []).map((w) => ({
      type: "research" as const,
      label: w.title || w.title_ja || "(untitled)",
      sub: w.authors || w.category || "Research",
      href: `/research/${w.id}`,
    })),
    ...(episodes.data ?? []).map((e) => ({
      type: "radio" as const,
      label: e.title,
      sub: e.description || "Radio",
      href: `/community/radio/${e.id}`,
    })),
    ...(users.data ?? []).map((u) => ({
      type: "user" as const,
      label: u.display_name || u.username || "user",
      sub: u.username ? `@${u.username}` : "User",
      href: `/u/${u.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
