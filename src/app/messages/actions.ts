"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// DMを送る
export async function sendMessage(formData: FormData) {
  const recipientId = String(formData.get("recipient_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!recipientId || recipientId === user.id || !content) {
    redirect(`/messages/${recipientId}`);
  }

  await supabase.from("messages").insert({
    sender_id: user.id,
    recipient_id: recipientId,
    content: content.slice(0, 2000),
  });

  revalidatePath(`/messages/${recipientId}`);
  revalidatePath("/messages");
  redirect(`/messages/${recipientId}`);
}
