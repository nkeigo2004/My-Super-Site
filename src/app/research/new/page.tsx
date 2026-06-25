import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/Section";
import { WorkForm } from "@/components/WorkForm";
import { createClient } from "@/lib/supabase/server";
import { createWork } from "../actions";

export const metadata = { title: "論文を投稿 / Submit" };

export default async function NewWorkPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_admin) redirect("/research");

  return (
    <Section eyebrow="Research" title="論文を投稿 / Submit">
      <Link
        href="/research"
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← 一覧に戻る
      </Link>

      {error && (
        <p className="mb-6 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <WorkForm action={createWork} submitLabel="投稿する" />
    </Section>
  );
}
