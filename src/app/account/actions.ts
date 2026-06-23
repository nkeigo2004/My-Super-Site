"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// プロフィールを更新する
export async function updateProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  const usernameRaw = String(formData.get("username") ?? "");
  const username = usernameRaw
    .replace(/^[@＠]+/, "")
    .replace(/\s+/g, "")
    .toLowerCase()
    .slice(0, 30);
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const bannerUrl = String(formData.get("banner_url") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const birthday = String(formData.get("birthday") ?? "").trim();
  const birthdayPublic = formData.get("birthday_public") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!displayName) {
    redirect("/account?error=" + encodeURIComponent("表示名を入力してください"));
  }

  // 行が無くても作成されるよう upsert を使用
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName.slice(0, 40),
    username: username || null,
    avatar_url: avatarUrl || null,
    banner_url: bannerUrl || null,
    bio: bio.slice(0, 500) || null,
    birthday: birthday || null,
    birthday_public: birthdayPublic,
  });

  if (error) {
    redirect("/account?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/", "layout");
  redirect("/account?message=" + encodeURIComponent("プロフィールを更新しました"));
}

// 他サービスへのリンクを追加
export async function addLink(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim().slice(0, 30);
  let url = String(formData.get("url") ?? "").trim();
  if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!url) redirect("/account");

  await supabase.from("profile_links").insert({
    user_id: user.id,
    label: label || url.replace(/^https?:\/\//i, "").split("/")[0],
    url: url.slice(0, 300),
  });
  revalidatePath("/account");
  revalidatePath(`/u/${user.id}`);
  redirect("/account");
}

// 他サービスへのリンクを削除
export async function removeLink(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("profile_links").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/account");
  revalidatePath(`/u/${user.id}`);
  redirect("/account");
}

// 興味タグを正規化（先頭の#・空白を除去、小文字化、30文字まで）
function normalizeTag(raw: string): string {
  return raw
    .replace(/^[#＃]+/, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase()
    .slice(0, 30);
}

function safeRedirect(v: string): string {
  return v.startsWith("/") ? v : "/account";
}

// 興味タグを追加
export async function addTag(formData: FormData) {
  const tag = normalizeTag(String(formData.get("tag") ?? ""));
  const back = safeRedirect(String(formData.get("redirect") ?? "/account"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!tag) redirect(back);

  await supabase
    .from("profile_tags")
    .upsert(
      { user_id: user.id, tag },
      { onConflict: "user_id,tag", ignoreDuplicates: true },
    );

  revalidatePath("/account");
  revalidatePath(`/tag/${tag}`);
  revalidatePath(`/u/${user.id}`);
  redirect(back);
}

// 興味タグを削除
export async function removeTag(formData: FormData) {
  const tag = String(formData.get("tag") ?? "");
  const back = safeRedirect(String(formData.get("redirect") ?? "/account"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profile_tags")
    .delete()
    .eq("user_id", user.id)
    .eq("tag", tag);

  revalidatePath("/account");
  revalidatePath(`/tag/${tag}`);
  revalidatePath(`/u/${user.id}`);
  redirect(back);
}
