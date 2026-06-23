"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ログイン
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  revalidatePath("/", "layout");
  redirect("/");
}

// 新規登録
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }
  // メール確認が有効な場合はセッションが無い（確認メールが送られる）
  if (!data.session) {
    redirect(
      "/login?message=" +
        encodeURIComponent(
          "確認メールを送信しました。メール内のリンクを開くと登録が完了します。",
        ),
    );
  }
  revalidatePath("/", "layout");
  redirect("/");
}

// ログアウト
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
