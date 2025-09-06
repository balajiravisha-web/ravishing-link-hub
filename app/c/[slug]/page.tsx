import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import Link from "next/link";

type Props = { params: { slug: string } };

export default async function CollectionPage({ params }: Props) {
  const slug = params.slug;
  // Fetch collection + items
  const { data: collection } = await supabaseAdmin
    .from("collections")
    .select("collection_id, title")
    .eq("slug", slug)
    .maybeSingle();

  if (!collection) {
    return (
      <main className="space-y-4">
        <h1 className="text-xl font-semibold">Collection not found</h1>
        <p className="text-sm text-neutral-600">Create it from the admin dashboard.</p>
        <Link className="underline text-sm" href="/admin">Go to Admin</Link>
      </main>
    );
  }

  const { data: items } = await supabaseAdmin
    .from("collection_items")
    .select("product_id, display_order")
    .eq("collection_id", collection.collection_id)
    .order("display_order", { ascending: true });

  // Fetch product basic data
  const ids = (items ?? []).map(i => i.product_id);
  let products: any[] = [];
  if (ids.length) {
    const { data } = await supabaseAdmin
      .from("products_master")
      .select("product_id, brand, product_name, primary_category")
      .in("product_id", ids);
    products = data ?? [];
  }

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-semibold">{collection.title}</h1>
      <div className="grid gap-3">
        {products.map((p) => (
          <div key={p.product_id} className="rounded-2xl shadow-soft bg-white p-4">
            <div className="font-medium">{p.product_name || 'Product'}</div>
            <div className="text-xs text-neutral-600">{p.brand}</div>
            <button disabled className="mt-2 text-sm rounded-xl px-3 py-2 bg-lemon-200">
              Shop • <span className="text-[10px] align-middle">Updating link</span>
            </button>
          </div>
        ))}
        {!products.length && (
          <div className="text-sm text-neutral-600">No products yet. Add items from the admin dashboard.</div>
        )}
      </div>
    </main>
  );
}
