"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
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
  if (!profile?.is_admin) {
    redirect("/community/radio?error=" + encodeURIComponent("権限がありません"));
  }
  return supabase;
}

// エピソードを投稿（管理者）
export async function createEpisode(formData: FormData) {
  const supabase = await requireAdmin();
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const title = get("title");
  const audio_url = get("audio_url");
  if (!title) {
    redirect("/community/radio/new?error=" + encodeURIComponent("タイトルは必須です"));
  }
  if (!audio_url) {
    redirect(
      "/community/radio/new?error=" +
        encodeURIComponent("音声ファイルをアップロードしてください"),
    );
  }
  const durationRaw = get("duration_seconds");
  const duration_seconds = durationRaw ? Math.round(Number(durationRaw)) : null;

  const { data, error } = await supabase
    .from("episodes")
    .insert({
      title,
      description: get("description") || null,
      audio_url,
      cover_url: get("cover_url") || null,
      duration_seconds:
        duration_seconds && !isNaN(duration_seconds) ? duration_seconds : null,
      published_on: get("published_on") || null,
    })
    .select("id")
    .single();
  if (error) {
    redirect("/community/radio/new?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/community/radio");
  redirect(`/community/radio/${data.id}`);
}

// エピソードを削除（管理者）
export async function deleteEpisode(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/community/radio");
  await supabase.from("episodes").delete().eq("id", id);
  revalidatePath("/community/radio");
  redirect("/community/radio");
}

// 「ここ好き」をその再生位置に記録（ログインユーザー・クライアントから直接呼ぶ）
export async function markTimestamp(episodeId: string, tSeconds: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const t = Math.max(0, Math.round(tSeconds));
  const { error } = await supabase.from("episode_marks").insert({
    episode_id: episodeId,
    user_id: user.id,
    t_seconds: t,
  });
  return { ok: !error };
}
