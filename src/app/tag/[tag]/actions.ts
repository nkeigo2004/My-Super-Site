"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function nameFromEmail(email?: string | null) {
  if (!email) return "user";
  return email.split("@")[0];
}

// タグスペースへ投稿
export async function createTagPost(formData: FormData) {
  const tag = String(formData.get("tag") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const dest = `/tag/${encodeURIComponent(tag)}`;
  if (!tag || (!content && !imageUrl)) redirect(dest);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pr } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const author = pr?.display_name || nameFromEmail(user.email);

  const { error } = await supabase.from("tag_posts").insert({
    tag,
    user_id: user.id,
    author,
    content: content.slice(0, 1000),
    image_url: imageUrl || null,
  });
  if (error) redirect(dest + "?error=" + encodeURIComponent(error.message));
  revalidatePath(dest);
  redirect(dest);
}

// 自分のタグ投稿を削除
export async function deleteTagPost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const tag = String(formData.get("tag") ?? "");
  const dest = `/tag/${encodeURIComponent(tag)}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("tag_posts").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath(dest);
  redirect(dest);
}
