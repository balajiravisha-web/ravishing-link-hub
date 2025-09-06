import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { source_url } = await req.json();
    if (!source_url) return NextResponse.json({ error: "source_url required" }, { status: 400 });

    // 1) Create product
    const { data: prod, error: perr } = await supabaseAdmin
      .from("products_master")
      .insert({})
      .select("product_id")
      .single();
    if (perr) throw perr;

    // 2) Create knowledge row
    const { error: kerr } = await supabaseAdmin
      .from("product_knowledge")
      .insert({ product_id: prod.product_id, source_url });
    if (kerr) throw kerr;

    return NextResponse.json({ ok: true, product_id: prod.product_id, message: "Product + Knowledge created" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "error" }, { status: 500 });
  }
}