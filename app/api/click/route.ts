// app/api/click/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only in Vercel
)

type LinkRow = {
  link_id: string
  affiliate_link_url: string
  is_primary: boolean
  last_updated_date: string | null
  link_status: string | null
}

async function quickOk(url: string) {
  try {
    // HEAD first; some stores block it, so GET fallback
    let r = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (!r.ok || r.status >= 400) {
      r = await fetch(url, { method: 'GET', redirect: 'follow' })
    }
    return r.ok
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { productId, referrer, utm } = await req.json()

    // 1) Load links for this product
    const { data: rows, error } = await supabase
      .from('affiliate_links')
      .select('link_id, affiliate_link_url, is_primary, last_updated_date, link_status')
      .eq('product_id', productId)

    if (error) throw error
    if (!rows || rows.length === 0) {
      return NextResponse.json({ ok: false, reason: 'no_links' }, { status: 404 })
    }

    // 2) Smart order: primary first, then healthy, then newest
    const ordered = [...rows].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      const ah = (a.link_status ?? '') === 'ok' ? 1 : 0
      const bh = (b.link_status ?? '') === 'ok' ? 1 : 0
      if (ah !== bh) return bh - ah
      return (b.last_updated_date || '').localeCompare(a.last_updated_date || '')
    })

    // 3) Try each affiliate link; STOP on first healthy
    let chosen: { url: string; linkId: string } | null = null
    for (const r of ordered) {
      if (await quickOk(r.affiliate_link_url)) {
        chosen = { url: r.affiliate_link_url, linkId: r.link_id }
        break
      }
    }

    // 4) Log the click (even unresolved)
    await supabase.from('click_events').insert({
      product_id: productId,
      link_id: chosen?.linkId ?? null, // null = unresolved (no healthy link)
      ts: new Date().toISOString(),
      referrer: referrer ?? null,
      utm: utm ?? null
    })

    // 5) If no link worked, DO NOT FALL BACK; tell the client to show a message
    if (!chosen) {
      return NextResponse.json({ ok: false, reason: 'no_healthy_links' }, { status: 503 })
    }

    // Otherwise return the working URL for the browser to open
    return NextResponse.json({ ok: true, url: chosen.url })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}

export const revalidate = 0
