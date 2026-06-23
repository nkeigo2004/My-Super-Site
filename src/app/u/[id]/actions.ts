"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// フォロー / フォロー解除（トグル）。相手が鍵アカウントなら申請（pending）になる。
export async function toggleFollow(formData: FormData) {
  const targetId = String(formData.get("target_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!targetId || targetId === user.id) redirect(`/u/${targetId}`);

  const { data: existing } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
  } else {
    const { data: target } = await supabase
      .from("profiles")
      .select("is_private")
      .eq("id", targetId)
      .maybeSingle();
    const status = target?.is_private ? "pending" : "accepted";
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: targetId, status });
  }

  revalidatePath(`/u/${targetId}`);
  redirect(`/u/${targetId}`);
}

// フォローリクエストを承認する（自分宛のみ）
export async function approveFollow(formData: FormData) {
  const followerId = String(formData.get("follower_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follows")
    .update({ status: "accepted" })
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  revalidatePath("/requests");
  revalidatePath(`/u/${user.id}`);
  redirect("/requests");
}

// フォローリクエストを拒否する（自分宛のみ）
export async function rejectFollow(formData: FormData) {
  const followerId = String(formData.get("follower_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  revalidatePath("/requests");
  redirect("/requests");
}
