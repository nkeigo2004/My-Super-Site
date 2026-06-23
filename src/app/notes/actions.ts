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
    redirect("/notes?error=" + encodeURIComponent("権限がありません"));
  }
  return supabase;
}

function cleanSlug(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ノートを追加（管理者）
export async function createNote(formData: FormData) {
  const supabase = await requireAdmin();
  const slug = cleanSlug(String(formData.get("slug") ?? ""));
  const title_ja = String(formData.get("title_ja") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const summary_ja = String(formData.get("summary_ja") ?? "").trim();
  const summary_en = String(formData.get("summary_en") ?? "").trim();
  const body_ja = String(formData.get("body_ja") ?? "").trim();
  const body_en = String(formData.get("body_en") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim();

  if (!slug || !title_ja) {
    redirect("/notes?error=" + encodeURIComponent("slug と日本語タイトルは必須です"));
  }

  const { error } = await supabase.from("notes").insert({
    slug,
    title_ja,
    title_en,
    summary_ja,
    summary_en,
    body_ja,
    body_en,
    tags,
    image_url: image_url || null,
  });
  if (error) {
    redirect(
      "/notes?error=" +
        encodeURIComponent(
          error.message.includes("duplicate")
            ? "その slug は既に使われています"
            : error.message,
        ),
    );
  }
  revalidatePath("/notes");
  revalidatePath("/");
  redirect("/notes?message=" + encodeURIComponent("追加しました"));
}

// ノートを編集（管理者）
export async function editNote(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/notes");
  const title_ja = String(formData.get("title_ja") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const summary_ja = String(formData.get("summary_ja") ?? "").trim();
  const summary_en = String(formData.get("summary_en") ?? "").trim();
  const body_ja = String(formData.get("body_ja") ?? "").trim();
  const body_en = String(formData.get("body_en") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim();

  await supabase
    .from("notes")
    .update({ title_ja, title_en, summary_ja, summary_en, body_ja, body_en, tags, image_url: image_url || null })
    .eq("id", id);
  revalidatePath("/notes");
  revalidatePath("/");
  redirect("/notes?message=" + encodeURIComponent("更新しました"));
}

// ノートを削除（管理者）
export async function deleteNote(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/notes");
  await supabase.from("notes").delete().eq("id", id);
  revalidatePath("/notes");
  revalidatePath("/");
  redirect("/notes");
}
