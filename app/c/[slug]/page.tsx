// app/c/[slug]/page.tsx
import ShopButton from '../../components/ShopButton';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only (safe)
);

export default async function CollectionPage({ params }: { params: { slug: string } }) {
  // 1) find the collection by slug
  const { data: col, error: colErr } = await supabase
    .from('collections')
    .select('collection_id, title, one_line_desc')
    .eq('slug', params.slug)
    .maybeSingle();

  if (colErr || !col) {
    return (
      <main className="p-4 space-y-4">
        <div className="text-lg font-semibold">Collection not found</div>
        <Link href="/" className="text-blue-600 underline text-sm">← Back to home</Link>
      </main>
    );
  }

  // 2) load items for this collection with product basics
  const { data: items } = await supabase
    .from('collection_items')
    .select('display_order, product:products_master(product_id, brand, product_name)')
    .eq('collection_id', col.collection_id)
    .order('display_order', { ascending: true });

  return (
    <main className="p-4 space-y-6">
      <header className="text-center space-y-1">
        <h1 className="text-xl font-semibold">{col.title}</h1>
        {col.one_line_desc ? (
          <p className="text-neutral-600 text-sm">{col.one_line_desc}</p>
        ) : null}
        <div className="text-xs">
          <Link href="/" className="underline">← Back</Link>
        </div>
      </header>

      {!items?.length ? (
        <div className="text-center text-sm text-neutral-600">No products in this collection yet.</div>
      ) : (
        <section className="grid gap-4">
          {items.map((row: any, i: number) => {
            const p = row.product;
            return (
              <div key={p.product_id} className="rounded-2xl shadow p-4 bg-white flex items-center justify-between">
                <div>
                  <div className="text-sm text-neutral-500">#{String(i + 1).padStart(2, '0')}</div>
                  <div className="font-medium">{p.product_name}</div>
                  <div className="text-xs text-neutral-600">{p.brand}</div>
                </div>
                <ShopButton productId={p.product_id} />
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
