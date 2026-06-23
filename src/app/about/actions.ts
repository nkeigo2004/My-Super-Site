"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// About（プロフィール本文）を更新（管理者）
export async function updateAbout(formData: FormData) {
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
    redirect("/about?error=" + encodeURIComponent("権限がありません"));
  }

  const fields = {
    id: 1,
    field_ja: String(formData.get("field_ja") ?? "").trim(),
    bio_ja: String(formData.get("bio_ja") ?? "").trim(),
  };

  const { error } = await supabase.from("site_profile").upsert(fields);
  if (error) redirect("/about?error=" + encodeURIComponent(error.message));

  revalidatePath("/about");
  revalidatePath("/");
  redirect("/about?message=" + encodeURIComponent("更新しました"));
}
