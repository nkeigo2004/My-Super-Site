import Link from "next/link";
import { redirect } from "next/navigation";
import { Section } from "@/components/Section";
import { createClient } from "@/lib/supabase/server";
import { approveFollow, rejectFollow } from "../u/[id]/actions";

export const metadata = { title: "フォローリクエスト" };

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rels } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", user.id)
    .eq("status", "pending");
  const ids = (rels ?? []).map((r) => r.follower_id as string);

  const { data: users } = ids.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .in("id", ids)
    : { data: [] as any[] };

  return (
    <Section eyebrow="Requests" title="フォローリクエスト">
      <Link
        href={`/u/${user.id}`}
        className="mb-6 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← プロフィールに戻る
      </Link>

      {(!users || users.length === 0) && (
        <p className="text-sm text-muted">保留中のリクエストはありません。</p>
      )}

      <div className="space-y-2">
        {users?.map((u) => {
          const nm = u.display_name || "user";
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-surface/20 p-3"
            >
              <Link href={`/u/${u.id}`} className="flex items-center gap-3 hover:opacity-80">
                {u.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.avatar_url}
                    alt=""
                    className="h-9 w-9 rounded-full border border-line object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-xs text-accent">
                    {nm.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>
                  <span className="block text-sm text-fg">{nm}</span>
                  {u.username && (
                    <span className="block font-mono text-xs text-muted">
                      @{u.username}
                    </span>
                  )}
                </span>
              </Link>
              <div className="ml-auto flex items-center gap-2">
                <form action={approveFollow}>
                  <input type="hidden" name="follower_id" value={u.id} />
                  <button className="rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-bg transition-opacity hover:opacity-90">
                    承認
                  </button>
                </form>
                <form action={rejectFollow}>
                  <input type="hidden" name="follower_id" value={u.id} />
                  <button className="rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-400 hover:text-red-400">
                    拒否
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
