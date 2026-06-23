"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function nameFromEmail(email: string | undefined) {
  return email ? email.split("@")[0] : "user";
}

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
    redirect("/research?error=" + encodeURIComponent("権限がありません"));
  }
  return supabase;
}

// 研究・制作物を追加（管理者）
export async function createWork(formData: FormData) {
  const supabase = await requireAdmin();
  const kind = String(formData.get("kind") ?? "project");
  const title_ja = String(formData.get("title_ja") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const summary_ja = String(formData.get("summary_ja") ?? "").trim();
  const summary_en = String(formData.get("summary_en") ?? "").trim();
  const meta = String(formData.get("meta") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();

  if (!title_ja) {
    redirect("/research?error=" + encodeURIComponent("日本語タイトルは必須です"));
  }
  const { error } = await supabase
    .from("works")
    .insert({ kind, title_ja, title_en, summary_ja, summary_en, meta, href });
  if (error) redirect("/research?error=" + encodeURIComponent(error.message));
  revalidatePath("/research");
  revalidatePath("/");
  redirect("/research?message=" + encodeURIComponent("追加しました"));
}

// 研究・制作物を編集（管理者）
export async function editWork(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/research");
  const kind = String(formData.get("kind") ?? "project");
  const title_ja = String(formData.get("title_ja") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const summary_ja = String(formData.get("summary_ja") ?? "").trim();
  const summary_en = String(formData.get("summary_en") ?? "").trim();
  const meta = String(formData.get("meta") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();

  await supabase
    .from("works")
    .update({ kind, title_ja, title_en, summary_ja, summary_en, meta, href })
    .eq("id", id);
  revalidatePath("/research");
  revalidatePath("/");
  redirect("/research?message=" + encodeURIComponent("更新しました"));
}

// 研究・制作物を削除（管理者）
export async function deleteWork(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/research");
  await supabase.from("works").delete().eq("id", id);
  revalidatePath("/research");
  revalidatePath("/");
  redirect("/research");
}

// 研究へのコメント（ログインユーザー）
export async function createWorkComment(formData: FormData) {
  const workId = String(formData.get("work_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  if (!workId || (!content && !imageUrl)) redirect("/research");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("work_comments").insert({
    work_id: workId,
    user_id: user.id,
    author: nameFromEmail(user.email),
    content: content.slice(0, 1000),
    image_url: imageUrl || null,
  });
  if (error) redirect("/research?error=" + encodeURIComponent(error.message));
  revalidatePath("/research");
}

// 自分の研究コメントを削除
export async function deleteWorkComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/research");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("work_comments").delete().eq("id", id);
  revalidatePath("/research");
}
