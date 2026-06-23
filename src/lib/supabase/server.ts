import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバー（サーバーコンポーネント / Server Action / Route Handler）用クライアント
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // サーバーコンポーネントからの呼び出し時は書き込めないので無視。
            // セッションの更新は middleware が担当します。
          }
        },
      },
    },
  );
}
