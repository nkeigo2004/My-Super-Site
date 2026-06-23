import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // 言語Cookieが無い初回訪問は、デバイスの言語（Accept-Language）から初期値を決める
  if (!request.cookies.get("lang")) {
    const al = (request.headers.get("accept-language") || "").toLowerCase();
    const lang = al.startsWith("en") ? "en" : "ja";
    response.cookies.set("lang", lang, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  // 静的ファイルや画像にはミドルウェアを走らせない
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
