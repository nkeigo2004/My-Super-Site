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

// 本文の最初の画像をサムネ（image_url）に使う
function firstImageUrl(body: string): string | null {
  const md = body.match(/!\[[^\]]*\]\((.+?)\)/);
  if (md) return md[1];
  const bare = body.match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?/i);
  return bare ? bare[0] : null;
}

// 日本語タイトルでも確実に作れるよう、slug は自動生成する
function autoSlug() {
  return `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ノートを追加（管理者・単一言語・slug自動）
export async function createNote(formData: FormData) {
  const supabase = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();

  if (!title) {
    redirect("/notes?error=" + encodeURIComponent("タイトルは必須です"));
  }

  const { error } = await supabase.from("notes").insert({
    slug: autoSlug(),
    title,
    summary,
    body,
    tags,
    image_url: firstImageUrl(body),
  });
  if (error) {
    redirect("/notes?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/notes");
  revalidatePath("/");
  redirect("/notes?message=" + encodeURIComponent("追加しました"));
}

// ノートを編集（管理者・単一言語）
export async function editNote(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/notes");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const image_url = firstImageUrl(body);

  await supabase
    .from("notes")
    .update({ title, summary, body, tags, image_url })
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

// ノート全体への絵文字リアクション（ログインユーザー・トグル）
export async function toggleNoteReaction(formData: FormData) {
  const noteId = String(formData.get("note_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const emoji = String(formData.get("emoji") ?? "");
  if (!noteId || !emoji) redirect(`/notes/${slug}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("note_reactions")
    .select("emoji")
    .eq("note_id", noteId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("note_reactions")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);
  } else {
    await supabase
      .from("note_reactions")
      .insert({ note_id: noteId, user_id: user.id, emoji });
  }
  revalidatePath(`/notes/${slug}`);
}

// 段落ごとの「響いた」リアクション（ログインユーザー・トグル）
export async function toggleParaReaction(formData: FormData) {
  const noteId = String(formData.get("note_id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const paraIndex = parseInt(String(formData.get("para_index") ?? ""), 10);
  if (!noteId || Number.isNaN(paraIndex)) redirect(`/notes/${slug}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("note_para_reactions")
    .select("para_index")
    .eq("note_id", noteId)
    .eq("user_id", user.id)
    .eq("para_index", paraIndex)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("note_para_reactions")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", user.id)
      .eq("para_index", paraIndex);
  } else {
    await supabase
      .from("note_para_reactions")
      .insert({ note_id: noteId, user_id: user.id, para_index: paraIndex });
  }
  revalidatePath(`/notes/${slug}`);
}

// 段落「響いた」をクライアントから直接呼ぶ版（リロードなし・楽観更新用）
export async function reactParagraph(noteId: string, paraIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, reacted: false };

  const { data: existing } = await supabase
    .from("note_para_reactions")
    .select("para_index")
    .eq("note_id", noteId)
    .eq("user_id", user.id)
    .eq("para_index", paraIndex)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("note_para_reactions")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", user.id)
      .eq("para_index", paraIndex);
    return { ok: true as const, reacted: false };
  }
  await supabase
    .from("note_para_reactions")
    .insert({ note_id: noteId, user_id: user.id, para_index: paraIndex });
  return { ok: true as const, reacted: true };
}
