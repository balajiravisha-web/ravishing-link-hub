# Ravishing Link Hub — Starter

## Deploy (3 steps)
1) **Create Vercel project** → Import this repo → Deploy.
2) In Vercel → Settings → Environment Variables, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SITE_URL` (https://links.ravishingravisha.in)
3) Visit `/admin` to test adding items (temporary forms).

> DB schema: run the Supabase SQL you already executed. This starter uses those tables.

## Temporary Admin Usage
- **Add Product Knowledge**: paste a product page URL; it creates a `products_master` row and a `product_knowledge` row.
- **Add Affiliate Link**: paste a link and choose a product; it creates an `affiliate_links` row.

These are minimal; the full UI will replace them later.