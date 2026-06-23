import Link from "next/link";
import { Section } from "@/components/Section";
import { FollowList } from "@/components/FollowList";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "フォロー中 / Following" };

export default async function FollowingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const { data: prof } = await supabase
    .from("profiles")
    .select("display_name, is_private")
    .eq("id", params.id)
    .maybeSingle();

  // 鍵アカウントの一覧は本人・承認済みフォロワーのみ閲覧可
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canView = !prof?.is_private;
  if (user) {
    if (user.id === params.id) canView = true;
    else if (!canView) {
      const { data: rel } = await supabase
        .from("follows")
        .select("status")
        .eq("follower_id", user.id)
        .eq("following_id", params.id)
        .maybeSingle();
      if (rel?.status === "accepted") canView = true;
    }
  }

  const { data: rels } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", params.id);
  const ids = (rels ?? []).map((r) => r.following_id as string);

  const { data: users } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", ids)
    : { data: [] as any[] };

  return (
    <Section eyebrow="Following" title="フォロー中">
      <Link
        href={`/u/${params.id}`}
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← {prof?.display_name || "プロフィール"} に戻る
      </Link>
      {canView ? (
        <FollowList users={users ?? []} />
      ) : (
        <div className="rounded-lg border border-line bg-surface/20 p-6 text-center text-sm text-muted">
          🔒 非公開アカウントです。フォローが承認されると見られます。
        </div>
      )}
    </Section>
  );
}
