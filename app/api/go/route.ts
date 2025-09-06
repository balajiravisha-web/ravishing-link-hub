// app/api/go/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function quickOk(url: string) {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (head.status >= 500) return false;
    if (head.status >= 400) {
      const get = await fetch(url, { method: "GET", redirect: "follow" });
      return get.ok;
    }
    return true;
  } catch {
    return false;
  }
}

function rankLinks(arr: any[]) {
  return [...arr].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    const as = a.link_status === "ok" ? 1 : 0;
    const bs = b.link_status === "ok" ? 1 : 0;
    if (as !== bs) return bs - as;
    return (b.last_updated_date || "").localeCompare(a.last_updated_date || "");
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const product_id = url.searchParams.get("product_id");
  const referrer = url.searchParams.get("ref") || "";

  if (!product_id) return NextResponse.json({ error: "product_id required" }, { status: 400 });

  const { data: links } = await supabase
    .from("affiliate_links")
    .select("link_id, affiliate_link_url, is_primary, link_status, last_updated_date, product_id")
    .eq("product_id", product_id);

  let chosen: { link_id?: string; url?: string } | null = null;

  if (links?.length) {
    for (const link of rankLinks(links)) {
      if (await quickOk(link.affiliate_link_url)) {
        chosen = { link_id: link.link_id, url: link.affiliate_link_url };
        break;
      }
    }
  }

  if (!chosen) {
    const { data: pk } = await supabase
      .from("product_knowledge")
      .select("source_url")
      .eq("product_id", product_id)
      .maybeSingle();
    if (pk?.source_url) chosen = { url: pk.source_url };
  }

  if (!chosen?.url) {
    return NextResponse.redirect(new URL("/", process.env.SITE_URL!), 302);
  }

  await supabase.from("click_events").insert({
    product_id,
    link_id: chosen.link_id ?? null,
    ts: new Date().toISOString(),
    referrer,
    utm: null,
  });

  return NextResponse.redirect(chosen.url, 302);
}
