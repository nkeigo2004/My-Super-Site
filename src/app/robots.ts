import type { MetadataRoute } from "next";
import { site } from "@/content/site";

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 個人用・管理系のページは検索に載せない
        disallow: ["/account", "/settings", "/requests", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
