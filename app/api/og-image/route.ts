import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ image: null });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Momly/1.0)" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return NextResponse.json({ image: null });

    const html = await res.text();

    // Try og:image first, then twitter:image
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);

    let image = match?.[1] ?? null;

    // Resolve relative URLs
    if (image && !image.startsWith("http")) {
      const base = new URL(url);
      image = new URL(image, base.origin).href;
    }

    return NextResponse.json(
      { image },
      { headers: { "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ image: null });
  }
}
