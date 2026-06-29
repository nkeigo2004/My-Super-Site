import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/Section";
import { EpisodeUploadForm } from "@/components/EpisodeUploadForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "エピソードを投稿" };

export default async function NewEpisodePage({
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
  if (!profile?.is_admin) redirect("/community/radio");

  return (
    <Section eyebrow="Community" title="エピソードを投稿">
      <Link
        href="/community/radio"
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← ラジオ一覧
      </Link>

      {error && (
        <p className="mb-6 rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <EpisodeUploadForm userId={user.id} />
    </Section>
  );
}
