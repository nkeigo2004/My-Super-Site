"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 配信設定を更新（管理者）
export async function updateLive(formData: FormData) {
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
    redirect("/live?error=" + encodeURIComponent("権限がありません"));
  }

  // 直前の状態を取得（配信を「新しく」開始したか判定するため）
  const { data: current } = await supabase
    .from("live_settings")
    .select("is_live, started_at")
    .eq("id", 1)
    .maybeSingle();

  const nextIsLive = formData.get("is_live") === "on";

  // off → on（または開始時刻が未設定）のときだけ、チャットを新しいセッションにする
  const startNewSession = nextIsLive && (!current?.is_live || !current?.started_at);
  const started_at = startNewSession
    ? new Date().toISOString()
    : current?.started_at ?? null;

  const fields = {
    id: 1,
    is_live: nextIsLive,
    provider: String(formData.get("provider") ?? "youtube"),
    video_id: String(formData.get("video_id") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    started_at,
  };

  const { error } = await supabase.from("live_settings").upsert(fields);
  if (error) redirect("/live?error=" + encodeURIComponent(error.message));
  revalidatePath("/live");
  redirect(
    "/live?message=" +
      encodeURIComponent(
        startNewSession
          ? "配信を開始しました（チャットをリセット）"
          : "配信設定を更新しました",
      ),
  );
}
