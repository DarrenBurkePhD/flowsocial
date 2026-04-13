import { NextRequest, NextResponse } from "next/server";

async function scrapeUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FlowSocial/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 3000);
  } catch {
    return "";
  }
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const linkRegex = /href=["']([^"']+)["']/gi;
  const links: string[] = [];
  let match;
  const priorityKeywords = ["product", "shop", "about", "ingredient", "story", "collection", "supplement", "nutrition"];

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
      const url = new URL(href, baseUrl);
      if (url.hostname === base.hostname && !links.includes(url.href)) {
        links.push(url.href);
      }
    } catch { continue; }
  }

  return links
    .sort((a, b) => {
      const aScore = priorityKeywords.some(k => a.toLowerCase().includes(k)) ? 1 : 0;
      const bScore = priorityKeywords.some(k => b.toLowerCase().includes(k)) ? 1 : 0;
      return bScore - aScore;
    })
    .slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ content: "" });

    const homeRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FlowSocial/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!homeRes.ok) return NextResponse.json({ content: "" });

    const homeHtml = await homeRes.text();
    const homeText = homeHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);

    const internalLinks = extractInternalLinks(homeHtml, url);
    const pageContents = await Promise.allSettled(
      internalLinks.slice(0, 8).map(link => scrapeUrl(link))
    );

    const allContent = [
      `Homepage (${url}):\n${homeText}`,
      ...pageContents
        .map((result, i) => result.status === "fulfilled" && result.value
          ? `Page (${internalLinks[i]}):\n${result.value}`
          : null
        )
        .filter(Boolean)
    ].join("\n\n---\n\n").slice(0, 15000);

    return NextResponse.json({ content: allContent });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ content: "" });
  }
}
