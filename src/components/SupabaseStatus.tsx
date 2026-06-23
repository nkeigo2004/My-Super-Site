"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Supabase に接続できているかを確認するための一時的なバッジ。
// 接続が確認できたら、このコンポーネントは消してOKです。
export function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "ok" | "error">("checking");
  const [detail, setDetail] = useState<string>("");

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth
        .getSession()
        .then(({ error }) => {
          if (error) {
            setStatus("error");
            setDetail(error.message);
          } else {
            setStatus("ok");
          }
        })
        .catch((e: unknown) => {
          setStatus("error");
          setDetail(e instanceof Error ? e.message : String(e));
        });
    } catch (e: unknown) {
      setStatus("error");
      setDetail(e instanceof Error ? e.message : String(e));
    }
  }, []);

  const label =
    status === "checking"
      ? "接続を確認中…"
      : status === "ok"
        ? "Supabase 接続: OK（未ログイン）"
        : "Supabase 接続: 失敗";

  const color =
    status === "ok"
      ? "text-accent"
      : status === "error"
        ? "text-red-400"
        : "text-muted";

  return (
    <div className="mx-auto mt-6 max-w-md rounded-lg border border-line bg-surface/30 p-4 text-center">
      <p className={`font-mono text-xs ${color}`}>{label}</p>
      {status === "error" && (
        <p className="mt-1 break-all font-mono text-[10px] text-muted">
          {detail || "環境変数（.env.local）を確認してください"}
        </p>
      )}
    </div>
  );
}
