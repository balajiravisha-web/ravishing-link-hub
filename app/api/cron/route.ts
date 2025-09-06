// app/api/cron/route.ts
import { NextResponse } from "next/server";

// IMPORTANT: we use the admin client (service role) to bypass RLS for maintenance jobs
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

// Simple helper for timing out fetches
async function getWithTimeout(url: string, ms = 12000) {
  const ctl = new AbortController();
  const id = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: { "user-agent": "LinkDoctor/1.0 (+https://links.ravishingravisha.in)" },
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// Decide a health outcome from a response
function classify(resOk: boolean, status: number, finalUrl: string) {
  if (!resOk) {
    if (status >= 500) return "5xx";
    if (status >= 400) return "4xx";
    return "timeout";
  }
  // Very simple “wrong destination” heuristic: homepage or no product-y path
  try {
    const u = new URL(finalUrl);
    if (u.pathname === "/" || u.pathname.length < 2) return "wrong_destination";
  } catch {}
  return "ok";
}

export async function GET() {
  // 1) Pick the stalest 25 links (never checked first)
  const { data: links, error } = await supabaseAdmin
    .from("affiliate_links")
    .select("link_id, affiliate_link_url")
    .order("health_last_checked", { ascending: true, nullsFirst: true })
    .limit(25);

  if (error) {
    return NextResponse.json({ ok: false, step: "select", error: error.message }, { status: 500 });
  }

  if (!links || links.length === 0) {
    return NextResponse.json({ ok: true, checked: 0, note: "No links need checking" });
  }

  // 2) Check them one by one (kept straightforward on purpose)
  const now = new Date().toISOString();
  let checked = 0;

  for (const row of links) {
    const url = row.affiliate_link_url as string;

    let statusNum = 0;
    let finalUrl = url;
    let outcome = "timeout";

    try {
      const res = await getWithTimeout(url);
      statusNum = res.status;
      // @ts-ignore – next’s Response has url
      if ((res as any).url) finalUrl = (res as any).url as string;
      outcome = classify(res.ok, res.status, finalUrl);
    } catch {
      outcome = "timeout";
    }

    // 3) Write to health log (optional but nice to have)
    await supabaseAdmin.from("link_health_checks").insert({
      link_id: row.link_id,
      checked_at: now,
      http_status: statusNum || null,
      final_url: finalUrl,
      outcome,
      latency_ms: null,
    });

    // 4) Update the link’s status + last checked
    await supabaseAdmin
      .from("affiliate_links")
      .update({ link_status: outcome, health_last_checked: now })
      .eq("link_id", row.link_id);

    checked++;
  }

  return NextResponse.json({ ok: true, checked });
}
