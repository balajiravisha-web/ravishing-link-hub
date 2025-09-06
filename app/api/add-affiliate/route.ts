import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function inferStore(url: string) {
  const d = (url || "").toLowerCase();
  if (d.includes("nykaa")) return "Nykaa";
  if (d.includes("tira") || d.includes("trbt.ly")) return "Tira";
  if (d.includes("yesstyle")) return "YesStyle";
  if (d.includes("wishlink")) return "Wishlink";
  if (d.includes("myntra")) return "Myntra";
  if (d.includes("sephora")) return "Sephora";
  if (d.includes("foy")) return "FoyForYou";
  return "Unknown";
}

export async function POST(req: Request) {
  try {
    const { product_id, affiliate_link_url } = await req.json();
    if (!affiliate_link_url) return NextResponse.json({ error: "affiliate_link_url required" }, { status: 400 });

    let pid = product_id;

    if (!pid) {
      // Create a product if not provided
      const { data: prod, error: perr } = await supabaseAdmin
        .from("products_master")
        .insert({})
        .select("product_id")
        .single();
      if (perr) throw perr;
      pid = prod.product_id;
    }

    const store_site = inferStore(affiliate_link_url);

    const { error: aerr } = await supabaseAdmin
      .from("affiliate_links")
      .insert({
        product_id: pid,
        store_site,
        affiliate_link_url,
        is_primary: false
      });

    if (aerr) throw aerr;

    return NextResponse.json({ ok: true, product_id: pid, message: "Affiliate link added" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "error" }, { status: 500 });
  }
}