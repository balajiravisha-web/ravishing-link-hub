"use client";

import { useState } from "react";

export default function Admin() {
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [productId, setProductId] = useState("");

  const addKnowledge = async () => {
    const res = await fetch("/api/add-knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_url: knowledgeUrl })
    });
    const data = await res.json();
    alert(data.message || "Done");
  };

  const addAffiliate = async () => {
    const res = await fetch("/api/add-affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId || null, affiliate_link_url: affiliateUrl })
    });
    const data = await res.json();
    alert(data.message || "Done");
  };

  return (
    <main className="space-y-8">
      <h1 className="text-xl font-semibold">Admin (temporary)</h1>

      <section className="space-y-3 rounded-2xl shadow-soft bg-white p-4">
        <h2 className="font-medium">Add to Product Knowledge</h2>
        <input
          value={knowledgeUrl}
          onChange={(e) => setKnowledgeUrl(e.target.value)}
          placeholder="Paste product page URL"
          className="w-full border rounded-xl px-3 py-2"
        />
        <button onClick={addKnowledge} className="rounded-xl px-3 py-2 bg-lemon-200">
          Add
        </button>
        <p className="text-xs text-neutral-500">This creates a product and a knowledge record with the URL.</p>
      </section>

      <section className="space-y-3 rounded-2xl shadow-soft bg-white p-4">
        <h2 className="font-medium">Add Affiliate Link</h2>
        <input
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID (optional)"
          className="w-full border rounded-xl px-3 py-2"
        />
        <input
          value={affiliateUrl}
          onChange={(e) => setAffiliateUrl(e.target.value)}
          placeholder="Paste affiliate URL"
          className="w-full border rounded-xl px-3 py-2"
        />
        <button onClick={addAffiliate} className="rounded-xl px-3 py-2 bg-lemon-200">
          Add
        </button>
        <p className="text-xs text-neutral-500">If Product ID is empty, a new product will be created.</p>
      </section>
    </main>
  );
}