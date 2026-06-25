"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// パスワードを変更する
export async function updatePassword(formData: FormData) {
  const pw = String(formData.get("password") ?? "");
  const pw2 = String(formData.get("password2") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (pw.length < 6) {
    redirect(
      "/settings?error=" +
        encodeURIComponent("パスワードは6文字以上にしてください"),
    );
  }
  if (pw !== pw2) {
    redirect(
      "/settings?error=" + encodeURIComponent("確認用パスワードが一致しません"),
    );
  }

  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) redirect("/settings?error=" + encodeURIComponent(error.message));
  redirect("/settings?message=" + encodeURIComponent("パスワードを変更しました"));
}

// 通知のON/OFFを保存する
export async function updateNotifyPrefs(formData: FormData) {
  const notifyComments = formData.get("notify_comments") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("profiles")
    .update({ notify_comments: notifyComments })
    .eq("id", user.id);

  revalidatePath("/settings");
  redirect("/settings?message=" + encodeURIComponent("通知設定を保存しました"));
}

// プライバシー（鍵アカウント）を保存する
export async function updatePrivacy(formData: FormData) {
  const isPrivate = formData.get("is_private") === "on";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase.from("profiles").update({ is_private: isPrivate }).eq("id", user.id);
  revalidatePath("/settings");
  redirect("/settings?message=" + encodeURIComponent("プライバシー設定を保存しました"));
}

// アカウントを削除（退会）する。管理キー（service role）が必要。
export async function deleteAccount(formData: FormData) {
  const confirm = String(formData.get("confirm") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 自動翻訳で「削除」が「delete」等に訳されても消せるよう、両方を受け付ける
  const ok = confirm === "削除" || confirm.toLowerCase() === "delete";
  if (!ok) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(
          "確認のため「削除」または「delete」と入力してください / Type 削除 or delete to confirm",
        ),
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    redirect(
      "/settings?error=" +
        encodeURIComponent(
          "退会機能はサーバー設定（SUPABASE_SERVICE_ROLE_KEY）が未設定のため使えません",
        ),
    );
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) redirect("/settings?error=" + encodeURIComponent(error.message));

  await supabase.auth.signOut();
  redirect("/");
}
