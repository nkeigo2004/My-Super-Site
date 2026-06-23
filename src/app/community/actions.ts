"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function nameFromEmail(email: string | undefined) {
  return email ? email.split("@")[0] : "user";
}

// 投稿する
export async function createPost(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  const fileUrl = String(formData.get("file_url") ?? "").trim();
  const fileName = String(formData.get("file_name") ?? "").trim();
  if (!content && !imageUrl && !fileUrl) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    author: nameFromEmail(user.email),
    content: content.slice(0, 1000),
    image_url: imageUrl || null,
    file_url: fileUrl || null,
    file_name: fileName || null,
  });
  if (error) redirect("/community?error=" + encodeURIComponent(error.message));
  revalidatePath("/community");
}

// 投稿を編集（自分のみ）
export async function editPost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!id || !content) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("posts")
    .update({ content: content.slice(0, 1000) })
    .eq("id", id);
  revalidatePath("/community");
}

// 投稿を削除（自分のみ）
export async function deletePost(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("posts").delete().eq("id", id);
  revalidatePath("/community");
}

// コメントする（通知はDBトリガーが自動作成）
export async function createComment(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  if (!postId || (!content && !imageUrl)) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    user_id: user.id,
    author: nameFromEmail(user.email),
    content: content.slice(0, 500),
    image_url: imageUrl || null,
  });
  if (error) redirect("/community?error=" + encodeURIComponent(error.message));
  revalidatePath("/community");
}

// コメントを編集（自分のみ）
export async function editComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!id || !content) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("comments")
    .update({ content: content.slice(0, 500) })
    .eq("id", id);
  revalidatePath("/community");
}

// コメントを削除（自分のみ）
export async function deleteComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("comments").delete().eq("id", id);
  revalidatePath("/community");
}

// いいねの ON/OFF
export async function toggleLike(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");
  if (!postId) redirect("/community");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("reactions")
      .insert({ post_id: postId, user_id: user.id });
  }
  revalidatePath("/community");
}

// リポスト / リポスト解除（トグル）
export async function toggleRepost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!postId) redirect("/community");

  const { data: existing } = await supabase
    .from("reposts")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("reposts")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);
  } else {
    await supabase.from("reposts").insert({ user_id: user.id, post_id: postId });
  }

  revalidatePath("/community");
  redirect("/community");
}
