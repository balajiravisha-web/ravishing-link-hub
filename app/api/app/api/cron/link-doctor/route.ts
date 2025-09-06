// app/api/cron/link-doctor/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function checkUrl(url: string) {
  const t0 = performance.now();
  let outcome: "ok" | "timeout" | "4xx" | "5xx";
  let http_status: number | null = null;
  let final_url: string | null = null;
  try {
    // try HEAD first, then GET fallback (some stores block HEAD)
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!res.ok || res.status >= 400) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    http_status = res.status;
    final_url = res.url;
    if (res.status >= 500) outcome = "5xx";
    else if (res.status >= 400) outcome = "4xx";
    else outcome = "ok";
  } catch {
    outcome = "timeout";
  }
  const latency_ms = Math.round(performance.now() - t0);
  return { outcome, http_status, final_url, latency_ms };
}

export async function GET(req: Request) {
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";

  const { data: links, error } = await supabase
    .from("affiliate_links")
    .select("link_id, product_id, store_site, affiliate_link_url");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!links?.length) return NextResponse.json({ ok: true, checked: 0 });

  const report: any[] = [];

  for (const link of links) {
    const { outcome, http_status, final_url, latency_ms } = await checkUrl(
      link.affiliate_link_url
    );

    report.push({
      link_id: link.link_id,
      product_id: link.product_id,
      store: link.store_site,
      outcome,
      http_status,
      latency_ms,
    });

    if (!dryRun) {
      await supabase
        .from("affiliate_links")
        .update({
          link_status: outcome === "ok" ? "ok" : outcome,
          health_last_checked: new Date().toISOString(),
        })
        .eq("link_id", link.link_id);

      await supabase.from("link_health_checks").insert({
        link_id: link.link_id,
        checked_at: new Date().toISOString(),
        http_status,
        final_url,
        outcome,
        latency_ms,
      });
    }
  }

  return NextResponse.json({ ok: true, dryRun, checked: links.length, report });
}
