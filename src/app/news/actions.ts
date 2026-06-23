"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 管理者であることを確認し、Supabaseクライアントを返す
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
    redirect("/news?error=" + encodeURIComponent("権限がありません"));
  }
  return supabase;
}

// ニュースを追加（管理者のみ）
export async function createNews(formData: FormData) {
  const supabase = await requireAdmin();

  const title_ja = String(formData.get("title_ja") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const body_ja = String(formData.get("body_ja") ?? "").trim();
  const body_en = String(formData.get("body_en") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const image_url = String(formData.get("image_url") ?? "").trim();

  if (!title_ja || !body_ja) {
    redirect(
      "/news?error=" + encodeURIComponent("日本語のタイトルと本文は必須です"),
    );
  }

  const { error } = await supabase
    .from("news")
    .insert({ title_ja, title_en, body_ja, body_en, pinned, image_url: image_url || null });

  if (error) redirect("/news?error=" + encodeURIComponent(error.message));
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/news?message=" + encodeURIComponent("ニュースを追加しました"));
}

// ニュースを削除（管理者のみ）
export async function deleteNews(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/news");

  await supabase.from("news").delete().eq("id", id);
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/news");
}

// 固定（pinned）の切り替え（管理者のみ）
export async function togglePin(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const current = formData.get("pinned") === "true";
  if (!id) redirect("/news");

  await supabase.from("news").update({ pinned: !current }).eq("id", id);
  revalidatePath("/news");
  revalidatePath("/");
  redirect("/news");
}
