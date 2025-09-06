// app/api/cron/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function isAuthorized(req: Request) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const url = new URL(req.url)
  const secret = url.searchParams.get('secret')
  return isVercelCron || secret === process.env.CRON_SECRET
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkLink(url: string) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'RavishingLinkHubBot/1.0 (+https://links.ravishingravisha.in)' },
      cache: 'no-store',
    })
    clearTimeout(t)
    const finalUrl = res.url
    const code = res.status
    let outcome: string
    if (code >= 200 && code < 300) {
      const path = new URL(finalUrl).pathname || '/'
      outcome = (path === '/' || path.split('/').filter(Boolean).length < 1)
        ? 'wrong_destination'
        : 'ok'
    } else if (code >= 500) outcome = '5xx'
    else if (code >= 400) outcome = '4xx'
    else outcome = 'unknown'
    return { outcome, code, finalUrl }
  } catch {
    return { outcome: 'timeout', code: 0, finalUrl: url }
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()

  const { data: links, error } = await supabase
    .from('affiliate_links')
    .select('link_id, affiliate_link_url')
    .or(`health_last_checked.is.null,health_last_checked.lt.${since}`)
    .limit(50)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  if (!links?.length) return NextResponse.json({ ok: true, checked: 0 })

  let checked = 0
  for (const l of links) {
    const r = await checkLink(l.affiliate_link_url)
    await supabase.from('affiliate_links')
      .update({
        link_status: r.outcome,
        health_last_checked: new Date().toISOString(),
        redirect_chain_last: r.finalUrl
      })
      .eq('link_id', l.link_id)

    await supabase.from('link_health_checks')
      .insert({
        link_id: l.link_id,
        checked_at: new Date().toISOString(),
        http_status: r.code,
        final_url: r.finalUrl,
        outcome: r.outcome
      })
    checked++
  }
  return NextResponse.json({ ok: true, checked })
}

export const revalidate = 0
