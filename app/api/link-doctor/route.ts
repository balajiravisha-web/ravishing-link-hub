// app/api/link-doctor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET!;

// Very small helper to sleep between requests (be nice to stores)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

type AffiliateLink = {
  link_id: string;
  product_id: string | null;
  store_site: string | null;
  affiliate_link_url: string;
  is_primary: boolean | null;
  health_last_checked: string | null;
};

export async function GET(req: NextRequest) {
  // 1) Protect the endpoint so only your cron can call it
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // 2) Pick links that were never checked OR checked > 12h ago
  const twelveHoursAgoISO = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  const { data: links, error } = await supabase
    .from("affiliate_links")
    .select("link_id, product_id, store_site, affiliate_link_url, is_primary, health_last_checked")
    .or(`health_last_checked.is.null,health_last_checked.lt.${twelveHoursAgoISO}`)
    .order("is_primary", { ascending: false })   // check primary first
    .limit(50);                                  // safety limit per run

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!links || links.length === 0) {
    return NextResponse.json({ checked: 0, updated: 0, message: "Nothing to do" });
  }

  let updated = 0;

  for (const row of links as AffiliateLink[]) {
    const url = row.affiliate_link_url;
    let status: "ok" | "wrong_destination" | "timeout" | "4xx" | "5xx" | "error" = "error";
    let finalUrl: string | null = null;

    try {
      // Some stores dislike HEAD; use GET with redirects
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        // 15s timeout via AbortController
        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined,
      });

      finalUrl = res.url;

      if (res.status >= 200 && res.status < 400) {
        // crude “homepage” heuristic — you can refine later
        const path = new URL(finalUrl).pathname || "/";
        if (path === "/" || path === "/home" || path.startsWith("/search")) {
          status = "wrong_destination";
        } else {
          status = "ok";
        }
      } else if (res.status >= 400 && res.status < 500) {
        status = "4xx";
      } else if (res.status >= 500) {
        status = "5xx";
      } else {
        status = "error";
      }
    } catch (e: any) {
      status = e?.name === "TimeoutError" ? "timeout" : "error";
    }

    const { error: updErr } = await supabase
      .from("affiliate_links")
      .update({
        link_status: status,
        health_last_checked: new Date().toISOString(),
        redirect_chain_last: finalUrl, // optional: store final URL we reached
      })
      .eq("link_id", row.link_id);

    if (!updErr) updated += 1;

    // tiny delay between checks so we don’t hammer stores
    await delay(800);
  }

  return NextResponse.json({ checked: links.length, updated }, { status: 200 });
}
