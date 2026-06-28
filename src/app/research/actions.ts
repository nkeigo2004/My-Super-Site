"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeSavedUrl } from "@/lib/url";

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

function readFields(formData: FormData) {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    kind: get("kind") || "paper",
    title: get("title"),
    authors: get("authors") || null,
    abstract: get("abstract") || null,
    body: get("body") || null,
    category: get("category") || null,
    keywords: get("keywords") || null,
    published_on: get("published_on") || null,
    pdf_url: normalizeSavedUrl(get("pdf_url")),
    code_url: normalizeSavedUrl(get("code_url")),
    doi: get("doi") || null,
  };
}

// 論文・制作物を投稿（管理者）
export async function createWork(formData: FormData) {
  const supabase = await requireAdmin();
  const fields = readFields(formData);
  if (!fields.title) {
    redirect("/research/new?error=" + encodeURIComponent("タイトルは必須です"));
  }
  const { data, error } = await supabase
    .from("works")
    .insert(fields)
    .select("id")
    .single();
  if (error) {
    redirect("/research/new?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/research");
  revalidatePath("/");
  redirect(`/research/${data.id}`);
}

// 論文・制作物を編集（管理者）
export async function editWork(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/research");
  const fields = readFields(formData);
  if (!fields.title) {
    redirect(`/research/${id}?error=` + encodeURIComponent("タイトルは必須です"));
  }
  await supabase.from("works").update(fields).eq("id", id);
  revalidatePath("/research");
  revalidatePath(`/research/${id}`);
  revalidatePath("/");
  redirect(`/research/${id}`);
}

// 論文・制作物を削除（管理者）
export async function deleteWork(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/research");
  await supabase.from("works").delete().eq("id", id);
  revalidatePath("/research");
  revalidatePath("/");
  redirect("/research");
}

// コメント（ログインユーザー）
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
  if (error) {
    redirect(`/research/${workId}?error=` + encodeURIComponent(error.message));
  }
  revalidatePath(`/research/${workId}`);
}

// 自分のコメントを削除
export async function deleteWorkComment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const workId = String(formData.get("work_id") ?? "");
  if (!id) redirect("/research");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("work_comments").delete().eq("id", id);
  if (workId) revalidatePath(`/research/${workId}`);
}
